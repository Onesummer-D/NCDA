"""DeepSeek Chat API 客户端（OpenAI 兼容协议，httpx 同步调用）。

- 问答页走 chat_stream（流式，学生端首字快）；
- 教师端建议走 chat（非流式，后台线程生成）；
- 网络异常 / 余额不足 / 密钥失效时由调用方捕获并降级到本地逻辑，系统不因大模型故障不可用。
"""
import json
import os
from collections.abc import Iterator

import httpx

try:
    from local_settings import DEEPSEEK_API_KEY
except ImportError:  # 未放本地密钥文件时用环境变量
    DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")

BASE_URL = "https://api.deepseek.com"
MODEL = "deepseek-chat"

_API_URL = f"{BASE_URL}/chat/completions"


def _headers() -> dict:
    if not DEEPSEEK_API_KEY:
        raise RuntimeError("未配置 DEEPSEEK_API_KEY")
    return {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}


def chat(messages: list[dict], *, temperature: float = 0.5, max_tokens: int = 500,
         timeout: float = 45.0) -> str:
    """一次性取回完整回答文本。"""
    with httpx.Client(timeout=timeout) as client:
        resp = client.post(_API_URL, headers=_headers(), json={
            "model": MODEL, "messages": messages,
            "temperature": temperature, "max_tokens": max_tokens, "stream": False,
        })
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()


def chat_stream(messages: list[dict], *, temperature: float = 0.3, max_tokens: int = 500,
                timeout: float = 60.0) -> Iterator[str]:
    """流式逐段产出回答文本（SSE 协议解析）。"""
    with httpx.Client(timeout=timeout) as client:
        with client.stream("POST", _API_URL, headers=_headers(), json={
            "model": MODEL, "messages": messages,
            "temperature": temperature, "max_tokens": max_tokens, "stream": True,
        }) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines():
                if not line.startswith("data:"):
                    continue
                payload = line[len("data:"):].strip()
                if payload == "[DONE]":
                    break
                try:
                    delta = json.loads(payload)["choices"][0]["delta"].get("content")
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue
                if delta:
                    yield delta
