#!/bin/bash

# update-curated.sh — Instagram 精選試色維護工具
# Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
#
# 使用方式：bash update-curated.sh

set -e

CURATED_FILE="js/data/curated-posts.js"
TODAY=$(date +%Y-%m-%d)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📷 Instagram 精選試色 — 維護工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 檢查檔案是否存在
if [ ! -f "$CURATED_FILE" ]; then
  echo "❌ 錯誤：找不到 $CURATED_FILE"
  exit 1
fi

# 顯示目前的清單
echo "📋 目前的精選清單："
echo ""
grep -E "^\s*'[^']+': \[" "$CURATED_FILE" | sed "s/^\s*'//; s/': \[//" | nl -w2 -s'. '
echo ""

# 主選單
echo "請選擇操作："
echo "  1) 新增色號"
echo "  2) 編輯色號"
echo "  3) 刪除色號"
echo "  4) 查看完整內容"
echo "  5) 退出"
echo ""
read -p "請輸入選項 (1-5): " choice

case $choice in
  1)
    # 新增色號
    echo ""
    echo "━━━ 新增色號 ━━━"
    echo ""

    read -p "品牌英文名稱（小寫，例如 ysl）: " brand
    read -p "色號（例如 416）: " color

    # 組合 key
    key="${brand}-${color}"
    key=$(echo "$key" | tr '[:upper:]' '[:lower:]' | sed 's/\s\+/ /g')

    echo ""
    echo "請輸入 Instagram 貼文 URL（最多 3 個，直接按 Enter 跳過）："
    urls=()
    for i in 1 2 3; do
      read -p "  URL $i: " url
      if [ -n "$url" ]; then
        urls+=("$url")
      fi
    done

    if [ ${#urls[@]} -eq 0 ]; then
      echo ""
      echo "❌ 至少需要輸入 1 個 URL"
      exit 1
    fi

    # 組合新條目
    echo ""
    echo "━━━ 預覽 ━━━"
    echo "Key: $key"
    echo "URLs:"
    for url in "${urls[@]}"; do
      echo "  - $url"
    done
    echo ""

    read -p "確認新增？(y/n): " confirm
    if [ "$confirm" != "y" ]; then
      echo "已取消"
      exit 0
    fi

    # 組合 JavaScript 格式
    new_entry="  // ${brand^^} ${color}\n  '${key}': [\n"
    for i in "${!urls[@]}"; do
      if [ $i -eq $((${#urls[@]} - 1)) ]; then
        new_entry+="    '${urls[$i]}'\n"
      else
        new_entry+="    '${urls[$i]}',\n"
      fi
    done
    new_entry+="  ],"

    # 找到 export const curatedPosts = { 的下一行
    line_num=$(grep -n "export const curatedPosts = {" "$CURATED_FILE" | cut -d: -f1)
    insert_line=$((line_num + 1))

    # 插入新條目
    sed -i "${insert_line}a\\
${new_entry}" "$CURATED_FILE"

    # 更新日期
    sed -i "s/export const lastUpdated = '[^']*'/export const lastUpdated = '$TODAY'/" "$CURATED_FILE"

    echo ""
    echo "✅ 已新增色號 $key"
    echo "✅ 已更新日期為 $TODAY"
    ;;

  2)
    # 編輯色號
    echo ""
    echo "━━━ 編輯色號 ━━━"
    echo ""
    echo "（功能開發中，請手動編輯 $CURATED_FILE）"
    ;;

  3)
    # 刪除色號
    echo ""
    echo "━━━ 刪除色號 ━━━"
    echo ""

    read -p "請輸入要刪除的 key（例如 ysl-416）: " key_to_delete

    # 檢查是否存在
    if ! grep -q "'${key_to_delete}'" "$CURATED_FILE"; then
      echo "❌ 找不到 $key_to_delete"
      exit 1
    fi

    echo ""
    read -p "確認刪除 $key_to_delete？(y/n): " confirm
    if [ "$confirm" != "y" ]; then
      echo "已取消"
      exit 0
    fi

    # 刪除整個條目（包含註解和陣列）
    # 找到 '${key}': [ 開始，到下一個 ], 結束
    sed -i "/\/\/ .*${key_to_delete}/,/\],/d" "$CURATED_FILE"

    # 更新日期
    sed -i "s/export const lastUpdated = '[^']*'/export const lastUpdated = '$TODAY'/" "$CURATED_FILE"

    echo ""
    echo "✅ 已刪除色號 $key_to_delete"
    echo "✅ 已更新日期為 $TODAY"
    ;;

  4)
    # 查看完整內容
    echo ""
    echo "━━━ 完整內容 ━━━"
    echo ""
    cat "$CURATED_FILE"
    ;;

  5)
    # 退出
    echo ""
    echo "👋 掰掰！"
    exit 0
    ;;

  *)
    echo ""
    echo "❌ 無效的選項"
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "下一步："
echo "  1. 檢查 $CURATED_FILE 是否正確"
echo "  2. 測試網站功能"
echo "  3. git add && git commit && git push"
echo ""
