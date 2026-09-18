"""启动时把 data/content.json 灌入 SQLite（幂等）。"""
import json
import sqlite3
from pathlib import Path

BASE = Path(__file__).parent
DB_PATH = BASE / "app.db"
CONTENT_PATH = BASE / "data" / "content.json"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(force: bool = False) -> None:
    if force and DB_PATH.exists():
        DB_PATH.unlink()
    conn = get_conn()
    with open(BASE / "schema.sql", encoding="utf-8") as f:
        conn.executescript(f.read())
    row = conn.execute("SELECT COUNT(*) AS n FROM nodes").fetchone()
    if row["n"] > 0:
        conn.close()
        return
    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    for q in content["craft_questions"]:
        conn.execute(
            "INSERT INTO questions VALUES (?,?,?,?,?,?,?)",
            (q["id"], q["code"], q["title"], q["essence"], q["ancient_answer_short"],
             q["modern_answer_short"], q["why_changed"]),
        )
    for n in content["process_nodes"]:
        conn.execute(
            "INSERT INTO nodes VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (n["id"], n["era"], n["stage"], n["title"], n["subtitle"], n["location"],
             n["time_label"], n["summary"], json.dumps(n["details"], ensure_ascii=False),
             json.dumps(n["question_ids"], ensure_ascii=False),
             json.dumps(n["evidence_ids"], ensure_ascii=False),
             1 if n.get("is_observation_point") else 0),
        )
    for e in content["relation_edges"]:
        conn.execute(
            "INSERT INTO edges VALUES (?,?,?,?,?,?,?,?)",
            (e["id"], e["from_id"], e["to_id"], e["type"], e["relation_type"],
             e["confidence"], json.dumps(e["evidence_ids"], ensure_ascii=False), e["note"]),
        )
    for t in content["observation_tasks"]:
        conn.execute(
            "INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?)",
            (t["id"], t["node_id"], t["mode"], t["prompt"],
             json.dumps(t["options"], ensure_ascii=False), t["correct_index"],
             t["gap_topic_on_wrong"], t["expected_signal_correct"],
             json.dumps(t["source_refs"], ensure_ascii=False)),
        )
    for c in content["curriculum_links"]:
        conn.execute(
            "INSERT INTO curriculum VALUES (?,?,?,?,?,?,?)",
            (c["id"], c["node_id"], c["subject"], c["concept"], c["hook"],
             c["verification_source"], 1 if c.get("needs_verification") else 0),
        )
    for x in content["explanations"]:
        conn.execute(
            "INSERT INTO explanations VALUES (?,?,?,?,?,?,?,?)",
            (x["id"], x["title"], x["body"], x["question_id"],
             json.dumps(x["node_ids"], ensure_ascii=False),
             json.dumps(x["gap_topics"], ensure_ascii=False),
             x["depth"], json.dumps(x["source_refs"], ensure_ascii=False)),
        )
    for ev in content["evidence_sources"]:
        conn.execute(
            "INSERT INTO evidence VALUES (?,?,?,?,?,?)",
            (ev["id"], ev["title"], ev["publisher"], ev["date"], ev["url"], ev["note"]),
        )
    for k in content["qa_knowledge"]:
        conn.execute(
            "INSERT INTO qa_knowledge VALUES (?,?,?,?,?)",
            (k["id"], json.dumps(k["keywords"], ensure_ascii=False), k["question_hint"],
             k["answer"], json.dumps(k["source_refs"], ensure_ascii=False)),
        )
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db(force=True)
    print("seeded", DB_PATH)
