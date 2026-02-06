import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Send, Sparkles, Target, Heart, Fingerprint, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Writing, WritingEvaluation } from '@/types/database';

const CreativeWriting = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [selectedWriting, setSelectedWriting] = useState<string | null>(null);
  const [writingStyle, setWritingStyle] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadWritings();
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('writing_style')
      .eq('user_id', user!.id)
      .maybeSingle();
    if (data?.writing_style) setWritingStyle(data.writing_style);
  };

  const loadWritings = async () => {
    const { data } = await (supabase as any)
      .from('writings')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setWritings(data);
  };

  const handleSaveAndAnalyze = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('يرجى كتابة العنوان والنص');
      return;
    }

    setSaving(true);
    try {
      // Save writing
      const { data: writingData, error: writeErr } = await (supabase as any)
        .from('writings')
        .insert({ user_id: user!.id, title, content, style: writingStyle })
        .select()
        .single();

      if (writeErr) throw writeErr;

      setSelectedWriting(writingData.id);
      toast.success('تم حفظ النص بنجاح!');
      setSaving(false);

      // Analyze with AI
      setAnalyzing(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-writing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            title,
            content,
            style: writingStyle,
            writingId: writingData.id,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'فشل التحليل');
      }

      const evalResult = await response.json();
      setEvaluation(evalResult);
      toast.success('تم التحليل بنجاح!');
      loadWritings();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  };

  const loadEvaluation = async (writingId: string) => {
    const { data } = await (supabase as any)
      .from('writing_evaluations')
      .select('*')
      .eq('writing_id', writingId)
      .maybeSingle();
    if (data) setEvaluation(data);
    else setEvaluation(null);
  };

  const selectExistingWriting = (w: Writing) => {
    setTitle(w.title);
    setContent(w.content);
    setSelectedWriting(w.id);
    loadEvaluation(w.id);
  };

  const scoreColor = (score: number) => {
    if (score >= 7) return 'text-primary';
    if (score >= 4) return 'text-accent';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <PenTool className="h-4 w-4" />
            المرحلة الخامسة — الكتابة الإبداعية
          </span>
          <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground">محرر الكتابة الذكي</h1>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {/* Sidebar - Previous writings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <h3 className="mb-4 font-amiri text-lg font-bold text-foreground">كتاباتك السابقة</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {writings.length === 0 && (
                <p className="text-sm text-muted-foreground">لم تكتب شيئًا بعد. ابدأ الآن!</p>
              )}
              {writings.map(w => (
                <button
                  key={w.id}
                  onClick={() => selectExistingWriting(w)}
                  className={`w-full rounded-lg border p-3 text-right transition-all ${
                    selectedWriting === w.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <p className="text-sm font-bold text-foreground truncate">{w.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(w.created_at).toLocaleDateString('ar')}
                  </p>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                setTitle('');
                setContent('');
                setSelectedWriting(null);
                setEvaluation(null);
              }}
            >
              كتابة جديدة
            </Button>
          </motion.div>

          {/* Main Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">عنوان النص</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اكتب عنوانًا إبداعيًا..."
                className="text-lg"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">النص الإبداعي</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب نصك الإبداعي هنا... دع خيالك ينطلق بحرية"
                className="min-h-[250px] w-full rounded-xl border border-input bg-background p-4 text-base leading-[2] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {content.length} حرف · {content.split(/\s+/).filter(Boolean).length} كلمة
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="hero"
                onClick={handleSaveAndAnalyze}
                disabled={saving || analyzing || !title.trim() || !content.trim()}
                className="gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جارٍ التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    حفظ وتحليل بالذكاء الاصطناعي
                  </>
                )}
              </Button>
            </div>

            {/* Evaluation Results */}
            {evaluation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 rounded-2xl border border-primary/20 bg-card p-6"
              >
                <h3 className="font-amiri text-xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  تقرير التقييم الفوري
                </h3>

                {/* Scores */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'دقة الكلمات', value: evaluation.word_precision, icon: Target },
                    { label: 'عمق المشاعر', value: evaluation.feeling_depth, icon: Heart },
                    { label: 'الهوية اللغوية', value: evaluation.linguistic_identity, icon: Fingerprint },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl border border-border bg-background p-4 text-center">
                      <Icon className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={`text-3xl font-bold ${scoreColor(value)}`}>
                        {Number(value).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">/10</p>
                    </div>
                  ))}
                </div>

                {/* Feedback */}
                {evaluation.feedback && (
                  <div className="rounded-xl bg-emerald-light/50 border border-primary/20 p-4">
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary" />
                      ملاحظات المراجعة
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {evaluation.feedback}
                    </p>
                  </div>
                )}

                {/* Suggestions */}
                {evaluation.suggestions && (
                  <div className="rounded-xl bg-gold-light/50 border border-accent/20 p-4">
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-accent" />
                      اقتراحات للتحسين
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {evaluation.suggestions}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreativeWriting;
