import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, BookOpen, Target, Heart, Fingerprint, TrendingUp, PenTool, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
      name: w.title.slice(0, 15) + (w.title.length > 15 ? '...' : ''),
      'دقة الكلمات': evaluation ? Number(evaluation.word_precision) : 0,
      'عمق المشاعر': evaluation ? Number(evaluation.feeling_depth) : 0,
      'الهوية اللغوية': evaluation ? Number(evaluation.linguistic_identity) : 0,
    };
  });

  const overallAvg = (avgScore('word_precision') + avgScore('feeling_depth') + avgScore('linguistic_identity')) / 3;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
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

          {/* Stats Overview */}
          <div className="grid gap-6 sm:grid-cols-4 mb-8">
            {[
              { label: 'عدد الكتابات', value: writings.length, icon: BookOpen, color: 'text-primary' },
              { label: 'متوسط دقة الكلمات', value: avgScore('word_precision').toFixed(1), icon: Target, color: 'text-primary' },
              { label: 'متوسط عمق المشاعر', value: avgScore('feeling_depth').toFixed(1), icon: Heart, color: 'text-accent' },
              { label: 'متوسط الهوية اللغوية', value: avgScore('linguistic_identity').toFixed(1), icon: Fingerprint, color: 'text-primary' },
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

          {/* Final Outcomes */}
          <div className="grid gap-6 sm:grid-cols-3 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-primary/20 bg-emerald-light/30 p-6"
            >
              <PenTool className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-amiri text-lg font-bold text-foreground">التعلم الفردي</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {profile?.writing_style
                  ? `أسلوبك الكتابي: ${profile.writing_style}. تم تخصيص مسار التعلم وفقًا لخصائصك الإبداعية الفريدة.`
                  : 'اكتشف أسلوبك الكتابي عبر اختبار الأسلوب لتخصيص تجربتك التعليمية.'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-accent/20 bg-gold-light/30 p-6"
            >
              <TrendingUp className="h-8 w-8 text-accent mb-3" />
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
              <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="font-amiri text-lg font-bold text-foreground">الوعي اللغوي الذاتي</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {evaluations.length > 0
                  ? 'تقارير الذكاء الاصطناعي ساعدتك على فهم نقاط قوتك وفرص التحسين في الكتابة العربية الإبداعية.'
                  : 'ستحصل على تحليلات مفصلة لتعزيز وعيك بأسلوبك الكتابي.'}
              </p>
            </motion.div>
          </div>

          {/* Progress Chart */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-border bg-card p-6 mb-8"
            >
              <h3 className="mb-4 font-amiri text-xl font-bold text-foreground">تطور مهاراتك</h3>
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
                  <Bar dataKey="دقة الكلمات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="عمق المشاعر" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="الهوية اللغوية" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
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
