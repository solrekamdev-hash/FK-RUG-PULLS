# FK RUG PULLS (FRP)

> **PRE-LAUNCH — NOT DEPLOYED**
>
> There is no official FRP mint address yet.

FK RUG PULLS is a pre-launch Solana memecoin project built around public creator wallets, visible rules, and post-deployment verification. This repository contains the static website, machine-readable launch information, and transparency documentation.

No token deployment, wallet connection, signing, or transaction code is included.

## Website

The site is a zero-dependency static build:

- `index.html` — page structure and content
- `styles.css` — responsive journal-style design
- `script.js` — copy-address interaction and small progressive enhancements
- `assets/og-preview.png` — branded social preview image

Open `index.html` directly, or serve the folder with any static web server. All paths are relative and compatible with GitHub Pages project sites.

## Public wallets

| Role | Address | Permission |
| --- | --- | --- |
| Deployer | `3tUzFchu7RrRhk9HP27jQGhiXC8KTtP6Ht3V5KQ4hCo2` | Creates the token; not used for normal creator trading |
| Creator trading | `9SHNnrmBnFALbNQatNUjduFK4THPKvpBYAimUqNn1k5V` | Published wallet for creator FRP activity; total creator beneficial ownership must never exceed 2% of total FRP supply |

The same addresses and rules are recorded in [`wallets.json`](wallets.json) and [`launch-manifest.json`](launch-manifest.json).

The creator must not use or control any undeclared wallet, account, custodian, nominee, or other arrangement to buy, hold, receive, sell, transfer, or otherwise beneficially control FRP. Creator FRP activity is intended to occur through the published creator trading wallet, and total creator beneficial ownership must never exceed 2% of total FRP supply.

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
