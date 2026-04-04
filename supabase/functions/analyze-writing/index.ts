import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** Gemini sometimes emits “curly” quotes; JSON.parse requires ASCII ". */
const normalizeAiQuotes = (s: string) =>
  s
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u201E/g, '"')
    .replace(/\u2033/g, '"');

const unescapeJsonStringChunk = (inner: string): string =>
  inner
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');

/** Flatten feedback when the model returns a string, object, or array (not per contract). */
const feedbackValueToString = (fb: unknown): string => {
  if (typeof fb === 'string') return fb.trim();
  if (fb == null) return '';
  if (Array.isArray(fb)) {
    return fb.map(feedbackValueToString).filter(Boolean).join(' ');
  }
  if (typeof fb === 'object') {
    const parts: string[] = [];
    for (const v of Object.values(fb as Record<string, unknown>)) {
      const s = feedbackValueToString(v);
      if (s) parts.push(s);
    }
    return parts.join(' ');
  }
  return String(fb).trim();
};

/** Pull "key": "value" string values from a fragment (e.g. inside feedback:{...}). */
const collectStringValuesFromJsonishFragment = (fragment: string): string => {
  const values: string[] = [];
  const re = /"[^"]*"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(fragment)) !== null) {
    const inner = unescapeJsonStringChunk(m[1]);
    if (inner.trim()) values.push(inner.trim());
  }
  return values.join(' ');
};

const extractJsonFromText = (text: string): string | null => {
  if (!text) return null;
  const raw = String(text).trim();

  // Prefer fenced blocks: ```json ... ```
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    const candidate = fenced[1].trim();
    if (
      (candidate.startsWith('{') && candidate.endsWith('}')) ||
      (candidate.startsWith('[') && candidate.endsWith(']'))
    ) {
      return candidate;
    }
  }

  // Find first balanced JSON object/array
  const startObj = raw.indexOf('{');
  const startArr = raw.indexOf('[');
  const start =
    startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr);
  if (start === -1) return null;

  const openCh = raw[start];
  const closeCh = openCh === '[' ? ']' : '}';

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === openCh) depth++;
    if (ch === closeCh) depth--;

    if (depth === 0) {
      const candidate = raw.slice(start, i + 1).trim();
      if (
        (candidate.startsWith('{') && candidate.endsWith('}')) ||
        (candidate.startsWith('[') && candidate.endsWith(']'))
      ) {
        return candidate;
      }
      return null;
    }
  }

  return null;
};

const buildFallbackEvaluation = (args: { title?: string; content: string; style?: string }) => {
  const text = (args.content || '').trim();
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  // Conservative heuristic scores for very short / low-signal texts
  const isTooShort = wordCount < 25;

  const word_precision = isTooShort ? 4 : 6;
  const feeling_depth = isTooShort ? 3 : 5;
  const linguistic_identity = isTooShort ? 2 : 5;

  const feedback = isTooShort
    ? 'النص قصير جدًا ولا يوفّر مادة كافية لتحليلٍ دقيق. حاول كتابة فقرة أطول (4–6 جمل) تتضمن حدثًا/مشهدًا ومشاعر واضحة.'
    : 'يوجد أساس جيد، لكن التحليل الآلي لم يتمكن من إنتاج تقرير كامل هذه المرة. جرّب تحسين النص قليلًا ثم أعد التحليل.';

  const suggestions = isTooShort
    ? 'اكتب مشهدًا صغيرًا: حدّد المكان، شخصية واحدة، هدفًا واضحًا، وجملة أو جملتين تعبّران عن الشعور. ثم أضف تفصيلة حسية (صوت/رائحة/لون).'
    : 'قسّم النص إلى فقرات، وركّز على أفعال دقيقة بدل العموميات، وأضف تفاصيل حسية قليلة ولكن مؤثرة.';

  const improved_text = isTooShort
    ? 'في مساءٍ هادئ، جلستُ قرب النافذة أراقب الضوء وهو ينسحب ببطء من فوق الجدار. لم يكن السؤال في رأسي مجرد كلمات، بل ارتجافة صغيرة في القلب: ماذا لو تأخرتُ خطوة واحدة؟'
    : text; // استخدم النص الأصلي كأساس عند فشل نموذج التقييم الرئيسي

  return {
    word_precision,
    feeling_depth,
    linguistic_identity,
    feedback,
    suggestions,
    improved_text,
  };
};

