# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/BrotherMus/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/BrotherMus/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Platinum Guide** – an offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies. It shows every trophy with its official name, description and grade; saves your progress in the browser with JSON export/import; filters by story, missable, collectibles, activities, side missions and robberies; hides story spoilers until earned; and gives a four-stage roadmap to the platinum, a missables view built from the story order, and a guide for every trophy in its own words with its sources cited beside it (PowerPyx, KeenGamer, Exophase). Static files under `app/`, no build step, no network requests, no game artwork.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Screenshots are retaken with `node tools/take-screenshots.mjs` (headless Chrome or Edge over the DevTools protocol, driven by `shots.json`), and `node tools/smoke-test.mjs` checks the tracker in the same browser: 55 rows, saved ticks, every filter, search, spoilers, export/import, and no request outside the local server.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8jskxc5q&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
