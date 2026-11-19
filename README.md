# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/BrotherMus/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/BrotherMus/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Trophy Log** is an offline guide and tracker for all 55 Grand Theft Auto VI trophies on PS5. It shows every official name, description and grade, saves your progress in the browser with export and import, and has filters plus a spoiler shield for story trophies. It also has a four-stage roadmap to the platinum, a chapter-by-chapter missables view, and a guide for every trophy written in our own words. Each guide names and links its sources (PowerPyx, KeenGamer, GTA Base, OutputLag, Exophase and others). The app is static files under `app/` with no build step, and it makes no network requests.

- `app/`: the guide (`index.html`, small ES modules in `app/js/`, stylesheets in `app/css/`, data in `app/data/trophies.json`)
- `scripts/take-screenshots.mjs`: drives headless Chrome/Edge over the DevTools protocol to capture `screenshots/` from the views in `shots.json`
- `main.ts`: hands the entry in (copies `app/` and `screenshots/`, writes `dossier.json`)

## Run it

```sh
node serve.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=8jskxc5q&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
