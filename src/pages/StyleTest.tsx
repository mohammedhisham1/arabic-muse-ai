import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StatementCard from '@/components/StatementCard';
import { useWriter } from '@/contexts/WriterContext';
import { statementGroups, TOTAL_GROUPS } from '@/data/questionnaire';

const StyleTest = () => {
  const [currentGroup, setCurrentGroup] = useState(0);
  const { answers, setAnswer, calculateProfile } = useWriter();
  const navigate = useNavigate();

  const group = statementGroups[currentGroup];
  const progress = ((currentGroup + 1) / TOTAL_GROUPS) * 100;

  const groupAnswered = group.statements.every(
    s => answers[s.id] === true || answers[s.id] === false
  );
  const isLast = currentGroup === TOTAL_GROUPS - 1;

  const allAnswered = statementGroups.every(g =>
    g.statements.every(s => answers[s.id] === true || answers[s.id] === false)
  );

  const handleNext = () => {
    if (isLast && allAnswered) {
      calculateProfile();
      navigate('/style-report');
    } else if (groupAnswered && !isLast) {
      setCurrentGroup(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentGroup > 0) setCurrentGroup(prev => prev - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Progress */}
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>البُعد {currentGroup + 1} من {TOTAL_GROUPS}</span>
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

        {/* Dimension Title */}
        <div className="mx-auto mt-10 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentGroup}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="mb-6 font-amiri text-2xl font-bold text-foreground sm:text-3xl">
                {group.label}
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                أجب بـ "نعم" أو "لا" على كل عبارة من العبارات التالية:
              </p>

              <div className="space-y-3">
                {group.statements.map((statement, idx) => (
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
              disabled={currentGroup === 0}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              السابق
            </Button>

            <Button
              onClick={handleNext}
              disabled={!groupAnswered}
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
