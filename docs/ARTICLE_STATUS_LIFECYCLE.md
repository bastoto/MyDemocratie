# Article Status Lifecycle - README (pg_cron)

## Overview
This system automatically transitions articles through their lifecycle statuses based on voting results and time-based criteria. It uses **pg_cron** to run the logic entirely within the database.

## Status Flow

```
Debate Duration voting opened
  ↓ (1 week after first vote + ≥1 vote)
Debate ongoing
  ↓ (after voted duration elapses)
Voting opened
  ↓ (after 2 weeks)
Approved / Rejected
```

## Setup Instructions

### 1. Enable pg_cron Extension

In your Supabase Dashboard:
1. Go to **Database** > **Extensions**
2. Search for `pg_cron`
3. Click **Enable**

### 2. Apply Database Migration

Run the migration file in your Supabase SQL editor:
```bash
supabase/migrations/20251201_article_status_lifecycle.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

This migration will:
1. Create all necessary status transition functions
2. Schedule the job to run every day at midnight (`0 0 * * *`)

## Monitoring

### Check Scheduled Jobs
Run this SQL query to see your active jobs:
```sql
SELECT * FROM cron.job;
```

### Check Job Execution History
Run this SQL query to see logs of past executions:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Testing

### Manual Trigger

You can manually trigger the transition logic at any time by running this SQL command:
```sql
SELECT process_all_status_transitions();
```

### Test Scenarios

1. **Create test article** with status "Debate Duration voting opened"
2. **Add a vote** to `voting_history` with `typevote = 'Debate_Duration_voting'`
3. **Manually update** `votedate` to 8 days ago
4. **Run manual trigger** and verify status changes to "Debate ongoing"

## Database Functions

### `process_all_status_transitions()`
Master function that processes all transitions. Returns JSON summary.

### `process_debate_duration_to_ongoing()`
Transitions articles from "Debate Duration voting opened" to "Debate ongoing".

### `process_debate_ongoing_to_voting()`
Transitions articles from "Debate ongoing" to "Voting opened".

### `process_voting_to_final()`
Transitions articles from "Voting opened" to "Approved" or "Rejected".

## Transition Rules

### Debate Duration Voting → Debate Ongoing
- **Criteria**: ≥1 vote + 1 week since first vote
- **Action**: Calculate winning duration, save to `voted_debate_duration`

### Debate Ongoing → Voting Opened
- **Criteria**: Voted duration has elapsed
- **Duration mapping**: One Month = 30 days, Two Months = 60 days, etc.

### Voting Opened → Approved/Rejected
- **Criteria**: 2 weeks have passed
- **Logic**: 
  - `nb_approve > nb_reject` → Approved
  - `nb_reject >= nb_approve` → Rejected (ties = rejected)

## Important Notes

- `statuschangedate` is automatically updated on every status change
- All time calculations use `statuschangedate` as reference
- Job runs every hour inside the database
- No external API calls or Vercel configuration required

## Troubleshooting

### Job not running
- Verify `pg_cron` extension is enabled in Dashboard
- Check `cron.job` table to ensure job is scheduled
- Check `cron.job_run_details` for error messages

### Transitions not happening
- Check article has required data (votes, statuschangedate, etc.)
- Manually trigger function to test logic
- Check Supabase logs for function errors
