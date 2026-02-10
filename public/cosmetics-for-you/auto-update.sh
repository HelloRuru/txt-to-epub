#!/bin/bash

# auto-update.sh — 自動更新 Instagram 精選試色清單
# Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
#
# 使用方式：
# 1. 編輯 curated-list.txt（格式見範例）
# 2. bash auto-update.sh
# 3. 完成！

set -e

TODAY=$(date +%Y-%m-%d)
LIST_FILE="curated-list.txt"
OUTPUT_FILE="js/data/curated-posts.js"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📷 自動更新 Instagram 精選試色清單"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 檢查清單檔案
if [ ! -f "$LIST_FILE" ]; then
  echo "❌ 找不到 $LIST_FILE"
  echo ""
  echo "請建立 curated-list.txt 檔案，格式範例："
  echo ""
  cat <<'EOF'
# Instagram 精選試色清單
# 格式：色號 key 開頭，後面接 1-3 個 Instagram URL

ysl-416
https://www.instagram.com/p/C_abc123/
https://www.instagram.com/p/C_def456/
https://www.instagram.com/p/C_ghi789/

dior-999
https://www.instagram.com/p/C_jkl012/

mac-ruby woo
https://www.instagram.com/p/C_mno345/
https://www.instagram.com/p/C_pqr678/
EOF
  echo ""
  exit 1
fi

echo "📋 正在讀取清單..."
echo ""

# 備份原始檔案
if [ -f "$OUTPUT_FILE" ]; then
  cp "$OUTPUT_FILE" "${OUTPUT_FILE}.backup"
  echo "✅ 已備份原始檔案為 ${OUTPUT_FILE}.backup"
fi

# 開始生成新檔案
cat > "$OUTPUT_FILE" <<EOF
/**
 * curated-posts.js — 人工策劃的 Instagram 試色貼文
 * Cosmetics For You / tools.helloruru.com/cosmetics-for-you/
 *
 * 收錄熱門色號的高品質試色照片（Instagram 貼文 URL）
 * 使用 Instagram oEmbed API 顯示縮圖，保留原作者資訊
 */

/**
 * 最後更新時間
 * 格式：YYYY-MM-DD
 */
export const lastUpdated = '$TODAY'

export const curatedPosts = {
EOF

# 解析清單檔案
current_key=""
urls=()

while IFS= read -r line; do
  # 跳過空行和註解
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  # 判斷是 key 還是 URL
  if [[ "$line" =~ ^https?:// ]]; then
    # 這是 URL
    urls+=("$line")
  else
    # 這是新的 key
    # 先處理上一個 key
    if [ -n "$current_key" ] && [ ${#urls[@]} -gt 0 ]; then
      # 組合品牌和色號的註解
      brand=$(echo "$current_key" | cut -d'-' -f1 | tr '[:lower:]' '[:upper:]')
      color=$(echo "$current_key" | cut -d'-' -f2-)

      echo "  // $brand $color" >> "$OUTPUT_FILE"
      echo "  '$current_key': [" >> "$OUTPUT_FILE"

      for i in "${!urls[@]}"; do
        if [ $i -eq $((${#urls[@]} - 1)) ]; then
          echo "    '${urls[$i]}'" >> "$OUTPUT_FILE"
        else
          echo "    '${urls[$i]}'," >> "$OUTPUT_FILE"
        fi
      done

      echo "  ]," >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"

      echo "  ✅ $current_key (${#urls[@]} 個貼文)"
    fi

    # 設定新 key
    current_key=$(echo "$line" | tr '[:upper:]' '[:lower:]' | sed 's/\s\+/ /g' | xargs)
    urls=()
  fi
done < "$LIST_FILE"

# 處理最後一個 key
if [ -n "$current_key" ] && [ ${#urls[@]} -gt 0 ]; then
  brand=$(echo "$current_key" | cut -d'-' -f1 | tr '[:lower:]' '[:upper:]')
  color=$(echo "$current_key" | cut -d'-' -f2-)

  echo "  // $brand $color" >> "$OUTPUT_FILE"
  echo "  '$current_key': [" >> "$OUTPUT_FILE"

  for i in "${!urls[@]}"; do
    if [ $i -eq $((${#urls[@]} - 1)) ]; then
      echo "    '${urls[$i]}'" >> "$OUTPUT_FILE"
    else
      echo "    '${urls[$i]}'," >> "$OUTPUT_FILE"
    fi
  done

  echo "  ]" >> "$OUTPUT_FILE"

  echo "  ✅ $current_key (${#urls[@]} 個貼文)"
fi

# 結尾
cat >> "$OUTPUT_FILE" <<'EOF'
}

/**
 * 取得特定色號的 Instagram 貼文 URL
 * @param {string} brandId - 品牌 ID（小寫）
 * @param {string} colorCode - 色號（小寫）
 * @returns {string[]} Instagram 貼文 URL 陣列（最多 3 個）
 */
export function getCuratedPosts(brandId, colorCode) {
  if (!brandId || !colorCode) return []

  const key = `${brandId.toLowerCase()}-${colorCode.toLowerCase()}`
    .replace(/\s+/g, ' ')  // 統一空格
    .trim()

  return curatedPosts[key] || []
}

/**
 * 檢查是否有人工策劃的貼文
 */
export function hasCuratedPosts(brandId, colorCode) {
  return getCuratedPosts(brandId, colorCode).length > 0
}
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 已更新 $OUTPUT_FILE"
echo "✅ 更新日期：$TODAY"
echo ""
echo "下一步："
echo "  1. 檢查檔案：cat $OUTPUT_FILE"
echo "  2. 測試網站功能"
echo "  3. git add && git commit && git push"
echo ""
