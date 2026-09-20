-- 开物四百年 数据层（第一版：SQLite + JSON 内容）
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  essence TEXT NOT NULL,
  ancient_answer_short TEXT NOT NULL,
  modern_answer_short TEXT NOT NULL,
  why_changed TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  era TEXT NOT NULL CHECK (era IN ('ancient','modern')),
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  location TEXT NOT NULL,
  time_label TEXT NOT NULL,
  summary TEXT NOT NULL,
  details_json TEXT NOT NULL,
  question_ids_json TEXT NOT NULL,
  evidence_ids_json TEXT NOT NULL,
  is_observation_point INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  type TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  confidence TEXT NOT NULL,
  evidence_ids_json TEXT NOT NULL,
  note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_index INTEGER,
  gap_topic_on_wrong TEXT,
  expected_signal_correct TEXT,
  source_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS curriculum (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  concept TEXT NOT NULL,
  hook TEXT NOT NULL,
  verification_source TEXT NOT NULL,
  needs_verification INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS explanations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  question_id TEXT,
  node_ids_json TEXT NOT NULL,
  gap_topics_json TEXT NOT NULL,
  depth TEXT NOT NULL,
  source_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  date TEXT NOT NULL,
  url TEXT NOT NULL,
  note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS qa_knowledge (
  id TEXT PRIMARY KEY,
  keywords_json TEXT NOT NULL,
  question_hint TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_refs_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  mode TEXT NOT NULL,               -- casual | curious | school
  variant TEXT NOT NULL,            -- fixed | adaptive
  grade TEXT,                       -- 初中 | 高中 | ...
  nickname TEXT,
  finished INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  ts TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  node_id TEXT,
  task_id TEXT,
  question_id TEXT,
  signal_type TEXT NOT NULL,        -- visit | task_answer | explanation_shown | qa_query | action_click
  correct INTEGER,                  -- 1/0/null
  gap_topic TEXT,
  detail TEXT
);

CREATE INDEX IF NOT EXISTS idx_signals_session ON signals(session_id);
CREATE INDEX IF NOT EXISTS idx_signals_topic ON signals(gap_topic);
