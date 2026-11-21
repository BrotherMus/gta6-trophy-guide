# Leonida Platinum Tracker — GTA VI trophy guide

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/BrotherMus/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01?ref=8jskxc5q)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/BrotherMus/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01?ref=8jskxc5q)

My entry for the make.fun bounty **Build the best GTA 6 trophy guide** (`gta6-trophy-guide-01`). Join on make.fun with referral code `8jskxc5q`.

An offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies (1 platinum, 2 gold, 6 silver, 46 bronze):

- **Checklist** with the official names, descriptions and grades, progress saved in `localStorage`, progress bars per grade, filters (story, missable, collectibles, activities, side quests, heists, misc; the list has no online trophies), a grade filter and search.
- **Spoiler setting** that hides story trophy names and descriptions until earned, plus **export/import** of progress as a JSON file.
- **Roadmap** to the platinum in four stages, and a **missables** view with a chapter timeline and the counts read from the official descriptions.
- **A guide for every trophy** in my own words, with the sources (named and linked) shown beside it. The app only shows links; it fetches nothing from the network.

No build step, no dependencies: static files under `app/`.

## Run

```
node serve.ts
```

Then open http://localhost:8080.

## Hand-in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are taken with `node scripts/take-screenshots.mjs` (headless Chrome or Edge over the DevTools protocol).

## Sources

Guides cite PowerPyx's trophy guide & roadmap and 100% checklist, KeenGamer's platinum roadmap and GMTreks' trophy overview. Fan-made; not affiliated with Rockstar Games. No Rockstar logo or artwork is used.
