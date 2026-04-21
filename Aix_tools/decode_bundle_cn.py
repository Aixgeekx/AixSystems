#!/usr/bin/env python3                                # 解 webpack minified bundle 的 \uXXXX 转义
import re, sys, os, pathlib, collections

root = pathlib.Path(r"E:/Desktop/Aix_ai/AixApp/title/raw")  # 目标目录
files = ["main.js", "vendor.js"]                       # 待扫描的 bundle
pat = re.compile(r'"((?:\\u[0-9a-fA-F]{4}){2,50})"')    # 纯 \u 组成的字符串

bag = collections.Counter()                            # 统计去重
for f in files:
    p = root / f
    if not p.exists(): continue
    txt = p.read_text(encoding="utf-8", errors="ignore")
    for m in pat.finditer(txt):
        raw = m.group(1)
        try:
            s = raw.encode().decode("unicode_escape")   # 解码
        except Exception:
            continue
        if 2 <= len(s) <= 40:                           # 过滤太短或太长
            bag[s] += 1

out = root.parent / "cn_strings.txt"                   # 输出
with open(out, "w", encoding="utf-8") as f:
    for s, c in sorted(bag.items(), key=lambda x: -x[1]):
        f.write(f"{c:5d}  {s}\n")
print(f"共 {len(bag)} 条中文字符串 -> {out}")
