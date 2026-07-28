'use strict';

const http = require('http');
const Homey = require('homey');
const {
  ensureStatusFlagsBySource,
  isAirPlaySessionActive,
  parseTxtFlags,
} = require('../../lib/airplay-status');
const parseAirportInfo = require('../../lib/parse-airport-info');

const DEFAULT_INFO_PORT = 7000;
const POLL_INTERVAL_MS = 3000;
const REQUEST_TIMEOUT_MS = 2500;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const INACTIVE_DELAY_MS = 8000;

module.exports = class AirportExpressDevice extends Homey.Device {
  async onInit() {
    // A Driver can already see this Device through getDevices() while Homey is
    // still initializing it. Set all runtime state before the first await.
    this.address = this.getStoreValue('address') || null;
    this.infoPort = this.getStoreValue('infoPort') || DEFAULT_INFO_PORT;
    this.lastActiveEvidenceAt = 0;
    this.pollInProgress = false;
    this.pollErrors = 0;
    this.lastStatusFlagsBySource = Object.create(null);
    this.hasAirPlayMdnsStatus = false;
    this.airPlayStatusReady = true;

    if (this.getCapabilityValue('airplay_active') === null) {
      await this.setCapabilityValue('airplay_active', false);
    }

    // Remove obsolete calibration data from version 0.1.x.
    await this.unsetStoreValue('inactiveFingerprint').catch(this.error);
    await this.unsetStoreValue('activeFingerprint').catch(this.error);

    this.pollTimer = this.homey.setInterval(() => {
      this._poll().catch(this.error);
    }, POLL_INTERVAL_MS);

    this.log(`AirPort Express status monitor initialized${this.address ? ` for ${this.address}:${this.infoPort}` : ''}`);
    await this._poll().catch(this.error);
  }

  onDiscoveryResult(result) {
    const matches = result.id === this.getData().id;
    if (matches && result.address) this._updateAddress(result.address).catch(this.error);
    return matches;
  }

  async onDiscoveryAvailable(result) {
    await this._updateAddress(result.address);
    await this.setAvailable();
    await this._poll();
  }

  async onDiscoveryAddressChanged(result) {
    await this._updateAddress(result.address);
    await this._poll();
  }

  async onDiscoveryLastSeenChanged(result) {
    await this._updateAddress(result.address);
  }

  onDeleted() {
    if (this.pollTimer) this.homey.clearInterval(this.pollTimer);
  }

  async _updateAddress(address) {
    if (!address || address === this.address) return;
    this.address = address;
    await this.setStoreValue('address', address);
    this.log(`AirPort Express address updated to ${address}`);
  }

  async handleAirPlayDiscovery(result) {
    if (!this.isAirPlayStatusReady()) return;
    await this._updateAddress(result.address);

    const port = Number(result.port);
    if (Number.isInteger(port) && port > 0 && port !== this.infoPort) {
      this.infoPort = port;
      await this.setStoreValue('infoPort', port);
      this.log(`AirPlay status port updated to ${port}`);
    }

    const txt = result.txt || {};
    const rawFlags = txt.flags ?? txt.statusflags;
    if (rawFlags === undefined || rawFlags === null) return;

    const statusFlags = parseTxtFlags(rawFlags);
    if (!Number.isFinite(statusFlags)) return;

    if (!this.hasAirPlayMdnsStatus) {
      this.hasAirPlayMdnsStatus = true;
      this.log('Using _airplay._tcp status flags; HTTP polling disabled for this device');
    }
    await this._handleStatusFlags(statusFlags, 'mDNS');
  }

  async _poll() {
    if (!this.address || this.pollInProgress || this.hasAirPlayMdnsStatus) return;
    this.pollInProgress = true;

    try {
      const info = await this._fetchInfo();
      const statusFlags = Number(info.statusFlags);
      if (!Number.isFinite(statusFlags)) {
        throw new Error('AirPort Express /info response has no numeric statusFlags');
      }

      this.pollErrors = 0;
      await this._handleStatusFlags(statusFlags, 'HTTP');
    } catch (error) {
      this.pollErrors += 1;
      if (this.pollErrors === 1 || this.pollErrors % 10 === 0) {
        this.error(
          `Could not read AirPort Express status at ${this.address}:${this.infoPort} (${this.pollErrors}):`,
          error.message || error,
        );
      }
      // A temporary network error must not be interpreted as AirPlay stopping.
    } finally {
      this.pollInProgress = false;
    }
  }

  async _handleStatusFlags(statusFlags, source) {
    // Defense in depth for lifecycle changes in Homey: never assume onInit()
    // has created the status cache before a discovery callback arrives.
    this.lastStatusFlagsBySource = ensureStatusFlagsBySource(this.lastStatusFlagsBySource);

    const active = isAirPlaySessionActive(statusFlags);
    if (statusFlags !== this.lastStatusFlagsBySource[source]) {
      this.log(`${source} AirPlay statusFlags=0x${statusFlags.toString(16)} active=${active}`);
      this.lastStatusFlagsBySource[source] = statusFlags;
    }
    await this._applyStatus(active);
  }

  isAirPlayStatusReady() {
    return this.airPlayStatusReady === true;
  }

  async _applyStatus(active) {
    if (active) {
      this.lastActiveEvidenceAt = Date.now();
      await this._setStatus(true);
      return;
    }

    if (
      this.getCapabilityValue('airplay_active') === true
      && Date.now() - this.lastActiveEvidenceAt >= INACTIVE_DELAY_MS
    ) {
      await this._setStatus(false);
    }
  }

  async _setStatus(active) {
    const previous = this.getCapabilityValue('airplay_active') === true;
    if (previous === active) return;

    await this.setCapabilityValue('airplay_active', active);
    this.log(`AirPlay session ${active ? 'started' : 'stopped'}`);
    const card = active ? this.driver.startedTrigger : this.driver.stoppedTrigger;
    await card.trigger(this, {}, {});
  }

  _fetchInfo() {
    return new Promise((resolve, reject) => {
      const request = http.get({
        host: this.address,
        port: this.infoPort,
        path: '/info',
        timeout: REQUEST_TIMEOUT_MS,
        headers: { Accept: 'application/x-apple-binary-plist, application/xml, text/xml' },
      }, response => {
        const chunks = [];
        let bytes = 0;

        response.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > MAX_RESPONSE_BYTES) {
            response.destroy(new Error('AirPort Express /info response is too large'));
            return;
          }
          chunks.push(chunk);
        });

        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`AirPort Express /info returned HTTP ${response.statusCode}`));
            return;
          }

          try {
            resolve(parseAirportInfo(Buffer.concat(chunks)));
          } catch (error) {
            reject(error);
          }
        });
      });

      request.on('timeout', () => request.destroy(new Error('AirPort Express /info timed out')));
      request.on('error', reject);
    });
  }

};
