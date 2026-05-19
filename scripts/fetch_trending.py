#!/usr/bin/env python3
"""
GitHub Trending Top 10 数据抓取脚本
抓取 https://github.com/trending 页面数据，输出 JSON 格式
"""

import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta

import requests
from bs4 import BeautifulSoup

TRENDING_URL = "https://github.com/trending"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

CST = timezone(timedelta(hours=8))


def fetch_trending(since="daily"):
    """抓取 GitHub Trending 页面数据"""
    url = f"{TRENDING_URL}?since={since}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }

    print(f"Fetching {url} ...")
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    articles = soup.select("article.Box-row")

    if not articles:
        print("WARNING: No articles found. Page structure may have changed.", file=sys.stderr)
        return None

    items = []
    for i, article in enumerate(articles[:25]):  # 抓取前25个，供筛选用
        try:
            # 仓库名
            h2 = article.select_one("h2.h3 a, h2 a")
            if not h2:
                continue
            repo_path = h2.get("href", "").strip("/")
            if not repo_path:
                continue

            # 描述
            desc_tag = article.select_one("p.col-9")
            description = desc_tag.get_text(strip=True) if desc_tag else ""

            # 语言
            lang_span = article.select_one("[itemprop='programmingLanguage']")
            language = lang_span.get_text(strip=True) if lang_span else "Unknown"

            # 总 Star
            star_links = article.select("a.Link--muted")
            total_stars = 0
            forks = 0
            for link in star_links:
                href = link.get("href", "")
                text = link.get_text(strip=True).replace(",", "")
                if "/stargazers" in href:
                    total_stars = _parse_number(text)
                elif "/forks" in href or "/network/members" in href:
                    forks = _parse_number(text)

            # 今日 Star
            today_span = article.select_one("span.d-inline-block.float-sm-right")
            today_stars = 0
            if today_span:
                today_text = today_span.get_text(strip=True)
                match = re.search(r"([\d,]+)\s+stars?\s+today", today_text)
                if match:
                    today_stars = int(match.group(1).replace(",", ""))

            # 头像
            avatar_img = article.select_one("img[src*='avatars']")
            avatar_url = avatar_img.get("src", "") if avatar_img else ""

            items.append({
                "rank": i + 1,
                "repo": repo_path,
                "description": description,
                "language": language,
                "totalStars": total_stars,
                "todayStars": today_stars,
                "forks": forks,
                "avatarUrl": avatar_url,
                "url": f"https://github.com/{repo_path}",
            })
        except Exception as e:
            print(f"Error parsing article {i}: {e}", file=sys.stderr)
            continue

    # 按今日Star排序
    items.sort(key=lambda x: x["todayStars"], reverse=True)
    for idx, item in enumerate(items):
        item["rank"] = idx + 1

    return items[:10]  # 取 TOP 10


def _parse_number(text):
    """解析数字字符串，支持 K 后缀"""
    text = text.strip().replace(",", "")
    if text.upper().endswith("K"):
        return int(float(text[:-1]) * 1000)
    try:
        return int(text)
    except ValueError:
        return 0


def save_data(items):
    """保存数据到 JSON 文件"""
    os.makedirs(DATA_DIR, exist_ok=True)

    now = datetime.now(CST)
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%Y-%m-%d %H:%M:%S CST")

    # 提取所有语言
    languages = sorted(set(item["language"] for item in items if item["language"] != "Unknown"))

    data = {
        "date": date_str,
        "updatedAt": time_str,
        "items": items,
        "languages": languages,
    }

    # 保存 latest.json
    latest_path = os.path.join(DATA_DIR, "latest.json")
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved to {latest_path}")

    # 保存日期文件
    date_path = os.path.join(DATA_DIR, f"{date_str}.json")
    with open(date_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved to {date_path}")

    # 更新 index.json（日期列表）
    index_path = os.path.join(DATA_DIR, "index.json")
    dates = []
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            dates = json.load(f).get("dates", [])

    if date_str not in dates:
        dates.append(date_str)
        dates.sort(reverse=True)  # 最新的在前

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump({"dates": dates, "updatedAt": time_str}, f, ensure_ascii=False, indent=2)
    print(f"Updated index.json ({len(dates)} dates)")

    return data


def main():
    items = fetch_trending()
    if not items:
        print("Failed to fetch trending data", file=sys.stderr)
        sys.exit(1)

    data = save_data(items)
    print(f"\nDone! Fetched {len(items)} repos for {data['date']}")
    print(f"Top 1: {items[0]['repo']} (+{items[0]['todayStars']} stars)")


if __name__ == "__main__":
    main()
