import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import QuestionCard from '@/components/QuestionCard';
import { useWriter } from '@/contexts/WriterContext';
import { questions } from '@/data/questionnaire';

const StyleTest = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const { answers, setAnswer, calculateProfile } = useWriter();
  const navigate = useNavigate();

  const progress = ((currentQ + 1) / questions.length) * 100;
  const canGoNext = answers[currentQ] >= 0;
  const isLast = currentQ === questions.length - 1;
  const allAnswered = answers.every(a => a >= 0);

  const handleNext = () => {
    if (isLast && allAnswered) {
      calculateProfile();
      navigate('/style-report');
    } else if (canGoNext && !isLast) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Progress */}
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>السؤال {currentQ + 1} من {questions.length}</span>
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

        {/* Question */}
        <div className="mx-auto mt-12 max-w-2xl">
          <AnimatePresence mode="wait">
            <QuestionCard
              key={currentQ}
              question={questions[currentQ]}
              selectedOption={answers[currentQ]}
              onSelect={(idx) => setAnswer(currentQ, idx)}
            />
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentQ === 0}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              السابق
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canGoNext}
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
