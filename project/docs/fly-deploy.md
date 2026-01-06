# Deploying Forg3t to Fly.io

This guide explains how to deploy the Forg3t control plane and worker services to Fly.io for production use.

## Prerequisites

1. Install the Fly.io CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Authenticate with Fly.io: `fly auth login`
3. Ensure you have a Fly.io organization account

## Environment Variables

Before deploying, you'll need to set the following environment variables:

### Control Plane

```bash
# Database connection
DATABASE_URL=postgresql://user:password@host:port/database

# Security secrets
JWT_SECRET=your-jwt-secret-here
ADMIN_BOOTSTRAP_KEY=your-admin-bootstrap-key-here
API_KEY_PEPPER=your-api-key-pepper-here

# Supabase integration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Worker

```bash
# Control plane connection
CONTROL_PLANE_URL=https://your-control-plane.fly.dev
API_KEY=your-worker-api-key-here

# Worker identification
WORKER_ID=forg3t-worker-1
```

## Deployment Steps

### 1. Deploy the Control Plane

```bash
# Navigate to control plane directory
cd packages/control-plane

# Set environment variables
fly secrets set \
  DATABASE_URL=your-database-url \
  JWT_SECRET=your-jwt-secret \
  ADMIN_BOOTSTRAP_KEY=your-admin-bootstrap-key \
  API_KEY_PEPPER=your-api-key-pepper \
  SUPABASE_URL=your-supabase-url \
  SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Deploy the application
fly deploy
```

### 2. Deploy the Worker

```bash
# Navigate to worker directory
cd packages/worker

# Set environment variables
fly secrets set \
  CONTROL_PLANE_URL=https://your-control-plane.fly.dev \
  API_KEY=your-worker-api-key

# Deploy the application
fly deploy
```

## Scaling

To scale the services:

### Control Plane
```bash
# Scale to multiple instances
fly scale count 2

# Increase VM resources
fly scale vm shared-cpu-2x --memory 1024
```

### Worker
```bash
# Scale to multiple workers
fly scale count 3

# Increase VM resources
fly scale vm shared-cpu-2x --memory 1024
```

## Monitoring

Both services expose health endpoints:

- Control Plane: `https://your-app.fly.dev/health`
- Worker Metrics: `https://your-worker.fly.dev/metrics`

## Troubleshooting

1. Check application logs:
   ```bash
   fly logs
   ```

2. Check application status:
   ```bash
   fly status
   ```

3. SSH into the machine:
   ```bash
   fly ssh console
   ```

## Cleanup Old Idempotency Records

To clean up old idempotency records, run this SQL command in your database:

```sql
SELECT cleanup_old_idempotency_records('24 hours');
```

This can be run manually or scheduled as a cron job.