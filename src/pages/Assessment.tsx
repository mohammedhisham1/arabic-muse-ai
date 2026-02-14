
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, CheckCircle2, XCircle, ArrowLeft, Award, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StyleTestRequired from '@/components/StyleTestRequired';
import { useWriter } from '@/contexts/WriterContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { QuizQuestion } from '@/types/writer';

const Assessment = () => {
  const { profile, loadingProfile } = useWriter();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const currentLessonIndex = parseInt(lessonId || '0', 10);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [previouslyCompleted, setPreviouslyCompleted] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [lastReachedLesson, setLastReachedLesson] = useState(0);


  useEffect(() => {
    if (user && profile) {
      fetchQuiz();
      checkProgress();
    }
  }, [currentLessonIndex, user, profile]);

  const checkProgress = async () => {
    if (!user) return;
    try {
      // Check current lesson status
      const { data: current } = await (supabase as any)
        .from('student_lesson_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('lesson_index', currentLessonIndex)
        .maybeSingle();

      if (current?.completed) {
        setPreviouslyCompleted(true);
      }

      // Check max progress to find "last reached lesson"
      const { data: all } = await (supabase as any)
        .from('student_lesson_progress')
        .select('lesson_index')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (all && all.length > 0) {
        const max = Math.max(...all.map((p: any) => p.lesson_index));
        // If completed max, next is max + 1. 
        // Bound it by TOTAL_LESSONS?
        setLastReachedLesson(max + 1);
      } else {
        setLastReachedLesson(0);
      }
    } catch (e) {
      console.error('Error checking progress', e);
    }
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      // Fetch the generated lesson to get the quiz
      const { data, error } = await (supabase as any)
        .from('generated_lessons')
        .select('quiz, title')
        .eq('user_id', user?.id)
        .eq('lesson_index', currentLessonIndex)
        .maybeSingle();

      if (data && data.quiz) {
        setQuestions(data.quiz);
        setLessonTitle(data.title);
        // Reset quiz state
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
        setAnswered([]);
        setQuizDone(false);
        setProgressSaved(false);
      } else {
        // If lesson doesn't exist, redirect to lesson view to generate it
        toast.error('لم يتم العثور على الاختبار. جاري توجيهك للدرس...');
        navigate(`/lesson/${currentLessonIndex}`);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('حدث خطأ أثناء تحميل الاختبار');
    } finally {
      setLoading(false);
    }
  };

  const TOTAL_LESSONS = 7;

  const isLastLesson = currentLessonIndex >= TOTAL_LESSONS - 1;

  const getNextRoute = () => {
    if (isLastLesson) {
      return '/creative-writing';
    }
    return `/lesson/${currentLessonIndex + 1}`;
  };

  const scorePercent = Math.round((score / questions.length) * 100);
  const passed = scorePercent >= 60;

  const handleRetry = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswered([]);
    setQuizDone(false);
    setProgressSaved(false);
    setRetaking(true);
  };

  const handleGoBack = () => {
    // If completed all, maybe go to creative writing? 
    // For now, lesson index.
    if (lastReachedLesson >= TOTAL_LESSONS) {
      navigate('/creative-writing');
    } else {
      navigate(`/lesson/${lastReachedLesson}`);
    }
  };

  if (loadingProfile) return null;
  if (!profile) return <StyleTestRequired />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Header />
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل الاختبار...</p>
      </div>
    );
  }

  if (questions.length === 0) return null; // Should have redirected

  // Screen for previously completed assessment
  if (previouslyCompleted && !retaking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-lg"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="font-amiri text-2xl font-bold text-foreground mb-2">
              لقد اجتزت هذا الاختبار مسبقاً
            </h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              يمكنك إعادة الاختبار لتحسين درجاتك، أو العودة لمتابعة رحلة التعلم من آخر درس وصلت إليه.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="hero"
                onClick={handleGoBack}
                className="w-full gap-2 text-lg h-12"
              >
                <Award className="h-5 w-5" />
                العودة لآخر درس ({lastReachedLesson})
              </Button>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة الاختبار
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const question = questions[currentQ];

  const handleAnswer = (answerIdx: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIdx);
    setShowResult(true);
    const isCorrect = answerIdx === question.correctIndex;
    if (isCorrect) setScore(prev => prev + 1);
    setAnswered(prev => [...prev, isCorrect]);
  };

  const handleNext = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizDone(true);
      // Calculate final score
      const finalScore = answered.reduce((acc, curr) => acc + (curr ? 1 : 0), 0) + (selectedAnswer === question.correctIndex ? 1 : 0);
      const finalPercent = Math.round((finalScore / questions.length) * 100);

      // Save progress if passed
      if (finalPercent >= 60 && user && profile) {
        await saveProgress(finalPercent);
      }
    }
  };

  const saveProgress = async (scorePercent: number) => {
    if (!user || !profile || progressSaved) return;

    try {
      console.log('Saving progress for lesson:', currentLessonIndex, 'Score:', scorePercent);
      const { error } = await (supabase as any)
        .from('student_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_index: currentLessonIndex,
          writing_style: profile.style,
          completed: true,
          score: scorePercent,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,writing_style,lesson_index'
        });

      if (error) {
        console.error('Error saving progress:', error);
        toast.error('خطأ في حفظ التقدم');
      } else {
        setProgressSaved(true);
        toast.success('🎉 تم حفظ تقدمك!');
      }
    } catch (err: any) {
      console.error('Error saving progress:', err);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <ClipboardCheck className="h-4 w-4 text-accent" />
              اختبار: {lessonTitle}
            </span>
            <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground">
              اختبار الفهم والاستيعاب
            </h1>
            {!quizDone && (
              <p className="mt-2 text-muted-foreground">
                السؤال {currentQ + 1} من {questions.length}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {!quizDone && (
            <div className="mb-8 h-2 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQ + (showResult ? 1 : 0)) / questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            {!quizDone ? (
              <motion.div
                key={`q-${currentQ}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="rounded-2xl border border-border bg-card p-8"
              >
                {/* Question */}
                <h2 className="font-amiri text-xl font-bold text-foreground mb-6 leading-relaxed">
                  {question.question}
                </h2>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {question.options.map((option, oIdx) => {
                    let borderClass = 'border-border hover:border-primary/30';
                    let bgClass = 'bg-background';

                    if (showResult) {
                      if (oIdx === question.correctIndex) {
                        borderClass = 'border-primary';
                        bgClass = 'bg-primary/10';
                      } else if (oIdx === selectedAnswer && oIdx !== question.correctIndex) {
                        borderClass = 'border-destructive';
                        bgClass = 'bg-destructive/10';
                      }
                    } else if (selectedAnswer === oIdx) {
                      borderClass = 'border-primary/50';
                      bgClass = 'bg-primary/5';
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswer(oIdx)}
                        disabled={showResult}
                        className={`w-full rounded-xl border-2 ${borderClass} ${bgClass} p-4 text-right transition-all ${!showResult ? 'cursor-pointer' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${showResult && oIdx === question.correctIndex
                            ? 'border-primary bg-primary text-primary-foreground'
                            : showResult && oIdx === selectedAnswer
                              ? 'border-destructive bg-destructive text-destructive-foreground'
                              : 'border-border bg-muted'
                            }`}>
                            {showResult && oIdx === question.correctIndex ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : showResult && oIdx === selectedAnswer && oIdx !== question.correctIndex ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-bold">{oIdx + 1}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 mb-6 ${selectedAnswer === question.correctIndex
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-accent/10 border border-accent/20'
                      }`}
                  >
                    <p className="text-sm font-bold text-foreground mb-1">
                      {selectedAnswer === question.correctIndex ? '✅ إجابة صحيحة!' : '💡 الإجابة الصحيحة:'}
                    </p>
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </motion.div>
                )}

                {/* Next Button */}
                {showResult && (
                  <Button
                    variant="hero"
                    onClick={handleNext}
                    className="gap-2 w-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {currentQ < questions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}
                  </Button>
                )}
              </motion.div>
            ) : (
              /* Results */
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border-2 border-primary/30 bg-card p-10 text-center"
              >
                <span className="text-6xl block mb-4">{passed ? '🎉' : '📚'}</span>
                <h2 className="font-amiri text-2xl font-bold text-foreground mb-2">
                  {passed ? 'أحسنت! لقد اجتزت الاختبار' : 'حاول مرة أخرى'}
                </h2>
                <p className="text-5xl font-bold text-primary mb-2">
                  {scorePercent}%
                </p>
                <p className="text-muted-foreground mb-2">
                  {score} من {questions.length} إجابات صحيحة
                </p>

                {/* Progress Saved Badge */}
                {passed && progressSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4"
                  >
                    <Sparkles className="h-4 w-4" />
                    تم حفظ تقدمك في الدرس {currentLessonIndex + 1}!
                  </motion.div>
                )}

                {/* Answer Summary */}
                <div className="flex justify-center gap-2 my-6">
                  {answered.map((correct, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full ${correct ? 'bg-primary' : 'bg-destructive'}`}
                    />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mb-8">
                  {passed
                    ? isLastLesson
                      ? '🎉 أحسنت! أكملت جميع الدروس. أنت جاهز للكتابة الإبداعية!'
                      : `ممتاز! أكملت الدرس ${currentLessonIndex + 1}. هل أنت مستعد للدرس التالي؟`
                    : 'لا بأس! راجع الدرس وحاول مرة أخرى. التعلم رحلة وليس سباقًا.'}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  {passed ? (
                    <Button
                      variant="hero"
                      onClick={() => navigate(getNextRoute())}
                      className="gap-2"
                    >
                      <Award className="h-4 w-4" />
                      {isLastLesson ? 'ابدأ الكتابة الإبداعية' : 'الدرس التالي'}
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      onClick={handleRetry}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      إعادة الاختبار
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/lesson/${currentLessonIndex}`)}
                    className="gap-2"
                  >
                    العودة للدرس
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default Assessment;
