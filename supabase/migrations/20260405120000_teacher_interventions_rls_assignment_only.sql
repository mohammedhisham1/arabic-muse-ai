-- RLS on teacher_interventions still failed for some accounts because INSERT
-- required is_teacher() / is_admin() via has_role(). If user_roles is out of sync
-- but teacher_students already links them to the student, INSERT still should succeed.

DROP POLICY IF EXISTS "Teachers can create interventions" ON public.teacher_interventions;

CREATE POLICY "Teachers can create interventions"
ON public.teacher_interventions
FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.teacher_students ts
    WHERE ts.teacher_id = auth.uid()
      AND ts.student_id = teacher_interventions.student_id
  )
);

-- Allow deleting own notes without re-checking role helpers
DROP POLICY IF EXISTS "Teachers can delete their interventions" ON public.teacher_interventions;

CREATE POLICY "Teachers can delete their interventions"
ON public.teacher_interventions
FOR DELETE
USING (teacher_id = auth.uid());

-- Admins use teacher dashboard but could not create assignments without teacher role
DROP POLICY IF EXISTS "Teachers can create assignments" ON public.teacher_students;

CREATE POLICY "Teachers can create assignments"
ON public.teacher_students
FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
  AND (public.is_teacher() OR public.is_admin())
);

DROP POLICY IF EXISTS "Teachers can delete their assignments" ON public.teacher_students;

CREATE POLICY "Teachers can delete their assignments"
ON public.teacher_students
FOR DELETE
USING (
  teacher_id = auth.uid()
  AND (public.is_teacher() OR public.is_admin())
);
