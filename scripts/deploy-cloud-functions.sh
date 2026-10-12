#!/bin/bash
# 使用独立部署目录，不修改工作区 require 路径。
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STAGING_DIR="$(mktemp -d -t loveCalendar-deploy-XXXXXX)"
node "$SCRIPT_DIR/prepare-cloud-functions.js" --output "$STAGING_DIR"
cd "$STAGING_DIR"
npm exec --yes --package=@cloudbase/cli@3.8.5 -- tcb fn deploy --all --force --install-dependency true
echo "部署包保留在: $STAGING_DIR"
