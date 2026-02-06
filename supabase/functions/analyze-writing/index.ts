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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { title, content, style, writingId } = await req.json();
    if (!content || !writingId) throw new Error('Missing required fields');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `أنت خبير في تحليل الكتابة الإبداعية باللغة العربية. مهمتك تقييم نص إبداعي كتبه متعلم غير ناطق بالعربية.

قيّم النص من حيث:
1. دقة الكلمات (word_precision): صحة استخدام المفردات والتراكيب (0-10)
2. عمق المشاعر (feeling_depth): القدرة على التعبير عن المشاعر والأحاسيس (0-10)
3. الهوية اللغوية (linguistic_identity): تميز الأسلوب وتطور صوت الكاتب (0-10)

أسلوب الكاتب: ${style || 'غير محدد'}
قدم تقييمًا عادلًا ومشجعًا مع اقتراحات عملية. اكتب بالعربية.`
          },
          { role: 'user', content: `عنوان: ${title}\n\nالنص:\n${content}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'evaluate_writing',
            description: 'تقييم النص الإبداعي العربي',
            parameters: {
              type: 'object',
              properties: {
                word_precision: { type: 'number', description: 'دقة الكلمات 0-10' },
                feeling_depth: { type: 'number', description: 'عمق المشاعر 0-10' },
                linguistic_identity: { type: 'number', description: 'الهوية اللغوية 0-10' },
                feedback: { type: 'string', description: 'ملاحظات تفصيلية بالعربية' },
                suggestions: { type: 'string', description: 'اقتراحات للتحسين بالعربية' },
              },
              required: ['word_precision', 'feeling_depth', 'linguistic_identity', 'feedback', 'suggestions'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'evaluate_writing' } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز حد الطلبات، يرجى المحاولة لاحقًا' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'يرجى إضافة رصيد لمتابعة استخدام الذكاء الاصطناعي' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No evaluation from AI');

    const evaluation = JSON.parse(toolCall.function.arguments);

    const { data: evalData, error: evalError } = await supabaseAdmin
      .from('writing_evaluations')
      .insert({
        writing_id: writingId,
        word_precision: Math.min(10, Math.max(0, evaluation.word_precision)),
        feeling_depth: Math.min(10, Math.max(0, evaluation.feeling_depth)),
        linguistic_identity: Math.min(10, Math.max(0, evaluation.linguistic_identity)),
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
