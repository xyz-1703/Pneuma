# PostgreSQL Administration Guide for Pneuma

This guide covers common PostgreSQL administration tasks for the Pneuma Mental Wellness application.

## Connection & Setup

### Access PostgreSQL CLI

```bash
# Connect as superuser (first time setup)
sudo -u postgres psql

# Connect to specific database
sudo -u postgres psql -d mental_wellness

# Connect as pneuma user
PGPASSWORD='your_password' psql -h localhost -U pneuma -d mental_wellness

# Connect from remote machine
PGPASSWORD='your_password' psql -h 192.168.1.100 -U pneuma -d mental_wellness -p 5432
```

### List Commands

Inside PostgreSQL shell (`psql`):

```sql
\l              -- List all databases
\du             -- List all users/roles
\dn             -- List all schemas
\dt             -- List all tables in current schema
\dt+            -- List tables with sizes
\di             -- List indexes
\dT             -- List data types
\df             -- List functions
\dp             -- List access privileges
\d+ table_name  -- Describe specific table with extended info
\quit or \q     -- Exit psql
```

## User & Permission Management

### Create New Application User

```sql
-- Create user with password
CREATE USER app_user WITH PASSWORD 'secure_password_here';

-- Create user with limited permissions
CREATE USER readonly_user WITH PASSWORD 'password' NOCREATEDB NOCREATEUSER;

-- List users
\du

-- Change password
ALTER USER app_user WITH PASSWORD 'new_password';

-- Delete user
DROP USER app_user;
```

### Grant Permissions

```sql
-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE mental_wellness TO app_user;

-- Grant schema permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO app_user;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Grant sequence permissions (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Grant read-only access to specific table
GRANT SELECT ON users TO readonly_user;

-- Revoke permissions
REVOKE ALL ON DATABASE mental_wellness FROM app_user;
```

### Set Default Permissions

```sql
-- Set default for new tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pneuma;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO pneuma;

-- Set default for new functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO pneuma;
```

## Database Operations

### Backup & Restore

```bash
# Backup entire database with compression
sudo -u postgres pg_dump -d mental_wellness -Fc > mental_wellness.backup

# Backup to SQL file
sudo -u postgres pg_dump -d mental_wellness > mental_wellness.sql

# Backup specific table
sudo -u postgres pg_dump -d mental_wellness -t users > users.sql

# Backup excluding certain tables
sudo -u postgres pg_dump -d mental_wellness --exclude-table=sessions > no_sessions.sql

# Restore from backup
sudo -u postgres pg_restore -d mental_wellness mental_wellness.backup

# Restore SQL file
sudo -u postgres psql -d mental_wellness < mental_wellness.sql

# Restore specific table (will overwrite!)
sudo -u postgres psql -d mental_wellness < users.sql
```

### Clone/Copy Database

```bash
-- Create empty database
CREATE DATABASE mental_wellness_copy;

-- Copy structure and data
pg_dump mental_wellness | psql -d mental_wellness_copy;

-- Or for faster operations
CREATE DATABASE mental_wellness_copy TEMPLATE mental_wellness;
```

### Maintenance

```sql
-- Analyze (update query planner statistics)
ANALYZE;

-- Vacuum (reclaim dead rows)
VACUUM;

-- Both together (recommended)
VACUUM ANALYZE;

-- Full vacuum (blocks database, use during maintenance)
VACUUM FULL;

-- Reindex (fix corrupted indexes)
REINDEX DATABASE mental_wellness;

-- Check database integrity
DBCC CHECKDB('mental_wellness');
```

## Monitoring & Performance

### View Active Connections

```sql
-- Show active queries
SELECT pid, usename, application_name, state, query 
FROM pg_stat_activity 
WHERE state != 'idle';

-- Count connections by user
SELECT usename, COUNT(*) FROM pg_stat_activity GROUP BY usename;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < NOW() - INTERVAL '10 minutes';

-- Kill specific connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = 12345;
```

### Slow Queries

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1 second
SELECT pg_reload_conf();  -- Reload configuration

-- View slow query log
tail -f /var/log/postgresql/postgresql-*.log | grep "duration:"

-- Install pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slowest queries
SELECT query, calls, mean_time, total_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

### Database & Table Sizes

```sql
-- Total database size
SELECT pg_size_pretty(pg_database_size('mental_wellness'));

-- Size of each table
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_catalog.pg_tables
WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Top 10 largest tables
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_catalog.pg_tables
WHERE schemaname != 'pg_catalog'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Index sizes
SELECT 
    schemaname,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Connection Limits

```sql
-- Current connection count
SELECT count(*) FROM pg_stat_activity;

-- Connection limit by user
SELECT usename, connlimit FROM pg_user;

-- Set connection limit for user
ALTER USER app_user CONNECTION LIMIT 50;

