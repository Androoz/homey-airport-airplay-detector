# Contributing

Issues and pull requests are welcome. Before submitting a change:

```bash
npm install
npm test
npm audit --omit=dev
npm run validate
```

Keep the app local-only and avoid cloud dependencies. Test changes against an AirPort Express generation 2 (A1392 / AirPort10,115) and Homey Pro.
