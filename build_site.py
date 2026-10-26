# -*- coding: utf-8 -*-
"""把 百合の写真 文件夹复制到桌面站点目录，并生成 data.js 图片清单。"""
import os
import re
import json
import shutil

SRC = r"F:\文档\pictures\百合の写真"
DST_ROOT = r"C:\Users\Administrator\Desktop\photo-gallery"
DST_PHOTOS = os.path.join(DST_ROOT, "photos")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}


def natural_key(name):
    """自然排序：数字按数值排，其余按字符。"""
    return [int(t) if t.isdigit() else t.lower()
            for t in re.split(r"(\d+)", name)]


def collect():
    """返回 [(分类名, 该分类下 [(src路径, 文件名), ...]), ...]"""
    cats = {}
    for entry in os.listdir(SRC):
        full = os.path.join(SRC, entry)
        if not os.path.isdir(full):
            continue
        files = []
        for fn in sorted(os.listdir(full), key=natural_key):
            p = os.path.join(full, fn)
            if os.path.isfile(p) and os.path.splitext(fn)[1].lower() in IMAGE_EXTS:
                files.append(fn)
        if files:
            cats[entry] = files
    return cats


def main():
    cats = collect()

    # 清空并重建 photos 目录
    if os.path.exists(DST_PHOTOS):
        shutil.rmtree(DST_PHOTOS)
    os.makedirs(DST_PHOTOS, exist_ok=True)

    photos = []
    total = 0
    # 分类按图片数量从多到少排序
    for cat in sorted(cats, key=lambda c: -len(cats[c])):
        cat_dir = os.path.join(DST_PHOTOS, cat)
        os.makedirs(cat_dir, exist_ok=True)
        for fn in cats[cat]:
            shutil.copy2(os.path.join(SRC, cat, fn), os.path.join(cat_dir, fn))
            photos.append({"cat": cat, "src": "photos/" + cat + "/" + fn})
            total += 1

    # 生成 data.js
    data_js = ("// 自动生成，请勿手动编辑（由 build_site.py 生成）。\n"
               "window.PHOTOS = ")
    data_js += json.dumps(photos, ensure_ascii=False, indent=None)
    data_js += ";\n"
    with open(os.path.join(DST_ROOT, "data.js"), "w", encoding="utf-8") as f:
        f.write(data_js)

    print(f"完成：复制 {total} 张图片，{len(cats)} 个分类。")
    for cat in sorted(cats, key=lambda c: -len(cats[c])):
        print(f"  {len(cats[cat]):4d}  {cat}")


if __name__ == "__main__":
    main()