/** When JSON is truncated or uses smart quotes, recover feedback (string or object shape). */
const extractFeedbackFromBrokenJson = (s: string): string | null => {
  const norm = normalizeAiQuotes(s);

  const strOpen = norm.match(/"feedback"\s*:\s*"/);
  if (strOpen && strOpen.index !== undefined) {
    let i = strOpen.index + strOpen[0].length;
    let out = '';
    let escape = false;
    for (; i < norm.length; i++) {
      const ch = norm[i];
      if (escape) {
        if (ch === 'n') out += '\n';
        else if (ch === 't') out += '\t';
        else if (ch === 'r') out += '\r';
        else out += ch;
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') break;
      out += ch;
    }
    const t = out.trim();
    if (t.length > 0) return t;
  }

  const objOpen = norm.match(/"feedback"\s*:\s*\{/);
  if (objOpen && objOpen.index !== undefined) {
    const frag = norm.slice(objOpen.index + objOpen[0].length);
    const joined = collectStringValuesFromJsonishFragment(frag);
    if (joined.trim()) return joined.trim();
  }

  return null;
};

const buildFallbackRewriteFeedback = () => ({
  feedback:
    'لم يكتمل الرد التلقائي. قارن صياغتك بالنموذج المستهدف، وركّز على دقة المفردات وتسلسل الأفكار، ثم أعد المحاولة.',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { title, content, style, writingId, mode, targetText, originalText } = await req.json();

    type GeminiCallResult = { text: string | undefined; finishReason?: string };

    const callGemini = async (
      prompt: string,
      attempt: 1 | 2,
      maxOutputTokens: number
    ): Promise<GeminiCallResult> => {
      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: attempt === 1 ? 0.7 : 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens,
            },
          }),
        }
      );

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`Gemini API error: ${aiResponse.status} - ${errText}`);
      }

      const aiData = await aiResponse.json();
      const cand = aiData.candidates?.[0];
      return {
        text: cand?.content?.parts?.[0]?.text as string | undefined,
        finishReason: cand?.finishReason as string | undefined,
      };
    };

    const strictJsonOnly = `\n\nقواعد إخراج صارمة:\n- أعد JSON فقط بدون أي Markdown.\n- لا تستخدم \`\`\`.\n- لا تضف أي نص خارج JSON.\n`;

    /** طلب ثانٍ يركّز على مثال النص المحسّن الكامل عندما يحذفه النموذج الأول أو يختصره */
    const ensureImprovedTextSample = async (args: {
      content: string;
      title?: string;
      style?: string;
      feedback: string;
      suggestions: string;
    }): Promise<string> => {
      const promptFill = `أنت محرر عربي للنصوص الإبداعية.

أعد صياغة «النص الأصلي» بالكامل داخل improved_text: طبّق عملياً ملاحظات المراجعة واقتراحات التحسين، مع الحفاظ على المعنى والصوت الشخصي للكاتب. يجب أن يكون improved_text النص كاملاً من أول كلمة لآخرها (وليس ملخصاً ولا تعليقاً قصيراً).

العنوان: ${args.title || '—'}
الأسلوب: ${args.style || '—'}

ملاحظات المراجعة:
${args.feedback || '—'}

اقتراحات التحسين:
${args.suggestions || '—'}

النص الأصلي:
${args.content}

أجب JSON فقط بهذا الشكل:
{"improved_text":"..."}`;

      let g = await callGemini(
        promptFill + strictJsonOnly + '- مفتاح واحد فقط: improved_text.\n',
        2,
        3072
      );
      let txt = normalizeAiQuotes(g.text ?? '');
      let j = extractJsonFromText(txt);
      if ((!j || g.finishReason === 'MAX_TOKENS') && args.content.length < 8000) {
        const g2 = await callGemini(
          promptFill +
            strictJsonOnly +
            '- improved_text إلزامي ويشمل كامل النص المعاد صياغته دون اختصار يلغي الفقرات.\n',
          2,
          4096
        );
        txt = normalizeAiQuotes(g2.text ?? '');
        j = extractJsonFromText(txt);
      }
      if (j) {
        try {
          const o = JSON.parse(normalizeAiQuotes(j));
          const im = typeof o.improved_text === 'string' ? o.improved_text.trim() : '';
          if (im.length >= 15) return im;
        } catch {
          /* ignore */
        }
      }
      return args.content.trim();
    };

    if (mode === 'rewrite_feedback') {
      if (!content || !targetText) throw new Error('Missing content or targetText for feedback mode');

      const prompt = `أنت معلم كتابة إبداعية. قام الطالب بمحاولة إعادة صياغة نص لتحسينه.
النص الأصلي: "${originalText || 'غير متوفر'}"
النص المحسن المستهدف (النموذج): "${targetText}"
محاولة الطالب: "${content}"

المطلوب:
1. قدم ملاحظة قصيرة ودقيقة (لا تتجاوز 40 كلمة) حول مدى اقتراب محاولة الطالب من الجودة المستهدفة.
2. اذكر نقطة قوة واحدة ونقطة للتحسين.
3. كن مشجعًا وإيجابيًا.

الرد بصيغة JSON (حقل feedback نص واحد فقط وليس كائناً ولا قائمة):
{
  "feedback": "الملاحظات هنا في فقرة واحدة"
}`;

      const strict = `\n\nقواعد إخراج صارمة:\n- أعد JSON فقط بدون أي Markdown.\n- لا تستخدم \`\`\`.\n- لا تضف أي نص خارج JSON.\n- feedback يجب أن يكون string عربي واحد فقط؛ ممنوع وضع feedback ككائن أو مفاتيح مثل overall_ أو summary.\n- أنهِ feedback جملة كاملة بنقطة أو علامة استفهام؛ لا تترك جملة غير مكتملة.\n`;

      const fallback = buildFallbackRewriteFeedback();

      const resolveFeedbackJson = (raw: string | null): { feedback: string; ok: boolean } => {
        if (!raw) return { ...fallback, ok: false };
        const normalized = normalizeAiQuotes(raw);
        try {
          const o = JSON.parse(normalized);
          const fb = feedbackValueToString(o?.feedback);
          if (fb) return { feedback: fb, ok: true };
        } catch {
          /* parse failed */
        }
        const partial = extractFeedbackFromBrokenJson(normalized);
        // Partial = model/API truncation — not acceptable as final; caller will retry or fallback
        if (partial) return { feedback: partial, ok: false };
        return { ...fallback, ok: false };
      };

      /** Only ok when JSON.parse succeeds; scraped text alone is never final. */
      const resolveFromModelText = (full: string, extracted: string | null): { feedback: string; ok: boolean } => {
        const fromExtracted = resolveFeedbackJson(extracted);
        if (fromExtracted.ok) return fromExtracted;
        const fromFull = extractFeedbackFromBrokenJson(normalizeAiQuotes(full));
        if (fromFull) return { feedback: fromFull, ok: false };
        return fromExtracted;
      };

      let lastFinish: string | undefined;
      let g1 = await callGemini(prompt + strict, 1, 2048);
      lastFinish = g1.finishReason;
      let responseText = g1.text ?? '';
      if (!responseText) throw new Error('No response from Gemini');
      responseText = normalizeAiQuotes(responseText);

      let jsonStr = extractJsonFromText(responseText);
      if (!jsonStr || lastFinish === 'MAX_TOKENS') {
        const g2 = await callGemini(prompt + strict + '\nأعد كائن JSON صغير فقط.', 2, 1024);
        lastFinish = g2.finishReason;
        responseText = normalizeAiQuotes(g2.text ?? '');
        if (!responseText) throw new Error('No response from Gemini');
        jsonStr = extractJsonFromText(responseText);
      }

      let { feedback, ok } = resolveFromModelText(responseText, jsonStr);

      if (!ok || lastFinish === 'MAX_TOKENS') {
        const tinyPrompt = `أجب بسطر واحد JSON فقط بدون Markdown. feedback نص واحد فقط (ليس كائناً): {"feedback":"ملاحظة قصيرة"}
حد أقصى 25 كلمة داخل feedback. أنهِ الجملة بنقطة. لا تقطع النص.
الأصل: ${(originalText || '').slice(0, 120)}
المستهدف: ${targetText.slice(0, 120)}
محاولة الطالب: ${content.slice(0, 280)}`;
        const g3 = await callGemini(tinyPrompt + strict, 2, 1024);
        lastFinish = g3.finishReason;
        const r3 = normalizeAiQuotes(g3.text ?? '');
        const j3 = r3 ? extractJsonFromText(r3) : null;
        const third = r3 ? resolveFromModelText(r3, j3) : { ...fallback, ok: false };
        if (third.ok) {
          feedback = third.feedback;
          ok = true;
        }
      }

      if (!ok) {
        feedback = fallback.feedback;
      }

      console.log(
        JSON.stringify({
          debugSession: 'a04600',
          branch: 'rewrite_feedback',
          event: 'ok',
          feedbackLen: feedback.length,
        })
      );

      return new Response(JSON.stringify({ feedback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!content || !writingId) throw new Error('Missing required fields');

    const prompt = `أنت خبير في تحليل الكتابة الإبداعية باللغة العربية. مهمتك تقييم نص إبداعي كتبه متعلم.

قيّم النص التالي من حيث:
1. دقة الكلمات (word_precision): صحة استخدام المفردات والتراكيب (0-10)
2. عمق المشاعر (feeling_depth): القدرة على التعبير عن المشاعر والأحاسيس (0-10)
3. الذات اللغوية (linguistic_identity): تميز الأسلوب وتطور صوت الكاتب (0-10)

أسلوب الكاتب: ${style || 'غير محدد'}

عنوان النص: ${title}

النص:
${content}

أجب بتنسيق JSON فقط بهذا الشكل بدون أي نص إضافي:
{
  "word_precision": <رقم من 0 إلى 10>,
  "feeling_depth": <رقم من 0 إلى 10>,
  "linguistic_identity": <رقم من 0 إلى 10>,
  "feedback": "<ملاحظات تفصيلية بالعربية عن نقاط القوة والضعف>",
  "suggestions": "<اقتراحات للتحسين بالعربية>",
  "improved_text": "<النص كاملًا بعد تطبيق التحسينات والتصحيحات اللغوية والأسلوبية، مع الحفاظ على صوت الكاتب الأصلي>"
}`;

    const strict =
      strictJsonOnly +
      `- حقل improved_text إلزامي دائماً: اكتب النص المعاد صياغته كاملاً (نفس طول النص الأصلي تقريباً)، حتى لو كان التقييم مرتفعاً؛ طبّق التحسينات الطفيفة صراحة ولا تترك الحقل فارغاً ولا تكتفي بجملة مثل «النص جيد».\n`;

    let gEval = await callGemini(prompt + strict, 1, 3072);
    let responseText = gEval.text;
    if (!responseText) throw new Error('No response from Gemini');

    let jsonStr = extractJsonFromText(responseText);
    if (!jsonStr || gEval.finishReason === 'MAX_TOKENS') {
      const gEval2 = await callGemini(prompt + strict + '\nأعد نفس الكائن لكن بإيجاز.', 2, 2048);
      responseText = gEval2.text;
      if (!responseText) throw new Error('No response from Gemini');
      jsonStr = extractJsonFromText(responseText);
    }

    let evaluation: any = null;
    if (jsonStr) {
      try {
        evaluation = JSON.parse(jsonStr);
      } catch {
        evaluation = null;
      }
    }

    // If the model output was truncated/non-JSON, fall back to a safe heuristic evaluation
    if (!evaluation) {
      evaluation = buildFallbackEvaluation({ title, content, style });
    }

    const cTrim = content.trim();
    const fb0 = String(evaluation.feedback ?? '').trim() || 'راعِ الوضوح والسلاسة اللغوية.';
    const sg0 = String(evaluation.suggestions ?? '').trim() || 'حسّن الصياغة مع الإبقاء على المعنى.';
    let imp0 = typeof evaluation.improved_text === 'string' ? evaluation.improved_text.trim() : '';

    const minImprovedLen = Math.max(
      40,
      Math.min(Math.floor(cTrim.length * 0.28), 4000)
    );
    const tooShortOrMissing =
      !imp0 || imp0.length < minImprovedLen || imp0 === fb0 || imp0 === sg0;

    if (tooShortOrMissing && cTrim.length > 0) {
      imp0 = await ensureImprovedTextSample({
        content,
        title,
        style,
        feedback: fb0,
        suggestions: sg0,
      });
      evaluation.improved_text = imp0;
    } else {
      evaluation.improved_text = imp0 || cTrim;
    }

    const { data: evalData, error: evalError } = await supabaseAdmin
      .from('writing_evaluations')
      .insert({
        writing_id: writingId,
        word_precision: Math.min(10, Math.max(0, Number(evaluation.word_precision))),
        feeling_depth: Math.min(10, Math.max(0, Number(evaluation.feeling_depth))),
        linguistic_identity: Math.min(10, Math.max(0, Number(evaluation.linguistic_identity))),
        feedback: evaluation.feedback,
        suggestions: evaluation.suggestions,
        improved_text: evaluation.improved_text ?? null,
      })
      .select()
      .single();

    if (evalError) throw evalError;

    return new Response(JSON.stringify(evalData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(
      JSON.stringify({
        debugSession: 'a04600',
        branch: 'catch',
        event: 'error',
        message: msg,
      })
    );
    console.error('analyze-writing error:', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
