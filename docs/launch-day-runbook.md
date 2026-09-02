# FK RUG PULLS — Launch-Day Runbook (Human Checklist)

## Context

This is a **plan/deliverable only**. Nothing here deploys, signs, sends, or modifies the
repo — it is the idiot-proof launch-day checklist the user follows by hand, from opening
Pump.fun to "FRP is verified and ready to announce."

Locked facts it is built on:
- **Platform:** Pump.fun, bonding-curve buy model (creation + initial buy together where available).
- **Wallets:**
  - Dev / Deployer — `3tUzFchu7RrRhk9HP27jQGhiXC8KTtP6Ht3V5KQ4hCo2` (must end at **0%**)
  - Personal / Trading — `9SHNnrmBnFALbNQatNUjduFK4THPKvpBYAimUqNn1k5V` (**0.99–1.00%**, never above 1.00%)
  - Operational Treasury — `8sBiyo1KURrM6UpHKyCFZao6wj8FEu2RBxr9rPKgZzEn` (**0.99–1.00%**)
  - Secondary Treasury — `9auPy6qFFd41jirxw1Qo4BaZdEzo5EYyc52tQDZrJvQk` (**0.99–1.00%**)
- **Flow:** dev creates FRP with an initial buy of **1.98–2.00%**, sends ~half to each
  treasury, dev ends at **0%**. Project-controlled total **2.97–3.00%**; public ~**97%**.
- **Locks:** Streamflow **QuickLock**, hard time-lock, **90 days**, no linear vesting. Each treasury
  locks its **entire** final FRP balance; each unlock recipient is that same treasury wallet.
- **Arithmetic source of truth:** `tools/fkrp-launch-calculator.html`. Open it locally.
  **Never eyeball percentages** — the calculator's PASS/STOP is the ruling.
- **Money:** ~A$150 was *budgeted*, not a spend instruction. The live Pump.fun quote + the
  calculator control the actual buys.

Legend used below: **DO** = take an action · **VERIFY** = confirm on-chain / in the
calculator · **RECORD** = write it into the calculator's evidence fields.

---

# THE RUNBOOK

