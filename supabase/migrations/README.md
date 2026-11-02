# Migration order

1. `20261018_create_base_finanzas_schema.sql`
2. `20261019_add_contrapartes_and_transaction_links.sql`
3. `20261102_add_multiple_counterparties.sql`
4. `20261102_update_reset_finanzas_for_counterparties.sql`

The base schema migration mirrors the six core tables and their existing RLS policies for the replacement test environment. Apply all migrations to an isolated test project first. Review and test on a non-production database before applying anything to production.