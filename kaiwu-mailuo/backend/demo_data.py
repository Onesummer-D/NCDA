"""生成教师端「示例班级数据集」（仅用于展板演示，会在展板上明确标注"示例数据"）。

模式：40 名学生沿固定安全路线走 M2→M3→M4→M5；
- T1（高炉出铁还是钢）：约 1/3 首答错误 → gap: fe_vs_steel（其中大部分随后通过补一环转为已验证）
- T2（吹氧目的）：约 1/4 首答错误
- T3（连铸产物）：约 1/5 首答错误
- T5（锻打/轧制共同点）：约 1/4 首答错误
另生成少量古代线观察与 QA 记录。运行：python demo_data.py
"""
import random
import sqlite3

from seed import get_conn, init_db

random.seed(42)


def main() -> None:
    init_db()
    conn = get_conn()
    n_sessions = conn.execute("SELECT COUNT(*) AS n FROM sessions").fetchone()["n"]
    if n_sessions > 3:
        print(f"已有 {n_sessions} 个会话，跳过示例数据生成（如需重新生成请删除 app.db 后先 seed 再运行）")
        return

    plans = [
        ("T1", "M2", 0.34, "fe_vs_steel"),
        ("T2", "M3", 0.25, "why_steelmaking"),
        ("T3", "M4", 0.20, "slab_not_product"),
        ("T5", "M5", 0.26, "forming_principle"),
    ]
    n_students = 40
    for i in range(n_students):
        cur = conn.execute(
            "INSERT INTO sessions (mode, variant, grade, nickname) VALUES (?,?,?,?)",
            ("school", "adaptive" if i % 2 else "fixed", "高一", f"示例学生{i + 1:02d}"),
        )
        sid = cur.lastrowid
        # 沿路线访问现代线节点（部分人也看古代线）
        for nid in ["M1", "M2", "M3", "M4", "M5", "M6"]:
            conn.execute(
                "INSERT INTO signals (session_id, node_id, signal_type) VALUES (?,?, 'visit')",
                (sid, nid),
            )
        if i % 3 == 0:
            for nid in ["A1", "A3", "A5"]:
                conn.execute(
                    "INSERT INTO signals (session_id, node_id, signal_type) VALUES (?,?, 'visit')",
                    (sid, nid),
                )
        # 依次答题
        for task_id, node_id, wrong_rate, gap in plans:
            wrong = random.random() < wrong_rate
            conn.execute(
                "INSERT INTO signals (session_id, node_id, task_id, signal_type, correct, gap_topic)"
                " VALUES (?,?,?,'task_answer',?,?)",
                (sid, node_id, task_id, 0 if wrong else 1, gap if wrong else None),
            )
            if wrong and random.random() < 0.8:
                # 看过“补一环”后复测转正确（真实信号：再次作答）
                conn.execute(
                    "INSERT INTO signals (session_id, node_id, task_id, signal_type, correct)"
                    " VALUES (?,?,?,'task_answer',1)",
                    (sid, node_id, task_id),
                )
        if i % 5 == 0:
            conn.execute(
                "INSERT INTO signals (session_id, signal_type, detail) VALUES (?, 'qa_query', ?)",
                (sid, random.choice(["铁和钢有什么区别", "钢水怎么变成钢板", "凤凰山遗址是什么年代的"])),
            )
        conn.execute("UPDATE sessions SET finished=1 WHERE id=?", (sid,))
    conn.commit()
    total = conn.execute("SELECT COUNT(*) AS n FROM sessions").fetchone()["n"]
    conn.close()
    print(f"示例数据生成完成：共 {total} 个会话")


if __name__ == "__main__":
    main()