## BEFORE YOU TOUCH PUMP.FUN
- [ ] **DO** Open `tools/fkrp-launch-calculator.html` locally in a browser. Keep it open all day.
- [ ] **DO** Open a Solana explorer (Solscan / Solana Explorer) in a second tab.
- [ ] **VERIFY** The dev wallet holds enough SOL for buys **plus** fee/buffer (do not drain it).
- [ ] **VERIFY** All four wallet addresses match the locked list, character-for-character.
- [ ] **DO** Prepare a blank "PROOF LOG" (or use the calculator's Evidence section) to capture,
      for every tx: **signature · explorer link · UTC time · before/after balance.**
- [ ] **VERIFY** You are calm and unrushed. Nothing on this page is time-pressured.

🛑 **STOP** if any wallet address does not exactly match the locked list. Do not proceed.

## CREATE FRP
- [ ] **DO** Open Pump.fun, connect the **dev wallet** `3tUzFch…hCo2` (confirm the connected address).
- [ ] **DO** Create the FRP token with metadata. Where Pump.fun offers **create + initial buy together**, use it.
- [ ] **DO** Set the **initial buy** so the dev wallet lands at **1.98–2.00%** — size it from the
      live Pump.fun quote, not from A$150.
- [ ] **RECORD** the **mint address** and the **creation transaction** (sig, link, UTC).
- [ ] **RECORD** the **dev initial-buy transaction** (sig, link, UTC) and the dev before/after balance.
- [ ] 🛑 **STOP AND CHECK CALCULATOR** — enter the **actual total supply** shown on-chain (do NOT
      assume 1,000,000,000), then enter the **actual dev balance**.

🛑 **STOP** conditions here:
- Wrong mint (does not match what you recorded) → **STOP**.
- Connected wallet is not the dev wallet → **STOP**.
- Calculator dev result is **UNDERSHOOT (<1.98%)** or **OVERSHOOT (>2.00%)** → **STOP**, do not transfer.
- Any unexpected token authority / mint config / freeze setting → **STOP** and investigate.

## PERSONAL BUY
- [ ] **DO** From the **personal wallet** `9SHN…1k5V`, buy FRP targeting **0.99–1.00%**.
      Use the live Pump.fun quote and the FKRP launch calculator to target 0.99%–1.00%. Do not eyeball the amount.
- [ ] **RECORD** the **personal buy transaction** (sig, link, UTC) and personal before/after balance.
- [ ] 🛑 **VERIFY** in the calculator: enter the **actual personal balance** → must read **PASS (0.99–1.00%)**.

🛑 **STOP** if the calculator shows personal **above 1.00%** (OVERSHOOT). Never announce or lock
with personal over the cap.

## TREASURY TRANSFERS
- [ ] **VERIFY** In the calculator's transfer card, read the **suggested Operational** and
      **Secondary** transfer amounts (an even split of the dev balance).
- [ ] **DO** From the **dev wallet**, transfer the suggested amount to **Operational** `8sBi…ZzEn`. Double-check the destination address before sending.
- [ ] **RECORD** the **Operational transfer transaction** (sig, link, UTC) + before/after balances.
- [ ] **DO** From the **dev wallet**, transfer the suggested amount to **Secondary** `9auP…Jvqk`. Double-check the destination address before sending.
- [ ] **RECORD** the **Secondary transfer transaction** (sig, link, UTC) + before/after balances.

🛑 **STOP** if a transfer destination does not exactly match the treasury address, or the
calculator reports **insufficient** / **excess** (no valid even split).

## STOP — VERIFY ALLOCATION
Enter all four **final** balances into the calculator's Final Balance Check. It must PASS **all**:
- [ ] **Dev = 0%** (exactly zero)
- [ ] **Personal = 0.99–1.00%**
- [ ] **Operational = 0.99–1.00%**
- [ ] **Secondary = 0.99–1.00%**
- [ ] **VERIFY** Project-controlled total = **2.97–3.00%**, estimated public ≈ **97%**.
- [ ] **VERIFY** Calculator overall reads **"READY TO PROCEED TO LOCKING."**

🛑 **STOP** if: dev is not exactly 0 · any treasury outside 0.99–1.00% · personal outside range ·
project total outside 2.97–3.00% · **the calculator says STOP.** Fix allocation before locking.

## LOCK TREASURIES
- [ ] **DO** Open **Streamflow → QuickLock**. Connect the **Operational** wallet.
- [ ] **DO** Lock the treasury's **entire final FRP balance**: hard time-lock, **90 days**,
      **no linear vesting**, unlock recipient = **Operational** wallet (same wallet).
- [ ] **RECORD** the **Operational lock transaction** (sig, link, UTC) and the **exact unlock timestamp (UTC).**
- [ ] **DO** Repeat with the **Secondary** wallet: entire balance, 90-day hard lock, no linear vesting,
      unlock recipient = **Secondary** wallet.
- [ ] **RECORD** the **Secondary lock transaction** (sig, link, UTC) and the **exact unlock timestamp (UTC).**

🛑 **STOP** if: a lock uses linear/vesting instead of a hard time-lock · duration ≠ 90 days ·
unlock recipient is not the same treasury wallet · the unlock date is wrong · either lock does
not confirm on-chain.

## FINAL VERIFICATION
- [ ] **VERIFY** on the explorer (independently of Streamflow's UI) that **both** locks exist,
      hold the full treasury balances, and show the correct 90-day unlock dates.
- [ ] **VERIFY** dev balance is still **0**, personal + both treasuries still in range.
- [ ] **DO** In the calculator, tick both manual lock boxes **only now** → must read
      **"READY FOR FINAL ON-CHAIN VERIFICATION."**
- [ ] **RECORD** Use **Copy summary** to save the full proof log (mint, all tx sigs, unlock timestamps).

🛑 **STOP** if either lock cannot be **independently** verified on-chain. A Streamflow success
screen alone is **not** proof.

## UPDATE WEBSITE
- [ ] **VERIFY** Both locks are on-chain-confirmed and independently verified (from step above).
- [ ] **DO** Only then change the site's treasury-lock status from **PLANNED** to **LOCKED**,
      and publish the lock tx links + unlock dates.

🛑 **STOP** — do **not** write "LOCKED" until **both** Streamflow locks are confirmed and
independently verifiable. Until then it stays **PLANNED**.

## ANNOUNCE
- [ ] **VERIFY** One last read-through of the proof log: mint, dev=0, allocation, both 90-day locks.
- [ ] **DO** Announce FRP with the mint address and the verification/evidence links.

---

## THE ONE RULE
> **Do not announce the mint until allocation, dev = 0, both 90-day locks, and the on-chain
> evidence are ALL verified.**

---

## Verification (of this runbook itself)
- Percentages, wallets, and thresholds above match `tools/fkrp-launch-calculator.html`
  (dev 1.98–2.00% → even split → dev 0%; personal/treasuries 0.99–1.00%; project 2.97–3.00%).
- No step deploys, signs, sends, or edits the repo — the user performs every on-chain action.
- The calculator remains the single source of truth for launch-day arithmetic; this checklist
  routes the user to it at every decision point rather than restating numbers.
