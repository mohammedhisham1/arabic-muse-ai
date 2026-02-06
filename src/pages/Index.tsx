import { motion } from 'framer-motion';
import { ClipboardList, BarChart3, BookOpen, GraduationCap } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';

const features = [
  {
    icon: ClipboardList,
    title: 'اختبار أسلوب الكاتب',
    description: 'اكتشف أسلوبك الكتابي الفريد من خلال استبيان ذكي يحلل ميولك اللغوية والإبداعية.',
  },
  {
    icon: BarChart3,
    title: 'تقرير شخصي ذكي',
    description: 'احصل على تقرير مفصل يوضح خصائصك اللغوية وسماتك الإبداعية والتحديات المتوقعة.',
  },
  {
    icon: BookOpen,
    title: 'نماذج مكتوبة تحليلية',
    description: 'اطلع على نصوص إبداعية تتوافق مع أسلوبك، مع تحليل تفاعلي لعناصر كل نص.',
  },
  {
    icon: GraduationCap,
    title: 'مسارات تعلم متفرعة',
    description: 'تعلّم عبر دروس مصممة خصيصًا لأسلوبك، مع أهداف واضحة وتمارين عملية.',
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />

        {/* Features section */}
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
                رحلتك في أربع مراحل
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                منصة قلم تقودك خطوة بخطوة نحو اكتشاف وتطوير هويتك الكتابية الإبداعية
              </p>
            </motion.div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group rounded-2xl border border-border bg-card p-8 text-center transition-all hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 font-amiri text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <div className="mt-4 text-xs font-bold text-primary">
                    المرحلة {idx + 1}
                  </div>
                </motion.div>
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
