import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImg from '@/assets/hero-calligraphy.jpg';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="فن الخط العربي"
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/80 to-background/60" />
      </div>

      {/* Content */}
      <div className="container relative mx-auto px-4 py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              مدعوم بالذكاء الاصطناعي
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-6 font-amiri text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            اكتشف أسلوبك الإبداعي
            <span className="block text-primary">في الكتابة العربية</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            برنامج معزز بالذكاء الاصطناعي يساعدك على بناء هوية لغوية فريدة وإبداعية
            في الكتابة العربية، مصممة خصيصًا لغير الناطقين بالعربية.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Button
              variant="hero"
              size="lg"
              className="h-14 px-10 text-lg"
              onClick={() => navigate('/style-test')}
            >
              ابدأ اختبار الأسلوب
              <Sparkles className="h-5 w-5 mr-2" />
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                تعرّف على البرنامج
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg border-accent/30 text-accent-foreground hover:bg-accent/10"
                onClick={() => navigate('/program-components')}
              >
                دليل البرنامج
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
