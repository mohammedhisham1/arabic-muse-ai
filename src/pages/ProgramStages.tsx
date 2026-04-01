import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { programPhases } from '@/data/programPhases';
import { Button } from '@/components/ui/button';

const ProgramStages = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const handlePhaseClick = (phase: typeof programPhases[number]) => {
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
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="font-amiri text-3xl font-bold text-foreground sm:text-4xl">
                رحلتك في سبع مراحل
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                منصة قلم تقودك خطوة بخطوة نحو اكتشاف وتطوير هويتك الكتابية الإبداعية
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => navigate('/')}>
                  العودة للرئيسية
                </Button>
                <Button variant="outline" onClick={() => navigate('/program-components')}>
                  دليل البرنامج
                </Button>
              </div>
            </motion.div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {programPhases.map((phase, idx) => (
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
                  <h2 className="mt-5 font-amiri text-lg font-bold text-foreground text-center">
                    {phase.title}
                  </h2>
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
      </main>
    </div>
  );
};

export default ProgramStages;

