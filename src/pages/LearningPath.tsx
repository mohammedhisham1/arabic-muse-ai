
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Lock, CheckCircle2, BookOpen, ArrowRight, Play, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StyleTestRequired from '@/components/StyleTestRequired';
import { useWriter } from '@/contexts/WriterContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { styleData } from '@/data/styles';

interface LessonProgress {
  lesson_index: number;
  completed: boolean;
  score: number | null;
}

const LESSON_TOPICS = [
  {
    title: "أساسيات الكتابة الإبداعية",
    desc: "مفهوم القصة، أهمية السرد، والفرق بين الوصف والحكي.",
  },
  {
    title: "بناء الشخصيات",
    desc: "الدوافع النفسية، التطور عبر الأحداث، وخلق شخصيات ثلاثية الأبعاد.",
  },
  {
    title: "الحبكة والصراع",
    desc: "أنواع الصراع (داخلي/خارجي)، منحنيات السرد، ونقطة الذروة.",
  },
  {
    title: "المكان والزمان",
    desc: "كيف يؤثر الإطار السردي على الشخصيات والمشاعر.",
  },
  {
    title: "الحوار والسرد",
    desc: "كتابة حوار واقعي، الموازنة بين السرد والحوار، والأصوات المتعددة.",
  },
  {
    title: "الخيال والتصوير",
    desc: "استخدام اللغة المجازية، الاستعارة، وبناء الصور الذهنية.",
  },
  {
    title: "نهاية القصة",
    desc: "كيفية كتابة نهاية مؤثرة وتجنب الكليشيهات.",
  }
];

const LearningPath = () => {
  const { profile, reset, loadingProfile } = useWriter();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      loadProgress();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const loadProgress = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await (supabase as any)
        .from('student_lesson_progress')
        .select('lesson_index, completed, score')
        .eq('user_id', user.id)
        .eq('writing_style', profile.style);

      if (error) {
        console.error('Error loading progress:', error);
      } else {
        setProgress(data || []);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) return null;
  if (!profile) return <StyleTestRequired />;

  const info = styleData[profile.style];

  const isLessonCompleted = (idx: number): boolean => {
    return progress.some(p => p.lesson_index === idx && p.completed);
  };

  const getLessonScore = (idx: number): number | null => {
    const lessonProgress = progress.find(p => p.lesson_index === idx);
    return lessonProgress?.score ?? null;
  };

  const isLessonUnlocked = (idx: number): boolean => {
    if (idx === 0) return true; // First lesson always unlocked
    return isLessonCompleted(idx - 1);
  };

  const getNextLesson = (): number => {
    for (let i = 0; i < LESSON_TOPICS.length; i++) {
      if (!isLessonCompleted(i)) return i;
    }
    return LESSON_TOPICS.length - 1;
  };

  const allLessonsCompleted = LESSON_TOPICS.every((_, idx) => isLessonCompleted(idx));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <Target className="h-4 w-4 text-accent" />
              مسار التعلم — الأسلوب {info.name}
            </span>
            <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground sm:text-4xl">
              مسار التعلم المتفرع
            </h1>
            <p className="mt-3 text-muted-foreground">
              يتم إنشاء الدروس خصيصًا لك بواسطة الذكاء الاصطناعي لتناسب أسلوبك الفريد
            </p>

            {!loading && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Trophy className="h-4 w-4" />
                التقدم: {progress.filter(p => p.completed).length} من {LESSON_TOPICS.length} دروس
              </div>
            )}
          </div>

          {/* All Completed Banner */}
          {allLessonsCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 text-center"
            >
              <span className="text-4xl block mb-2">🎉</span>
              <h2 className="font-amiri text-xl font-bold text-foreground mb-2">
                أحسنت! أكملت جميع الدروس
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                يمكنك الآن الانتقال إلى الكتابة الإبداعية لتطبيق ما تعلمته
              </p>
              <Button variant="hero" onClick={() => navigate('/creative-writing')} className="gap-2">
                <Play className="h-4 w-4" />
                ابدأ الكتابة الإبداعية
              </Button>
            </motion.div>
          )}

          {/* Learning Path */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute right-8 top-0 h-full w-0.5 bg-border" />

            <div className="space-y-8">
              {LESSON_TOPICS.map((lesson, idx) => {
                const completed = isLessonCompleted(idx);
                const unlocked = isLessonUnlocked(idx);
                const score = getLessonScore(idx);
                const isNext = idx === getNextLesson() && !allLessonsCompleted;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.15 }}
                    className="relative pr-20"
                  >
                    {/* Node */}
                    <div
                      className={`absolute right-5 top-6 flex h-7 w-7 items-center justify-center rounded-full border-2 ${completed
                        ? 'border-primary bg-primary text-primary-foreground'
                        : unlocked
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-muted-foreground/30 bg-background text-muted-foreground'
                        }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : unlocked ? (
                        <Play className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </div>

                    {/* Card */}
                    <div
                      className={`rounded-2xl border p-6 transition-all ${completed
                        ? 'border-primary/30 bg-primary/5'
                        : unlocked
                          ? 'border-accent/30 bg-card shadow-md'
                          : 'border-border bg-card/50 opacity-75'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className={`h-5 w-5 ${completed ? 'text-primary' : unlocked ? 'text-accent' : 'text-muted-foreground'}`} />
                          <div>
                            <h3 className="font-amiri text-lg font-bold text-foreground">
                              الدرس {idx + 1}: {lesson.title}
                            </h3>
                            <p className="text-xs text-muted-foreground font-normal">{lesson.desc}</p>
                          </div>
                        </div>
                        {completed && score !== null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                            <Trophy className="h-3 w-3" />
                            {Math.round(score)}%
                          </span>
                        )}
                      </div>

                      {completed && (
                        <div className="flex items-center gap-3 mt-4">
                          <span className="flex items-center gap-1 text-xs font-bold text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            مكتمل
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => navigate(`/lesson/${idx}`)}
                          >
                            مراجعة الدرس
                          </Button>
                        </div>
                      )}

                      {unlocked && !completed && (
                        <div className="mt-4">
                          <Button
                            variant="hero"
                            size="sm"
                            className="gap-2 w-full sm:w-auto"
                            onClick={() => navigate(`/lesson/${idx}`)}
                          >
                            <Sparkles className="h-4 w-4" />
                            {isNext ? 'توليد الدرس بالذكاء الاصطناعي' : 'ابدأ الدرس'}
                          </Button>
                        </div>
                      )}

                      {!unlocked && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                          <Lock className="h-3 w-3" />
                          يُفتح بعد إتمام الدرس السابق
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex flex-wrap justify-center gap-4"
          >
            <Button
              variant="outline"
              onClick={() => navigate('/style-report')}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للتقرير
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default LearningPath;
