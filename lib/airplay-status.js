'use strict';

const SESSION_ACTIVE_FLAG = 0x800;

function parseTxtFlags(value) {
  if (typeof value === 'number') return value;
  if (value === undefined || value === null) return Number.NaN;
  return Number.parseInt(String(value).replace(/^0x/i, ''), 16);
}

function isAirPlaySessionActive(statusFlags) {
  return Number.isFinite(statusFlags)
    && (statusFlags & SESSION_ACTIVE_FLAG) !== 0;
}

function ensureStatusFlagsBySource(value) {
  return value && typeof value === 'object'
    ? value
    : Object.create(null);
}

module.exports = {
  SESSION_ACTIVE_FLAG,
  ensureStatusFlagsBySource,
  isAirPlaySessionActive,
  parseTxtFlags,
};
