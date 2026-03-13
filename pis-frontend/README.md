# PIS Frontend (React + Vite)

Frontend application for Permit Issuance System.

## Run

```bash
npm install
npm run dev
```

## Key Functional Notes

### 1. Permit Application Upload Limit
- Permit upload field accepts PDF only.
- Maximum allowed file size: **300 KB**.
- Validation is shown inline on Permit Application Form.

### 2. Logout Confirmation Dialog
When user clicks Logout in header, a confirmation modal appears:

- Title (bold): **Permit Issuance System**
- Message: `Are you sure you want to logout from this session?`
- Buttons: `Cancel` and `Logout`
- UX behavior:
  - `Cancel` closes modal
  - `Logout` clears session and redirects to login
  - `Esc` key closes modal
  - Clicking outside modal closes modal

### 3. Role-Based Authority Dashboards
Authority dashboard tabs and actions are role-specific. SDPO and OC outcome tabs (Approved/Rejected) now use jurisdiction-filtered backend APIs.

## Build

```bash
npm run build
```
