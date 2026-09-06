#!/bin/bash
# 云函数部署脚本
# 将 shared 模块复制到每个需要的云函数目录中，然后部署

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLOUD_DIR="$PROJECT_DIR/cloudfunctions"
SHARED_DIR="$CLOUD_DIR/shared"
TCB_CMD=$(command -v tcb 2>/dev/null || echo "npx @cloudbase/cli")
ENV_ID="dev-5gu57acl6acc6a6b"

# 需要使用 shared 模块的函数列表
FUNCTIONS_WITH_SHARED=(
  "createRecord"
  "updateRecord"
  "createAnniversary"
  "updateAnniversary"
  "createDish"
  "updateDish"
  "getCalendarData"
  "getRecordsByDate"
  "getRecordsByDateRange"
  "addRecordComment"
  "createMenu"
)

echo "=== 云函数部署脚本 ==="
echo "环境: $ENV_ID"
echo ""

# 步骤 1: 复制 shared 到每个函数目录
echo "步骤 1: 准备 shared 模块..."
for fn in "${FUNCTIONS_WITH_SHARED[@]}"; do
  fn_dir="$CLOUD_DIR/$fn"
  if [ -d "$fn_dir" ]; then
    # 创建 shared 子目录
    mkdir -p "$fn_dir/shared"
    # 复制 shared 文件
    cp "$SHARED_DIR/validators.js" "$fn_dir/shared/"
    cp "$SHARED_DIR/constants.js" "$fn_dir/shared/"

    # 临时修改 require 路径: ../shared -> ./shared
    sed -i "s|require('../shared/|require('./shared/|g" "$fn_dir/index.js"
    echo "  ✓ 准备 $fn"
  else
    echo "  ✗ 目录不存在: $fn"
  fi
done

echo ""
echo "步骤 2: 部署云函数..."

# 部署所有云函数
deploy_count=0
for fn_dir in "$CLOUD_DIR"/*/; do
  fn_name=$(basename "$fn_dir")

  # 跳过非函数目录
  if [[ "$fn_name" == "__tests__" || "$fn_name" == "shared" ]]; then
    continue
  fi

  # 检查是否有 index.js
  if [ ! -f "$fn_dir/index.js" ]; then
    continue
  fi

  echo "  部署 $fn_name..."
  if $TCB_CMD fn deploy "$fn_name" -e "$ENV_ID" --force 2>&1 | grep -q "succeed\|success\|completed"; then
    echo "    ✓ 成功"
    ((deploy_count++))
  else
    echo "    ✗ 失败"
    $TCB_CMD fn deploy "$fn_name" -e "$ENV_ID" --force 2>&1 | tail -3
  fi
done

echo ""
echo "步骤 3: 清理临时文件..."
for fn in "${FUNCTIONS_WITH_SHARED[@]}"; do
  fn_dir="$CLOUD_DIR/$fn"
  if [ -d "$fn_dir/shared" ]; then
    rm -rf "$fn_dir/shared"
    # 恢复 require 路径
    sed -i "s|require('./shared/|require('../shared/|g" "$fn_dir/index.js"
    echo "  ✓ 清理 $fn"
  fi
done

echo ""
echo "=== 部署完成 ==="
echo "共部署 $deploy_count 个云函数"
