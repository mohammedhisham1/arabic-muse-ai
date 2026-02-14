
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

        // 3. Generate content with Gemini
        const prompt = `
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

      تأكد من أن الرد هو JSON صالح فقط، وبدون أي نصوص إضافية أو علامات markdown ( \`\`\`json ... \`\`\` ).
      اللغة: العربية الفصحى الجميلة والواضحة.
    `

        console.log('Generating lesson via Gemini for style:', style, 'topic:', topic.title);

        const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4000,
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

        if (!responseText) throw new Error('No response from Gemini');

        // Clean up JSON response
        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        let generatedLesson;
        try {
            generatedLesson = JSON.parse(jsonString);
        } catch (e) {
            console.error('Failed to parse Gemini JSON response:', jsonString);
            throw new Error('Invalid JSON from AI');
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
