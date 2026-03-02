#!/usr/bin/env python3
"""
HelloRuru 中文字體子集化工具
掃描全站 HTML/JS，提取中文字元，子集化為 woff2

用法：
  pip install fonttools brotli
  python subset-font.py --source <OTF 目錄> --output <woff2 輸出目錄> --fonts R.otf:Regular.woff2 SB.otf:Bold.woff2

範例：
  python subset-font.py \
    --source /tmp/genwan \
    --output ../../helloruru.github.io/fonts \
    --fonts GenWanMin2TC-R.otf:GenWanMin2TC-Regular.woff2 GenWanMin2TC-SB.otf:GenWanMin2TC-SemiBold.woff2

  python subset-font.py \
    --source /tmp/GenSenRounded \
    --output ../../helloruru.github.io/fonts \
    --fonts GenSenRounded2TW-R.otf:GenSenRounded-Regular.woff2 GenSenRounded2TW-M.otf:GenSenRounded-Medium.woff2 GenSenRounded2TW-B.otf:GenSenRounded-Bold.woff2
"""

import os
import re
import argparse
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options


# ── 預設掃描目錄（相對於 tools repo 根目錄）──
DEFAULT_SCAN_DIRS = [
    'public',                                    # tools 站
    os.path.join('..', 'helloruru.github.io'),   # lab 站
    os.path.join('..', 'happy-exit'),            # newday 站
]

BASE_CHARS = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    '0123456789 .,;:!?@#$%^&*()-_=+[]{}|\\/\"\''
    '<>~`©–—·「」『』【】《》、。！？；：（）％＆＋－／＝'
    '…〈〉→←•◇❖'
)


def find_files(directory, extensions=('.html', '.js', '.jsx', '.tsx')):
    """遞迴找檔案"""
    results = []
    if not os.path.exists(directory):
        return results
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist', '.next')]
        for f in files:
            if any(f.endswith(ext) for ext in extensions):
                results.append(os.path.join(root, f))
    return results


def extract_cjk_chars(directories):
    """從檔案中提取 CJK 字元"""
    chars = set()
    stats = {}

    for d in directories:
        dirname = os.path.basename(os.path.abspath(d))
        files = find_files(d)
        dir_chars = set()

        for filepath in files:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    found = re.findall(r'[\u4e00-\u9fff\u3400-\u4dbf]', content)
                    for ch in found:
                        chars.add(ch)
                        dir_chars.add(ch)
            except Exception:
                pass

        stats[dirname] = {'files': len(files), 'chars': len(dir_chars)}

    print('  掃描結果:')
    for dirname, data in stats.items():
        if data['files'] > 0:
            print(f'    {dirname}: {data["chars"]} 字 ({data["files"]} 個檔案)')

    return chars


def subset_font(source_path, output_path, text):
    """子集化字體為 woff2"""
    font = TTFont(source_path)

    options = Options()
    options.flavor = 'woff2'
    options.desubroutinize = True

    subsetter = Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)

    font.flavor = 'woff2'
    font.save(output_path)

    src_size = os.path.getsize(source_path) / 1024 / 1024
    dst_size = os.path.getsize(output_path) / 1024

    return src_size, dst_size


def main():
    parser = argparse.ArgumentParser(description='HelloRuru 中文字體子集化工具')
    parser.add_argument('--source', required=True, help='OTF/TTF 來源目錄')
    parser.add_argument('--output', default='.', help='woff2 輸出目錄（預設：當前目錄）')
    parser.add_argument('--fonts', nargs='+', required=True,
                        help='字體對應，格式：來源檔名:輸出檔名（例如 R.otf:Regular.woff2）')
    parser.add_argument('--scan', nargs='*', default=None,
                        help='自訂掃描目錄（預設：掃描 tools/lab/newday 三站）')
    parser.add_argument('--extra-chars', default='',
                        help='額外要包含的字元')
    args = parser.parse_args()

    # 計算掃描目錄
    tools_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    if args.scan is not None:
        scan_dirs = [os.path.abspath(d) for d in args.scan]
    else:
        scan_dirs = [os.path.join(tools_root, d) for d in DEFAULT_SCAN_DIRS]

    print('HelloRuru 字體子集化\n')

    # 1. 提取字元
    print('掃描網站...')
    cjk_chars = extract_cjk_chars(scan_dirs)
    all_text = ''.join(sorted(cjk_chars)) + BASE_CHARS + args.extra_chars
    print(f'\n  CJK 字元: {len(cjk_chars)} 個')
    print(f'  全部字元: {len(all_text)} 個\n')

    # 2. 解析字體對應
    font_pairs = []
    for pair in args.fonts:
        parts = pair.split(':')
        if len(parts) != 2:
            print(f'  格式錯誤（應為 來源:輸出）: {pair}')
            continue
        font_pairs.append((parts[0], parts[1]))

    # 3. 子集化
    os.makedirs(args.output, exist_ok=True)

    for src_name, dst_name in font_pairs:
        source = os.path.join(args.source, src_name)
        output = os.path.join(args.output, dst_name)

        if not os.path.exists(source):
            print(f'  找不到: {source}')
            continue

        print(f'處理 {src_name}...')
        src_mb, dst_kb = subset_font(source, output, all_text)
        print(f'  {src_mb:.1f} MB → {dst_kb:.0f} KB\n')

    print('完成！')


if __name__ == '__main__':
    main()
