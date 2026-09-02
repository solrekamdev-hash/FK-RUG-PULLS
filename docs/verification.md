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

## 3. Mint authority

- Identify the current mint authority.
- Confirm whether it is active or revoked, and record the exact on-chain state.
- Do not describe the supply as fixed unless the authority state proves it.

## 4. Freeze authority

- Identify the current freeze authority.
- Confirm whether it is active, revoked, or was never configured.
- Publish the exact result without softening the wording.

## 5. Token program

- Confirm which Solana token program owns the mint account.
- Record the program ID and whether the mint uses the original Token Program or Token-2022.
- Review any enabled extensions before making claims about token behaviour.

## 6. Personal/trading wallet holdings

- Inspect `9SHNnrmBnFALbNQatNUjduFK4THPKvpBYAimUqNn1k5V`.
- Record its FRP balance and percentage of total supply.
- Confirm the wallet never exceeds 1% of total FRP supply.
- Confirm personal FRP activity occurred through this published personal/trading wallet.

## 7. Operational treasury wallet holdings

- Inspect `8sBiyo1KURrM6UpHKyCFZao6wj8FEu2RBxr9rPKgZzEn`.
- Record all FRP token accounts and balances connected to it.
- Confirm its final holding is 1% of total FRP supply.
- Verify the planned 90-day lock after launch from direct on-chain evidence before describing the treasury as locked.
- Review treasury receipts, transfers, and linked accounts for evidence of undeclared control.

## 8. Dev/deployer transit wallet holdings

- Inspect `3tUzFchu7RrRhk9HP27jQGhiXC8KTtP6Ht3V5KQ4hCo2`.
- Confirm this same address signed the creation transaction.
- Record all FRP token accounts and balances connected to it.
- Confirm it temporarily acquired 2% of total FRP supply.
- Confirm it transferred 1% to the Operational Treasury and 1% to the Secondary Treasury.
- Confirm its final holding is 0% and that it is not a final allocation bucket.

## 9. Secondary treasury wallet holdings

- Inspect `9auPy6qFFd41jirxw1Qo4BaZdEzo5EYyc52tQDZrJvQk`.
- Record all FRP token accounts and balances connected to it.
- Confirm its final holding is 1% of total FRP supply.
- Verify the planned 90-day lock after launch from direct on-chain evidence before describing the treasury as locked.
- Confirm this address is distinct from the Operational Treasury and dev/deployer addresses.

## 10. Allocation structure

- Confirm four project wallets are documented and inspect all four addresses character by character.
- Confirm the Operational Treasury and Secondary Treasury are distinct wallets.
- Confirm the dev/deployer is a transit wallet and not a fourth final allocation bucket.
- Confirm the three final project-controlled allocation buckets: Personal maximum 1%, Operational Treasury 1%, and Secondary Treasury 1%.
- Confirm project-controlled allocation totals 3% and public allocation is 97%.
- Confirm the complete calculation is 1% + 1% + 1% + 97% = 100%.
- Confirm the project has not used or controlled any undeclared wallet, account, custodian, nominee, or other arrangement to buy, hold, receive, sell, transfer, or otherwise beneficially control a project allocation.

## 11. Pump.fun configuration

- Confirm the token was created through the expected Pump.fun flow.
- Verify pair: SOL.
- Verify Cash Back: ON.
- Verify Mayhem Mode: OFF.
- Confirm there was no presale.
- Save public evidence for every configuration claim.

## 12. Creation transaction

- Publish a direct link to the creation transaction.
- Record the signer, timestamp, slot, instructions, fees, and resulting accounts.
- Confirm the signer matches the published deployer wallet.
- Cross-check every account and program ID used by the transaction.

## Verification record template

| Check | Result | Evidence link | Checked at (UTC) |
| --- | --- | --- | --- |
| Mint address | Pending deployment | — | — |
| Total supply | Pending deployment | — | — |
| Mint authority | Pending deployment | — | — |
| Freeze authority | Pending deployment | — | — |
| Token program | Pending deployment | — | — |
| Personal/trading wallet holdings | Pending deployment | — | — |
| Operational treasury wallet holdings | Pending deployment | — | — |
| Dev/deployer transit wallet holdings | Pending deployment | — | — |
| Secondary treasury wallet holdings | Pending deployment | — | — |
| Allocation structure | Pending deployment | — | — |
| Pump.fun configuration | Pending deployment | — | — |
| Creation transaction | Pending deployment | — | — |
