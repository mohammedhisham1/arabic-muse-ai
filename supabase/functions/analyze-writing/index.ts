import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { title, content, style, writingId } = await req.json();
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
  "feedback": "<ملاحظات تفصيلية بالعربية>",
  "suggestions": "<اقتراحات للتحسين بالعربية>"
}`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز حد الطلبات، يرجى المحاولة لاحقًا' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Gemini API error: ${aiResponse.status} - ${errText}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) throw new Error('No response from Gemini');

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const evaluation = JSON.parse(jsonStr.trim());

    const { data: evalData, error: evalError } = await supabaseAdmin
      .from('writing_evaluations')
      .insert({
        writing_id: writingId,
        word_precision: Math.min(10, Math.max(0, Number(evaluation.word_precision))),
        feeling_depth: Math.min(10, Math.max(0, Number(evaluation.feeling_depth))),
        linguistic_identity: Math.min(10, Math.max(0, Number(evaluation.linguistic_identity))),
        feedback: evaluation.feedback,
        suggestions: evaluation.suggestions,
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
