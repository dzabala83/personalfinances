# NEXO FINANZAS — Release runbook (approval required)

## Current release status
This is a release candidate only. No production database migration or production deployment is authorized by this document.

## Pre-deployment gates
1. Confirm the exact approved PR head SHA and ensure the PR is not behind `main`.
2. Confirm GitHub Actions validation passes for the exact candidate SHA.
3. Review all three SQL migrations in filename order.
4. Take and verify a production database backup/snapshot before any DDL.
5. Confirm the production Supabase project reference is `femwcgsptumpmwjqnhxp`.
6. Obtain explicit owner approval for the database migration and frontend deployment.

## Deployment order (only after approval)
1. Apply `20261019_add_contrapartes_and_transaction_links.sql`.
2. Verify tables, composite foreign keys, indexes, RLS policies, and grants.
3. Apply `20261102_add_multiple_counterparties.sql`.
4. Verify authenticated user A can only read/write their own assignments; user B cannot read or reference user A's rows.
5. Apply `20261102_update_reset_finanzas_for_counterparties.sql`.
6. Verify account reset deletes that user's counterparties and related movements while leaving other users untouched.
7. Merge the approved PR to `main`; verify GitHub Pages deployment and production login.
8. Smoke-test create/edit transactions with multiple counterparties, per-person amounts, reload persistence, and the transaction list.

## Rollback
- Frontend: revert the merge commit or redeploy the previous known-good `main` commit.
- Database: these are additive migrations; do not automatically drop the new tables or columns because they may contain user data. Disable the new UI by reverting frontend first, preserve the tables, and plan a reviewed forward-fix or a data-preserving SQL rollback only after backup.
- If any migration or smoke test fails, stop the deployment and leave the frontend on the previous version.

## Known review notes
- The production Supabase advisor currently reports an existing `SECURITY DEFINER` warning for `public.reset_my_finanzas()`. The function checks `auth.uid()`, uses an empty search_path, and schema-qualified references; this release preserves those protections and adds counterpart cleanup.
- Production advisor also reports leaked-password protection disabled and existing RLS performance warnings on `usuario_config`. These are pre-existing project findings, not introduced by these migrations; review them separately.
- Integration verification against the test Supabase project was unavailable during release preparation. Do not approve deployment until the test project is reachable and the migrations have been applied and exercised there.
