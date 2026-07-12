'use strict';

const Homey = require('homey');

module.exports = class AirportAirPlayDetectorApp extends Homey.App {
  async onInit() {
    this.log('AirPort AirPlay Detector started');
  }
};
