# Publishing checklist

## Community release

1. Upload `dist/airport-airplay-detector-homey-1.0.0.zip` to a GitHub release.
2. Publish the prepared text in `COMMUNITY_POST.md` on community.homey.app.
3. Add the resulting topic ID as `homeyCommunityTopicId` in `app.json`.

## Homey App Store

```bash
npm install
npm test
npm audit --omit=dev
npx homey app validate --level publish
npx homey app publish
```

`homey app publish` creates a Draft. Open Homey Developer Tools, test the Draft/Test release, and submit it for certification when ready.

The app and driver now use distinct SVG icons in accordance with Homey's certification guidelines.
