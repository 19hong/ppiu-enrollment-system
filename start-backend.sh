#!/bin/bash
export PGHOME=~/pgsql/usr/lib/postgresql/16
export PGBIN=$PGHOME/bin
export PGDATA=~/pgsql/data
export LD_LIBRARY_PATH=$PGHOME/lib:~/pgsql/usr/lib/x86_64-linux-gnu:/usr/lib/x86_64-linux-gnu

# Start PostgreSQL if not running
$PGBIN/pg_isready -h localhost > /dev/null 2>&1 || {
  echo "Starting PostgreSQL..."
  $PGBIN/pg_ctl -D $PGDATA -l ~/pgsql/logfile start
  sleep 2
}

# Start backend
cd /home/ubuntu/ppiu-enrollment-system/backend
npx tsx src/index.ts
