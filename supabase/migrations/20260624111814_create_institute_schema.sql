/*
# Direct-to-Student Online Institute - Full Schema

## Overview
Complete multi-role educational platform schema supporting:
- Super Admin, Teacher, and Student roles
- Sequential learning paths (Science → Arabic → French → Math)
- Manual payment verification workflow
- Help ticket system
- AI chat logging
- Notifications
- Consultation bookings
- Banner management
- Religion module

## Tables

### 1. profiles
Extended user profile linked to auth.users.
- id: matches auth.users.id
- role: 'super_admin' | 'teacher' | 'student'
- full_name, email, phone
- language: 'ar' | 'en'
- status: 'pending' | 'active' | 'rejected'
- payment_receipt_url: uploaded payment proof
- religion_enabled: whether premium religion is unlocked
- religion_choice: 'islamic' | 'christian' | null
- religion_prompt_shown: tracks if religion selection prompt was shown

### 2. subjects
Subjects in the curriculum.
- order_index: defines sequential unlock order
- color_gradient: subject card color
- is_religion: whether this is a religion subject

### 3. lessons
Lessons within a subject.
- video_url, pdf_url
- order_index for sequencing

### 4. quizzes
Quizzes attached to lessons.

### 5. quiz_questions / quiz_options
Quiz content.

### 6. student_lesson_progress
Tracks per-student lesson completion.

### 7. student_quiz_attempts
Tracks quiz attempts and scores.

### 8. help_tickets
Student-to-teacher help requests.

### 9. ticket_messages
Chat messages within a help ticket.

### 10. notifications
System notifications sent to students.

### 11. consultation_slots
Teacher-managed booking slots.

### 12. consultation_bookings
Student bookings for consultation slots.

### 13. banners
Dynamic home screen banners.

### 14. ai_chat_logs
Logs of AI interactions for teacher review.

### 15. curriculum_pdfs
Uploaded Syrian curriculum PDFs per subject.

## Security
- RLS enabled on all tables
- Role-based access via profiles.role
- Students see only their own data
- Teachers see student data for monitoring
- Super admin has full access
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('super_admin', 'teacher', 'student')),
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  language text NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  payment_receipt_url text,
  payment_notes text,
  religion_enabled boolean NOT NULL DEFAULT false,
  religion_choice text CHECK (religion_choice IN ('islamic', 'christian')),
  religion_prompt_shown boolean NOT NULL DEFAULT false,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
TO authenticated USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
TO authenticated USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
) WITH CHECK (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  order_index integer NOT NULL,
  color_from text NOT NULL DEFAULT '#1e3a5f',
  color_to text NOT NULL DEFAULT '#0ea5e9',
  icon text NOT NULL DEFAULT 'BookOpen',
  is_religion boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_select" ON subjects;
CREATE POLICY "subjects_select" ON subjects FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "subjects_insert" ON subjects;
CREATE POLICY "subjects_insert" ON subjects FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "subjects_update" ON subjects;
CREATE POLICY "subjects_update" ON subjects FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "subjects_delete" ON subjects;
CREATE POLICY "subjects_delete" ON subjects FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  video_url text,
  order_index integer NOT NULL,
  duration_minutes integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select" ON lessons;
CREATE POLICY "lessons_select" ON lessons FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "lessons_insert" ON lessons;
CREATE POLICY "lessons_insert" ON lessons FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "lessons_update" ON lessons;
CREATE POLICY "lessons_update" ON lessons FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "lessons_delete" ON lessons;
CREATE POLICY "lessons_delete" ON lessons FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  passing_score integer NOT NULL DEFAULT 70,
  time_limit_minutes integer DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select" ON quizzes;
CREATE POLICY "quizzes_select" ON quizzes FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "quizzes_insert" ON quizzes;
CREATE POLICY "quizzes_insert" ON quizzes FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "quizzes_update" ON quizzes;
CREATE POLICY "quizzes_update" ON quizzes FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "quizzes_delete" ON quizzes;
CREATE POLICY "quizzes_delete" ON quizzes FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- QUIZ QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_ar text NOT NULL,
  question_en text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_questions_select" ON quiz_questions;
CREATE POLICY "quiz_questions_select" ON quiz_questions FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "quiz_questions_insert" ON quiz_questions;
CREATE POLICY "quiz_questions_insert" ON quiz_questions FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "quiz_questions_update" ON quiz_questions;
CREATE POLICY "quiz_questions_update" ON quiz_questions FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "quiz_questions_delete" ON quiz_questions;
CREATE POLICY "quiz_questions_delete" ON quiz_questions FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- QUIZ OPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text_ar text NOT NULL,
  option_text_en text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL
);

ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_options_select" ON quiz_options;
CREATE POLICY "quiz_options_select" ON quiz_options FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "quiz_options_insert" ON quiz_options;
CREATE POLICY "quiz_options_insert" ON quiz_options FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "quiz_options_update" ON quiz_options;
CREATE POLICY "quiz_options_update" ON quiz_options FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "quiz_options_delete" ON quiz_options;
CREATE POLICY "quiz_options_delete" ON quiz_options FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- STUDENT LESSON PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  watch_percentage integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slp_select" ON student_lesson_progress;
CREATE POLICY "slp_select" ON student_lesson_progress FOR SELECT
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "slp_insert" ON student_lesson_progress;
CREATE POLICY "slp_insert" ON student_lesson_progress FOR INSERT
TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "slp_update" ON student_lesson_progress;
CREATE POLICY "slp_update" ON student_lesson_progress FOR UPDATE
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
) WITH CHECK (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "slp_delete" ON student_lesson_progress;
CREATE POLICY "slp_delete" ON student_lesson_progress FOR DELETE
TO authenticated USING (auth.uid() = student_id);

-- ============================================================
-- STUDENT QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb,
  manually_unlocked boolean NOT NULL DEFAULT false,
  unlocked_by uuid REFERENCES auth.users(id),
  unlocked_at timestamptz,
  attempt_number integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sqa_select" ON student_quiz_attempts;
CREATE POLICY "sqa_select" ON student_quiz_attempts FOR SELECT
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "sqa_insert" ON student_quiz_attempts;
CREATE POLICY "sqa_insert" ON student_quiz_attempts FOR INSERT
TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "sqa_update" ON student_quiz_attempts;
CREATE POLICY "sqa_update" ON student_quiz_attempts FOR UPDATE
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
) WITH CHECK (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "sqa_delete" ON student_quiz_attempts;
CREATE POLICY "sqa_delete" ON student_quiz_attempts FOR DELETE
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- HELP TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS help_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_teacher_id uuid REFERENCES auth.users(id),
  subject_id uuid REFERENCES subjects(id),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  closed_by uuid REFERENCES auth.users(id),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE help_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ht_select" ON help_tickets;
CREATE POLICY "ht_select" ON help_tickets FOR SELECT
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "ht_insert" ON help_tickets;
CREATE POLICY "ht_insert" ON help_tickets FOR INSERT
TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "ht_update" ON help_tickets;
CREATE POLICY "ht_update" ON help_tickets FOR UPDATE
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
) WITH CHECK (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "ht_delete" ON help_tickets;
CREATE POLICY "ht_delete" ON help_tickets FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- TICKET MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES help_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('student', 'teacher', 'super_admin')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tm_select" ON ticket_messages;
CREATE POLICY "tm_select" ON ticket_messages FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM help_tickets ht
    WHERE ht.id = ticket_id AND (
      ht.student_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
    )
  )
);

DROP POLICY IF EXISTS "tm_insert" ON ticket_messages;
CREATE POLICY "tm_insert" ON ticket_messages FOR INSERT
TO authenticated WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM help_tickets ht
    WHERE ht.id = ticket_id AND (
      ht.student_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
    )
  )
);

DROP POLICY IF EXISTS "tm_update" ON ticket_messages;
CREATE POLICY "tm_update" ON ticket_messages FOR UPDATE
TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "tm_delete" ON ticket_messages;
CREATE POLICY "tm_delete" ON ticket_messages FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id),
  is_global boolean NOT NULL DEFAULT false,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  body_ar text NOT NULL,
  body_en text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select" ON notifications;
CREATE POLICY "notif_select" ON notifications FOR SELECT
TO authenticated USING (
  is_global = true
  OR recipient_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "notif_insert" ON notifications;
CREATE POLICY "notif_insert" ON notifications FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "notif_update" ON notifications;
CREATE POLICY "notif_update" ON notifications FOR UPDATE
TO authenticated USING (
  recipient_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
) WITH CHECK (
  recipient_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "notif_delete" ON notifications;
CREATE POLICY "notif_delete" ON notifications FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- CONSULTATION SLOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS consultation_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'video')),
  is_available boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_select" ON consultation_slots;
CREATE POLICY "cs_select" ON consultation_slots FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "cs_insert" ON consultation_slots;
CREATE POLICY "cs_insert" ON consultation_slots FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "cs_update" ON consultation_slots;
CREATE POLICY "cs_update" ON consultation_slots FOR UPDATE
TO authenticated USING (
  auth.uid() = teacher_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
) WITH CHECK (
  auth.uid() = teacher_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "cs_delete" ON consultation_slots;
CREATE POLICY "cs_delete" ON consultation_slots FOR DELETE
TO authenticated USING (
  auth.uid() = teacher_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- CONSULTATION BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES consultation_slots(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cb_select" ON consultation_bookings;
CREATE POLICY "cb_select" ON consultation_bookings FOR SELECT
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "cb_insert" ON consultation_bookings;
CREATE POLICY "cb_insert" ON consultation_bookings FOR INSERT
TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "cb_update" ON consultation_bookings;
CREATE POLICY "cb_update" ON consultation_bookings FOR UPDATE
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
) WITH CHECK (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "cb_delete" ON consultation_bookings;
CREATE POLICY "cb_delete" ON consultation_bookings FOR DELETE
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  subtitle_ar text,
  subtitle_en text,
  image_url text,
  link_url text,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_select" ON banners;
CREATE POLICY "banners_select" ON banners FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "banners_insert" ON banners;
CREATE POLICY "banners_insert" ON banners FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "banners_update" ON banners;
CREATE POLICY "banners_update" ON banners FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "banners_delete" ON banners;
CREATE POLICY "banners_delete" ON banners FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- AI CHAT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id),
  mode text NOT NULL DEFAULT 'text' CHECK (mode IN ('text', 'voice')),
  user_message text NOT NULL,
  ai_response text NOT NULL,
  language text NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acl_select" ON ai_chat_logs;
CREATE POLICY "acl_select" ON ai_chat_logs FOR SELECT
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'teacher'))
);

DROP POLICY IF EXISTS "acl_insert" ON ai_chat_logs;
CREATE POLICY "acl_insert" ON ai_chat_logs FOR INSERT
TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "acl_update" ON ai_chat_logs;
CREATE POLICY "acl_update" ON ai_chat_logs FOR UPDATE
TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "acl_delete" ON ai_chat_logs;
CREATE POLICY "acl_delete" ON ai_chat_logs FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- CURRICULUM PDFS
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  file_url text NOT NULL,
  file_size_kb integer,
  version text,
  uploaded_by uuid REFERENCES auth.users(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE curriculum_pdfs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cpdf_select" ON curriculum_pdfs;
CREATE POLICY "cpdf_select" ON curriculum_pdfs FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "cpdf_insert" ON curriculum_pdfs;
CREATE POLICY "cpdf_insert" ON curriculum_pdfs FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "cpdf_update" ON curriculum_pdfs;
CREATE POLICY "cpdf_update" ON curriculum_pdfs FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "cpdf_delete" ON curriculum_pdfs;
CREATE POLICY "cpdf_delete" ON curriculum_pdfs FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_slp_student ON student_lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_sqa_student ON student_quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_ht_student ON help_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_ht_teacher ON help_tickets(assigned_teacher_id);
CREATE INDEX IF NOT EXISTS idx_tm_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_acl_student ON ai_chat_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_cpdf_subject ON curriculum_pdfs(subject_id);

-- ============================================================
-- SEED DEFAULT SUBJECTS
-- ============================================================
INSERT INTO subjects (name_ar, name_en, description_ar, description_en, order_index, color_from, color_to, icon, is_religion)
VALUES
  ('العلوم', 'Science', 'العلوم الطبيعية والتجريبية', 'Natural and experimental sciences', 1, '#dc2626', '#b91c1c', 'FlaskConical', false),
  ('اللغة العربية', 'Arabic Language', 'اللغة العربية والأدب', 'Arabic language and literature', 2, '#059669', '#047857', 'BookOpen', false),
  ('اللغة الفرنسية', 'French Language', 'اللغة الفرنسية والثقافة', 'French language and culture', 3, '#7c3aed', '#6d28d9', 'Globe', false),
  ('الرياضيات', 'Mathematics', 'الرياضيات والحساب', 'Mathematics and arithmetic', 4, '#ea580c', '#c2410c', 'Calculator', false),
  ('التربية الإسلامية', 'Islamic Education', 'التربية الإسلامية والقيم', 'Islamic education and values', 5, '#0369a1', '#075985', 'Star', true),
  ('التربية المسيحية', 'Christian Education', 'التربية المسيحية والقيم', 'Christian education and values', 6, '#0369a1', '#075985', 'Heart', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DEFAULT BANNER
-- ============================================================
INSERT INTO banners (title_ar, title_en, subtitle_ar, subtitle_en, image_url, order_index, is_active)
VALUES (
  'مرحباً بك في منصة التعلم',
  'Welcome to the Learning Platform',
  'تعلم وأنت في بيتك مع أفضل المعلمين',
  'Learn from home with the best teachers',
  'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg',
  1,
  true
)
ON CONFLICT DO NOTHING;
