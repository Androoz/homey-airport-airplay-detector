# Airport Airplay Detector for Homey Pro

An independent Homey SDK 3 app that detects active AirPlay sessions on AirPort Express generation 2 (A1392 / AirPort10,115). It makes session state available as a device capability and as Flow cards, allowing an amplifier such as a HEOS Amp to switch to its AirPort input automatically.

## Features

- Local discovery of AirPort Express through RAOP/mDNS
- Active AirPlay session detection without cloud services
- **AirPlay started** and **AirPlay stopped** Flow triggers
- **AirPlay is active** Flow condition
- Debounced stop detection to avoid input switching during short interruptions

## Requirements

- Homey Pro; Homey Cloud and Homey Bridge are not supported
- AirPort Express generation 2, model A1392 / AirPort10,115
- Homey Pro and AirPort Express on a network where mDNS/Bonjour can pass

## Install from source

```bash
npm install
npx homey login
npx homey select
npx homey app install
```

For live logs during testing, use `npx homey app run` instead of `app install`.

## Example: HEOS input switching

Create a Flow:

- **When:** AirPort Express → AirPlay started
- **Then:** Denon HEOS → Play AUX in

Pausing may keep the AirPlay state active until the sender disconnects the session. This is intentional: an amplifier should normally remain on the AirPort input while playback is paused.

## Development

```bash
npm test
npm run validate
```

## License and trademarks

Released under the MIT License. See [NOTICE.md](NOTICE.md) for acknowledgements and trademark notices. This project is not affiliated with Apple Inc. or Athom B.V.

Source code, releases and issue tracking are available at [Androoz/homey-airport-airplay-detector](https://github.com/Androoz/homey-airport-airplay-detector).
