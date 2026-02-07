export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
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
