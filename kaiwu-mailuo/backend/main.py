"""开物脉络 后端服务（FastAPI + SQLite）。

设计原则（对应技术设计文档）：
- 内容动态适配，物理路线固定（本系统只调整观察重点与解释深度）；
- Gap Engine 第一版为可解释规则，不使用机器学习；
- 问答证据约束：知识库未命中时明确回答"暂未支持"，不自由发挥。
"""
import json
import sqlite3
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from seed import init_db, get_conn, DB_PATH

BASE = Path(__file__).parent
META_PATH = BASE / "data" / "content.json"

app = FastAPI(title="开物脉络 API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


def rows(conn: sqlite3.Connection, sql: str, args: tuple = ()) -> list[dict]:
    return [dict(r) for r in conn.execute(sql, args).fetchall()]


def jloads(s: str) -> Any:
    return json.loads(s)


# ---------------------------------------------------------------- content

@app.get("/api/meta")
def get_meta() -> dict:
    content = json.loads(META_PATH.read_text(encoding="utf-8"))
    return {"meta": content["meta"]}


@app.get("/api/content")
def get_content() -> dict:
    conn = get_conn()
    bundle = {
        "questions": rows(conn, "SELECT * FROM questions ORDER BY id"),
        "nodes": [
            {**r, "details": jloads(r.pop("details_json")),
             "question_ids": jloads(r.pop("question_ids_json")),
             "evidence_ids": jloads(r.pop("evidence_ids_json")),
             "is_observation_point": bool(r["is_observation_point"])}
            for r in rows(conn, "SELECT * FROM nodes ORDER BY id")
        ],
        "edges": [
            {**r, "evidence_ids": jloads(r.pop("evidence_ids_json"))}
            for r in rows(conn, "SELECT * FROM edges ORDER BY id")
        ],
        "tasks": [
            {**r, "options": jloads(r.pop("options_json")),
             "source_refs": jloads(r.pop("source_refs_json"))}
            for r in rows(conn, "SELECT * FROM tasks ORDER BY id")
        ],
        "curriculum": rows(conn, "SELECT * FROM curriculum ORDER BY id"),
        "explanations": [
            {**r, "node_ids": jloads(r.pop("node_ids_json")),
             "gap_topics": jloads(r.pop("gap_topics_json")),
             "source_refs": jloads(r.pop("source_refs_json"))}
            for r in rows(conn, "SELECT * FROM explanations ORDER BY id")
        ],
        "evidence": rows(conn, "SELECT * FROM evidence ORDER BY id"),
    }
    conn.close()
    return bundle


# ---------------------------------------------------------------- session

class SessionIn(BaseModel):
    mode: str = "school"          # casual | curious | school
    variant: str = "adaptive"     # fixed | adaptive
    grade: Optional[str] = None
    nickname: Optional[str] = None


@app.post("/api/session")
def create_session(body: SessionIn) -> dict:
    if body.mode not in {"casual", "curious", "school"}:
        raise HTTPException(400, "mode 必须是 casual/curious/school")
    if body.variant not in {"fixed", "adaptive"}:
        raise HTTPException(400, "variant 必须是 fixed/adaptive")
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO sessions (mode, variant, grade, nickname) VALUES (?,?,?,?)",
        (body.mode, body.variant, body.grade, body.nickname),
    )
    conn.commit()
    sid = cur.lastrowid
    conn.close()
    return {"session_id": sid, "mode": body.mode, "variant": body.variant}


class FinishIn(BaseModel):
    finished: bool = True


@app.post("/api/session/{session_id}/finish")
def finish_session(session_id: int, body: FinishIn) -> dict:
    conn = get_conn()
    conn.execute("UPDATE sessions SET finished=? WHERE id=?", (1 if body.finished else 0, session_id))
    conn.commit()
    conn.close()
    return {"ok": True}


# ---------------------------------------------------------------- signals

