import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Lock, CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useWriter } from '@/contexts/WriterContext';
import { styleData } from '@/data/styles';

const LearningPath = () => {
  const { profile, reset } = useWriter();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) navigate('/style-test');
  }, [profile, navigate]);

  if (!profile) return null;

  const info = styleData[profile.style];

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
              سيتقن الطالب المفاهيم والعناصر الأساسية للكتابة الإبداعية وفق أسلوبه الخاص
            </p>
          </div>

          {/* Learning Path */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute right-8 top-0 h-full w-0.5 bg-border" />

            <div className="space-y-8">
              {info.lessons.map((lesson, idx) => {
                const isFirst = idx === 0;
                const isLocked = idx > 0;

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
                      className={`absolute right-5 top-6 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                        isFirst
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 bg-background text-muted-foreground'
                      }`}
                    >
                      {isFirst ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </div>

                    {/* Card */}
                    <div
                      className={`rounded-2xl border p-6 transition-all ${
                        isFirst
                          ? 'border-primary/30 bg-card shadow-md'
                          : 'border-border bg-card/50 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className={`h-5 w-5 ${isFirst ? 'text-primary' : 'text-muted-foreground'}`} />
                        <h3 className="font-amiri text-lg font-bold text-foreground">
                          الدرس {idx + 1}: {lesson.title}
                        </h3>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs font-bold text-muted-foreground mb-2">
                          أهداف الدرس — سيتقن الطالب:
                        </p>
                        <ul className="space-y-1.5">
                          {lesson.objectives.map((obj, oIdx) => (
                            <li
                              key={oIdx}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isFirst ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {isFirst && (
                        <Button variant="default" size="sm" className="gap-2" disabled>
                          <BookOpen className="h-4 w-4" />
                          قريبًا — بدء الدرس
                        </Button>
                      )}

                      {isLocked && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
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

          {/* Actions */}
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
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                navigate('/style-test');
              }}
              className="gap-2"
            >
              إعادة الاختبار
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default LearningPath;
