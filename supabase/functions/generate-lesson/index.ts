
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const extractJsonFromText = (text: string): string | null => {
    if (!text) return null
    const raw = String(text).trim()

    // 1) Prefer fenced code blocks: ```json ... ```
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (fenced?.[1]) {
        const candidate = fenced[1].trim()
        if (candidate.startsWith('{') && candidate.endsWith('}')) return candidate
    }

    // 2) Try to locate the first balanced JSON object in the text
    const startObj = raw.indexOf('{')
    const startArr = raw.indexOf('[')
    const start = startObj === -1 ? startArr : (startArr === -1 ? startObj : Math.min(startObj, startArr))
    if (start === -1) return null

    let depth = 0
    let inString = false
    let escape = false
    const openCh = raw[start]
    const closeCh = openCh === '[' ? ']' : '}'

    for (let i = start; i < raw.length; i++) {
        const ch = raw[i]

        if (inString) {
            if (escape) {
                escape = false
                continue
            }
            if (ch === '\\') {
                escape = true
                continue
            }
            if (ch === '"') {
                inString = false
            }
            continue
        }

        if (ch === '"') {
            inString = true
            continue
        }

        if (ch === openCh) depth++
        if (ch === closeCh) depth--

        if (depth === 0) {
            const candidate = raw.slice(start, i + 1).trim()
            if (
                (candidate.startsWith('{') && candidate.endsWith('}')) ||
                (candidate.startsWith('[') && candidate.endsWith(']'))
            ) return candidate
            return null
        }
    }

    return null
}

