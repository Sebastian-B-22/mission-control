# Kids Typing Game (Wings Typing) - MVP

This is a simple iPad + keyboard-friendly typing game inside Mission Control.

Routes:
- `/kids/typing` - typing game + profile switcher (Roma / Anthony)
- `/kids/rewards` - reward balances + mark redeemed

## What it does

- Shows a single short, original dragon-adventure sentence.
- Captures keystrokes (including Backspace).
- Highlights per-character correctness (green correct, red incorrect).
- Tracks:
  - **WPM** (based on correct chars)
  - **Accuracy** (correct / typed)
- Saves each finished sentence to Convex.

## Rewards + XP

When a sentence is completed, the backend computes XP (roughly based on WPM + accuracy).

XP milestones create **reward events**:
- Every **200 XP**: `bonus_bot_minutes` +5
- Every **500 XP**: `barnes_points` +10

Rewards are stored in the Convex table `rewardEvents` and are **unredeemed** until marked redeemed.

## Convex tables

- `typingProfiles` - totals per child (XP, best WPM/accuracy)
- `typingSessions` - each completed sentence
- `rewardEvents` - earned rewards + redemption state

## Admin / parent flow

1. Sign into Mission Control (Clerk)
2. Hand iPad + keyboard to kid
3. Open:
   - Typing: `https://<mission-control-host>/kids/typing`
   - Rewards: `https://<mission-control-host>/kids/rewards`
4. When you give the reward in real life, open `/kids/rewards` and click **Mark redeemed**.

## Agent hooks (Compass / James)

Agents can query reward balances via Convex:

### 1) By Clerk ID (recommended)

Convex query: `rewardEvents:getBalancesByClerkId`

Example:

```bash
cd mission-control
npx convex run rewardEvents:getBalancesByClerkId '{"clerkId":"<CLERK_USER_ID>"}'
```

Returns:

```json
{
  "roma": { "bonus_bot_minutes": 0, "barnes_points": 0 },
  "anthony": { "bonus_bot_minutes": 0, "barnes_points": 0 }
}
```

### 2) By Convex userId

Convex query: `rewardEvents:getBalances`

```bash
npx convex run rewardEvents:getBalances '{"userId":"<CONVEX_USER_ID>"}'
```

## Notes / MVP constraints

- The kids pages currently require being signed in to Mission Control.
- Prompts are generated from in-code word lists and templates (dragon themed, not book text).
