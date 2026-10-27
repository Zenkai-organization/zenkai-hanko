#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "${SCRIPT_DIR}/.." && pwd)}"

HANKO_BIN="${HANKO_BIN:-${PROJECT_ROOT}/backend/zenkai-hanko}"
HANKO_CONFIG="${HANKO_CONFIG:-${PROJECT_ROOT}/backend/config/config.yaml}"
HANKO_SERVE_MODE="${HANKO_SERVE_MODE:-all}"
HANKO_BUILD_ON_START="${HANKO_BUILD_ON_START:-1}"
HANKO_FORCE_REBUILD="${HANKO_FORCE_REBUILD:-0}"
HANKO_PUBLIC_PORT="${HANKO_PUBLIC_PORT:-4604}"
HANKO_ADMIN_PORT="${HANKO_ADMIN_PORT:-4605}"
HANKO_DEV_FRONTEND_PORT="${HANKO_DEV_FRONTEND_PORT:-4606}"

build_hanko() {
  local backend_dir
  backend_dir="${PROJECT_ROOT}/backend"

  if ! command -v go >/dev/null 2>&1; then
    echo "Go toolchain not found. Install Go or set HANKO_BIN to a prebuilt binary." >&2
    exit 1
  fi

  echo "Building Hanko binary at ${HANKO_BIN}..."
  mkdir -p "$(dirname "${HANKO_BIN}")"
  (
    cd "${backend_dir}"
    go generate ./...
    go build -a -o "${HANKO_BIN}" main.go
  )
}

if [[ "${HANKO_FORCE_REBUILD}" == "1" ]]; then
  build_hanko
elif [[ ! -x "${HANKO_BIN}" ]]; then
  if [[ "${HANKO_BUILD_ON_START}" == "1" ]]; then
    build_hanko
  else
    echo "Hanko binary not found or not executable: ${HANKO_BIN}" >&2
    echo "Set HANKO_BIN, or enable auto-build with HANKO_BUILD_ON_START=1." >&2
    exit 1
  fi
fi

if [[ ! -f "${HANKO_CONFIG}" ]]; then
  echo "Hanko config file not found: ${HANKO_CONFIG}" >&2
  echo "Set HANKO_CONFIG to a valid config file path." >&2
  exit 1
fi

# Dev-only defaults for local port mapping.
# Hanko config uses envconfig with no prefix, so variable names must be SERVER_*.
export SERVER_PUBLIC_ADDRESS="${SERVER_PUBLIC_ADDRESS:-0.0.0.0:${HANKO_PUBLIC_PORT}}"
export SERVER_ADMIN_ADDRESS="${SERVER_ADMIN_ADDRESS:-0.0.0.0:${HANKO_ADMIN_PORT}}"

echo "Starting Hanko dev server"
echo "  public:  http://localhost:${HANKO_PUBLIC_PORT}"
echo "  admin:   http://localhost:${HANKO_ADMIN_PORT}"
echo "  frontend origin (expected): http://localhost:${HANKO_DEV_FRONTEND_PORT}"

exec "${HANKO_BIN}" serve "${HANKO_SERVE_MODE}" --config "${HANKO_CONFIG}"
