# FinGuard AI — User Guide & Deployment Checklist

## 1. Getting Started (Google Sign-In)
1. Open the FinGuard AI web application.
2. Click **Sign in with Google** and select a verified Google account.
3. FinGuard AI requests **OpenID Connect identity only** (name, email, avatar, and stable UID). It never requests Gmail, Google Drive, or bank access.

## 2. Managing Transactions
- **Add Transaction:** Navigate to **Transactions**, enter a date, type (`Income` or `Expense`), description, and INR amount. FinGuard AI displays a live AI category suggestion that you can keep or manually override before clicking **Save Transaction**.
- **Search & Filter:** Filter your ledger by description keyword, transaction type, category, or date range (`From Date` / `To Date`).
- **Edit & Delete:** Use the pencil or trash icons on any row to modify or remove entries owned by your account.
- **CSV Import:** Upload a `.csv` file with required columns `transaction_date`, `description`, `amount`, and `transaction_type` (optional: `category`, `payment_method`, `notes`). Review the **Accepted vs. Rejected** preview before clicking **Import**.
- **CSV Export:** Click **Download My Transactions** to export only your currently filtered records.

## 3. Personal Finance Analytics
- Open **Analytics** to inspect Total Income, Total Expenses, Net Savings, and Savings Rate in INR (`₹`).
- Adjust the date-range filter at the top right to update all five charts simultaneously:
  1. Income vs. Expenses by Month
  2. Expenses by Category
  3. Monthly Savings Trend
  4. Transaction Timeline
  5. Top Expense Categories Breakdown

## 4. Risk Monitor & PaySim Fraud Model Demo
- **Personal Activity Monitors:** Reviews your own ledger for possible duplicates (click **Mark Reviewed** to dismiss), configurable daily transaction frequency alerts, and unusual category expenses compared strictly against prior records in that category.
- **PaySim Fraud Model Demo:** Switch to the **PaySim Fraud Model Demo** tab to test Logistic Regression, Random Forest, and Isolation Forest scores on complete PaySim schema inputs (`step`, `type`, `amount`, `oldbalanceOrg`, `newbalanceOrig`, `oldbalanceDest`, `newbalanceDest`). Saved assessments remain scoped strictly to your UID.

## 5. Scam-Awareness Assistant
- Open **Scam Awareness**, paste suspicious message text (never real OTPs, UPI PINs, or CVVs), and click **Check Warning Signs**.
- Review detected warning categories (`OTP request`, `PIN request`, `Urgent pressure`, `Account threat`, `Link present`, `Prize claim`) and their educational explanations.

## 6. Two-Account Isolation Verification (Phase 11 Test)
1. Sign in as **Account A**, create fictional transactions (or click **Load Fictional Sample Ledger** on Overview), and note your totals.
2. Sign out and sign in as **Account B**.
3. Verify Account B sees **zero** records, charts, alerts, or PaySim assessments from Account A.
4. Export Account B's CSV and confirm it contains only Account B's records.

## 7. Account Export & Deletion
- Visit **Account & Privacy** to inspect your stable UID, download a full JSON or CSV archive of your workspace data, or click **Delete My Data** to permanently erase your stored records from Firestore.

## 8. Pushing to GitHub
```bash
git status            # Confirm .env, secrets, and node_modules are ignored
git add .
git commit -m "Complete FinGuard AI multi-user web app, Firestore rules, and test suite"
git branch -M main
git remote add origin https://github.com/<your-username>/FinGuard-AI.git
git push -u origin main
```
