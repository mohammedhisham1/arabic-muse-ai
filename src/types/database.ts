export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  writing_style: string | null;
  language_level: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface TeacherEmail {
  id: string;
  email: string;
  created_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Writing {
  id: string;
  user_id: string;
  title: string;
  content: string;
  style: string | null;
  created_at: string;
  updated_at: string;
}

export interface WritingEvaluation {
  id: string;
  writing_id: string;
  word_precision: number;
  feeling_depth: number;
  linguistic_identity: number;
  feedback: string | null;
  suggestions: string | null;
  improved_text: string | null;
  created_at: string;
}

export interface TeacherStudent {
  id: string;
  teacher_id: string;
  student_id: string;
  assigned_at: string;
}

export interface TeacherIntervention {
  id: string;
  teacher_id: string;
  student_id: string;
  writing_id: string | null;
  intervention_type: string;
  content: string;
  created_at: string;
}

export interface StudentLessonProgress {
  id: string;
  user_id: string;
  lesson_index: number;
  writing_style: string;
  completed: boolean;
  score: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface StudentAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achieved_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

// Achievement definitions
export const ACHIEVEMENTS = {
  first_writing: { icon: '🏆', name: 'أول كتابة', description: 'أرسل أول كتابة إبداعية' },
  active_learner: { icon: '📚', name: 'متعلم نشط', description: 'أكمل 5 دروس' },
  excellent_writer: { icon: '⭐', name: 'كاتب متميز', description: 'احصل على متوسط 8+' },
  word_master: { icon: '🎯', name: 'دقيق الكلمات', description: 'احصل على 9+ في دقة الكلمات' },
  emotion_master: { icon: '💝', name: 'عميق المشاعر', description: 'احصل على 9+ في عمق المشاعر' },
  identity_master: { icon: '🔐', name: 'هوية لغوية', description: 'احصل على 9+ في الذات اللغوية' },
  path_complete: { icon: '🎓', name: 'أكمل المسار', description: 'أكمل جميع الدروس' },
} as const;
