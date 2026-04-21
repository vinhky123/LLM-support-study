#!/usr/bin/env bash
# Use docker-compose to run the application to avoid environment gap.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "Starting Cloud Study Assistant with docker-compose..."
echo

# Check if docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: docker is not installed. Please install docker and try again."
  exit 1
fi

# Check if docker compose is available (either as plugin or standalone)
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "Error: neither docker compose nor docker-compose is installed."
  exit 1
fi

cleanup() {
  echo "Stopping services..."
  $DOCKER_COMPOSE down
}
trap cleanup EXIT INT TERM

$DOCKER_COMPOSE up --build