# Changelog

## 1.0.1 — 2026-07-28

- Prevents a startup crash on Homey Pro 13.4.0 when AirPlay discovery reaches a device before its initialization has completed.
- Adds a defensive status-cache initialization and a regression test for early discovery callbacks.

## 1.0.0 — 2026-07-18

- Initial public release.
- Detects active AirPlay sessions on AirPort Express generation 2.
- Provides Flow triggers for session start and stop.
- Provides a Flow condition for current AirPlay activity.
- Uses active local mDNS queries with Homey discovery and `/info` fallbacks.
