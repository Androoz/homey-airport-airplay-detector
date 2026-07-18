# Publishing checklist

Version 1.0.0 is live in the Homey App Store:

https://homey.app/a/com.anders.airport-airplay-detector

## Community release

1. Create an annotated Git tag for the released source version.
2. Create a GitHub release from the tag with release notes from `CHANGELOG.md`.
3. Attach a source archive only if it is useful to developers; Homey users should install from the App Store.
4. Publish the prepared text in `COMMUNITY_POST.md` on community.homey.app.
5. Add the resulting topic ID as `homeyCommunityTopicId` in `app.json`.

## Homey App Store

```bash
npm install
npm test
npm audit --omit=dev
npx homey app validate --level publish
npx homey app publish
```

For future versions, `homey app publish` creates a Draft. Open Homey Developer Tools, test the Draft/Test release, and submit it for certification when ready.

The app and driver now use distinct SVG icons in accordance with Homey's certification guidelines.
