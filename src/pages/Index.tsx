import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, BarChart3, BookOpen, GraduationCap, PenTool, Users, Award } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import TeacherFeedbackSection from '@/components/TeacherFeedbackSection';
import { useAuth } from '@/hooks/useAuth';

const phases = [
  {
    icon: ClipboardList,
    title: 'اختبار أسلوب الكاتب',
    description: 'اكتشف أسلوبك الكتابي الفريد من خلال استبيان ذكي يحلل ميولك اللغوية والإبداعية.',
    path: '/style-test',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
  },
  {
    icon: BarChart3,
    title: 'تقرير شخصي ذكي',
    description: 'احصل على تقرير مفصل يوضح خصائصك اللغوية وسماتك الإبداعية والتحديات المتوقعة.',
    path: '/style-report',
    color: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
  },
  {
    icon: BookOpen,
    title: 'نماذج مكتوبة تحليلية',
    description: 'اطلع على نصوص إبداعية تتوافق مع أسلوبك، مع تحليل تفاعلي لعناصر كل نص.',
    path: '/writing-models',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
  },
  {
    icon: GraduationCap,
    title: 'مسارات تعلم متفرعة',
    description: 'تعلّم عبر دروس مصممة خصيصًا لأسلوبك، مع أهداف واضحة وتمارين عملية.',
    path: '/learning-path',
    color: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
  },
  {
    icon: PenTool,
    title: 'الكتابة الإبداعية الذكية',
    description: 'محرر نصوص ذكي مع اقتراحات لغوية عاطفية وتقييم فوري بالذكاء الاصطناعي لدقة الكلمات وعمق المشاعر والهوية اللغوية.',
    path: '/creative-writing',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    requiresAuth: true,
  },
  {
    icon: Users,
    title: 'لوحة المعلم',
    description: 'تتبع تقدم كل متعلم، عرض تقارير الذكاء الاصطناعي، واقتراح تدخلات فردية مخصصة.',
    path: '/teacher-dashboard',
    color: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
    requiresAuth: true,
    teacherOnly: true,
  },
  {
    icon: Award,
    title: 'مخرجات التعلم النهائية',
    description: 'ملخص شامل يعرض التعلم الفردي، تحسن الكتابة الإبداعية، والوعي اللغوي الذاتي المعزز.',
    path: '/final-outputs',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    requiresAuth: true,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const handlePhaseClick = (phase: typeof phases[0]) => {
    if (phase.requiresAuth && !user) {
      navigate('/auth');
    } else if (phase.teacherOnly && role !== 'teacher') {
      navigate('/auth');
    } else {
      navigate(phase.path);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />

        {/* Teacher Feedback for Students */}
        <TeacherFeedbackSection />

        {/* All 7 Phases */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="font-amiri text-3xl font-bold text-foreground sm:text-4xl">
                رحلتك في سبع مراحل
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                منصة قلم تقودك خطوة بخطوة نحو اكتشاف وتطوير هويتك الكتابية الإبداعية
              </p>
            </motion.div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {phases.map((phase, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  onClick={() => handlePhaseClick(phase)}
                  className="group rounded-2xl border border-border bg-card p-7 text-center transition-all hover:border-primary/30 hover:shadow-lg text-right"
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${phase.color}`}>
                    <phase.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 font-amiri text-lg font-bold text-foreground text-center">
                    {phase.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-center">
                    {phase.description}
                  </p>
                  <div className="mt-4 text-xs font-bold text-primary">
                    المرحلة {idx + 1}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="font-amiri text-lg text-muted-foreground">
              قلم — منصة تطوير الكتابة الإبداعية بالذكاء الاصطناعي
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
