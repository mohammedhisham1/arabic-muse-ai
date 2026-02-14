
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Target, CheckCircle2,
  Award, ArrowLeft, ArrowRight, GraduationCap,
  Sparkles, Play, Loader2, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StyleTestRequired from '@/components/StyleTestRequired';
import FloatingLessonChat from '@/components/FloatingLessonChat';
import { useWriter } from '@/contexts/WriterContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneratedLesson {
  id: string;
  title: string;
  objectives: string[];
  content: {
    introduction: string;
    explanation: string;
    examples: string[];
    key_takeaway: string;
  };
  quiz: any[];
}

const LessonView = () => {
  const { profile, loadingProfile } = useWriter();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lessonIndex } = useParams<{ lessonIndex: string }>();
  const idx = parseInt(lessonIndex || '0', 10);

  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [revealedObjectives, setRevealedObjectives] = useState<number[]>([]);


  useEffect(() => {
    if (user && profile) {
      fetchLesson();
    }
  }, [idx, user, profile]);

  useEffect(() => {
    setCurrentStep(0);
    setRevealedObjectives([]);
  }, [idx]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      // 1. Try to fetch existing generated lesson
      const { data, error } = await (supabase as any)
        .from('generated_lessons')
        .select('*')
        .eq('user_id', user?.id)
        .eq('lesson_index', idx)
        .maybeSingle();

      if (data) {
        setLesson(data);
        setLoading(false);
      } else {
        // 2. If not found, generate it
        generateLesson();
      }
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setLoading(false);
    }
  };

  const generateLesson = async () => {
    if (!user || !profile) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson', {
        body: {
          userId: user.id,
          style: profile.style, // Or pass the full style name from profile
          lessonIndex: idx
        }
      });

      if (error) throw error;

      if (data) {
        setLesson(data);
        toast.success('تم إنشاء الدرس بنجاح بواسطة الذكاء الاصطناعي!');
      }
    } catch (err: any) {
      console.error('Error generating lesson:', err);
      toast.error('حدث خطأ أثناء إنشاء الدرس: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  if (loadingProfile) return null;
  if (!profile) return <StyleTestRequired />;

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Header />
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-bold font-amiri">
            {generating ? 'جاري تأليف الدرس خصيصًا لك...' : 'جاري تحميل الدرس...'}
          </h2>
          <p className="text-muted-foreground">
            يقوم الذكاء الاصطناعي بإعداد محتوى يناسب أسلوبك "{profile.style}"
          </p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-bold text-destructive">عذراً، لم نتمكن من تحميل الدرس.</h2>
          <Button onClick={() => window.location.reload()} className="mt-4">حاول مرة أخرى</Button>
        </div>
      </div>
    );
  }

  const revealNextObjective = () => {
    if (revealedObjectives.length < lesson.objectives.length) {
      setRevealedObjectives(prev => [...prev, prev.length]);
    }
  };

  const allObjectivesRevealed = revealedObjectives.length >= lesson.objectives.length;



  const handleRegenerateLesson = () => {
    toast.info('جاري إعادة بناء الدرس...');
    setLesson(null);
    generateLesson();
  };

  const handleUpdateLesson = async (partial: any) => {
    if (!lesson) return;

    const newContent = { ...lesson.content, ...partial };
    // Update local state immediately for responsiveness
    setLesson(prev => prev ? ({ ...prev, content: newContent }) : null);
    toast.success('تم تحديث محتوى الدرس!');

    // Persist to database
    try {
      const { error } = await (supabase as any)
        .from('generated_lessons')
        .update({ content: newContent })
        .eq('id', lesson.id);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save lesson update:', err);
      toast.error('فشل حفظ التحديث في قاعدة البيانات');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          {/* Lesson Header */}
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <GraduationCap className="h-4 w-4" />
              الدرس {idx + 1}
            </span>
            <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground sm:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              تم إعداد هذا الدرس خصيصًا لأسلوبك
            </p>
          </div>

          {/* Step Indicators */}
          <div className="mb-10 flex justify-center gap-3">
            {['الأهداف والمقدمة', 'الشرح والأمثلة', 'الخلاصة'].map((label, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${currentStep === i
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Objectives & Intro */}
            {currentStep === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                {/* Introduction Meta-Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
                  <h2 className="font-amiri text-2xl font-bold text-primary mb-4">مقدمة</h2>
                  <p className="text-lg leading-relaxed text-foreground/90">
                    {lesson.content?.introduction || 'مقدمة غير متوفرة.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Target className="h-5 w-5 text-primary" />
                    <h2 className="font-amiri text-2xl font-bold text-foreground">
                      أهداف الدرس
                    </h2>
                  </div>

                  <div className="space-y-4 mb-6">
                    {Array.isArray(lesson.objectives) ? (
                      lesson.objectives.map((obj, oIdx) => (
                        <motion.div
                          key={oIdx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={
                            revealedObjectives.includes(oIdx)
                              ? { opacity: 1, y: 0 }
                              : { opacity: 0.4, y: 0 }
                          }
                          className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${revealedObjectives.includes(oIdx)
                            ? 'border-primary/30 bg-card'
                            : 'border-border bg-muted/20'
                            }`}
                        >
                          <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${revealedObjectives.includes(oIdx) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                            {revealedObjectives.includes(oIdx) ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{oIdx + 1}</span>}
                          </div>
                          <p className="font-medium text-foreground">{obj}</p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">أهداف الدرس غير متوفرة.</p>
                    )}
                  </div>
                  {!allObjectivesRevealed ? (
                    <Button onClick={revealNextObjective} variant="outline" className="w-full gap-2">
                      <Sparkles className="h-4 w-4" /> اكشف الهدف التالي
                    </Button>
                  ) : (
                    <Button onClick={() => setCurrentStep(1)} variant="hero" className="w-full gap-2">
                      <ArrowLeft className="h-4 w-4" /> التالي: الشرح والأمثلة
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Explanation & Examples */}
            {currentStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-8"
              >
                {/* Detailed Explanation */}
                <div className="rounded-2xl border border-border bg-card p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="h-5 w-5 text-accent" />
                    <h2 className="font-amiri text-2xl font-bold text-foreground">الشرح التفصيلي</h2>
                  </div>
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap leading-loose text-foreground/90">
                      {typeof lesson.content?.explanation === 'string'
                        ? lesson.content.explanation
                        : JSON.stringify(lesson.content?.explanation || 'لم يتم توفير شرح تفصيلي.')}
                    </p>
                  </div>
                </div>

                {/* Examples */}
                <div className="rounded-2xl border border-border bg-card p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <h2 className="font-amiri text-2xl font-bold text-foreground">أمثلة تطبيقية</h2>
                  </div>
                  <div className="grid gap-6">
                    {Array.isArray(lesson.content?.examples) ? (
                      lesson.content.examples.map((ex, i) => (
                        <div key={i} className="rounded-xl bg-muted/30 p-5 border-r-4 border-primary">
                          <p className="text-foreground italic">
                            "{typeof ex === 'string' ? ex : String(ex)}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">لا توجد أمثلة متاحة.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => setCurrentStep(0)}>السابق</Button>
                  <Button variant="hero" onClick={() => setCurrentStep(2)} className="gap-2">
                    التالي: الخلاصة <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Key Takeaway */}
            {currentStep === 2 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-primary bg-primary/5 p-10 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="font-amiri text-3xl font-bold text-foreground mb-4">
                    الخلاصة الذهبية
                  </h2>
                  <p className="text-xl leading-relaxed text-foreground/80 mb-8 max-w-2xl mx-auto">
                    {lesson.content?.key_takeaway || 'لا توجد خلاصة متاحة.'}
                  </p>

                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => navigate(`/assessment/${idx}`)}
                    className="gap-2 text-lg px-8"
                  >
                    <GraduationCap className="h-6 w-6" />
                    ابدأ الاختبار القصير
                  </Button>
                </div>
                <div className="flex justify-center">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)}>عودة للشرح</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Floating AI Chat */}
      {lesson && (
        <FloatingLessonChat
          lessonTitle={lesson.title}
          lessonIndex={idx}
          lessonContent={lesson.content}
          onRegenerateLesson={handleRegenerateLesson}
          onUpdateLesson={handleUpdateLesson}
        />
      )}
    </div>
  );
};

export default LessonView;
