import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, FileText, Target, Heart, Fingerprint, Search, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import ScoreGauge from '@/components/ScoreGauge';
import TeacherInterventionPanel from '@/components/TeacherInterventionPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Profile, Writing, WritingEvaluation } from '@/types/database';

interface StudentWithProfile {
  student_id: string;
  assigned_at: string;
  profile?: Profile;
  writingsCount?: number;
  avgScore?: number;
}

interface WritingWithEval extends Writing {
  evaluation?: WritingEvaluation;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentWritings, setStudentWritings] = useState<WritingWithEval[]>([]);
  const [selectedWriting, setSelectedWriting] = useState<WritingWithEval | null>(null);
  const [showInterventions, setShowInterventions] = useState(false);

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
    const [profilesRes, writingsRes] = await Promise.all([
      (supabase as any).from('profiles').select('*').in('user_id', studentIds),
      (supabase as any).from('writings').select('id, user_id').in('user_id', studentIds),
    ]);

    const enriched = assignments.map((a: any) => {
      const studentWritings = writingsRes.data?.filter((w: any) => w.user_id === a.student_id) || [];
      return {
        ...a,
        profile: profilesRes.data?.find((p: Profile) => p.user_id === a.student_id),
        writingsCount: studentWritings.length,
      };
    });
    setStudents(enriched);
  };

  const handleAddStudentById = async () => {
    if (!studentId.trim()) return;
    try {
      const { error } = await (supabase as any)
        .from('teacher_students')
        .insert({ teacher_id: user!.id, student_id: studentId.trim() });
      if (error) throw error;
      toast.success('تم إضافة الطالب بنجاح!');
      setStudentId('');
      loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
  };

  const handleRemoveStudent = async (sid: string) => {
    try {
      const { error } = await (supabase as any)
        .from('teacher_students')
        .delete()
        .eq('teacher_id', user!.id)
        .eq('student_id', sid);
      if (error) throw error;
      toast.success('تم إزالة الطالب');
      if (selectedStudent === sid) {
        setSelectedStudent(null);
        setSelectedWriting(null);
      }
      loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
  };

  const loadStudentWritings = async (sid: string) => {
    setSelectedStudent(sid);
    setSelectedWriting(null);
    setShowInterventions(false);

    const { data: writings } = await (supabase as any)
      .from('writings')
      .select('*')
      .eq('user_id', sid)
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

  const getStudentAvgScore = () => {
    const evalsWithScores = studentWritings.filter(w => w.evaluation);
    if (evalsWithScores.length === 0) return null;
    const avg = evalsWithScores.reduce((sum, w) => {
      const e = w.evaluation!;
      return sum + (Number(e.word_precision) + Number(e.feeling_depth) + Number(e.linguistic_identity)) / 3;
    }, 0) / evalsWithScores.length;
    return avg;
  };

  const scoreColor = (score: number) => {
    if (score >= 7) return 'text-primary';
    if (score >= 4) return 'text-accent';
    return 'text-destructive';
  };

  const selectedStudentProfile = students.find(s => s.student_id === selectedStudent)?.profile;
  const avgScore = getStudentAvgScore();

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
          <p className="mt-2 text-muted-foreground">تابع تقدم طلابك واطلع على تقارير الذكاء الاصطناعي واقترح تدخلات فردية</p>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {/* Students List */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-amiri text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                طلابي ({students.length})
              </h3>

              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="معرف الطالب..."
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddStudentById}
                  disabled={!studentId.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {students.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لم تقم بإضافة طلاب بعد
                  </p>
                )}
                {students.map(s => (
                  <div
                    key={s.student_id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-all cursor-pointer ${
                      selectedStudent === s.student_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => loadStudentWritings(s.student_id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">
                        {s.profile?.full_name || 'طالب'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {s.writingsCount || 0} كتابة
                        </span>
                        {s.profile?.writing_style && (
                          <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                            {s.profile.writing_style}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive shrink-0"
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
                {/* Student summary */}
                {selectedStudentProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-amiri text-xl font-bold text-foreground">
                          {selectedStudentProfile.full_name || 'طالب'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedStudentProfile.writing_style ? `أسلوب: ${selectedStudentProfile.writing_style}` : 'لم يحدد أسلوبه'}
                          {' · '}
                          {studentWritings.length} كتابة
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {avgScore !== null && (
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${scoreColor(avgScore)}`}>{avgScore.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">المتوسط العام</p>
                          </div>
                        )}
                        <Button
                          variant={showInterventions ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowInterventions(!showInterventions)}
                          className="gap-1.5"
                        >
                          <TrendingUp className="h-4 w-4" />
                          التدخلات
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Intervention panel */}
                {showInterventions && selectedStudent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <TeacherInterventionPanel
                      studentId={selectedStudent}
                      writingId={selectedWriting?.id}
                      studentName={selectedStudentProfile?.full_name}
                    />
                  </motion.div>
                )}

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
                                  <Target className="inline h-3 w-3 ml-0.5" />
                                  {Number(w.evaluation.word_precision).toFixed(1)}
                                </span>
                                <span className={scoreColor(w.evaluation.feeling_depth)}>
                                  <Heart className="inline h-3 w-3 ml-0.5" />
                                  {Number(w.evaluation.feeling_depth).toFixed(1)}
                                </span>
                                <span className={scoreColor(w.evaluation.linguistic_identity)}>
                                  <Fingerprint className="inline h-3 w-3 ml-0.5" />
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
                    className="rounded-2xl border border-border bg-card p-6 space-y-5"
                  >
                    <h3 className="font-amiri text-xl font-bold text-primary">{selectedWriting.title}</h3>
                    <p className="text-sm leading-[2] text-foreground whitespace-pre-line rounded-xl bg-background border border-border p-4">
                      {selectedWriting.content}
                    </p>

                    {selectedWriting.evaluation && (
                      <div className="space-y-5 border-t border-border pt-5">
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          تقرير الذكاء الاصطناعي
                        </h4>
                        <div className="flex flex-wrap justify-center gap-6">
                          <ScoreGauge
                            label="دقة الكلمات"
                            value={selectedWriting.evaluation.word_precision}
                            icon={Target}
                          />
                          <ScoreGauge
                            label="عمق المشاعر"
                            value={selectedWriting.evaluation.feeling_depth}
                            icon={Heart}
                          />
                          <ScoreGauge
                            label="الهوية اللغوية"
                            value={selectedWriting.evaluation.linguistic_identity}
                            icon={Fingerprint}
                          />
                        </div>
                        {selectedWriting.evaluation.feedback && (
                          <div className="rounded-xl bg-emerald-light/50 border border-primary/20 p-4">
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {selectedWriting.evaluation.feedback}
                            </p>
                          </div>
                        )}
                        {selectedWriting.evaluation.suggestions && (
                          <div className="rounded-xl bg-gold-light/50 border border-accent/20 p-4">
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
