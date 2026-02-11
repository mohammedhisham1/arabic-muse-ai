-- Create table for storing AI-generated lessons
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS generated_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_index INT NOT NULL,
  title TEXT NOT NULL,
  objectives TEXT[] NOT NULL,
  content JSONB NOT NULL, -- Stores the structured lesson content (sections, examples)
  quiz JSONB NOT NULL, -- Stores the generated quiz questions
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_index)
);

-- RLS policies
ALTER TABLE generated_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lessons" ON generated_lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert lessons" ON generated_lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
