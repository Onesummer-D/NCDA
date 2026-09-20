#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""开物四百年 · 静态站上传腾讯云 COS

先在 frontend/ 下 `npm run build:cos` 构建，再运行本脚本：

    python upload_to_cos.py            # 上传 dist/（同名覆盖）
    python upload_to_cos.py --clean    # 同时删除远端已不在本地的多余对象

配置来源：环境变量 或 本目录 .env 文件（参考 .env.example，.env 不入库）。
依赖：pip install cos-python-sdk-v5
"""
import argparse
import mimetypes
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load_dotenv(path: Path) -> None:
    """极简 .env 加载，不引入额外依赖。已有环境变量优先。"""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


load_dotenv(HERE / ".env")

SECRET_ID = os.getenv("TENCENT_SECRET_ID", "").strip()
SECRET_KEY = os.getenv("TENCENT_SECRET_KEY", "").strip()
BUCKET = os.getenv("COS_BUCKET", "").strip()  # 完整桶名，如 kaiwu-site-1250000000
REGION = os.getenv("COS_REGION", "ap-hongkong").strip()
DIST = Path(os.getenv("COS_DIST_DIR", str(HERE.parent / "frontend" / "dist"))).resolve()

EXCLUDE_DIR_NAMES = {".git", ".vite", "node_modules", "__pycache__"}
EXCLUDE_FILE_NAMES = {".DS_Store", "Thumbs.db", "desktop.ini"}

# 入口文件要求浏览器每次都拿最新版（CDN 端配合刷新脚本使用）
NO_CACHE_KEYS = {"index.html", "content.json"}


def die(msg: str) -> None:
    print(f"[x] {msg}")
    sys.exit(1)


def collect_local_files():
    items = []
    for path in sorted(DIST.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(DIST)
        if any(part in EXCLUDE_DIR_NAMES for part in rel.parts):
            continue
        if path.name in EXCLUDE_FILE_NAMES:
            continue
        items.append((path, rel.as_posix()))
    return items


def upload_one(client, path: Path, key: str):
    ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if key.endswith(".html"):
        ctype = "text/html; charset=utf-8"
    extra = {"ContentType": ctype}
    if key in NO_CACHE_KEYS:
        extra["CacheControl"] = "no-cache"
    last_err = None
    for _ in range(3):  # 失败重试 3 次
        try:
            client.put_object_from_file(
                Bucket=BUCKET, Key=key, LocalFilePath=str(path), **extra
            )
            return None
        except Exception as exc:  # noqa: BLE001
            last_err = exc
    return last_err


def clean_remote(client) -> int:
    local_keys = {k for _, k in collect_local_files()}
    remote, marker = [], ""
    while True:
        resp = client.list_objects(Bucket=BUCKET, Marker=marker, MaxKeys=1000)
        remote += [c["Key"] for c in resp.get("Contents", [])]
        if resp.get("IsTruncated") == "true":
            marker = resp.get("NextMarker", "")
        else:
            break
    extra = [k for k in remote if k not in local_keys]
    for k in extra:
        client.delete_object(Bucket=BUCKET, Key=k)
    return len(extra)


def main() -> None:
    ap = argparse.ArgumentParser(description="上传静态站点到腾讯云 COS")
    ap.add_argument("--clean", action="store_true", help="删除远端存在但本地没有的对象")
    args = ap.parse_args()

    if not (SECRET_ID and SECRET_KEY):
        die("缺少密钥：设置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY（环境变量或 deploy/.env）")
    if not BUCKET:
        die("缺少桶名：设置 COS_BUCKET（完整桶名，带 -APPID 后缀）")
    if not DIST.is_dir():
        die(f"找不到构建产物：{DIST}\n    先执行  cd frontend && npm run build:cos")

    try:
        from qcloud_cos import CosConfig, CosS3Client
    except ImportError:
        die("缺少依赖：pip install cos-python-sdk-v5")

    client = CosS3Client(CosConfig(Region=REGION, SecretId=SECRET_ID, SecretKey=SECRET_KEY))
    items = collect_local_files()
    if not items:
        die(f"{DIST} 为空")
    total = len(items)
    print(f"[i] 共 {total} 个文件 -> cos://{BUCKET} ({REGION})")

    failed = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futs = {pool.submit(upload_one, client, p, k): k for p, k in items}
        done = 0
        for fut in as_completed(futs):
            key = futs[fut]
            err = fut.result()
            done += 1
            mark = "+" if err is None else "x"
            print(f"  [{done}/{total}] {mark} {key}" + (f"  {err}" if err else ""))
            if err:
                failed.append(key)

    if args.clean:
        removed = clean_remote(client)
        print(f"[i] --clean：删除远端多余对象 {removed} 个")

    if failed:
        print(f"[x] {len(failed)} 个文件失败，直接重跑本脚本即可续传")
        sys.exit(2)
    print("[ok] 上传完成")


if __name__ == "__main__":
    main()
