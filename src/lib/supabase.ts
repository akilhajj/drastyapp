import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'super_admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  language: 'ar' | 'en';
  status: 'pending' | 'active' | 'rejected';
  payment_receipt_url?: string;
  payment_notes?: string;
  religion_enabled: boolean;
  religion_choice?: 'islamic' | 'christian';
  religion_prompt_shown: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  order_index: number;
  color_from: string;
  color_to: string;
  icon: string;
  is_religion: boolean;
  is_active: boolean;
}

export interface Lesson {
  id: string;
  subject_id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  video_url?: string;
  order_index: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title_ar: string;
  title_en: string;
  passing_score: number;
  time_limit_minutes: number;
  is_active: boolean;
}

export interface HelpTicket {
  id: string;
  student_id: string;
  assigned_teacher_id?: string;
  subject_id?: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'normal' | 'high';
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'student' | 'teacher' | 'super_admin';
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id?: string;
  sender_id?: string;
  is_global: boolean;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  image_url?: string;
  link_url?: string;
  order_index: number;
  is_active: boolean;
}

export interface AiChatLog {
  id: string;
  student_id: string;
  subject_id?: string;
  mode: 'text' | 'voice';
  user_message: string;
  ai_response: string;
  language: 'ar' | 'en';
  created_at: string;
}

export interface CurriculumPdf {
  id: string;
  subject_id: string;
  title_ar: string;
  title_en: string;
  file_url: string;
  file_size_kb?: number;
  version?: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentLessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  watch_percentage: number;
  completed_at?: string;
}

export interface StudentQuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  manually_unlocked: boolean;
  attempt_number: number;
  created_at: string;
}