class SignalIn(BaseModel):
    session_id: int
    node_id: Optional[str] = None
    task_id: Optional[str] = None
    question_id: Optional[str] = None
    signal_type: str              # visit | task_answer | explanation_shown | qa_query | action_click
    correct: Optional[bool] = None
    gap_topic: Optional[str] = None
    detail: Optional[str] = None


@app.post("/api/signal")
def post_signal(body: SignalIn) -> dict:
    conn = get_conn()
    if not conn.execute("SELECT 1 FROM sessions WHERE id=?", (body.session_id,)).fetchone():
        raise HTTPException(404, "session 不存在")
    conn.execute(
        "INSERT INTO signals (session_id, node_id, task_id, question_id, signal_type, correct, gap_topic, detail)"
        " VALUES (?,?,?,?,?,?,?,?)",
        (body.session_id, body.node_id, body.task_id, body.question_id, body.signal_type,
         None if body.correct is None else int(body.correct), body.gap_topic, body.detail),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


# ---------------------------------------------------------------- gap engine

def detected_gaps(conn: sqlite3.Connection, session_id: int) -> dict:
    """返回 {gap_topic: latest_correct(bool)}，只保留答错的（未解决）与已解决的记录。"""
    out: dict[str, bool] = {}
    for r in conn.execute(
        "SELECT gap_topic, correct FROM signals"
        " WHERE session_id=? AND gap_topic IS NOT NULL ORDER BY id", (session_id,)
    ):
        out[r["gap_topic"]] = bool(r["correct"])
    return out


def recommend_for_session(conn: sqlite3.Connection, session_id: int, node_id: str) -> dict:
    """规则式推荐：前置缺口 > 叙事连续 > 课程相关 > 时间适配；重复与负担做减分。"""
    sess = conn.execute("SELECT * FROM sessions WHERE id=?", (session_id,)).fetchone()
    if not sess:
        raise HTTPException(404, "session 不存在")
    variant = sess["variant"]
    gaps = detected_gaps(conn, session_id)
    unresolved = [t for t, ok in gaps.items() if not ok]
    resolved = [t for t, ok in gaps.items() if ok]

    visited = {r["node_id"] for r in conn.execute(
        "SELECT DISTINCT node_id FROM signals WHERE session_id=? AND node_id IS NOT NULL", (session_id,))}
    shown = {r["detail"] for r in conn.execute(
        "SELECT detail FROM signals WHERE session_id=? AND signal_type='explanation_shown'", (session_id,))}
    answer_events = conn.execute(
        "SELECT COUNT(*) AS n FROM signals WHERE session_id=? AND signal_type='task_answer'",
        (session_id,)).fetchone()["n"]
    load_penalty = 1.0 if answer_events >= 3 else 0.0  # 连续答题后降低新增负担

    expls = rows(conn, "SELECT * FROM explanations")
    scored = []
    for x in expls:
        topics = jloads(x["gap_topics_json"])
        node_ids = jloads(x["node_ids_json"])
        score = 0.0
        reasons: list[str] = []
        if variant == "fixed":
            # 强基线：专家固定顺序（按内容编排深度推进），不看信号
            fixed_order = ["X9", "X3", "X1", "X4", "X6", "X7", "X2", "X5", "X8", "X11", "X10"]
            score = -fixed_order.index(x["id"]) * 0.001  # 保持固定顺序
            reasons.append("固定研学讲解序列")
        else:
            hit_topics = sorted(set(topics) & set(unresolved))
            if hit_topics:
                score += 3.0
                reasons.append(f"命中理解断点：{('、'.join(hit_topics))}")
            if node_id and node_id in node_ids:
                score += 1.0
                reasons.append("与当前工艺节点连续")
            if any(t in resolved for t in topics):
                score -= 0.5
            if sess["mode"] == "school":
                score += 0.5
            if x["depth"] == "deep" and load_penalty:
                score -= load_penalty
                reasons.append("认知负担调节：已连续互动多次，降低解释深度")
        if x["id"] in shown:
            score -= 5.0
            reasons.append("已看过（避免重复）")
        scored.append({"id": x["id"], "score": round(score, 2), "reasons": reasons, **{
            "title": x["title"], "body": x["body"], "depth": x["depth"],
            "node_ids": node_ids, "source_refs": jloads(x["source_refs_json"]),
        }})
    scored.sort(key=lambda d: (-d["score"], d["id"]))
    top = [d for d in scored if d["score"] > -4][:3]

    # 下一步动作
    next_node: Optional[str] = None
    if variant == "adaptive":
        if unresolved and node_id:
            # 有未解决缺口 → 优先建议补当前节点相关解释（top 已体现），节点本身继续链式推进
            pass
        chain = [r["id"] for r in conn.execute(
            "SELECT id FROM nodes WHERE era='modern' ORDER BY id")]
        cur_idx = chain.index(node_id) if node_id in chain else -1
        if cur_idx >= 0 and cur_idx + 1 < len(chain):
            next_node = chain[cur_idx + 1]
    return {"variant": variant, "unresolved_gaps": unresolved, "resolved_gaps": resolved,
            "recommendations": top, "next_node": next_node}


@app.get("/api/recommend/{session_id}")
def recommend(session_id: int, node_id: Optional[str] = None) -> dict:
    conn = get_conn()
    try:
        return recommend_for_session(conn, session_id, node_id)
    finally:
        conn.close()


# ---------------------------------------------------------------- evidence QA

@app.post("/api/qa")
def qa(body: dict) -> dict:
    query = (body.get("query") or "").strip()
    session_id = body.get("session_id")
    if not query:
        raise HTTPException(400, "问题不能为空")
    conn = get_conn()
    if session_id:
        conn.execute("INSERT INTO signals (session_id, signal_type, detail) VALUES (?,?,?)",
                     (session_id, "qa_query", query[:200]))
        conn.commit()
    best, best_score = None, 0
    for k in rows(conn, "SELECT * FROM qa_knowledge"):
        kws = jloads(k["keywords_json"])
        score = sum(1 for kw in kws if kw in query)
        if score > best_score:
            best, best_score = k, score
    if not best:
        suggestions: list[str] = []
        for k in rows(conn, "SELECT question_hint FROM qa_knowledge ORDER BY id"):
            hint = k["question_hint"]
            if hint and hint not in suggestions:
                suggestions.append(hint)
            if len(suggestions) == 3:
                break
        conn.close()
        return {"hit": False, "answer":
                "这个问题暂时超出了资料库的范围。为了避免凭空编造冶金史，我需要先查证可靠资料再回答——你可以先问一问带队老师，或换个和工艺流程有关的问题。",
                "suggestions": suggestions}
    conn.close()
    return {
        "hit": True,
        "question_hint": best["question_hint"],
        "answer": best["answer"],
        "source_refs": jloads(best["source_refs_json"]),
    }


# ---------------------------------------------------------------- spectrum 开物谱

@app.get("/api/spectrum/{session_id}")
def spectrum(session_id: int) -> dict:
    conn = get_conn()
    if not conn.execute("SELECT 1 FROM sessions WHERE id=?", (session_id,)).fetchone():
        raise HTTPException(404, "session 不存在")
    nodes = rows(conn, "SELECT id, era, stage, title FROM nodes ORDER BY id")
    states: dict[str, str] = {}
    for n in nodes:
        nid = n["id"]
        visited = conn.execute(
            "SELECT 1 FROM signals WHERE session_id=? AND node_id=? AND signal_type='visit'",
            (session_id, nid)).fetchone()
        correct = conn.execute(
            "SELECT correct FROM signals WHERE session_id=? AND node_id=? AND task_id IS NOT NULL"
            " ORDER BY id DESC LIMIT 1", (session_id, nid)).fetchone()
        if correct is not None:
            states[nid] = "verified" if correct["correct"] else "gap_detected"
        elif visited:
            states[nid] = "exposed"
        else:
            states[nid] = "unseen"
    # 今日理解的关键变化：某个 gap 从 detected → verified
    key_changes: list[str] = []
    gap_rows = rows(conn,
        "SELECT gap_topic, correct FROM signals WHERE session_id=? AND gap_topic IS NOT NULL ORDER BY id",
        (session_id,))
    seen: dict[str, list[bool]] = {}
    for r in gap_rows:
        seen.setdefault(r["gap_topic"], []).append(bool(r["correct"]))
    change_texts = {
        "fe_vs_steel": "“炼出来” ≠ “已经成为可以直接使用的钢材”——铁与钢之间，还隔着炼钢。",
        "why_steelmaking": "炼钢不是重复加热，而是一次受控的氧化：降碳、去杂。",
        "slab_not_product": "钢坯只是中间态：从钢水到钢材，还要经过轧制。",
        "forming_principle": "锻打与轧制原理相通：金属在压力下塑性成形。",
    }
    for topic, seq in seen.items():
        if False in seq and True in seq and topic in change_texts:
            key_changes.append(change_texts[topic])
    conn.close()
    return {"nodes": nodes, "states": states, "key_changes": key_changes}


# ---------------------------------------------------------------- teacher

@app.get("/api/teacher/summary")
def teacher_summary() -> dict:
    conn = get_conn()
    tasks = rows(conn, "SELECT * FROM tasks ORDER BY id")
    out = []
    for t in tasks:
        tid = t["id"]
        reached = conn.execute(
            "SELECT COUNT(DISTINCT session_id) AS n FROM signals WHERE node_id=? AND signal_type='visit'",
            (t["node_id"],)).fetchone()["n"]
        answered = conn.execute(
            "SELECT COUNT(DISTINCT session_id) AS n FROM signals WHERE task_id=?", (tid,)).fetchone()["n"]
        first_rows = conn.execute(
            "SELECT session_id, correct FROM signals WHERE task_id=? ORDER BY session_id, id", (tid,)).fetchall()
        first_seen: dict[int, bool] = {}
        for r in first_rows:
            first_seen.setdefault(r["session_id"], bool(r["correct"]))
        first_correct = sum(1 for v in first_seen.values() if v)
        first_wrong = sum(1 for v in first_seen.values() if not v)
        out.append({
            "task_id": tid, "node_id": t["node_id"], "prompt": t["prompt"],
            "reached": reached, "answered": answered,
            "first_correct": first_correct, "first_wrong": first_wrong,
        })
    gaps = conn.execute(
        "SELECT gap_topic, COUNT(*) AS n FROM signals WHERE gap_topic IS NOT NULL AND correct=0"
        " GROUP BY gap_topic ORDER BY n DESC").fetchall()
    sessions = conn.execute("SELECT COUNT(*) AS n FROM sessions").fetchone()["n"]
    qa_count = conn.execute("SELECT COUNT(*) AS n FROM signals WHERE signal_type='qa_query'").fetchone()["n"]
    conn.close()
    return {
        "sessions": sessions,
        "qa_count": qa_count,
        "tasks": out,
        "top_gap_topics": [{"gap_topic": r["gap_topic"], "n": r["n"]} for r in gaps],
        "advice": _advice(gaps),
    }


def _advice(gaps) -> str:
    top = next((r["gap_topic"] for r in gaps if r["gap_topic"] == "fe_vs_steel"), None)
    if top:
        return "建议：返校讨论可重点补充“铁与钢的成分和用途差异”（炼铁 ≠ 炼钢），本班多位学生把高炉产品当成了最终钢材。"
    if gaps:
        return f"建议：针对“{gaps[0]['gap_topic']}”相关的工艺关系做一次返校补充讲解。"
    return "暂无明显的共性理解断点记录。"


# ---------------------------------------------------------------- 静态前端（生产模式）
# API 路由注册在前、静态目录挂载在后：/api/* 走接口，其余（含 /assets /images /favicon.svg）走 dist
from fastapi.staticfiles import StaticFiles  # noqa: E402

DIST = BASE.parent / "frontend" / "dist"
if (DIST / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(DIST), html=True), name="dist")
