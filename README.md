# FK RUG PULLS (FRP)

> **PRE-LAUNCH — NOT DEPLOYED**
>
> There is no official FRP mint address yet.

FK RUG PULLS is a pre-launch Solana memecoin project built around public wallets, visible rules, a public Treasury structure, and post-deployment verification. This repository contains the static website, machine-readable launch information, and transparency documentation.

No token deployment, wallet connection, signing, or transaction code is included.

## Website

The site is a zero-dependency static build:

- `index.html` — page structure and content
- `styles.css` — responsive journal-style design
- `script.js` — copy-address interaction and small progressive enhancements
- `assets/og-preview.png` — branded social preview image

The journal routes are generated from `Content/Journal/*.md`. Optional notebook-page artwork lives at `assets/journal/NNN/page-NN.webp`; `tools/build-journal.ps1` discovers those files and writes the shared journal manifest. Entries without page artwork continue to render their Markdown source as a fallback. See [`assets/journal/README.md`](assets/journal/README.md) for the asset convention.

Open `index.html` directly, or serve the folder with any static web server. All paths are relative and compatible with GitHub Pages project sites.

## Locked ownership structure

The current locked structure is:

| Bucket | Share | Amount at exactly 1B FRP |
| --- | ---: | ---: |
| Creator / creator trading wallet | 1% | 10,000,000 FRP |
| Operational Treasury | 1% | 10,000,000 FRP |
| Secondary Treasury reserve | 1% | 10,000,000 FRP |
| Public | 97% | 970,000,000 FRP |

Creator personal beneficial ownership must never exceed **1% of total FRP supply**.

The Treasury represents **2% of total supply in total** and is a separate project asset: 1% operational Treasury plus 1% secondary Treasury reserve. Treasury holdings do not count as creator personal holdings and must not be used to bypass the creator cap.

## Public wallets

| Role | Address | Permission / purpose |
| --- | --- | --- |
| Deployer | `3tUzFchu7RrRhk9HP27jQGhiXC8KTtP6Ht3V5KQ4hCo2` | Creates the token; not used for normal creator trading |
| Creator trading | `9SHNnrmBnFALbNQatNUjduFK4THPKvpBYAimUqNn1k5V` | Published wallet for creator FRP activity; creator personal beneficial ownership capped at 1% |
| Treasury | `8sBiyo1KURrM6UpHKyCFZao6wj8FEu2RBxr9rPKgZzEn` | Published project Treasury; 2% total split into 1% operational and 1% secondary reserve |

The same addresses and rules are recorded in [`wallets.json`](wallets.json) and [`launch-manifest.json`](launch-manifest.json).

## Planned launch settings

These technical settings are plans, not deployed facts, and **must be checked again before deployment**.

| Setting | Plan |
| --- | --- |
| Blockchain | Solana |
| Platform | Pump.fun |
| Pair | SOL |
| Cash Back | ON |
| Mayhem Mode | OFF |
| Standard supply target | Approximately 1,000,000,000 FRP |
| Mining | None |

Deployment is not authorized by this repository or by completing its checklists.

## Documentation

- [`docs/transparency-pledge.md`](docs/transparency-pledge.md) — plain-language wallet and ownership rules
- [`docs/launch-record.md`](docs/launch-record.md) — pre-launch checklist and future creation record
- [`docs/verification.md`](docs/verification.md) — post-deployment on-chain checks
- [`docs/brand.md`](docs/brand.md) — story, tone, colour, and visual system

## Official links

- Token X: [@FKRUGPULLS](https://x.com/FKRUGPULLS)
- Developer X: [@SolRDev](https://x.com/SolRDev)
- GitHub: [solrekamdev-hash/FK-RUG-PULLS](https://github.com/solrekamdev-hash/FK-RUG-PULLS)

## Risk warning

FRP will be a speculative memecoin. Transparency does not guarantee profit, safety, liquidity, price stability, or continued value. Whales can sell. The creator can sell. Treasury assets can move for documented project purposes. The price can collapse.

Nothing in this repository is financial advice.

**DON'T TRUST THE DEV. VERIFY THE DEV.**
