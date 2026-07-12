'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const plist = require('plist');
const {
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
