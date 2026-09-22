#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""开物四百年 · 刷新腾讯云 CDN 缓存（网站更新后跑一次）

    python refresh_cdn.py                    # 刷新整站（路径 /）
    python refresh_cdn.py --urls https://你的域名/index.html ...

配置来源同 upload_to_cos.py（环境变量 / deploy/.env），刷新整站需额外填 CDN_DOMAIN。
依赖：pip install tencentcloud-sdk-python-cdn
"""
import argparse
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load_dotenv(path: Path) -> None:
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
CDN_DOMAIN = os.getenv("CDN_DOMAIN", "").strip()  # 加速域名，如 www.example.com


def die(msg: str) -> None:
    print(f"[x] {msg}")
    sys.exit(1)


def main() -> None:
    ap = argparse.ArgumentParser(description="刷新腾讯云 CDN 缓存")
    ap.add_argument("--urls", nargs="+", help="只刷新这些 URL（不填则刷新整站路径 /）")
    args = ap.parse_args()

    if not (SECRET_ID and SECRET_KEY):
        die("缺少密钥：设置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY（环境变量或 deploy/.env）")
    if not args.urls and not CDN_DOMAIN:
        die("缺少加速域名：设置 CDN_DOMAIN（如 www.example.com），或用 --urls 指定刷新地址")

    try:
        from tencentcloud.common import credential
        from tencentcloud.cdn.v20180606 import cdn_client, models
    except ImportError:
        die("缺少依赖：pip install tencentcloud-sdk-python-cdn")

    cred = credential.Credential(SECRET_ID, SECRET_KEY)
    client = cdn_client.CdnClient(cred)

    if args.urls:
        req = models.PurgeUrlsCacheRequest()
        req.Urls = args.urls
        label = f"{len(args.urls)} 个 URL"
        resp = client.PurgeUrlsCache(req)
    else:
        req = models.PurgePathCacheRequest()
        req.Domains = [CDN_DOMAIN]
        req.Paths = ["/"]
        req.FlushType = "flush"  # 只刷新有更新的资源，刷新额度消耗小
        label = f"整站 {CDN_DOMAIN}/"
        resp = client.PurgePathCache(req)

    print(f"[ok] 已提交刷新任务（{label}），任务ID {resp.TaskId}，约 5 分钟内生效")


if __name__ == "__main__":
    main()
