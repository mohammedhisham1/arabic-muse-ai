import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BookOpen, Target, Heart, Fingerprint, TrendingUp, PenTool, BarChart3, Star, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Writing, WritingEvaluation, Profile } from '@/types/database';

const FinalOutputs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [evaluations, setEvaluations] = useState<WritingEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [profileRes, writingsRes] = await Promise.all([
      (supabase as any).from('profiles').select('*').eq('user_id', user!.id).maybeSingle(),
      (supabase as any).from('writings').select('*').eq('user_id', user!.id).order('created_at', { ascending: true }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (writingsRes.data) {
      setWritings(writingsRes.data);
      const ids = writingsRes.data.map((w: Writing) => w.id);
      if (ids.length > 0) {
        const { data: evals } = await (supabase as any)
          .from('writing_evaluations')
          .select('*')
          .in('writing_id', ids);
        if (evals) setEvaluations(evals);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const avgScore = (field: keyof WritingEvaluation) => {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, e) => acc + Number(e[field] || 0), 0);
    return sum / evaluations.length;
  };

  const chartData = writings.map(w => {
    const evaluation = evaluations.find(e => e.writing_id === w.id);
    return {
      name: w.title.slice(0, 12) + (w.title.length > 12 ? '...' : ''),
      'دقة الكلمات': evaluation ? Number(evaluation.word_precision) : 0,
      'عمق المشاعر': evaluation ? Number(evaluation.feeling_depth) : 0,
      'الذات اللغوية': evaluation ? Number(evaluation.linguistic_identity) : 0,
    };
  });

  const radarData = [
    { skill: 'دقة الكلمات', value: avgScore('word_precision'), fullMark: 10 },
    { skill: 'عمق المشاعر', value: avgScore('feeling_depth'), fullMark: 10 },
    { skill: 'الذات اللغوية', value: avgScore('linguistic_identity'), fullMark: 10 },
  ];

  const overallAvg = (avgScore('word_precision') + avgScore('feeling_depth') + avgScore('linguistic_identity')) / 3;

  const getLevel = (avg: number) => {
    if (avg >= 8) return { label: 'متميز', emoji: '🏆', color: 'text-primary' };
    if (avg >= 6) return { label: 'متقدم', emoji: '⭐', color: 'text-primary' };
    if (avg >= 4) return { label: 'متطور', emoji: '📈', color: 'text-accent' };
    return { label: 'مبتدئ', emoji: '🌱', color: 'text-muted-foreground' };
  };

  const level = getLevel(overallAvg);

  // Calculate improvement trend
  const getImprovement = () => {
    if (evaluations.length < 2) return null;
    const sorted = [...evaluations].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
    const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));
    const avgFirst = firstHalf.reduce((s, e) => s + (Number(e.word_precision) + Number(e.feeling_depth) + Number(e.linguistic_identity)) / 3, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, e) => s + (Number(e.word_precision) + Number(e.feeling_depth) + Number(e.linguistic_identity)) / 3, 0) / secondHalf.length;
    return avgSecond - avgFirst;
  };

  const improvement = getImprovement();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-5xl"
        >
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <Award className="h-4 w-4 text-accent" />
              المرحلة النهائية — مخرجات التعلم
            </span>
            <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground sm:text-4xl">
              ملخص رحلتك الإبداعية
            </h1>
            <p className="mt-2 text-muted-foreground">
              {profile?.full_name ? `مرحبًا ${profile.full_name}، ` : ''}إليك تقرير شامل عن تطورك في الكتابة الإبداعية
            </p>
          </div>

          {/* Level Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-10 max-w-md rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-card p-8 text-center"
          >
            <span className="text-5xl">{level.emoji}</span>
            <h2 className={`mt-3 font-amiri text-2xl font-bold ${level.color}`}>
              المستوى: {level.label}
            </h2>
            <p className="mt-1 text-4xl font-bold text-foreground">{overallAvg.toFixed(1)}<span className="text-lg text-muted-foreground">/10</span></p>
            {improvement !== null && (
              <p className={`mt-2 text-sm font-medium ${improvement >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {improvement >= 0 ? '↑' : '↓'} تغير {Math.abs(improvement).toFixed(1)} نقطة عن النصف الأول
              </p>
            )}
          </motion.div>

          {/* Stats Overview */}
          <div className="grid gap-6 sm:grid-cols-4 mb-8">
            {[
              { label: 'عدد الكتابات', value: writings.length, icon: BookOpen, color: 'text-primary' },
              { label: 'متوسط دقة الكلمات', value: avgScore('word_precision').toFixed(1), icon: Target, color: 'text-primary' },
              { label: 'متوسط عمق المشاعر', value: avgScore('feeling_depth').toFixed(1), icon: Heart, color: 'text-accent' },
              { label: 'متوسط الذات اللغوية', value: avgScore('linguistic_identity').toFixed(1), icon: Fingerprint, color: 'text-primary' },
            ].map(({ label, value, icon: Icon, color }, idx) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 text-center"
              >
                <Icon className={`mx-auto h-6 w-6 ${color} mb-2`} />
                <p className="text-3xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Radar Chart + Final Outcomes */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            {/* Radar Chart */}
            {evaluations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="mb-4 font-amiri text-xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  خريطة المهارات
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 10]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <Radar
                      name="مهاراتك"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Final Outcomes */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-primary/20 bg-emerald-light/30 p-6"
              >
                <PenTool className="h-7 w-7 text-primary mb-3" />
                <h3 className="font-amiri text-lg font-bold text-foreground">التعلم الفردي</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {profile?.writing_style
                    ? `أسلوبك الكتابي: ${profile.writing_style}. تم تخصيص مسار التعلم وفقًا لخصائصك الإبداعية الفريدة.`
                    : 'إكتشف أسلوبك الكتابي عبر اختبار الأسلوب لتخصيص تجربتك التعليمية.'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-accent/20 bg-gold-light/30 p-6"
              >
                <TrendingUp className="h-7 w-7 text-accent mb-3" />
                <h3 className="font-amiri text-lg font-bold text-foreground">تحسن الكتابة الإبداعية</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {evaluations.length > 0
                    ? `متوسط أدائك العام: ${overallAvg.toFixed(1)}/10. ${overallAvg >= 7 ? 'أداء متميز!' : overallAvg >= 5 ? 'تقدم جيد، واصل التطور!' : 'بداية رائعة، استمر في التدرب!'}`
                    : 'ابدأ بكتابة نصوص إبداعية للحصول على تقييمات الذكاء الاصطناعي.'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <Star className="h-7 w-7 text-accent mb-3" />
                <h3 className="font-amiri text-lg font-bold text-foreground">الوعي اللغوي الذاتي</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {evaluations.length > 0
                    ? 'تقارير الذكاء الاصطناعي ساعدتك على فهم نقاط قوتك وفرص التحسين في الكتابة العربية الإبداعية.'
                    : 'ستحصل على تحليلات مفصلة لتعزيز وعيك بأسلوبك الكتابي.'}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Progress Bar Chart */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-border bg-card p-6 mb-8"
            >
              <h3 className="mb-4 font-amiri text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                تطور مهاراتك عبر الكتابات
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="دقة الكلمات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="عمق المشاعر" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="الذات اللغوية" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" onClick={() => navigate('/creative-writing')} className="gap-2">
              <PenTool className="h-5 w-5" />
              كتابة نص جديد
            </Button>
            <Button variant="outline" onClick={() => navigate('/style-test')} className="gap-2">
              إعادة اختبار الأسلوب
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default FinalOutputs;
