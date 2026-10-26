# 百合写真集 · 相册与备忘录

一个简洁的单页网站：可以**浏览相片**（按分类筛选、懒加载、灯箱查看），也可以**写备忘录**（保存在浏览器本地）。

## 功能

- 📷 **相册**：按番剧分类筛选，网格懒加载，点击放大查看，支持左右方向键 / 上一张下一张切换。
- 📝 **备忘录**：新增、编辑、删除，内容保存在浏览器 `localStorage`，刷新不丢失。
- 🎨 **简洁风格**：纯静态页面，无需后端，可直接托管在 GitHub Pages。

## 目录结构

```
photo-gallery/
├── index.html        # 页面
├── style.css         # 样式
├── script.js         # 逻辑（相册 + 备忘录）
├── data.js           # 图片清单（自动生成）
├── build_site.py     # 重新生成脚本（加入新照片后运行）
└── photos/           # 相片（按分类子文件夹存放）
```

## 上传到 GitHub 并部署

1. 在 GitHub 新建一个仓库（如 `photo-gallery`）。
2. 把本文件夹推上去：

```bash
cd photo-gallery
git init
git add .
git commit -m "初始：相册与备忘录"
git branch -M main
git remote add origin https://github.com/<你的用户名>/photo-gallery.git
git push -u origin main
```

3. 在仓库页 `Settings` → `Pages` 里，把 Source 选为 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`，保存。
4. 稍等片刻，即可通过 `https://<你的用户名>.github.io/photo-gallery/` 访问。

## 加入新照片后如何更新

把新照片放进对应分类文件夹后，运行：

```bash
python build_site.py
```

它会重新复制相片到 `photos/` 并刷新 `data.js`，然后重新 commit + push 即可。

> 提示：脚本里 `SRC` 指向本机相片目录、`DST_ROOT` 指向本项目目录，如果路径变了请自行修改。
