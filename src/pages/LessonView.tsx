import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Target, CheckCircle2, Users, Swords, MapPin,
  TrendingUp, Award, ArrowLeft, ArrowRight, GraduationCap,
  Sparkles, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useWriter } from '@/contexts/WriterContext';
import { styleData } from '@/data/styles';

const storyElements = [
  {
    icon: Users,
    title: 'الشخصيات',
    description: 'الأفراد الذين تدور حولهم الأحداث، بدوافعهم ومشاعرهم وتطورهم عبر القصة.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: MapPin,
    title: 'المكان والزمان',
    description: 'الإطار الذي تدور فيه الأحداث، ويؤثر في الأجواء ومشاعر الشخصيات.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Swords,
    title: 'الصراع',
    description: 'المشكلة أو التحدي الذي يواجه الشخصيات ويحرك الأحداث نحو الذروة.',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  {
    icon: TrendingUp,
    title: 'الحبكة',
    description: 'تسلسل الأحداث من البداية مرورًا بالتصاعد والذروة وصولًا إلى الحل.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Award,
    title: 'الذروة والحل',
    description: 'اللحظة الأكثر إثارة في القصة، يليها الحل الذي يختتم الصراع.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
];

const LessonView = () => {
  const { profile } = useWriter();
  const navigate = useNavigate();
  const { lessonIndex } = useParams<{ lessonIndex: string }>();
  const idx = parseInt(lessonIndex || '0', 10);

  const [currentStep, setCurrentStep] = useState(0);
  const [revealedObjectives, setRevealedObjectives] = useState<number[]>([]);

  useEffect(() => {
    if (!profile) navigate('/style-test');
  }, [profile, navigate]);

  useEffect(() => {
    setCurrentStep(0);
    setRevealedObjectives([]);
  }, [idx]);

  if (!profile) return null;

  const info = styleData[profile.style];
  const lesson = info.lessons[idx];
  if (!lesson) {
    navigate('/learning-path');
    return null;
  }

  const totalSteps = 3; // objectives, elements, story example

  const revealNextObjective = () => {
    if (revealedObjectives.length < lesson.objectives.length) {
      setRevealedObjectives(prev => [...prev, prev.length]);
    }
  };

  const allObjectivesRevealed = revealedObjectives.length >= lesson.objectives.length;

  const getNextRoute = () => {
    if (idx === 0) return '/assessment/concept';
    if (idx === 1) return '/assessment/elements';
    return '/creative-writing';
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
              الدرس {idx + 1} من {info.lessons.length}
            </span>
            <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground sm:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              مسار الأسلوب {info.name}
            </p>
          </div>

          {/* Step Indicators */}
          <div className="mb-10 flex justify-center gap-3">
            {['أهداف الدرس', 'عناصر القصة', 'نموذج قصصي'].map((label, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  currentStep === i
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Objectives */}
            {currentStep === 0 && (
              <motion.div
                key="objectives"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-border bg-card p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Target className="h-5 w-5 text-primary" />
                    <h2 className="font-amiri text-2xl font-bold text-foreground">
                      أهداف الدرس — سيتقن الطالب:
                    </h2>
                  </div>

                  <div className="space-y-4 mb-6">
                    {lesson.objectives.map((obj, oIdx) => (
                      <motion.div
                        key={oIdx}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={
                          revealedObjectives.includes(oIdx)
                            ? { opacity: 1, y: 0, scale: 1 }
                            : { opacity: 0.2, y: 0, scale: 0.95 }
                        }
                        transition={{ duration: 0.5, type: 'spring' }}
                        className={`flex items-start gap-4 rounded-xl border p-5 transition-all ${
                          revealedObjectives.includes(oIdx)
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          revealedObjectives.includes(oIdx)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {revealedObjectives.includes(oIdx) ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-bold">{oIdx + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className={`text-base font-bold ${
                            revealedObjectives.includes(oIdx) ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {obj}
                          </p>
                          {revealedObjectives.includes(oIdx) && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-sm text-primary mt-1"
                            >
                              ✨ هدف رائع! ستتقنه بنهاية هذا الدرس
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {!allObjectivesRevealed ? (
                    <Button
                      variant="hero"
                      onClick={revealNextObjective}
                      className="gap-2 w-full"
                    >
                      <Sparkles className="h-4 w-4" />
                      اكشف الهدف التالي ({revealedObjectives.length + 1}/{lesson.objectives.length})
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      onClick={() => setCurrentStep(1)}
                      className="gap-2 w-full"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      انتقل إلى عناصر القصة
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Story Elements Visual Explanation */}
            {currentStep === 1 && (
              <motion.div
                key="elements"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-border bg-card p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="h-5 w-5 text-accent" />
                    <h2 className="font-amiri text-2xl font-bold text-foreground">
                      عناصر القصة الإبداعية
                    </h2>
                  </div>

                  <p className="text-muted-foreground mb-8">
                    كل قصة إبداعية تتكون من عناصر أساسية تتشابك معًا لتخلق تجربة قرائية متكاملة
                  </p>

                  {/* Visual Element Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {storyElements.map((el, eIdx) => {
                      const Icon = el.icon;
                      return (
                        <motion.div
                          key={eIdx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + eIdx * 0.15 }}
                          className="group rounded-xl border border-border bg-background p-5 text-center transition-all hover:border-primary/30 hover:shadow-md"
                        >
                          <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${el.bg}`}>
                            <Icon className={`h-6 w-6 ${el.color}`} />
                          </div>
                          <h4 className="font-amiri text-lg font-bold text-foreground mb-2">{el.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{el.description}</p>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Connection Diagram */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="rounded-xl bg-muted/50 border border-border p-6 text-center"
                  >
                    <p className="text-sm font-bold text-foreground mb-2">🔗 كيف ترتبط العناصر؟</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      الشخصيات تعيش في المكان والزمان ← تواجه الصراع ← تتطور عبر الحبكة ← تصل إلى الذروة ← يُحَل الصراع
                    </p>
                  </motion.div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(0)} className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    أهداف الدرس
                  </Button>
                  <Button variant="hero" onClick={() => setCurrentStep(2)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    نموذج قصصي
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Story Example */}
            {currentStep === 2 && (
              <motion.div
                key="example"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-border bg-card p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Play className="h-5 w-5 text-primary" />
                    <h2 className="font-amiri text-2xl font-bold text-foreground">
                      نموذج قصصي — الأسلوب {info.name}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-muted/30 border border-border p-6 mb-6">
                    <h3 className="font-amiri text-xl font-bold text-primary mb-4">
                      {info.sampleText.title}
                    </h3>
                    <p className="text-lg leading-[2] text-foreground">
                      {info.sampleText.content}
                    </p>
                  </div>

                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-5">
                    <p className="text-sm font-bold text-primary mb-3">💡 لاحظ في هذا النص:</p>
                    <ul className="space-y-2">
                      {Object.entries(info.sampleText.analysis).map(([, value], aIdx) => (
                        <li key={aIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    عناصر القصة
                  </Button>
                  <Button
                    variant="hero"
                    onClick={() => navigate(getNextRoute())}
                    className="gap-2"
                  >
                    <GraduationCap className="h-4 w-4" />
                    {idx < 2 ? 'انتقل إلى الاختبار' : 'ابدأ الكتابة الإبداعية'}
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

export default LessonView;
