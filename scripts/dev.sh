#!/usr/bin/env bash
set -euo pipefail
export NODE_ENV=development
node scripts/prisma-ctl.mjs generate
npm run dev

