import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Send, Sparkles, Target, Heart, Fingerprint, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import ScoreGauge from '@/components/ScoreGauge';
import EmotionalSuggestions from '@/components/EmotionalSuggestions';
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

  // Rewrite Challenge State
  const [rewriteAttempts, setRewriteAttempts] = useState(0);
  const [showRewrite, setShowRewrite] = useState(false);
  const [userRewrite, setUserRewrite] = useState('');
  const [showAIResult, setShowAIResult] = useState(false);
  const [rewriteFeedback, setRewriteFeedback] = useState<string | null>(null);
  const [analyzingRewrite, setAnalyzingRewrite] = useState(false);

  useEffect(() => {
    if (user) {
      loadWritings();
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('writing_style')
      .eq('id', user!.id)  // Fixed: use 'id' not 'user_id'
      .maybeSingle();
    console.log('Profile load:', { data, error, userId: user!.id });
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
    // Debug log to see what's being submitted
    console.log('Form submission:', { title, content, writingStyle, titleTrimmed: title.trim(), contentTrimmed: content.trim() });

    if (!title.trim() || !content.trim()) {
      toast.error('يرجى كتابة العنوان والنص');
      return;
    }

    setSaving(true);
    try {
      const { data: writingData, error: writeErr } = await (supabase as any)
        .from('writings')
        .insert({ user_id: user!.id, title, content, style: writingStyle })
        .select()
        .single();

      if (writeErr) throw writeErr;

      setSelectedWriting(writingData.id);
      toast.success('تم حفظ النص بنجاح!');
      setSaving(false);

      setAnalyzing(true);

      // Debug log before API call
      const payload = {
        title,
        content,
        style: writingStyle,
        writingId: writingData.id,
      };
      console.log('API payload:', payload);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-writing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'فشل التحليل');
      }

      const evalResult = await response.json();
      setEvaluation(evalResult);
      // Reset challenge state
      setRewriteAttempts(0);
      setShowRewrite(false);
      setUserRewrite('');
      setShowAIResult(false);

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
    if (data) {
      setEvaluation(data);
      // Reset challenge state for loaded evaluation
      setRewriteAttempts(0);
      setShowRewrite(false);
      setUserRewrite('');
      setShowAIResult(false);
    } else setEvaluation(null);
  };

  const selectExistingWriting = (w: Writing) => {
    setTitle(w.title);
    setContent(w.content);
    setSelectedWriting(w.id);
    loadEvaluation(w.id);
  };

  const handleApplySuggestion = (suggestion: string) => {
    setContent(prev => prev + ' ' + suggestion);
    toast.success('تم إضافة الاقتراح إلى النص');
  };

  const handleRewriteSubmit = async () => {
    if (!userRewrite.trim()) return;

    setAnalyzingRewrite(true);
    setRewriteFeedback(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-writing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            mode: 'rewrite_feedback',
            content: userRewrite,
            targetText: evaluation?.improved_text,
            originalText: content
          }),
        }
      );

      if (!response.ok) throw new Error('فشل تحليل المحاولة');

      const data = await response.json();
      setRewriteFeedback(data.feedback);

      const next = rewriteAttempts + 1;
      setRewriteAttempts(next);
      toast.success(`تم تسجيل المحاولة ${next}`);

      if (next >= 2) {
        setShowAIResult(true);
        toast.info('تم استلام تقييم المحاولة الأخيرة وإظهار النص المحسن');
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحليل المحاولة');
    } finally {
      setAnalyzingRewrite(false);
    }
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
          <p className="mt-2 text-muted-foreground">اكتب نصك الإبداعي واحصل على تحليل فوري واقتراحات لغوية عاطفية</p>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-4">
          {/* Sidebar - Previous writings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 font-amiri text-lg font-bold text-foreground">كتاباتك السابقة</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {writings.length === 0 && (
                  <p className="text-sm text-muted-foreground">لم تكتب شيئًا بعد. ابدأ الآن!</p>
                )}
                {writings.map(w => (
                  <button
                    key={w.id}
                    onClick={() => selectExistingWriting(w)}
                    className={`w-full rounded-lg border p-3 text-right transition-all ${selectedWriting === w.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:border-primary/30'
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
                  setRewriteAttempts(0);
                  setShowRewrite(false);
                  setUserRewrite('');
                  setShowAIResult(false);
                  setRewriteFeedback(null);
                  setAnalyzingRewrite(false);
                }}
              >
                كتابة جديدة
              </Button>
            </div>
          </motion.div>

          {/* Main Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
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
                  className="min-h-[280px] w-full rounded-xl border border-input bg-background p-4 text-base leading-[2] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {content.length} حرف · {content.split(/\s+/).filter(Boolean).length} كلمة
                  </p>
                  {writingStyle && (
                    <span className="text-xs rounded-full bg-primary/10 px-3 py-1 text-primary font-medium">
                      أسلوبك: {writingStyle}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="hero"
                onClick={handleSaveAndAnalyze}
                disabled={saving || analyzing || !title.trim() || !content.trim()}
                className="gap-2 w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جارٍ التحليل بالذكاء الاصطناعي...
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

                {/* Score Gauges */}
                <div className="flex flex-wrap justify-center gap-8">
                  <ScoreGauge label="دقة الكلمات" value={evaluation.word_precision} icon={Target} />
                  <ScoreGauge label="عمق المشاعر" value={evaluation.feeling_depth} icon={Heart} />
                  <ScoreGauge label="الهوية اللغوية" value={evaluation.linguistic_identity} icon={Fingerprint} />
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

                {/* Improved Text with Challenge */}
                {evaluation.improved_text && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-5">
                    <h4 className="font-bold text-foreground flex items-center gap-2 mb-4">
                      <Sparkles className="h-4 w-4 text-primary" />
                      النص المحسّن
                    </h4>

                    {!showAIResult && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          لديك فرصة لتحسين النص بنفسك بناءً على الملاحظات قبل رؤية اقتراح الذكاء الاصطناعي.
                          <br />
                          <span className="font-bold text-primary">المحاولات المتبقية: {2 - rewriteAttempts}</span>
                        </p>
                      </div>
                    )}

                    {/* Feedback Display */}
                    {rewriteFeedback && (
                      <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 mb-4 mt-4">
                        <h5 className="font-bold text-sm text-accent-foreground mb-1 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" /> ملاحظات الذكاء الاصطناعي على محاولتك:
                        </h5>
                        <p className="text-sm text-foreground/90">{rewriteFeedback}</p>
                      </div>
                    )}

                    {!showRewrite && !showAIResult ? (
                      <Button
                        onClick={() => setShowRewrite(true)}
                        variant="outline"
                        className="w-full border-dashed border-2"
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        محاولة إعادة كتابة النص المحسن
                      </Button>
                    ) : (
                      <div className="space-y-3 mt-4">
                        {/* Keep showing input but disabled if result is shown, so user can see their last attempt */}
                        <label className="text-xs font-bold text-muted-foreground">محاولتك:</label>
                        <textarea
                          value={userRewrite}
                          onChange={(e) => setUserRewrite(e.target.value)}
                          className="w-full min-h-[120px] rounded-xl border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-70 disabled:bg-muted/30"
                          placeholder="اكتب صياغتك المحسنة هنا..."
                          disabled={analyzingRewrite || showAIResult}
                        />

                        {!showAIResult && (
                          <Button
                            onClick={handleRewriteSubmit}
                            className="w-full"
                            variant="hero"
                            disabled={analyzingRewrite || !userRewrite.trim()}
                          >
                            {analyzingRewrite ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                جاري تحليل المحاولة...
                              </>
                            ) : (
                              `تسليم المحاولة (${rewriteAttempts + 1}/2)`
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {showAIResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-3 mt-8 pt-6 border-t-2 border-dashed border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                            اقتراح الذكاء الاصطناعي (النموذج)
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => {
                              navigator.clipboard.writeText(evaluation.improved_text || '');
                              toast.success('تم نسخ النص المحسّن');
                            }}
                          >
                            نسخ النص
                          </Button>
                        </div>
                        <div className="rounded-lg bg-background border border-border p-4">
                          <p className="text-sm leading-[2] text-foreground whitespace-pre-line font-medium">
                            {evaluation.improved_text}
                          </p>
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          قارن بين محاولتك أعلاه وهذا الاقتراح لتعزيز تعلمك
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Right Sidebar - Emotional Suggestions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <EmotionalSuggestions
              content={content}
              style={writingStyle}
              onApplySuggestion={handleApplySuggestion}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreativeWriting;
