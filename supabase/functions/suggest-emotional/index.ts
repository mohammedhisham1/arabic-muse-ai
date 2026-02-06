import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { content, style } = await req.json();
    if (!content || content.trim().length < 10) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            content: `أنت مساعد لغوي متخصص في الكتابة الإبداعية العربية. مهمتك تقديم اقتراحات عاطفية ولغوية قصيرة لتحسين النص الذي يكتبه المتعلم.

أسلوب الكاتب: ${style || 'غير محدد'}

قدم 3-4 اقتراحات قصيرة وعملية تشمل:
- تعبيرات عاطفية بديلة أو محسنة
- صور بلاغية مناسبة للسياق
- كلمات أدق للتعبير عن المشاعر
- تحسينات أسلوبية

كن موجزًا ومشجعًا.`
          },
          { role: 'user', content: `النص الحالي:\n${content}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'provide_suggestions',
            description: 'تقديم اقتراحات لغوية عاطفية',
            parameters: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['emotion', 'imagery', 'style', 'vocabulary'], description: 'نوع الاقتراح' },
                      original: { type: 'string', description: 'الجزء الأصلي من النص (إن وجد)' },
                      suggestion: { type: 'string', description: 'الاقتراح البديل أو الإضافة' },
                      reason: { type: 'string', description: 'سبب الاقتراح بإيجاز' },
                    },
                    required: ['type', 'suggestion', 'reason'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['suggestions'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'provide_suggestions' } },
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
    if (!toolCall) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('suggest-emotional error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
