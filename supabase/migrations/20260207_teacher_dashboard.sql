-- Teacher Dashboard Enhancements Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vccawaxnskbmjsjzohlu/sql/new

-- ============================================
-- 1. Student Lesson Progress
-- ============================================
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_index INT NOT NULL,
  writing_style TEXT NOT NULL, -- which style path this lesson belongs to
  completed BOOLEAN DEFAULT false,
  score NUMERIC(3,1),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, writing_style, lesson_index)
);

-- RLS for lesson progress
ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON student_lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON student_lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON student_lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student progress" ON student_lesson_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_students
      WHERE teacher_id = auth.uid() AND student_id = student_lesson_progress.user_id
    )
  );

-- ============================================
-- 2. Student Achievements
-- ============================================
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- RLS for achievements
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON student_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON student_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can view student achievements" ON student_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_students
      WHERE teacher_id = auth.uid() AND student_id = student_achievements.user_id
    )
  );

-- ============================================
-- 3. Messages (Real-time Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update read status" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- Grant permissions
-- ============================================
GRANT ALL ON student_lesson_progress TO authenticated;
GRANT ALL ON student_achievements TO authenticated;
GRANT ALL ON messages TO authenticated;
