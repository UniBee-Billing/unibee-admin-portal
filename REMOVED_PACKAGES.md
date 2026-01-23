# Removed Unused Packages

Date: 2026-01-23

## Dependencies Removed

| Package | Version | Reason |
|---------|---------|--------|
| @stripe/react-stripe-js | ^2.4.0 | No imports found in codebase |
| @stripe/stripe-js | ^2.2.2 | No imports found in codebase |
| @tanstack/react-query | ^5.36.0 | No imports found in codebase |
| antd-img-crop | ^4.24.0 | No imports found in codebase |
| currency.js | ^2.0.4 | No imports found in codebase |
| recharts | ^2.11.0 | No imports found in codebase |

## Verification

- Used `depcheck` to identify unused packages
- Manually verified with `grep` that no imports exist in `/src`
- Build tested successfully after removal

## Notes

If any of these packages are needed in the future, reinstall with:

```bash
yarn add <package-name>
```
