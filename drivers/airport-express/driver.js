'use strict';

const Homey = require('homey');
const mdns = require('mdns-js');

const MDNS_QUERY_INTERVAL_MS = 3000;
const MDNS_QUERY_DURATION_MS = 2000;

// Homey already runs an mDNS daemon. Avoid binding mdns-js to its wildcard interface.
mdns.excludeInterface('0.0.0.0');

module.exports = class AirportExpressDriver extends Homey.Driver {
  async onInit() {
    this.startedTrigger = this.homey.flow.getDeviceTriggerCard('airplay_started');
    this.stoppedTrigger = this.homey.flow.getDeviceTriggerCard('airplay_stopped');
    this.airplayStrategy = this.homey.discovery.getStrategy('airport-airplay');
    this.mdnsQueryInProgress = false;

    this.homey.flow.getConditionCard('airplay_is_active')
      .registerRunListener(({ device }) => device.getCapabilityValue('airplay_active') === true);

    this.airplayTimer = this.homey.setInterval(() => {
      this._refreshAirPlayStatus().catch(this.error);
    }, MDNS_QUERY_INTERVAL_MS);
    await this._updateFromAirPlayDiscovery();
    await this._queryAirPlayMdns();
  }

  async _refreshAirPlayStatus() {
    await this._updateFromAirPlayDiscovery();
    await this._queryAirPlayMdns();
  }

  async _updateFromAirPlayDiscovery() {
    const results = Object.values(this.airplayStrategy.getDiscoveryResults());
    const devices = this.getDevices();

    await Promise.all(devices.map(async device => {
      const result = results.find(candidate => this._matchesAirPlayResult(device, candidate));
      if (result) await device.handleAirPlayDiscovery(result);
    }));
  }

  async _queryAirPlayMdns() {
    if (this.mdnsQueryInProgress) return;
    this.mdnsQueryInProgress = true;

    await new Promise(resolve => {
      let browser;
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        try {
          if (browser) browser.stop();
        } catch (error) {
          this.error('Could not stop active mDNS query:', error);
        }
        this.mdnsQueryInProgress = false;
        resolve();
      };

      try {
        browser = mdns.createBrowser(mdns.tcp('airplay'));
        browser.on('ready', () => browser.discover());
        browser.on('update', data => {
          const result = this._normalizeMdnsReply(data);
          if (!result) return;
          this._routeAirPlayResult(result).catch(this.error);
        });
        browser.on('error', error => {
          this.error('Active _airplay._tcp query failed:', error);
          finish();
        });
        this.homey.setTimeout(finish, MDNS_QUERY_DURATION_MS);
      } catch (error) {
        this.error('Could not start active _airplay._tcp query:', error);
        finish();
      }
    });
  }

  _normalizeMdnsReply(data) {
    if (!data || !Array.isArray(data.txt)) return null;

    const txt = {};
    data.txt.forEach(entry => {
      const separator = entry.indexOf('=');
      if (separator < 0) return;
      txt[entry.slice(0, separator).toLowerCase()] = entry.slice(separator + 1);
    });

    if (String(txt.model || '').toLowerCase() !== 'airport10,115') return null;
    const name = String(data.fullname || data.name || '')
      .replace(/\._airplay\._tcp\.local\.?$/i, '');
    const addresses = Array.isArray(data.addresses) ? data.addresses : [];

    return {
      name,
      address: addresses.find(address => /^\d+\.\d+\.\d+\.\d+$/.test(address))
        || addresses[0]
        || data.host,
      port: data.port,
      txt,
    };
  }

  async _routeAirPlayResult(result) {
    const devices = this.getDevices();
    await Promise.all(devices.map(async device => {
      if (this._matchesAirPlayResult(device, result)) {
        await device.handleAirPlayDiscovery(result);
      }
    }));
  }

  _matchesAirPlayResult(device, result) {
    const raopId = String(device.getData().id || '');
    const expectedName = this._friendlyName(raopId).trim().toLowerCase();
    if (String(result.name || '').trim().toLowerCase() === expectedName) return true;

    const raopMac = raopId.split('@')[0].replace(/[^a-f0-9]/gi, '').toLowerCase();
    const airplayMac = String(result.txt?.deviceid || '')
      .replace(/[^a-f0-9]/gi, '')
      .toLowerCase();
    return raopMac.length === 12 && raopMac === airplayMac;
  }

  async onPairListDevices() {
    const results = await this.getDiscoveryStrategy().getDiscoveryResults();
    return Object.values(results).map(result => ({
      name: this._friendlyName(result.name),
      data: { id: result.id },
      store: { discoveryId: result.id },
    }));
  }

  _friendlyName(name = 'AirPort Express') {
    const at = name.indexOf('@');
    return at >= 0 ? name.slice(at + 1) : name;
  }

  onUninit() {
    if (this.airplayTimer) this.homey.clearInterval(this.airplayTimer);
  }
};