-- Set connection limit for database
ALTER DATABASE mental_wellness CONNECTION LIMIT 100;
```

## Troubleshooting

### Out of Space

```sql
-- Check what's taking up space
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_catalog.pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum to reclaim space
VACUUM ANALYZE mental_wellness;

-- Or with full vacuum (blocks access)
VACUUM FULL ANALYZE mental_wellness;

-- Check available disk space
df -h /var/lib/postgresql/
```

### Memory Issues

```bash
# Check PostgreSQL memory usage
ps aux | grep postgres | grep -v grep

# Check system memory
free -h

# Edit postgresql.conf to reduce memory usage
sudo nano /etc/postgresql/14/main/postgresql.conf

# Reduce these values:
# shared_buffers = 256MB          # For low-memory servers
# effective_cache_size = 1GB
# work_mem = 4MB
# maintenance_work_mem = 64MB

sudo systemctl restart postgresql
```

### Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check listening ports
sudo netstat -tlnp | grep postgres

# Check configuration
grep "listen_addresses" /etc/postgresql/14/main/postgresql.conf

# Should be: listen_addresses = 'localhost'
# For remote access: listen_addresses = '*'
```

### Permission Denied

```bash
# Check pg_hba.conf authentication
sudo cat /etc/postgresql/14/main/pg_hba.conf

# Should include:
# TYPE  DATABASE        USER            ADDRESS                 METHOD
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
# host    mental_wellness pneuma          127.0.0.1/32            md5

# Reload if changed
sudo systemctl reload postgresql
```

### Cannot Create User/Database

```bash
-- Check current user privileges
\du

-- User might not have CREATEUSER role
-- Grant as superuser
\c postgres postgres
GRANT CREATEUSER TO pneuma;

-- Or create user as superuser
sudo -u postgres createuser -d -r -s new_user
```

## Replication & High Availability (Advanced)

### Setup Physical Streaming Replication

**On Primary Server:**

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add/modify:
```
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
```

```bash
# Create replication user
sudo -u postgres psql
```

```sql
CREATE USER replication WITH REPLICATION ENCRYPTED PASSWORD 'replication_password';
```

**On Standby Server:**

```bash
# Create backup from primary
sudo -u postgres pg_basebackup -h PRIMARY_IP -D /var/lib/postgresql/14/main -U replication
```

## Query Optimization

```sql
-- Enable EXPLAIN ANALYZE to see query plans
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Create indexes for frequently accessed columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_chat_user_id ON chat(user_id);
CREATE INDEX idx_journal_user_created ON journal(user_id, created_at DESC);

-- View existing indexes
\di

-- Check index usage statistics
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Drop unused indexes
DROP INDEX IF EXISTS unused_index;
```

## Common Commands Cheatsheet

| Command | Description |
|---------|-------------|
| `sudo systemctl status postgresql` | Check PostgreSQL status |
| `sudo systemctl start postgresql` | Start PostgreSQL |
| `sudo systemctl stop postgresql` | Stop PostgreSQL |
| `sudo systemctl restart postgresql` | Restart PostgreSQL |
| `sudo -u postgres psql` | Open PostgreSQL shell |
| `sudo -u postgres createdb mydb` | Create database |
| `sudo -u postgres createuser myuser` | Create user |
| `sudo -u postgres psql -l` | List all databases |
| `sudo -u postgres psql -d mydb -c "SELECT version();"` | Run single query |
| `sudo tail -f /var/log/postgresql/postgresql.log` | View logs |
| `sudo pg_dump mydb > backup.sql` | Backup database |
| `sudo psql mydb < backup.sql` | Restore database |

## Emergency Procedures

### Database is Corrupted

```bash
# Stop the application
sudo systemctl stop pneuma.service

# Stop PostgreSQL
sudo systemctl stop postgresql

# Run recovery mode
sudo -u postgres /usr/lib/postgresql/14/bin/postgres --single -D /var/lib/postgresql/14/main -c exit_on_error=true

# Or restore from backup
sudo systemctl start postgresql
gunzip -c /backups/postgresql/mental_wellness_latest.sql.gz | \
  sudo -u postgres psql -d mental_wellness

# Start application
sudo systemctl restart pneuma.service
```

### Lost Root Password / Can't Connect

```bash
# If you can connect as another user, create new superuser
sudo -u postgres createuser -s new_superuser

# Then use that to reset other passwords
sudo -u postgres psql
ALTER USER pneuma WITH PASSWORD 'new_password';
```

### Migrations Needed After Update

```bash
# Use alembic if configured
cd /var/www/pneuma/backend
../venv/bin/python -m alembic upgrade head

# Or run raw SQL for table schema updates (document changes first!)
sudo -u postgres psql -d mental_wellness < schema_update.sql
```
