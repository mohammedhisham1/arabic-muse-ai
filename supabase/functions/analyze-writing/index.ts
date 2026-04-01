import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    : null;

  return {
    word_precision,
    feeling_depth,
    linguistic_identity,
    feedback,
    suggestions,
    improved_text,
  };
};

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

    const callGemini = async (prompt: string, attempt: 1 | 2, maxOutputTokens: number) => {
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
      return aiData.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
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

الرد بصيغة JSON:
{
  "feedback": "الملاحظات هنا"
}`;

      const strict = `\n\nقواعد إخراج صارمة:\n- أعد JSON فقط بدون أي Markdown.\n- لا تستخدم \`\`\`.\n- لا تضف أي نص خارج JSON.\n`;

      let responseText = await callGemini(prompt + strict, 1, 500);
      if (!responseText) throw new Error('No response from Gemini');

      let jsonStr = extractJsonFromText(responseText);
      if (!jsonStr) {
        // retry stricter and shorter
        responseText = await callGemini(prompt + strict + '\nأعد كائن JSON صغير فقط.', 2, 300);
        if (!responseText) throw new Error('No response from Gemini');
        jsonStr = extractJsonFromText(responseText);
      }

      if (!responseText) throw new Error('No response from Gemini');
      if (!jsonStr) {
        return new Response(JSON.stringify({ error: 'Invalid JSON from AI', raw: responseText.slice(0, 2000) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let result: any;
      try {
        result = JSON.parse(jsonStr);
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON from AI', raw: jsonStr.slice(0, 2000) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!content || !writingId) throw new Error('Missing required fields');

    const prompt = `أنت خبير في تحليل الكتابة الإبداعية باللغة العربية. مهمتك تقييم نص إبداعي كتبه متعلم.

قيّم النص التالي من حيث:
1. دقة الكلمات (word_precision): صحة استخدام المفردات والتراكيب (0-10)
2. عمق المشاعر (feeling_depth): القدرة على التعبير عن المشاعر والأحاسيس (0-10)
3. الهوية اللغوية (linguistic_identity): تميز الأسلوب وتطور صوت الكاتب (0-10)

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

    const strict = `\n\nقواعد إخراج صارمة:\n- أعد JSON فقط بدون أي Markdown.\n- لا تستخدم \`\`\`.\n- لا تضف أي نص خارج JSON.\n`;

    let responseText = await callGemini(prompt + strict, 1, 2048);
    if (!responseText) throw new Error('No response from Gemini');

    let jsonStr = extractJsonFromText(responseText);
    if (!jsonStr) {
      // Retry with a compact instruction to avoid truncation/formatting
      responseText = await callGemini(prompt + strict + '\nأعد نفس الكائن لكن بإيجاز.', 2, 1200);
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

    const { data: evalData, error: evalError } = await supabaseAdmin
      .from('writing_evaluations')
      .insert({
        writing_id: writingId,
        word_precision: Math.min(10, Math.max(0, Number(evaluation.word_precision))),
        feeling_depth: Math.min(10, Math.max(0, Number(evaluation.feeling_depth))),
        linguistic_identity: Math.min(10, Math.max(0, Number(evaluation.linguistic_identity))),
        feedback: evaluation.feedback,
        suggestions: evaluation.suggestions,
        improved_text: evaluation.improved_text || null,
      })
      .select()
      .single();

    if (evalError) throw evalError;

    return new Response(JSON.stringify(evalData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('analyze-writing error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
