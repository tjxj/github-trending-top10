# 🔥 GitHub 今日 Star 增长榜 TOP 10

每日自动更新的 GitHub Trending 项目榜单，暗色科技风主题。

## ✨ 功能特性

- 📊 **每日自动更新** — GitHub Actions 每日 09:00 (CST) 自动抓取最新数据
- 🌐 **语言筛选** — 支持按编程语言过滤榜单
- 📅 **历史查看** — 可切换查看不同日期的榜单
- 📱 **响应式设计** — 桌面端和移动端均可良好展示
- 🌙 **暗色主题** — 科技感暗色主题 + 霓虹渐变 + 卡片动效

## 🚀 快速开始

### 本地运行

```bash
# 安装 Python 依赖
pip install requests beautifulsoup4

# 抓取数据
python scripts/fetch_trending.py

# 启动本地预览
python -m http.server 8080
# 访问 http://localhost:8080
```

### 部署到 GitHub Pages

1. 创建 GitHub 仓库并推送代码
2. 在仓库 Settings → Pages 中，选择 GitHub Actions 作为部署来源
3. Actions 会自动运行，部署完成后即可访问

## 📁 项目结构

```
├── index.html                    # 主页面
├── style.css                     # 样式
├── app.js                        # 前端逻辑
├── data/
│   ├── latest.json               # 最新数据
│   ├── index.json                # 日期索引
│   └── YYYY-MM-DD.json           # 历史数据
├── scripts/
│   └── fetch_trending.py         # 抓取脚本
└── .github/workflows/
    └── daily-update.yml          # 自动更新工作流
```

## 🕐 自动更新时间

- **定时**: 每日 09:00 CST (UTC 01:00)
- **手动**: 在 Actions 页面点击 "Run workflow"

## 数据来源

[GitHub Trending](https://github.com/trending)
