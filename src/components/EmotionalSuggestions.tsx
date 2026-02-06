import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Palette, Type, Feather, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Suggestion {
  type: 'emotion' | 'imagery' | 'style' | 'vocabulary';
  original?: string;
  suggestion: string;
  reason: string;
}

interface EmotionalSuggestionsProps {
  content: string;
  style: string;
  onApplySuggestion?: (suggestion: string) => void;
}

const typeConfig = {
  emotion: { label: 'تعبير عاطفي', icon: Heart, color: 'text-destructive' },
  imagery: { label: 'صورة بلاغية', icon: Palette, color: 'text-accent' },
  style: { label: 'تحسين أسلوبي', icon: Feather, color: 'text-primary' },
  vocabulary: { label: 'دقة المفردات', icon: Type, color: 'text-muted-foreground' },
};

const EmotionalSuggestions = ({ content, style, onApplySuggestion }: EmotionalSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    if (content.trim().length < 10) {
      toast.error('اكتب على الأقل 10 أحرف للحصول على اقتراحات');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-emotional`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ content, style }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'فشل في جلب الاقتراحات');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-accent/20 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-amiri text-lg font-bold text-foreground flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-accent" />
          اقتراحات لغوية عاطفية
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          disabled={loading || content.trim().length < 10}
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? 'جارٍ التحليل...' : 'اقترح تحسينات'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {suggestions.length === 0 && !loading && (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-muted-foreground text-center py-4"
          >
            اضغط "اقترح تحسينات" للحصول على اقتراحات ذكية لتحسين نصك
          </motion.p>
        )}

        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-6"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <span className="text-sm text-muted-foreground">الذكاء الاصطناعي يحلل نصك...</span>
            </div>
          </motion.div>
        )}

        {suggestions.length > 0 && !loading && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {suggestions.map((s, idx) => {
              const config = typeConfig[s.type] || typeConfig.style;
              const Icon = config.icon;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-muted-foreground mb-1">{config.label}</p>
                      {s.original && (
                        <p className="text-xs text-muted-foreground line-through mb-1">«{s.original}»</p>
                      )}
                      <p className="text-sm font-bold text-foreground mb-1">«{s.suggestion}»</p>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                    </div>
                    {onApplySuggestion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0"
                        onClick={() => onApplySuggestion(s.suggestion)}
                      >
                        تطبيق
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmotionalSuggestions;
