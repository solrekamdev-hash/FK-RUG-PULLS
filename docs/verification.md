# Post-deployment verification guide

Status: **WAITING FOR AN AUTHORIZED DEPLOYMENT**

No official FRP mint address exists yet. Run these checks only after a real, separately authorized deployment. Use public Solana explorers and direct on-chain data. Do not accept screenshots or chat messages as proof.

## 1. Mint address

- Copy the mint address from the creation transaction.
- Match it character by character across the official website, repository, Token X account, and developer X account.
- Treat any mismatch as a stop condition.

## 2. Total supply

- Read total supply directly from the mint account.
- Confirm decimals and calculate the human-readable supply.
- Compare it with the planned standard target of approximately 1,000,000,000 FRP.
- Record any difference and the reason for it.

## 3. Ownership structure

Verify the locked structure against the actual supply:

- Creator personal holdings: **maximum 1%**.
- Operational Treasury: **1%**.
- Secondary Treasury reserve: **1%**.
- Public ownership: **97%**.

At exactly 1,000,000,000 FRP, the reference amounts are 10,000,000 / 10,000,000 / 10,000,000 / 970,000,000 FRP respectively.

Treasury holdings are separate project assets and must not be counted as creator personal beneficial ownership. Treasury assets must not be used to bypass the creator cap.

## 4. Mint authority

- Identify the current mint authority.
- Confirm whether it is active or revoked, and record the exact on-chain state.
- Do not describe the supply as fixed unless the authority state proves it.

## 5. Freeze authority

- Identify the current freeze authority.
- Confirm whether it is active, revoked, or was never configured.
- Publish the exact result without softening the wording.

## 6. Token program

- Confirm which Solana token program owns the mint account.
- Record the program ID and whether the mint uses the original Token Program or Token-2022.
- Review any enabled extensions before making claims about token behaviour.

## 7. Deployer holdings

- Inspect `3tUzFchu7RrRhk9HP27jQGhiXC8KTtP6Ht3V5KQ4hCo2`.
- Record all FRP token accounts and balances connected to it.
- Confirm it has not been used for normal creator trading.

## 8. Creator trading holdings

- Inspect `9SHNnrmBnFALbNQatNUjduFK4THPKvpBYAimUqNn1k5V`.
- Record its FRP balance and percentage of total supply.
- Confirm creator personal beneficial ownership does not exceed 1% of total FRP supply.
- Review linked wallets, accounts, custodians, nominees, or other arrangements for evidence of undeclared creator personal control.
- Confirm creator FRP activity occurred through the published creator trading wallet where intended.

## 9. Treasury holdings

- Inspect `8sBiyo1KURrM6UpHKyCFZao6wj8FEu2RBxr9rPKgZzEn`.
- Record its FRP balance and percentage of total supply.
- Confirm total Treasury holdings represent the planned 2% project Treasury structure.
- Confirm 1% is designated operational Treasury and 1% is designated secondary Treasury reserve in the public records.
- Confirm Treasury assets have not been represented or used as creator personal holdings.
- Review Treasury movements and match them against published project purposes.

## 10. Pump.fun configuration

- Confirm the token was created through the expected Pump.fun flow.
- Verify pair: SOL.
- Verify Cash Back: ON.
- Verify Mayhem Mode: OFF.
- Confirm there was no presale or private team allocation.
- Save public evidence for every configuration claim.

## 11. Creation transaction

- Publish a direct link to the creation transaction.
- Record the signer, timestamp, slot, instructions, fees, and resulting accounts.
- Confirm the signer matches the published deployer wallet.
- Cross-check every account and program ID used by the transaction.

## Verification record template

| Check | Result | Evidence link | Checked at (UTC) |
| --- | --- | --- | --- |
| Mint address | Pending deployment | — | — |
| Total supply | Pending deployment | — | — |
| 1% creator cap | Pending deployment | — | — |
| 1% operational Treasury | Pending deployment | — | — |
| 1% secondary Treasury reserve | Pending deployment | — | — |
| 97% public ownership | Pending deployment | — | — |
| Mint authority | Pending deployment | — | — |
| Freeze authority | Pending deployment | — | — |
| Token program | Pending deployment | — | — |
| Deployer holdings | Pending deployment | — | — |
| Creator trading holdings | Pending deployment | — | — |
| Treasury holdings | Pending deployment | — | — |
| Pump.fun configuration | Pending deployment | — | — |
| Creation transaction | Pending deployment | — | — |
