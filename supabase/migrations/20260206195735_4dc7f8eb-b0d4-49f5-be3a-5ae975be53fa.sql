
-- Teacher interventions table for individual student suggestions
CREATE TABLE public.teacher_interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  writing_id UUID REFERENCES public.writings(id) ON DELETE CASCADE,
  intervention_type TEXT NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_interventions ENABLE ROW LEVEL SECURITY;

-- Teachers can create interventions for their assigned students
CREATE POLICY "Teachers can create interventions"
ON public.teacher_interventions
FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
  AND is_teacher()
  AND is_teacher_of_student(student_id)
);

-- Teachers can view their own interventions
CREATE POLICY "Teachers can view their interventions"
ON public.teacher_interventions
FOR SELECT
USING (teacher_id = auth.uid());

-- Students can view interventions directed at them
CREATE POLICY "Students can view their interventions"
ON public.teacher_interventions
FOR SELECT
USING (student_id = auth.uid());

-- Teachers can delete their own interventions
CREATE POLICY "Teachers can delete their interventions"
ON public.teacher_interventions
FOR DELETE
USING (teacher_id = auth.uid() AND is_teacher());

-- Create the trigger for handle_new_user if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Create trigger for updated_at on profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create trigger for updated_at on writings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_writings_updated_at'
  ) THEN
    CREATE TRIGGER update_writings_updated_at
      BEFORE UPDATE ON public.writings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
