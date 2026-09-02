# FK RUG PULLS (FRP)

> **PRE-LAUNCH — NOT DEPLOYED**
>
> There is no official FRP mint address yet.

FK RUG PULLS is a pre-launch Solana memecoin project built around public project wallets, visible allocation rules, and post-deployment verification. This repository contains the static website, machine-readable launch information, and transparency documentation.

No token deployment, wallet connection, signing, or transaction code is included.

## Website

The site is a zero-dependency static build:

- `index.html` — page structure and content
- `styles.css` — responsive journal-style design
- `script.js` — copy-address interaction and small progressive enhancements
- `assets/og-preview.png` — branded social preview image

The journal routes are generated from `Content/Journal/*.md`. Optional notebook-page artwork lives at `assets/journal/NNN/page-NN.webp`; `tools/build-journal.ps1` discovers those files and writes the shared journal manifest. Entries without page artwork continue to render their Markdown source as a fallback. See [`assets/journal/README.md`](assets/journal/README.md) for the asset convention.

Open `index.html` directly, or serve the folder with any static web server. All paths are relative and compatible with GitHub Pages project sites.

## Public wallets

| Role | Address | Permission |
| --- | --- | --- |
| Personal/trading | `9SHNnrmBnFALbNQatNUjduFK4THPKvpBYAimUqNn1k5V` | Published wallet for personal FRP activity; capped at 1% of total FRP supply |
| Dev/deployer | `3tUzFchu7RrRhk9HP27jQGhiXC8KTtP6Ht3V5KQ4hCo2` | Deployer/transit wallet; temporarily acquires 2%, transfers 1% to each treasury, and has a final intended holding of 0% |
| Operational treasury | `8sBiyo1KURrM6UpHKyCFZao6wj8FEu2RBxr9rPKgZzEn` | Final 1% allocation; planned 90-day treasury lock after launch |
| Secondary treasury | `9auPy6qFFd41jirxw1Qo4BaZdEzo5EYyc52tQDZrJvQk` | Final 1% allocation; planned 90-day treasury lock after launch |

The same addresses and rules are recorded in [`wallets.json`](wallets.json) and [`launch-manifest.json`](launch-manifest.json).

Four project wallets are disclosed. The dev/deployer is a transit wallet, not a fourth final allocation bucket. After it transfers 1% to the Operational Treasury and 1% to the distinct Secondary Treasury, its final intended holding is 0%. The three final project-controlled allocation buckets are Personal, Operational Treasury, and Secondary Treasury.

The project must not use or control any undeclared wallet, account, custodian, nominee, or other arrangement to buy, hold, receive, sell, transfer, or otherwise beneficially control a project allocation. Personal FRP activity is intended to occur through the published personal/trading wallet.

### Finalized token allocation structure

| Allocation bucket | Finalized share or cap |
| --- | ---: |
| Personal/trading wallet | Maximum 1% |
| Operational treasury wallet | 1% |
| Secondary treasury wallet | 1% |
| Public | 97% |
| **Total** | **100%** |

Final allocation is 1% Personal + 1% Operational Treasury + 1% Secondary Treasury + 97% Public = 100%. Project-controlled allocation totals exactly 3%. The dev/deployer has no permanent allocation and a final intended holding of 0%. This structure does not need to be re-decided before deployment, but compliance must still be verified before deployment and after launch. Only this allocation structure is finalized; the other launch settings below remain planned.

## Planned launch settings

These are plans, not deployed facts, and **must be checked again before deployment**.

| Setting | Plan |
| --- | --- |
| Blockchain | Solana |
| Platform | Pump.fun |
| Pair | SOL |
| Cash Back | ON |
| Mayhem Mode | OFF |
| Standard supply target | Approximately 1,000,000,000 FRP |
| Mining | None |
| Operational Treasury lock | Planned 90-day treasury lock after launch |
| Secondary Treasury lock | Planned 90-day treasury lock after launch |

Deployment is not authorized by this repository or by completing its checklists.

## Documentation

- [`docs/transparency-pledge.md`](docs/transparency-pledge.md) — plain-language public-wallet rules
- [`docs/launch-record.md`](docs/launch-record.md) — pre-launch checklist and future creation record
- [`docs/verification.md`](docs/verification.md) — post-deployment on-chain checks
- [`docs/brand.md`](docs/brand.md) — story, tone, colour, and visual system

## Official links

- Token X: [@FKRUGPULLS](https://x.com/FKRUGPULLS)
- Developer X: [@SolRDev](https://x.com/SolRDev)
- GitHub: [solrekamdev-hash/FK-RUG-PULLS](https://github.com/solrekamdev-hash/FK-RUG-PULLS)

## GitHub Pages

After the committed files are pushed to GitHub:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the default branch and the `/ (root)` folder, then save.
4. Wait for GitHub Pages to publish and confirm the displayed URL.

No build command, paid service, API key, secret, or environment variable is required.

## Risk warning

FRP will be a speculative memecoin. Transparency does not guarantee profit, safety, liquidity, price stability, or continued value. Whales can sell. The creator can sell. The price can collapse.

Nothing in this repository is financial advice.

**DON'T TRUST THE DEV. VERIFY THE DEV.**
