# Construction Management System QA and Financial Audit Report

Date: 2026-07-11

## Executive Summary

I audited the Django REST Framework backend and React frontend with special focus on AFN/USD financial integrity. The highest-risk issue was confirmed and fixed: project budgets did not store a currency, so dashboard budget comparisons subtracted USD expenses from every budget. The system now stores `Project.budget_currency`, keeps project budget comparison in the project's own currency, and displays budget totals separately for USD and AFN.

I also fixed two payroll API runtime defects and tightened expense validation so one expense record cannot contain both AFN and USD values.

## Automated Tests Added

Backend tests added in `backend/reports/tests.py`:

- Expense serializer rejects mixed AFN/USD rows.
- Dashboard budget comparison uses only the project budget currency.
- Contract values, payments, and balances remain separated by currency.
- Bulk payroll creation uses existing model fields and calculates gross/net pay correctly.
- Unauthenticated financial API access is rejected.
- Expense API list totals are raw AFN/USD buckets, not converted mixed totals.

E2E smoke test scaffold added in `frontend/e2e/construction-management.spec.js`:

- Dashboard shows separate AFN/USD financial totals.
- Projects and expenses pages are reachable on mobile viewport.
- Protected routes redirect unauthenticated sessions.

Note: Playwright is not installed in `frontend/package.json`, so the E2E spec is ready but was not executed.

## Verification Results

- `python manage.py test`: passed, 6 tests.
- `npm run build`: passed.
- `npm run lint`: failed with existing frontend lint debt, including unused imports, hook lint violations, and fast-refresh export warnings.
- Coverage: not generated because `coverage` / `python -m coverage` is not installed in this environment.

## Bugs Fixed

1. Project budgets were currency-ambiguous.
   - Added `budget_currency` to `Project`.
   - Added migration `project/migrations/0002_project_budget_currency.py`.
   - Dashboard budget comparisons now calculate remaining budget only against same-currency spend.

2. Expense rows allowed mixed AFN and USD values.
   - Serializer and model validation now reject rows with both `amount_afn > 0` and `amount_usd > 0`.
   - Expense totals now aggregate raw currency buckets instead of converting and mixing.

3. Payroll bulk creation referenced removed model field `social_security`.
   - Removed invalid write.
   - Added regression test.

4. Payroll status endpoints referenced removed payment-status fields.
   - Updated metadata endpoint behavior to payment method/currency breakdown.

5. Dashboard frontend rendered budget totals as a single value.
   - Updated `FinancialOverview` to show USD and AFN budget totals separately.
   - Updated `BudgetComparison` to chart project spending in the project budget currency.

## Financial Audit Findings

### Currency Controls

Status after fixes:

- Project budgets now have `budget_currency`.
- Dashboard budget totals are split into AFN and USD.
- Expense API totals are split into AFN and USD.
- Payroll summaries already group employee and daily-worker payroll by currency.
- Contract dashboard totals group contract values and payments by currency.

Remaining concern:

- Historical imported expense rows may already contain both `amount_afn` and `amount_usd`. The new validation prevents future mixed rows through the API, but existing database data should be audited and cleaned.

Recommended SQL/Django check:

```sql
SELECT id, project_id, amount_afn, amount_usd
FROM expenses_expense
WHERE amount_afn > 0 AND amount_usd > 0;
```

### Project Budgets

Fixed:

- Estimated budget, actual expenses, remaining budget, utilization, and over-budget flags now compare only in the project budget currency.

Remaining recommendation:

- Add database constraints for non-negative `estimated_budget`.

### Payroll

Verified by tests:

- Gross pay = basic salary + overtime + bonus + allowances.
- Net pay = gross pay - deductions - tax.
- Payroll currency remains attached to each payroll record.

Remaining recommendation:

- Add validators preventing negative salary, bonus, allowances, deductions, tax, and overtime values.

### Contracts and Variations

Verified by tests:

- Contract totals remain separated by contract currency.
- Payments are summed in the contract currency.
- Approved variations adjust the contract value.

Remaining recommendation:

- Add stricter validation on negative variations so they cannot reduce adjusted contract value below zero or below paid amount unless explicitly approved by an admin workflow.

## Data Integrity Checks

Covered now:

- Contract values/payments separated by currency.
- Expense API totals match raw stored AFN/USD amounts.
- Payroll creation totals match employee/payroll inputs.

Recommended next tests:

- Inventory valuation from material transactions.
- Project total cost = raw expenses + payroll + contract payments, grouped by currency.
- Deleting or editing historical financial records produces an audit trail.
- Concurrent contract payments cannot exceed adjusted contract value under parallel requests.

## Security Findings

Covered now:

- Unauthenticated users cannot access `/api/expenses/`.
- RBAC permission classes are used across core viewsets.

Remaining risks:

- There is no organization/tenant model in the inspected code, so "users cannot modify another organization's data" cannot be fully enforced yet.
- Data-entry project scoping exists for expenses but not uniformly for all project-related financial resources.
- File upload endpoints validate extension/size, but uploads should also be virus-scanned and stored with private access controls in production.

## Seed Data

Added `python manage.py seed_qa_data` via `backend/project/management/commands/seed_qa_data.py`.

It generates:

- 20 projects
- 100 employees
- 50 subcontractors
- 500 material/expense transactions
- 200 payroll records
- 100 contracts
- 1000+ financial transactions through contract payments, payroll, expenses, and variations

I did not execute it against the local development database to avoid mutating user data.

## Recommendations

1. Install and wire backend coverage:
   - Add `coverage` or `pytest-cov`.
   - Enforce minimum coverage for financial modules.

2. Install Playwright:
   - Add `@playwright/test`.
   - Add `test:e2e` script and CI artifact screenshots.

3. Add database constraints:
   - Non-negative financial fields.
   - Exactly one expense currency amount must be positive.
   - Project budget currency cannot be null.

4. Add financial audit logging:
   - Track edits/deletes for expenses, payroll, contract payments, variations, invoices, and budgets.

5. Fix frontend lint debt:
   - Current lint failure is broad and pre-existing; it should be cleaned before CI enforcement.

6. Add tenant/organization ownership:
   - Required before organization-level access isolation can be proven.
