
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  writing_style TEXT,
  language_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create writings table
CREATE TABLE public.writings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create writing_evaluations table
CREATE TABLE public.writing_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  writing_id UUID REFERENCES public.writings(id) ON DELETE CASCADE NOT NULL,
  word_precision NUMERIC(3,1) DEFAULT 0,
  feeling_depth NUMERIC(3,1) DEFAULT 0,
  linguistic_identity NUMERIC(3,1) DEFAULT 0,
  feedback TEXT,
  suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher_students table
CREATE TABLE public.teacher_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

-- =====================
-- Helper functions (SECURITY DEFINER)
-- =====================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'student')
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'teacher')
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_student(_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_students
    WHERE teacher_id = auth.uid() AND student_id = _student_id
  )
$$;

-- =====================
-- RLS Policies
-- =====================

-- Profiles: users see own, teachers see assigned students
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view assigned students profiles"
  ON public.profiles FOR SELECT
  USING (public.is_teacher() AND public.is_teacher_of_student(user_id));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles: users see own, can insert own (one time)
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Writings: students CRUD own, teachers read assigned
CREATE POLICY "Students can view their own writings"
  ON public.writings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view assigned students writings"
  ON public.writings FOR SELECT
  USING (public.is_teacher() AND public.is_teacher_of_student(user_id));

CREATE POLICY "Students can create writings"
  ON public.writings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own writings"
  ON public.writings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Students can delete their own writings"
  ON public.writings FOR DELETE
  USING (auth.uid() = user_id);

-- Writing evaluations: students see own, teachers see assigned
CREATE POLICY "Students can view evaluations of their writings"
  ON public.writing_evaluations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.writings
    WHERE writings.id = writing_evaluations.writing_id
    AND writings.user_id = auth.uid()
  ));

CREATE POLICY "Teachers can view evaluations of assigned students"
  ON public.writing_evaluations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.writings
    JOIN public.teacher_students ON teacher_students.student_id = writings.user_id
    WHERE writings.id = writing_evaluations.writing_id
    AND teacher_students.teacher_id = auth.uid()
  ));

-- Teacher students: teachers manage own assignments
CREATE POLICY "Teachers can view their assignments"
  ON public.teacher_students FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create assignments"
  ON public.teacher_students FOR INSERT
  WITH CHECK (teacher_id = auth.uid() AND public.is_teacher());

CREATE POLICY "Teachers can delete their assignments"
  ON public.teacher_students FOR DELETE
  USING (teacher_id = auth.uid() AND public.is_teacher());

-- =====================
-- Triggers
-- =====================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_writings_updated_at
  BEFORE UPDATE ON public.writings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
