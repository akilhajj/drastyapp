CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    grade TEXT NOT NULL,
    branch TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    allowed_days INTEGER DEFAULT 30,
    subscription_expires_at TEXT
);

CREATE TABLE IF NOT EXISTS academy_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade TEXT NOT NULL,
    branch TEXT NOT NULL,
    subject TEXT NOT NULL,
    book_title TEXT NOT NULL,
    book_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    duration INTEGER NOT NULL,
    target_group TEXT NOT NULL,
    lesson_title TEXT NOT NULL,
    lesson_file_content TEXT,
    lesson_scenario TEXT,
    scheduled_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_name TEXT,
    sender_phone TEXT,
    sender_email TEXT,
    message_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_support_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    teacher_id TEXT,
    status TEXT DEFAULT 'requested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    sender_role TEXT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
