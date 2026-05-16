#!/bin/sh
set -e

echo "Running database migrations..."
node dist/scripts/migrate.mjs

echo "Starting server..."
exec node dist/src/index.mjs