const buildFallbackLesson = (args: { style?: string; lessonIndex: number; topicTitle: string; topicFocus: string }) => {
    const { style, lessonIndex, topicTitle, topicFocus } = args
    const styleLabel = style ? `(${style})` : ''

    const title = `الدرس ${lessonIndex + 1}: ${topicTitle}`
    const objectives = [
        'فهم الفكرة الأساسية للدرس وتحديد عناصرها الرئيسة.',
        'تطبيق مفهوم واحد على الأقل في كتابة قصيرة.',
        'تمييز مثال صحيح من مثال يحتاج تحسينًا.',
    ]

    const introduction =
        `هذا درس موجّه لتطوير مهاراتك في الكتابة الإبداعية ${styleLabel}. ` +
        `سنركّز على: ${topicFocus}`

    const explanation =
        `الفكرة المحورية في هذا الدرس هي: ${topicTitle}.\n\n` +
        `أداة عملية سريعة:\n` +
        `- اكتب سطرًا يعرّف هدف المشهد.\n` +
        `- اختر كلمتين مفتاحيتين تعبّران عن شعور الشخصية.\n` +
        `- اكتب 4–6 جمل تجمع بين الوصف والفعل.\n\n` +
        `ملاحظة: حافظ على البساطة والوضوح، ثم حسّن الإيقاع واللغة بعد اكتمال المسودة.`

    const examples = [
        'مثال (موجز): "قالت بصوت خافت، بينما كانت يداها ترتجفان: لم أعد أحتمل الصمت."',
        'مثال (تطبيقي): "تقدّم خطوة ثم توقّف؛ كان يعرف أن كلمة واحدة قد تغيّر كل شيء."',
    ]

    const key_takeaway = 'اكتب أولًا بحرية، ثم عدّل بوعي: الدقة تأتي بعد الاكتمال.'

    const quiz = [
        {
            question: 'ما الهدف الأهم من استخدام أدوات عملية قبل الكتابة؟',
            options: ['تزيين النص فقط', 'تثبيت فكرة المشهد وتوجيه الكتابة', 'تقليل عدد الجمل', 'إلغاء التخطيط تمامًا'],
            correctIndex: 1,
            explanation: 'الأدوات العملية تساعد على وضوح الهدف وبناء نص متماسك.',
        },
        {
            question: 'أي عبارة أقرب لأسلوب الكتابة الإبداعية؟',
            options: ['حدثت الواقعة الساعة الثالثة', 'أُغلق الباب ثم انتهى الأمر', 'ارتجف الضوء فوق الجدار كأنه يتنفس', 'بلغت درجة الحرارة 20'],
            correctIndex: 2,
            explanation: 'الصور الفنية والإيحاء من سمات الإبداع.',
        },
        {
            question: 'أفضل ترتيب للعمل عادة هو:',
            options: ['التدقيق ثم الكتابة', 'الكتابة ثم التعديل', 'عدم الكتابة', 'الحفظ قبل الفهم'],
            correctIndex: 1,
            explanation: 'المسودة أولًا ثم التحسين خطوة بخطوة.',
        },
    ]

    return { title, objectives, content: { introduction, explanation, examples, key_takeaway }, quiz }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const { userId, style, lessonIndex } = await req.json()

        // 1. Check if lesson already exists
        const { data: existingLesson } = await supabase
            .from('generated_lessons')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_index', lessonIndex)
            .maybeSingle()

        if (existingLesson) {
            console.log('Returning cached lesson', lessonIndex)
            return new Response(JSON.stringify(existingLesson), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Determine lesson topic based on index
        const lessonTopics = [
            {
                title: "مفهوم السرد الإبداعي",
                focus: "ما هو السرد الإبداعي، لماذا نحكي القصص، عناصر القصة الأساسية، وكيف يختلف السرد الإبداعي عن الكتابة العادية.",
            },
            {
                title: "بناء الشخصيات",
                focus: "الدوافع النفسية، التطور عبر الأحداث، خلق شخصيات ثلاثية الأبعاد.",
            },
            {
                title: "الحبكة والصراع",
                focus: "أنواع الصراع (داخلي/خارجي)، منحنيات السرد، نقطة الذروة.",
            },
            {
                title: "المكان والزمان (الإطار السردي)",
                focus: "كيف يؤثر المكان على الشخصيات، استخدام الحواس في الوصف المكاني و الزمني.",
            },
            {
                title: "الحوار والسرد",
                focus: "كتابة حوار واقعي، الموازنة بين السرد والحوار، الأصوات المتعددة.",
            },
            {
                title: "الخيال والتصوير",
                focus: "استخدام اللغة المجازية، الاستعارة، التشبيه، بناء الصور الذهنية.",
            },
            {
                title: "نهاية القصة",
                focus: "كيفية كتابة نهاية مؤثرة، النهايات المفتوحة والمغلقة، تجنب الكليشيهات.",
            }
        ];

        if (lessonIndex >= lessonTopics.length) {
            return new Response(JSON.stringify({ error: 'لقد أكملت جميع الدروس المتاحة! انتقل إلى الكتابة الإبداعية.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const topic = lessonTopics[lessonIndex];

        const buildPrompt = (mode: 'normal' | 'compact') => `
      أنت معلم خبير في الكتابة الإبداعية ومصمم مناهج دراسية.
      الطالب لديه أسلوب كتابي هو: "${style}".
      موضوع الدرس هو: "${topic.title}".
      التركيز الأساسي للدرس: "${topic.focus}".
      رقم الدرس: ${lessonIndex + 1}.

      المهمة:
      أنشئ درسًا تعليميًا كاملًا ومفصلًا بصيغة JSON. يجب أن يكون الدرس مصممًا خصيصًا للطالب بناءً على أسلوبه ("${style}").

      هيكل JSON المطلوب:
      {
        "title": "عنوان الدرس الإبداعي",
        "objectives": ["هدف 1", "هدف 2", "هدف 3"],
        "content": {
          "introduction": "مقدمة جذابة تشرح المفهوم",
          "explanation": "شرح مفصل للنقاط الأساسية ومفاهيم الدرس",
          "examples": ["مثال 1 يوضح المفهوم", "مثال 2 تطبيقي"],
          "key_takeaway": "نصيحة قصيرة وذهبية"
        },
        "quiz": [
          {
            "question": "سؤال اختبار من متعدد 1",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correctIndex": 0,
            "explanation": "شرح لماذا هذا الخيار صحيح"
          },
          {
            "question": "سؤال اختبار من متعدد 2",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correctIndex": 1,
            "explanation": "شرح لماذا هذا الخيار صحيح"
          },
           {
            "question": "سؤال اختبار من متعدد 3",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correctIndex": 2,
            "explanation": "شرح لماذا هذا الخيار صحيح"
          }
        ]
      }

      قواعد إخراج صارمة:
      - أعد JSON صالح فقط (بدون أي نص إضافي، وبدون markdown).
      - لا تستخدم ** أو تنسيق عناوين داخل النص.
      - تأكد أن كل الأقواس والاقتباسات مغلقة وأن الحقول كلها موجودة.
      ${mode === 'compact'
                ? `- اجعل المحتوى مختصرًا جدًا لتجنب القطع:
        introduction <= 350 حرف
        explanation <= 900 حرف
        كل مثال <= 140 حرف
        key_takeaway <= 120 حرف`
                : ''}
      اللغة: العربية الفصحى الجميلة والواضحة.
    `

        console.log('Generating lesson via Gemini for style:', style, 'topic:', topic.title);

        const callGemini = async (promptText: string, attempt: 1 | 2) => {
            const aiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                        generationConfig: {
                            temperature: attempt === 1 ? 0.4 : 0.2,
                            maxOutputTokens: attempt === 1 ? 4000 : 2500,
                        },
                    }),
                }
            );

            if (!aiResponse.ok) {
                const errorText = await aiResponse.text();
                throw new Error(`Gemini API error: ${aiResponse.status} - ${errorText}`);
            }

            const aiData = await aiResponse.json();
            const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            return responseText as string | undefined;
        }

        let responseText = await callGemini(buildPrompt('normal'), 1);
        if (!responseText) throw new Error('No response from Gemini');

        let jsonString = extractJsonFromText(responseText);
        if (!jsonString) {
            // Retry with a compact prompt to reduce truncation likelihood
            responseText = await callGemini(buildPrompt('compact'), 2);
            if (!responseText) throw new Error('No response from Gemini');
            jsonString = extractJsonFromText(responseText);
        }

        let generatedLesson: any;
        if (jsonString) {
            try {
                generatedLesson = JSON.parse(jsonString);
            } catch (e) {
                console.error('Failed to parse Gemini JSON response:', jsonString);
                generatedLesson = null
            }
        }

        // Basic shape validation; fallback if invalid or missing
        const isValidShape =
            generatedLesson?.title &&
            Array.isArray(generatedLesson?.objectives) &&
            generatedLesson?.content &&
            Array.isArray(generatedLesson?.content?.examples) &&
            typeof generatedLesson?.content?.introduction === 'string' &&
            typeof generatedLesson?.content?.explanation === 'string' &&
            typeof generatedLesson?.content?.key_takeaway === 'string' &&
            Array.isArray(generatedLesson?.quiz)

        if (!isValidShape) {
            console.error('Invalid JSON/shape from AI, using fallback', {
                lessonIndex,
                topic: topic.title,
                raw: (responseText || '').slice(0, 500),
            })
            generatedLesson = buildFallbackLesson({
                style,
                lessonIndex,
                topicTitle: topic.title,
                topicFocus: topic.focus,
            })
        }

        // 4. Store generated lesson in DB
        const { data: insertedLesson, error: insertError } = await supabase
            .from('generated_lessons')
            .upsert({
                user_id: userId,
                lesson_index: lessonIndex,
                title: generatedLesson.title,
                objectives: generatedLesson.objectives,
                content: generatedLesson.content,
                quiz: generatedLesson.quiz,
            }, {
                onConflict: 'user_id, lesson_index'
            })
            .select()
            .single()

        if (insertError) {
            console.error('DB Insert Error:', insertError);
            throw insertError;
        }

        return new Response(JSON.stringify(insertedLesson), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, // Return 500 so client knows to retry or handle error
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
