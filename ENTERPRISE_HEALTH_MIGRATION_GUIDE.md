# Enterprise Health Cell Migration Guide

## ✅ Migration File Created Successfully

**Location:** `supabase/migrations/003_enterprise_health_cell_schema.sql`

---

## 📊 What's Included

### **11 Database Tables**

1. **services** - Core services being monitored
2. **health_checks** - Health check configurations
3. **metrics** - Time-series metrics data
4. **incidents** - Incident tracking and management
5. **incident_updates** - Timeline of incident updates
6. **maintenance_windows** - Scheduled maintenance tracking
7. **alert_rules** - Alerting rule definitions
8. **alert_history** - Historical record of triggered alerts
9. **sla_targets** - Service Level Agreement targets
10. **status_page_subscriptions** - User subscriptions to status page notifications
11. **audit_logs** - Comprehensive audit trail

### **3 Utility Functions**

- `update_updated_at_column()` - Automatically updates `updated_at` timestamps
- `calculate_uptime_percentage()` - Calculates service uptime percentage
- `generate_incident_number()` - Generates unique incident numbers (INC-XXXXX)

### **7 Automated Triggers**

- Automatic `updated_at` timestamp updates for all major tables

### **3 Convenience Views**

- `active_incidents` - View of all open incidents
- `service_health_summary` - Health summary for all services
- `recent_metrics_summary` - Recent metrics aggregated by service

### **Features**

✅ UUID primary keys for all tables
✅ Foreign key constraints with CASCADE rules
✅ JSONB fields for flexible metadata storage
✅ Comprehensive indexes for performance
✅ IF NOT EXISTS safety guards
✅ Row Level Security (RLS) - commented out, ready to enable
✅ Email validation constraints
✅ Status and severity enums via CHECK constraints

---

## 🚀 How to Apply the Migration

Since the environment doesn't have direct network access to Supabase, please follow these steps to apply the migration manually:

### **Option 1: Supabase Dashboard (Recommended)**

1. Open your Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/tjfeindwmpuyajvjftke
   ```

2. Click **"SQL Editor"** in the left sidebar

3. Click **"New query"** button

4. Copy the entire contents of:
   ```
   supabase/migrations/003_enterprise_health_cell_schema.sql
   ```

5. Paste into the SQL Editor

6. Click **"Run"** to execute the migration

7. Verify tables in **"Table Editor"**

### **Option 2: Supabase CLI (If you have it installed locally)**

If you're on your local machine with Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref tjfeindwmpuyajvjftke

# Push the migration
supabase db push
```

### **Option 3: Direct PostgreSQL Connection**

If you have `psql` installed and your database password:

```bash
PGPASSWORD="your_db_password" psql \
  -h db.tjfeindwmpuyajvjftke.supabase.co \
  -U postgres \
  -d postgres \
  -f supabase/migrations/003_enterprise_health_cell_schema.sql
```

---

## 🔍 Verification

After applying the migration, verify the tables were created:

1. Open Supabase Dashboard → **Table Editor**
2. You should see all 11 new tables listed
3. Check that views are created in **Database** → **Views**
4. Verify functions in **Database** → **Functions**

---

## 📝 Next Steps

1. **Enable Row Level Security (Optional)**
   - Uncomment the RLS sections at the end of the migration file
   - Customize policies for your security requirements

2. **Add Seed Data (Optional)**
   - Uncomment the seed data section to add sample services
   - Or create your own services programmatically

3. **Set Up Monitoring**
   - Create health check configurations
   - Set up alert rules
   - Configure SLA targets

4. **Build Your API**
   - Use the tables to build health monitoring endpoints
   - Create dashboards to visualize service health
   - Set up automated incident creation

---

## 🗂️ Table Relationships

```
services (root)
├── health_checks
├── metrics
├── incidents
│   └── incident_updates
├── maintenance_windows
├── alert_rules
│   └── alert_history
└── sla_targets

status_page_subscriptions (independent)
audit_logs (independent)
```

---

## 📚 Key Features by Table

### **Services Table**
- Track operational status
- Flexible metadata with JSONB
- Service types (api, database, frontend, third-party)

### **Health Checks Table**
- Multiple check types (http, tcp, ping, script, database)
- Configurable intervals and timeouts
- Enable/disable checks dynamically

### **Metrics Table**
- Time-series data storage
- Indexed for fast queries
- Tagged with JSONB for flexibility

### **Incidents Table**
- Auto-generated incident numbers (INC-00001)
- Track severity, status, and impact
- Resolution tracking with timestamps

### **Alert Rules Table**
- Threshold-based alerting
- Multiple notification channels via JSONB
- Cooldown periods to prevent spam

### **SLA Targets Table**
- Track uptime, response time, error rate
- Automated calculations
- Period-based measurements (daily, weekly, monthly)

---

## 🔒 Security Notes

- RLS is **commented out** by default
- Service role key required for admin operations
- Consider enabling RLS policies before going to production
- Audit logs track all changes with IP and user agent

---

## ⚡ Performance Optimizations

- **15+ indexes** created for common query patterns
- **JSONB GIN indexes** for metadata and tags
- **Composite indexes** for frequent joins
- **Timestamp indexes** for time-series queries

---

## 🛠️ Troubleshooting

### Tables Already Exist
If tables already exist, the migration will skip them (IF NOT EXISTS)

### Permission Errors
Ensure you're using the service role key, not the anon key

### Foreign Key Violations
Ensure you create tables in order (the migration handles this automatically)

---

## 📞 Support

For issues or questions:
- Check Supabase Dashboard logs
- Review the migration file for comments
- Verify environment variables in `.env`

---

**Migration Created:** 2025-11-11
**Project:** tjfeindwmpuyajvjftke
**File:** `supabase/migrations/003_enterprise_health_cell_schema.sql`
