# Security Specification — Digimon World Digital War (Firestore)

## 1. Data Invariants & Master Source of Truth

1. **Ownership Invariant**: Every `/players/{userId}` document belongs exclusively to the authenticated, email-verified user whose `request.auth.uid == userId`. Cross-user reads, writes, or list queries are strictly forbidden.
2. **PII Isolation Invariant**: Personal email addresses NEVER exist on `/players/{userId}` or `/usernames/{usernameKey}`. Email is strictly isolated inside `/players/{userId}/private/account`, guarded by both `isVerifiedOwner(userId)` and the parent Master Gate (`exists`/`existsAfter` on `/players/{userId}`).
3. **Permanent Starter Digimon Invariant**: Once `starterDigimon` on `/players/{userId}` is set to a non-null object, it is terminally locked and cannot be overwritten or deleted by subsequent client updates.
4. **Username Uniqueness & Atomicity Invariant**: A `/usernames/{usernameKey}` document can only be created for `request.auth.uid` if `/players/{uid}` exists in the same atomic transaction (`existsAfter`), cannot be mutated after creation (`allow update: if false`), and contains zero PII.
5. **Temporal Integrity & Anti-Poisoning Invariant**: All `createdAt`/`updatedAt` timestamps must strictly equal `request.time`. All document IDs, strings, maps, and arrays (`inventory <= 24`, `discoveredZones <= 20`, `equippedItems <= 10`) have strict type and size upper bounds.
6. **Exclusive GM RBAC Invariant**: Only the email-verified bootstrapped GM accounts (`opiadoalvorada@gmail.com`, `otiliolopesmirella@gmail.com`, and `tanisemarques2@gmail.com` with `email_verified == true`) hold GM privileges. Client writes to `/admins/{userId}` are universally denied (`if false`), blocking any self-promotion.
7. **Live Shared-World Presence Invariant**: `/worldPresence/{userId}` contains ZERO PII (only public avatar coordinates, Digimon form, and short chat text). Only the verified owner (`request.auth.uid == userId`) with an existing `/players/{userId}` profile may create/update/delete their own presence. Regular players are strictly forbidden from setting `isGm: true` (`!incoming().isGm || isAdmin()`), and `allow list` strictly enforces `existing().online == true` on the rule side.

## 2. The "Dirty Dozen" + GM RBAC + Multiplayer Adversarial Payloads (All Must Fail with `PERMISSION_DENIED`)

1. **Unauthenticated Player Read**: Unauthenticated client calls `get(/players/userA)`.
2. **Cross-User Player Read**: `userB` (normal player) calls `get(/players/userA)`.
3. **Blanket Collection Scraping**: `userA` (normal player) calls `list(/players)`, `list(/usernames)`, or `list(/admins)`.
4. **Unverified Email Write**: Authenticated user with `email_verified: false` tries to `create(/players/userA)`.
5. **Identity Spoofing on Create**: `userA` tries to create `/players/userA` with `ownerUid: "userB"`.
6. **Shadow Field Injection (Ghost Field)**: `userA` updates `/players/userA` adding `isAdmin: true` or `role: "gm"`.
7. **PII Leakage on Player Root**: `userA` attempts to store `email: "leak@example.com"` directly on `/players/userA` (blocked by strict `hasOnly`).
8. **Cross-User Private PII Read**: `userB` calls `get(/players/userA/private/account)`.
9. **Orphaned Private Account Write**: `userA` creates `/players/userA/private/account` when `/players/userA` does not exist.
10. **Terminal Starter Digimon Overwrite**: Normal player `userA` attempts to replace an already chosen `starterDigimon` (`agumon` -> `gaomon`).
11. **Timestamp Forgery & Immutable Field Mutation**: `userA` attempts to modify `createdAt` or `ownerUid` or pass a client timestamp instead of `request.time`.
12. **Resource / Array Poisoning**: `userA` attempts to write a 30-item `inventory` array (> 24 max), a 1.5KB `tamerName`, or a poisoned document ID with invalid characters.
13. **GM Self-Escalation Attack**: Normal player `userA` attempts `create(/admins/userA, { role: "gm" })`.
14. **GM Email Spoofing Attack**: Unverified account with `email: "opiadoalvorada@gmail.com"` and `email_verified: false` attempts to list `/alphaFeedback` or read `/players/userA`.
15. **Normal Player Feedback Scraping**: Normal player `userB` attempts `list(/alphaFeedback)` without restricting to `ownerUid == "userB"`.
16. **Multiplayer GM Badge Spoofing**: Normal player `userB` attempts `create(/worldPresence/userB)` with `isGm: true`.
17. **Cross-Player Avatar Hijack**: `userB` attempts `update(/worldPresence/userA)` to move another player's Tamer or inject chat text.
18. **Offline Presence Scraping**: `userB` attempts `list(/worldPresence)` without `where('online', '==', true)`.
19. **Presence Chat & Coordinate Poisoning**: `userA` attempts `update(/worldPresence/userA)` with a 500-char `chatText` (> 140 max) or `worldX: 999999`.
20. **Cross-Player Ranking Spoof**: `userB` attempts `create` or `update` on `/playerRankings/userA` or sets `isGm: true` on `/playerRankings/userB`.
21. **Non-Member Guild Ranking Tampering**: `userB` (not in `/guilds/g-dats.memberUids`) attempts `update(/guildRankings/g-dats)` to inflate guild level or kills.
22. **DWcoin Order Self-Approval or Price/Amount Tampering**: `userA` attempts `create(/dwCoinOrders/ord_1)` with `status: "approved"`, `termsAccepted: false`, mismatched `packId`/`priceCents`/`dwCoinAmount`, or `update` to `status: "approved"` or `cardNumber` shadow field.
23. **Non-GM Player List / Economy Scraping**: Normal player `userB` calls `list(/players)`, `list(/bannedAccounts)`, or `list(/gmAuditLogs)`.
24. **Cross-Player DWcoin Spend Spoofing**: Normal player `userB` attempts `create(/dwCoinTransactions/tx_1)` with `ownerUid: "userA"` or `type: "recharge"` / `"gm_grant"`.
25. **Unauthorized Ban / Announcement / Audit Forgery**: Normal player `userB` attempts `create(/bannedAccounts/userA)`, `set(/serverConfig/announcement)`, or `create(/gmAuditLogs/log_1)`.

