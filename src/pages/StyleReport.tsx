import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, AlertTriangle, Lightbulb, Feather } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StyleTestRequired from '@/components/StyleTestRequired';
import CompatibilityMatrix from '@/components/CompatibilityMatrix';
import { useWriter } from '@/contexts/WriterContext';
import { styleData, styleNames } from '@/data/styles';
import type { WritingStyle } from '@/types/writer';

const StyleReport = () => {
  const { profile, loadingProfile } = useWriter();
  const navigate = useNavigate();



  // Writing style is now saved by WriterContext.calculateProfile()

  if (loadingProfile) return null;
  if (!profile) return <StyleTestRequired />;

  const info = styleData[profile.style];

  const radarData = Object.entries(profile.scores).map(([key, value]) => ({
    style: styleNames[key as WritingStyle],
    value,
    fullMark: 5,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Style Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-6xl">{info.icon}</span>
          <h1 className="mt-4 font-amiri text-4xl font-bold text-foreground sm:text-5xl">
            أسلوبك: <span className="text-primary">{info.name}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {info.description}
          </p>
        </motion.div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="mb-4 font-amiri text-xl font-bold text-foreground">خريطة أسلوبك</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="style"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  name="النتيجة"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Characteristics & Features */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Feather className="h-5 w-5 text-primary" />
                <h3 className="font-amiri text-xl font-bold text-foreground">الخصائص اللغوية</h3>
              </div>
              <ul className="space-y-2">
                {info.characteristics.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-accent" />
                <h3 className="font-amiri text-xl font-bold text-foreground">السمات الإبداعية</h3>
              </div>
              <ul className="space-y-2">
                {info.creativeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-amiri text-xl font-bold text-foreground">التحديات المتوقعة</h3>
              </div>
              <ul className="space-y-2">
                {info.challenges.map((ch, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    {ch}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Compatibility Matrix */}
        <div className="mx-auto mt-8 max-w-5xl">
          <CompatibilityMatrix currentStyle={profile.style} />
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mx-auto mt-12 flex max-w-xl flex-wrap justify-center gap-4"
        >
          <Button
            variant="hero"
            size="lg"
            className="gap-2"
            onClick={() => navigate('/writing-models')}
          >
            <BookOpen className="h-5 w-5" />
            اطلع على نماذج من أسلوبك
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => navigate('/learning-path')}
          >
            <GraduationCap className="h-5 w-5" />
            ابدأ مسار التعلم
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default StyleReport;
