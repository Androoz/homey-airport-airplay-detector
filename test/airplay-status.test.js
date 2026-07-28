'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const plist = require('plist');
const {
  ensureStatusFlagsBySource,
  isAirPlaySessionActive,
  parseTxtFlags,
} = require('../lib/airplay-status');
const parseAirportInfo = require('../lib/parse-airport-info');

test('parses AirPlay TXT flags as hexadecimal', () => {
  assert.equal(parseTxtFlags('0x004'), 0x004);
  assert.equal(parseTxtFlags('0x804'), 0x804);
  assert.equal(parseTxtFlags(0x804), 0x804);
});

test('detects the AirPort Express active-session flag', () => {
  assert.equal(isAirPlaySessionActive(0x004), false);
  assert.equal(isAirPlaySessionActive(0x804), true);
});

test('parses an XML /info plist', () => {
  const value = parseAirportInfo(Buffer.from(plist.build({ statusFlags: 0x804 })));
  assert.equal(value.statusFlags, 0x804);
});

test('creates the status cache when discovery arrives before device initialization', () => {
  const cache = ensureStatusFlagsBySource(undefined);
  cache.mDNS = 0x804;

  assert.equal(cache.mDNS, 0x804);
  assert.equal(ensureStatusFlagsBySource(cache), cache);
});
