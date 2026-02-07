
-- Add 'admin' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- Create teacher_emails table to store allowed teacher emails
CREATE TABLE IF NOT EXISTS public.teacher_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_settings table for admin email configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.teacher_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage teacher_emails and app_settings
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- teacher_emails policies - admins can manage, authenticated users can read
CREATE POLICY "Admins can manage teacher_emails"
  ON public.teacher_emails FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read teacher_emails"
  ON public.teacher_emails FOR SELECT
  USING (auth.role() = 'authenticated');

-- app_settings policies - admins can manage, none can read by default
CREATE POLICY "Admins can manage app_settings"
  ON public.app_settings FOR ALL
  USING (public.is_admin());

-- Update handle_new_user to auto-assign roles based on email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email TEXT;
  is_teacher BOOLEAN;
  new_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Check if this is the admin email
  SELECT value INTO admin_email FROM public.app_settings WHERE key = 'admin_email';
  
  -- Check if email is in teacher_emails table
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_emails WHERE email = NEW.email
  ) INTO is_teacher;

  -- Determine role: admin > teacher > student
  IF NEW.email = admin_email THEN
    new_role := 'admin';
  ELSIF is_teacher THEN
    new_role := 'teacher';
  ELSE
    new_role := 'student';
  END IF;

  -- Auto-assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_role);

  RETURN NEW;
END;
$$;

-- Add trigger for app_settings updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- Seed Data
-- =====================

-- Set admin email
INSERT INTO public.app_settings (key, value) 
VALUES ('admin_email', 'mohamad92moh@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

