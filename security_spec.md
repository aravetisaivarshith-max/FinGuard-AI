# FinGuard AI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Ownership**: Every document under `/users/{userId}` and its subcollections (`/transactions/{transactionId}`, `/fraudAssessments/{assessmentId}`, `/preferences/{prefId}`) is readable, writable, and deletable exclusively by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. **Identity Integrity**: No user may forge `userId` or `uid` to point to another account. On updates, `uid`, `userId`, and `createdAt` are immutable.
3. **Parent Anchor (Master Gate)**: Subcollection writes require the parent `/users/{userId}` profile document to exist.
4. **Type, Range, and Size Bounds**: Amounts must be finite positive numbers (`> 0` and `<= 1,000,000,000`), dates must match `YYYY-MM-DD`, categories/types/payment methods must match strict allowlists, and all strings enforce explicit `.size()` bounds.
5. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time`.
6. **Zero Shadow Fields**: Every write validates exact key sets (`hasAll` + `hasOnly` on create; `affectedKeys().hasOnly(...)` on update).

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Read `/users/userA/transactions/tx1` with `auth == null`.
2. **Cross-Account Read (Account B reads Account A)**: Read `/users/userA/transactions/tx1` signed in as `userB`.
3. **Cross-Account List (Account B lists Account A)**: List `/users/userA/transactions` signed in as `userB`.
4. **Cross-Account Write Spoof**: Create `/users/userA/transactions/tx1` as `userB` with `userId: "userB"`.
5. **UID Body Forgery**: Create `/users/userB/transactions/tx1` as `userB` with `userId: "userA"`.
6. **Shadow Field Injection**: Create `/users/userB/transactions/tx1` with extra ghost field `isAdmin: true`.
7. **Unverified Email Bypass**: Create `/users/userB/transactions/tx1` where `request.auth.token.email_verified == false`.
8. **Negative or Zero Amount**: Create transaction with `amount: -500` or `amount: 0`.
9. **Invalid Date Format**: Create transaction with `transactionDate: "18/11/2026"` instead of `YYYY-MM-DD`.
10. **Immutable Ownership Tampering**: Update `/users/userB/transactions/tx1` attempting to mutate `userId` or `createdAt`.
11. **Oversized Path ID Poisoning**: Write to `/users/userB/transactions/${'a'.repeat(300)}` exceeding `isValidId` bounds.
12. **Client Timestamp Forgery**: Create transaction with a backdated client `createdAt` instead of `request.time`.
