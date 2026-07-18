# Airport Airplay Detector for Homey Pro

Now available in the Homey App Store:

https://homey.app/a/com.anders.airport-airplay-detector

I have created a local Homey Pro app for AirPort Express generation 2 (A1392). It detects when an AirPlay session connects or disconnects and makes the state available in Flow.

The main use case is automatically selecting the correct input on an amplifier. For example:

**When:** AirPort Express → AirPlay started

**Then:** Denon HEOS → Play AUX in

The app provides:

- AirPlay started trigger
- AirPlay stopped trigger
- AirPlay is active condition
- A visible AirPlay activity status on the device

Everything runs locally. No account, cloud API or external server is required. Homey Pro and AirPort Express must be on a network where mDNS/Bonjour traffic can pass between them.

Supported hardware: AirPort Express generation 2, model A1392 / AirPort10,115. AirPlay pause may remain active until the sending device disconnects the AirPlay session, which is intentional for amplifier input switching.

Install from the Homey App Store: https://homey.app/a/com.anders.airport-airplay-detector

This is an independent community project and is not affiliated with Apple or Athom.

Source code and releases: https://github.com/Androoz/homey-airport-airplay-detector
