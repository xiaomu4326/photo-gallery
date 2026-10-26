# -*- coding: utf-8 -*-
"""把视频按分类复制到站点目录，并生成 videos.js 清单。

- 分类对应 F:\文档\videos\Other 下的子文件夹（分类名 = 文件夹名）。
- 小于 25 MiB 的视频复制到 videos/<分类>/，随仓库一起上传。
- 大于等于 25 MiB 的视频跳过（Cloudflare Pages 单文件上限为 25 MiB）。
- 压缩软件生成的文件名带 `.x264.aac`（如 xxx.x264.aac.mp4），复制时去掉该后缀，
  源文件夹内的文件名保持不变。

用法：
    python build_videos.py
"""
import os
import json
import shutil
from urllib.parse import quote

VIDEO_ROOT = r"F:\文档\videos\Other"
CATEGORIES = [
    "私を喰べたい、ひとでなし",
    "君が死ぬまで恋をしたい",
]

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DST_VIDEOS = os.path.join(PROJECT_ROOT, "videos")

VIDEO_EXTS = {".mp4", ".webm", ".mov", ".m4v"}
LIMIT = 25 * 1024 * 1024  # 25 MiB


def main():
    # 清空并重建 videos 目录
    if os.path.exists(DST_VIDEOS):
        shutil.rmtree(DST_VIDEOS)
    os.makedirs(DST_VIDEOS, exist_ok=True)

    videos = []
    skipped = []
    for cat in CATEGORIES:
        src_dir = os.path.join(VIDEO_ROOT, cat)
        if not os.path.isdir(src_dir):
            print("警告：找不到分类目录 " + src_dir)
            continue

        dst_dir = os.path.join(DST_VIDEOS, cat)
        os.makedirs(dst_dir, exist_ok=True)

        for fn in sorted(os.listdir(src_dir)):
            p = os.path.join(src_dir, fn)
            if not os.path.isfile(p) or os.path.splitext(fn)[1].lower() not in VIDEO_EXTS:
                continue

            size = os.path.getsize(p)
            if size >= LIMIT:
                # 超过 25 MiB 无法上传到 Cloudflare Pages，跳过。
                skipped.append((cat, fn, size))
                continue

            # 压缩软件附加的 .x264.aac 后缀，复制到项目时去掉。
            dst_fn = fn.replace(".x264.aac", "")
            shutil.copy2(p, os.path.join(dst_dir, dst_fn))
            videos.append({
                "cat": cat,
                "title": os.path.splitext(dst_fn)[0],
                "src": "videos/" + cat + "/" + quote(dst_fn, safe=""),
                "size": size,
            })

    # 生成 videos.js
    data_js = ("// 自动生成，请勿手动编辑（由 build_videos.py 生成）。\n"
               "window.VIDEOS = ")
    data_js += json.dumps(videos, ensure_ascii=False, indent=None)
    data_js += ";\n"
    with open(os.path.join(PROJECT_ROOT, "videos.js"), "w", encoding="utf-8") as f:
        f.write(data_js)

    print("完成：复制 %d 个视频，跳过 %d 个超 25 MiB 的视频。"
          % (len(videos), len(skipped)))
    for v in videos:
        print("  [%s] %6.1f MiB  %s" % (v["cat"], v["size"] / 1048576, v["title"]))
    for cat, fn, size in skipped:
        print("  [跳过 %s] %6.1f MiB  %s" % (cat, size / 1048576, fn))


if __name__ == "__main__":
    main()
