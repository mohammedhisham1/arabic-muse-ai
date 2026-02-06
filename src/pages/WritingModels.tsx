import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Tag, MessageSquare, Users, Swords, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useWriter } from '@/contexts/WriterContext';
import { styleData } from '@/data/styles';

const analysisIcons = {
  titleType: Tag,
  languageStyle: MessageSquare,
  characters: Users,
  conflict: Swords,
};

const analysisLabels: Record<string, string> = {
  titleType: 'نوع العنوان',
  languageStyle: 'أسلوب اللغة',
  characters: 'الشخصيات',
  conflict: 'الصراع',
};

const WritingModels = () => {
  const { profile } = useWriter();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) navigate('/style-test');
  }, [profile, navigate]);

  if (!profile) return null;

  const info = styleData[profile.style];
  const { sampleText } = info;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <BookOpen className="h-4 w-4" />
              نماذج مكتوبة — الأسلوب {info.name}
            </span>
            <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground sm:text-4xl">
              نموذج تحليلي تفاعلي
            </h1>
            <p className="mt-2 text-muted-foreground">
              اطلع على نص إبداعي يتوافق مع أسلوبك مع تحليل تفاعلي لعناصره
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            {/* Sample Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3 rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="font-amiri text-2xl font-bold text-primary mb-6">
                {sampleText.title}
              </h2>
              <p className="text-lg leading-[2] text-foreground">
                {sampleText.content}
              </p>
              <div className="mt-6 rounded-xl bg-emerald-light/50 border border-primary/20 p-4">
                <p className="text-sm font-medium text-primary">
                  💡 لاحظ كيف يعكس هذا النص سمات الأسلوب {info.name}: تجد فيه{' '}
                  {info.characteristics[0].toLowerCase()} و{info.characteristics[1].toLowerCase()}.
                </p>
              </div>
            </motion.div>

            {/* Analysis Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 space-y-4"
            >
              <h3 className="font-amiri text-xl font-bold text-foreground">التحليل التفاعلي</h3>
              {Object.entries(sampleText.analysis).map(([key, value], idx) => {
                const Icon = analysisIcons[key as keyof typeof analysisIcons];
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <span className="text-sm font-bold text-foreground">
                        {analysisLabels[key]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12 text-center"
          >
            <Button
              variant="hero"
              size="lg"
              className="gap-2"
              onClick={() => navigate('/learning-path')}
            >
              <GraduationCap className="h-5 w-5" />
              ابدأ درسك
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default WritingModels;
