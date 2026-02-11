import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Tag, MessageSquare, Users, Swords, GraduationCap, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StyleTestRequired from '@/components/StyleTestRequired';
import { useWriter } from '@/contexts/WriterContext';
import { styleData } from '@/data/styles';
import { styleHighlights } from '@/data/highlights';

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

/** Render text with highlighted phrases inline */
function HighlightedText({ content, phrases }: {
  content: string;
  phrases: { phrase: string; characteristic: string }[];
}) {
  const segments = useMemo(() => {
    if (!phrases.length) return [{ text: content, highlight: null }];

    // Sort phrases by their position in the content (longest first to avoid partial matches)
    const sortedPhrases = [...phrases].sort((a, b) => b.phrase.length - a.phrase.length);

    type Segment = { text: string; highlight: { phrase: string; characteristic: string } | null };
    let result: Segment[] = [{ text: content, highlight: null }];

    for (const phrase of sortedPhrases) {
      const newResult: Segment[] = [];
      for (const seg of result) {
        if (seg.highlight) {
          newResult.push(seg);
          continue;
        }
        const idx = seg.text.indexOf(phrase.phrase);
        if (idx === -1) {
          newResult.push(seg);
          continue;
        }
        if (idx > 0) {
          newResult.push({ text: seg.text.slice(0, idx), highlight: null });
        }
        newResult.push({ text: phrase.phrase, highlight: phrase });
        const after = idx + phrase.phrase.length;
        if (after < seg.text.length) {
          newResult.push({ text: seg.text.slice(after), highlight: null });
        }
      }
      result = newResult;
    }

    return result;
  }, [content, phrases]);

  return (
    <p className="text-lg leading-[2] text-foreground">
      {segments.map((seg, i) =>
        seg.highlight ? (
          <span
            key={i}
            className="relative inline bg-primary/15 px-1 rounded border-b-2 border-primary/40 cursor-help group"
            title={seg.highlight.characteristic}
          >
            {seg.text}
            <span className="pointer-events-none absolute -top-8 right-0 z-10 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
              {seg.highlight.characteristic}
            </span>
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  );
}

const WritingModels = () => {
  const { profile, loadingProfile } = useWriter();
  const navigate = useNavigate();



  if (loadingProfile) return null;
  if (!profile) return <StyleTestRequired />;

  const info = styleData[profile.style];
  const { sampleText } = info;
  const highlights = styleHighlights[profile.style] || [];

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
            {/* Sample Text with Highlighting */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3 rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="font-amiri text-2xl font-bold text-primary mb-6">
                {sampleText.title}
              </h2>

              <HighlightedText content={sampleText.content} phrases={highlights} />

              {/* Highlight Legend */}
              {highlights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 rounded-xl bg-muted/50 border border-border p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Highlighter className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">
                      🤖 الذكاء الاصطناعي يشير إلى سمات النمط {info.name}:
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {highlights.map((h, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
                        <span>
                          <span className="font-bold text-foreground">«{h.phrase}»</span>
                          {' — '}
                          {h.characteristic}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-4">
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
