# Worker Operations Guide

This guide covers troubleshooting, monitoring, and scaling the Forg3t worker service.

## Health Checks

Workers expose a Prometheus-compatible metrics endpoint at `/metrics` on port 8000.

Key metrics include:
- `jobs_claimed_total`: Total jobs claimed
- `jobs_succeeded_total`: Successful job completions
- `jobs_failed_total`: Failed jobs
- `job_latency_ms`: Job processing time histogram
- `active_jobs`: Currently processing jobs

## Troubleshooting

### Common Issues

1. **Worker not claiming jobs**
   - Check API key validity
   - Verify control plane URL accessibility
   - Review worker logs: `fly logs -a forg3t-worker`

2. **Authentication failures**
   - Confirm API_KEY is correctly set
   - Check that the key has appropriate permissions
   - Verify the control plane is accepting connections

3. **Performance issues**
   - Monitor CPU and memory usage: `fly status`
   - Consider increasing VM resources
   - Check for network latency to control plane

### Log Analysis

View worker logs:
```bash
fly logs -a forg3t-worker
```

Look for these key log entries:
- `status:starting` - Worker initialization
- `status:checking_jobs` - Polling for jobs
- `status:job_claimed` - Successfully claimed a job
- `status:job_completed_success` - Job completed successfully
- `status:error` - Any errors during processing

## Scaling

### Horizontal Scaling

Add more worker instances:
```bash
fly scale count 3 -a forg3t-worker
```

### Vertical Scaling

Increase VM resources:
```bash
fly scale vm shared-cpu-2x --memory 1024 -a forg3t-worker
```

## Concurrency Controls

The worker implements concurrency through:

1. **Single-threaded polling**: Each worker polls for one job at a time
2. **Multiple worker instances**: Scale horizontally for concurrency
3. **Controlled poll intervals**: Configurable via `--poll-interval` flag

Default poll interval is 10 seconds. Adjust based on your workload:
```bash
python src/main.py poll --poll-interval 5
```

## Maintenance Tasks

### Cleanup Old Idempotency Records

Run this SQL command periodically to clean up old records:
```sql
SELECT cleanup_old_idempotency_records('24 hours');
```

This can be scheduled as a daily cron job in your database.

### Key Rotation

To rotate worker keys:
1. Generate a new API key in the control plane
2. Update the worker's API_KEY secret:
   ```bash
   fly secrets set API_KEY=new-api-key-value -a forg3t-worker
   ```
3. Redeploy the worker:
   ```bash
   fly deploy -a forg3t-worker
   ```

## Monitoring Alerts

Set up alerts for these conditions:

1. **High job failure rate**: Jobs failing consistently
2. **Low job throughput**: Workers idle when jobs are queued
3. **High latency**: Jobs taking longer than expected
4. **Resource exhaustion**: High CPU/memory usage

## Debugging

### Enable Verbose Logging

Temporarily increase log verbosity:
```bash
fly secrets set LOG_LEVEL=DEBUG -a forg3t-worker
fly deploy -a forg3t-worker
```

### Test Job Processing

Process a single job and exit:
```bash
python src/main.py run_once
```

This is useful for testing connectivity and configuration.