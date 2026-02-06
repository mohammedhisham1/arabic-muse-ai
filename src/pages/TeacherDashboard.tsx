import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, FileText, Target, Heart, Fingerprint, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Profile, Writing, WritingEvaluation } from '@/types/database';

interface StudentWithProfile {
  student_id: string;
  assigned_at: string;
  profile?: Profile;
}

interface WritingWithEval extends Writing {
  evaluation?: WritingEvaluation;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentWritings, setStudentWritings] = useState<WritingWithEval[]>([]);
  const [selectedWriting, setSelectedWriting] = useState<WritingWithEval | null>(null);

  useEffect(() => {
    if (user) loadStudents();
  }, [user]);

  const loadStudents = async () => {
    const { data: assignments } = await (supabase as any)
      .from('teacher_students')
      .select('student_id, assigned_at')
      .eq('teacher_id', user!.id);

    if (!assignments || assignments.length === 0) {
      setStudents([]);
      return;
    }

    const studentIds = assignments.map((a: any) => a.student_id);
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('*')
      .in('user_id', studentIds);

    const enriched = assignments.map((a: any) => ({
      ...a,
      profile: profiles?.find((p: Profile) => p.user_id === a.student_id),
    }));
    setStudents(enriched);
  };

  const handleAddStudent = async () => {
    if (!studentEmail.trim()) return;
    setAdding(true);
    try {
      // Look up user by email via profiles (we need an edge function for this in production)
      // For now, use the student_id directly or search by name
      toast.info('ميزة البحث بالبريد الإلكتروني قيد التطوير. أدخل معرف الطالب مباشرة.');
      setAdding(false);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
      setAdding(false);
    }
  };

  const handleAddStudentById = async (studentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('teacher_students')
        .insert({ teacher_id: user!.id, student_id: studentId });
      if (error) throw error;
      toast.success('تم إضافة الطالب بنجاح!');
      loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('teacher_students')
        .delete()
        .eq('teacher_id', user!.id)
        .eq('student_id', studentId);
      if (error) throw error;
      toast.success('تم إزالة الطالب');
      setSelectedStudent(null);
      loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
  };

  const loadStudentWritings = async (studentId: string) => {
    setSelectedStudent(studentId);
    setSelectedWriting(null);

    const { data: writings } = await (supabase as any)
      .from('writings')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    if (!writings || writings.length === 0) {
      setStudentWritings([]);
      return;
    }

    const writingIds = writings.map((w: Writing) => w.id);
    const { data: evaluations } = await (supabase as any)
      .from('writing_evaluations')
      .select('*')
      .in('writing_id', writingIds);

    const enriched = writings.map((w: Writing) => ({
      ...w,
      evaluation: evaluations?.find((e: WritingEvaluation) => e.writing_id === w.id),
    }));
    setStudentWritings(enriched);
  };

  const scoreColor = (score: number) => {
    if (score >= 7) return 'text-primary';
    if (score >= 4) return 'text-accent';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Users className="h-4 w-4 text-accent" />
            المرحلة السادسة — لوحة المعلم
          </span>
          <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="mt-2 text-muted-foreground">تابع تقدم طلابك واطلع على تقارير الذكاء الاصطناعي</p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {/* Students List */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-amiri text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                طلابي ({students.length})
              </h3>

              {/* Add student */}
              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="معرف الطالب..."
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleAddStudentById(studentEmail)}
                  disabled={!studentEmail.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {students.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لم تقم بإضافة طلاب بعد
                  </p>
                )}
                {students.map(s => (
                  <div
                    key={s.student_id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-all cursor-pointer ${
                      selectedStudent === s.student_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => loadStudentWritings(s.student_id)}
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {s.profile?.full_name || 'طالب'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.profile?.writing_style || 'لم يحدد أسلوبه بعد'}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStudent(s.student_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Writings & Evaluation */}
          <div className="lg:col-span-2">
            {!selectedStudent ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
                <div className="text-center text-muted-foreground">
                  <Search className="mx-auto h-12 w-12 mb-3 opacity-30" />
                  <p>اختر طالبًا لعرض كتاباته وتقاريره</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Writings list */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="mb-4 font-amiri text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    كتابات الطالب ({studentWritings.length})
                  </h3>

                  {studentWritings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">لم يكتب هذا الطالب شيئًا بعد</p>
                  ) : (
                    <div className="space-y-3">
                      {studentWritings.map(w => (
                        <motion.button
                          key={w.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setSelectedWriting(w)}
                          className={`w-full rounded-xl border p-4 text-right transition-all ${
                            selectedWriting?.id === w.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-foreground">{w.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(w.created_at).toLocaleDateString('ar')}
                              </p>
                            </div>
                            {w.evaluation && (
                              <div className="flex gap-3 text-xs">
                                <span className={scoreColor(w.evaluation.word_precision)}>
                                  {Number(w.evaluation.word_precision).toFixed(1)}
                                </span>
                                <span className={scoreColor(w.evaluation.feeling_depth)}>
                                  {Number(w.evaluation.feeling_depth).toFixed(1)}
                                </span>
                                <span className={scoreColor(w.evaluation.linguistic_identity)}>
                                  {Number(w.evaluation.linguistic_identity).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected writing detail */}
                {selectedWriting && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-card p-6 space-y-4"
                  >
                    <h3 className="font-amiri text-xl font-bold text-primary">{selectedWriting.title}</h3>
                    <p className="text-sm leading-[2] text-foreground whitespace-pre-line">
                      {selectedWriting.content}
                    </p>

                    {selectedWriting.evaluation && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <h4 className="font-bold text-foreground">تقرير الذكاء الاصطناعي</h4>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {[
                            { label: 'دقة الكلمات', value: selectedWriting.evaluation.word_precision, icon: Target },
                            { label: 'عمق المشاعر', value: selectedWriting.evaluation.feeling_depth, icon: Heart },
                            { label: 'الهوية اللغوية', value: selectedWriting.evaluation.linguistic_identity, icon: Fingerprint },
                          ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="rounded-lg border border-border p-3 text-center">
                              <Icon className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                              <p className="text-xs text-muted-foreground">{label}</p>
                              <p className={`text-2xl font-bold ${scoreColor(value)}`}>{Number(value).toFixed(1)}</p>
                            </div>
                          ))}
                        </div>
                        {selectedWriting.evaluation.feedback && (
                          <div className="rounded-lg bg-emerald-light/50 p-3">
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {selectedWriting.evaluation.feedback}
                            </p>
                          </div>
                        )}
                        {selectedWriting.evaluation.suggestions && (
                          <div className="rounded-lg bg-gold-light/50 p-3">
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {selectedWriting.evaluation.suggestions}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
