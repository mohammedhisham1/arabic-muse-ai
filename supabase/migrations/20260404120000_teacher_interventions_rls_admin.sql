-- teacher_interventions INSERT required is_teacher(), but ProtectedRoute lets admins
-- use /teacher-dashboard too. Admins therefore failed RLS (42501) on INSERT.
-- Allow teacher OR admin when the row is still tied to an assigned student.

DROP POLICY IF EXISTS "Teachers can create interventions" ON public.teacher_interventions;

CREATE POLICY "Teachers can create interventions"
ON public.teacher_interventions
FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
  AND public.is_teacher_of_student(student_id)
  AND (public.is_teacher() OR public.is_admin())
);

DROP POLICY IF EXISTS "Teachers can delete their interventions" ON public.teacher_interventions;

CREATE POLICY "Teachers can delete their interventions"
ON public.teacher_interventions
FOR DELETE
USING (
  teacher_id = auth.uid()
  AND (public.is_teacher() OR public.is_admin())
);
