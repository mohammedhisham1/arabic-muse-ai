-- Fix student_lesson_progress score column to allow scores up to 100
-- Run this in Supabase SQL Editor

-- Change score column to allow larger values (0-100)
ALTER TABLE student_lesson_progress 
ALTER COLUMN score TYPE NUMERIC(5,2);

-- Delete old invalid progress data to start fresh
-- (Optional - remove this line if you want to keep old data)
DELETE FROM student_lesson_progress WHERE score < 50 OR score > 100;
