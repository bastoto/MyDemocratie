-- First, let's check if the test cron job exists
SELECT jobname, schedule, command, active 
FROM cron.job 
WHERE jobname LIKE '%test%' OR jobname LIKE '%article%';
