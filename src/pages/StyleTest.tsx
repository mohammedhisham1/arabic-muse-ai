import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2, RefreshCw, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StatementCard from '@/components/StatementCard';
import { useWriter } from '@/contexts/WriterContext';
import { shuffledStatements, STATEMENTS_PER_PAGE, TOTAL_PAGES } from '@/data/questionnaire';
import { styleData } from '@/data/styles';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const StyleTest = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const { answers, setAnswer, calculateProfile, profile, reset, loadingProfile } = useWriter();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lastLesson, setLastLesson] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    const fetchProgress = async () => {
      const { data } = await (supabase as any)
        .from('student_lesson_progress')
        .select('lesson_index')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (data && data.length > 0) {
        const maxIndex = Math.max(...data.map(d => d.lesson_index));
        // Check if maxIndex is within bounds? Assuming valid.
        // Return to the NEXT lesson (max + 1)
        // If maxIndex is 6 (last), navigate to 6 or creative-writing?
        // User said "last lesson reached". 
        // If I finished 2, I reached 3.
        setLastLesson(maxIndex + 1);
      } else {
        setLastLesson(0);
      }
    };
    fetchProgress();
  }, [user]);

  // Show retake prompt if user already has a profile
  const [showRetakePrompt, setShowRetakePrompt] = useState(true);
  const hasExistingProfile = profile !== null;

  const pageStatements = shuffledStatements.slice(
    currentPage * STATEMENTS_PER_PAGE,
    (currentPage + 1) * STATEMENTS_PER_PAGE
  );

  const progress = ((currentPage + 1) / TOTAL_PAGES) * 100;

  const pageAnswered = pageStatements.every(
    s => answers[s.id] === true || answers[s.id] === false
  );
  const isLast = currentPage === TOTAL_PAGES - 1;

  const allAnswered = shuffledStatements.every(
    s => answers[s.id] === true || answers[s.id] === false
  );

  const handleNext = () => {
    if (isLast && allAnswered) {
      calculateProfile();
      navigate('/style-report');
    } else if (pageAnswered && !isLast) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const handleRetake = () => {
    reset();
    setCurrentPage(0);
    setShowRetakePrompt(false);
  };

  const handleReturn = () => {
    if (lastLesson >= 7) {
      navigate('/creative-writing');
    } else {
      navigate(`/lesson/${lastLesson}`);
    }
  };

  // Don't render anything while loading profile
  if (loadingProfile) return null;

  // Show retake prompt if user has existing profile
  if (hasExistingProfile && showRetakePrompt) {
    const info = styleData[profile.style];

    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto max-w-lg"
          >
            {/* Card */}
            <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-lg">
              {/* Style icon & badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
              >
                <span className="text-5xl">{info.icon}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h1 className="font-amiri text-2xl font-bold text-foreground sm:text-3xl mb-2">
                  لقد أكملت الاختبار سابقًا
                </h1>
                <p className="text-muted-foreground leading-relaxed mb-1">
                  نتيجتك الحالية هي:
                </p>
                <span className="inline-block rounded-full bg-primary/10 px-5 py-1.5 font-amiri text-lg font-bold text-primary">
                  {info.name} {info.icon}
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-6 text-center text-sm text-muted-foreground leading-relaxed"
              >
                هل ترغب في إعادة الاختبار لتحديث أسلوبك الكتابي، أم تفضّل العودة؟
              </motion.p>

              {/* Divider */}
              <div className="my-8 h-px bg-border" />

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex flex-col gap-3 sm:flex-row sm:gap-4"
              >
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleRetake}
                  className="flex-1 gap-2 h-13"
                  id="retake-test-btn"
                >
                  <RefreshCw className="h-5 w-5" />
                  إعادة الاختبار
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReturn}
                  className="flex-1 gap-2 h-13"
                  id="return-btn"
                >
                  <Undo2 className="h-5 w-5" />
                  العودة إلى الدرس
                </Button>
              </motion.div>
            </div>

            {/* Subtle hint below card */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center text-xs text-muted-foreground/60"
            >
              إعادة الاختبار ستُعيد تعيين إجاباتك السابقة
            </motion.p>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Progress */}
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>الصفحة {currentPage + 1} من {TOTAL_PAGES}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Statements */}
        <div className="mx-auto mt-10 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="mb-6 font-amiri text-2xl font-bold text-foreground sm:text-3xl">
                استبيان تحديد أنماط الكتابة الإبداعية
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                أجب بـ "نعم" أو "لا" على كل عبارة من العبارات التالية:
              </p>

              <div className="space-y-3">
                {pageStatements.map((statement, idx) => (
                  <StatementCard
                    key={statement.id}
                    statement={statement}
                    answer={answers[statement.id] ?? null}
                    onAnswer={(value) => setAnswer(statement.id, value)}
                    index={idx}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              السابق
            </Button>

            <Button
              onClick={handleNext}
              disabled={!pageAnswered}
              className={`gap-2 ${isLast && allAnswered ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
            >
              {isLast ? (
                <>
                  عرض النتائج
                  <CheckCircle2 className="h-4 w-4" />
                </>
              ) : (
                <>
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StyleTest;
