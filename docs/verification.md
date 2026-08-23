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

## 6. Deployer holdings

- Inspect `3tUzFchu7RrRhk9HP27jQGhiXC8KTtP6Ht3V5KQ4hCo2`.
- Record all FRP token accounts and balances connected to it.
- Confirm it has not been used for normal creator trading.

## 7. Creator trading holdings

- Inspect `9SHNnrmBnFALbNQatNUjduFK4THPKvpBYAimUqNn1k5V`.
- Record its FRP balance and percentage of total supply.
- Confirm the creator has not used or controlled any undeclared wallet, account, custodian, nominee, or other arrangement to buy, hold, receive, sell, transfer, or otherwise beneficially control FRP.
- Confirm creator FRP activity occurred through the published creator trading wallet.
- Confirm total creator beneficial ownership across all arrangements never exceeds 2% of total FRP supply.
- Review buys, holdings, receipts, sells, transfers, and linked accounts for evidence of undeclared control.

## 8. Pump.fun configuration

- Confirm the token was created through the expected Pump.fun flow.
- Verify pair: SOL.
- Verify Cash Back: ON.
- Verify Mayhem Mode: OFF.
- Confirm there was no presale or private allocation.
- Save public evidence for every configuration claim.

## 9. Creation transaction

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
| Deployer holdings | Pending deployment | — | — |
| Creator trading holdings | Pending deployment | — | — |
| Pump.fun configuration | Pending deployment | — | — |
| Creation transaction | Pending deployment | — | — |
