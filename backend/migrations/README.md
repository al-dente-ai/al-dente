# Database Migrations

This directory contains SQL migration scripts for the Al Dente database.

## Available Migrations

### 002_add_email_verification.sql
**Description:** Adds email verification functionality with 6-digit codes that expire after 10 minutes.

**Changes:**
- Adds `email_verified` column to the `users` table
- Creates `email_verification_codes` table to store verification codes
- Adds indexes for optimal performance
- Ensures only one active verification code per user

**How to Apply:**
```bash
# Option 1: Using psql command-line tool
psql -h <host> -U <username> -d <database> -f migrations/002_add_email_verification.sql

# Option 2: Using psql with connection string from environment
psql $DATABASE_URL -f migrations/002_add_email_verification.sql

# Option 3: Copy and paste the SQL content into your database management tool
```

**How to Rollback:**
```bash
psql -h <host> -U <username> -d <database> -f migrations/002_add_email_verification_rollback.sql
```

## Migration Best Practices

1. **Always backup your database before running migrations**
   ```bash
   pg_dump -h <host> -U <username> -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test migrations on a development/staging environment first**

3. **Run migrations in a transaction** (BEGIN/COMMIT/ROLLBACK)
   - All migration scripts use transactions by default
   - If a step fails, the entire migration is rolled back

4. **Keep migrations versioned and ordered**
   - Migration files are prefixed with numbers (001_, 002_, etc.)
   - Apply migrations in order

5. **Document each migration**
   - Include description, date, and author
   - List all changes made
   - Provide rollback instructions

## Checking Migration Status

To verify if a migration has been applied:

```sql
-- Check if email_verified column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'email_verified';

-- Check if email_verification_codes table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'email_verification_codes';

-- View email_verification_codes table structure
\d email_verification_codes
```

## Environment-Specific Migrations

### Development
```bash
psql postgresql://localhost:5432/al_dente -f migrations/002_add_email_verification.sql
```

### Production
```bash
# Always create a backup first!
pg_dump $DATABASE_URL > backup_before_migration.sql

# Apply migration
psql $DATABASE_URL -f migrations/002_add_email_verification.sql
```

## Troubleshooting

### Migration fails with "relation already exists"
The migration has likely been applied already. Check the current database schema:
```sql
\dt  -- List all tables
\d users  -- Describe users table
```

### Need to re-apply a migration
If you need to re-apply a migration:
1. First run the rollback script
2. Then run the migration script again

### Connection issues
If you can't connect to the database:
```bash
# Check your DATABASE_URL environment variable
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

