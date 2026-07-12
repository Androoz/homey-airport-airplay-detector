'use strict';

const bplistParser = require('bplist-parser');
const plist = require('plist');

module.exports = function parseAirportInfo(buffer) {
  if (buffer.subarray(0, 8).toString('ascii') === 'bplist00') {
    const values = bplistParser.parseBuffer(buffer);
    if (!values.length || !values[0]) throw new Error('Empty binary plist response');
    return values[0];
  }

  const value = plist.parse(buffer.toString('utf8'));
  if (!value || typeof value !== 'object') throw new Error('Invalid XML plist response');
  return value;
};
