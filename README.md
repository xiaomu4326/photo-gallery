# OumiShiori's Website

一个简洁的单页网站：可以**浏览相片**（按分类筛选、懒加载、灯箱查看）、**播放视频**（独立视频模块、点击卡片放大播放）、也可以**写备忘录**（保存在浏览器本地）。

## 功能

- 📷 **相册**：按番剧分类筛选，网格懒加载，点击放大查看，支持左右方向键 / 上一张下一张切换。
- 🎬 **视频**：独立「视频」标签页，与相册分开展示；卡片带预览封面 + 播放按钮，点击弹出播放器，支持上一集/下一集切换与进度条拖动。
- 📝 **备忘录**：新增、编辑、删除，内容保存在浏览器 `localStorage`，刷新不丢失。
- 🎨 **简洁风格**：纯静态页面，无需后端。

## 目录结构

```
photo-gallery/
├── index.html         # 页面
├── style.css          # 样式
├── script.js          # 逻辑（相册 + 视频 + 备忘录）
├── data.js            # 图片清单（自动生成）
├── videos.js          # 视频清单（自动生成）
├── build_site.py      # 重新生成相册（加入新照片后运行）
├── build_videos.py    # 复制视频（按分类）+ 生成 videos.js
├── photos/            # 相片（按分类子文件夹存放）
└── videos/            # < 25 MiB 的视频（按分类子文件夹存放）
```

## 加入新视频后如何更新

1. 把新视频放进 `F:\文档\videos\Other\<分类名>`（分类名 = 子文件夹名）。
2. 要加入新分类时，在 `build_videos.py` 的 `CATEGORIES` 列表里补上该文件夹名。
3. 运行 `python build_videos.py`：小于 25 MiB 的视频会复制到 `videos/<分类>/` 并写入 `videos.js`（含 `cat` 分类字段）；大于等于 25 MiB 的视频会被跳过（Cloudflare Pages 单文件上限为 25 MiB）。

> 提示：压缩软件生成的文件名若带 `.x264.aac`（例如 `xxx.x264.aac.mp4`），`build_videos.py` 复制时会自动去掉 `.x264.aac`，源文件夹内的文件名不受影响。

## 加入新照片后如何更新

把新照片放进对应分类文件夹后，运行：

```bash
python build_site.py
```

它会重新复制相片到 `photos/` 并刷新 `data.js`，然后重新 commit + push 即可。

> 提示：`build_site.py` 里的 `SRC`（相片目录）与 `DST_ROOT`（项目目录）如果路径变了请自行修改；`build_videos.py` 里的 `VIDEO_ROOT` / `CATEGORIES` 同理。
