import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured')

        const { message, lessonTitle, lessonContent, chatHistory } = await req.json()

        if (!message) throw new Error('Missing message')

        // Build conversation context
        const systemPrompt = `أنت مساعد تعليمي ذكي ومتخصص في الكتابة الإبداعية باللغة العربية.
أنت الآن تساعد طالبًا يدرس درسًا بعنوان: "${lessonTitle || 'درس في الكتابة الإبداعية'}".

${lessonContent ? `محتوى الدرس:
- المقدمة: ${lessonContent.introduction || ''}
- الشرح: ${lessonContent.explanation || ''}
- أمثلة: ${Array.isArray(lessonContent.examples) ? lessonContent.examples.join(' | ') : ''}
- الخلاصة: ${lessonContent.key_takeaway || ''}` : ''}

معلومة مهمة جدًا: هذا الدرس يحتوي بالفعل على اختبار قصير (quiz) جاهز. الاختبار موجود ومتاح للطالب. لا تنفِ وجود الاختبار أبدًا.

قواعد مهمة:
1. أجب بالعربية الفصحى الواضحة والبسيطة.
2. كن ودودًا ومشجعًا.
3. إذا سألك الطالب سؤالًا خارج نطاق الدرس، أجبه بلطف ثم وجهه للعودة لمحتوى الدرس.
4. قدم أمثلة عملية عندما يكون ذلك مناسبًا.
5. اجعل إجاباتك مختصرة ومركزة (لا تتجاوز 200 كلمة).
6. استخدم الرموز التعبيرية باعتدال لجعل المحادثة أكثر حيوية.

قواعد خاصة بالأسئلة والاختبارات:
7. إذا طلب الطالب الذهاب إلى اختبار الدرس أو أسئلة الدرس أو الاختبار القصير (مثل: "أريد الاختبار"، "خذني للأسئلة"، "أين الاختبار"، "ابدأ الاختبار"، "خذني لاختبار الدرس"، "الأسئلة"، "الاختبار")، يجب عليك دائمًا:
   - تأكيد أن الاختبار موجود ومتاح
   - إضافة العلامة [GOTO_ASSESSMENT] في نهاية ردك حتمًا
   مثال: "بالطبع! اختبار الدرس جاهز لك. اضغط على الزر أدناه للانتقال إليه. 📝 [GOTO_ASSESSMENT]"
   مهم: لا تقل أبدًا أنه لا يوجد اختبار. الاختبار موجود دائمًا.
8. إذا طلب الطالب أسئلة جديدة أو إضافية أو تدريبية (مثل: "أعطني أسئلة جديدة"، "أريد أسئلة إضافية"، "اختبرني"، "أسئلة تدريبية"، "أريد التدرب")، قم بتوليد 3 أسئلة اختيار من متعدد جديدة تتعلق بمحتوى الدرس وضعها بصيغة JSON بين علامتي [QUIZ_START] و [QUIZ_END]. يجب أن يكون JSON مصفوفة من الأسئلة بالشكل التالي:
[QUIZ_START]
[{"question":"نص السؤال","options":["خيار 1","خيار 2","خيار 3","خيار 4"],"correctIndex":0,"explanation":"شرح الإجابة الصحيحة"}]
[QUIZ_END]
اكتب نصًا تشجيعيًا قصيرًا قبل الأسئلة. لا تكرر أسئلة الاختبار الأصلي. اجعل الأسئلة الجديدة متنوعة ومفيدة.

قواعد *صارمة جداً* لتعديل محتوى الدرس:
9. إذا طلب الطالب إعادة توليد الدرس بالكامل (مثل: "أعد الدرس"، "غير الدرس"، "أريد درسًا جديدًا"):
   - لا تكتب محتوى الدرس الجديد في المحادثة أبدًا.
   - فقط أضف جملة قصيرة: "جاري إعادة بناء الدرس بالكامل...".
   - أضف العلامة [REGENERATE_FULL_LESSON] في نهاية النص لكي يتم تحديث الصفحة فعليًا.

10. إذا طلب الطالب تعديل جزء معين (مثل: "بسط الشرح"، "غير الأمثلة"، "أعد صياغة المقدمة"):
   - قم بتوليد المحتوى الجديد وضعه في كائن JSON فقط.
   - لا تكتب شرحًا مطولًا أو نص المحتوى المعدل في المحادثة. فقط قل: "تم تحديث [الجزء] في الصفحة.".
   - ضع التعديلات في JSON بين [JSON_START] و [JSON_END].
   - الحقول المسموح بها: introduction, explanation, examples (مصفوفة), key_takeaway.
   - أضف العلامة [UPDATE_PART] في النهاية لتطبيق التعديل.
   مثال صحيح: "تم تحديث الشرح في الصفحة.
   [JSON_START]
   {"explanation": "النص الجديد للشرح المختصر..."}
   [JSON_END]
   [UPDATE_PART]"`

        // Build messages array for multi-turn conversation
        const contents = []

        // Add system context as the first user message
        contents.push({
            role: 'user',
            parts: [{ text: systemPrompt + '\n\nمرحبًا، أنا طالب أدرس هذا الدرس.' }]
        })
        contents.push({
            role: 'model',
            parts: [{ text: 'أهلًا وسهلًا! 😊 أنا هنا لمساعدتك في فهم الدرس. اسألني أي سؤال يخطر ببالك!' }]
        })

        // Add chat history
        if (Array.isArray(chatHistory)) {
            for (const msg of chatHistory) {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                })
            }
        }

        // Add the current message with reinforcement instruction
        const reinforcement = `
IMPORTANT SYSTEM INSTRUCTION (DO NOT IGNORE):
If the user is asking to regenerate or update the lesson content:
1. DO NOT write the new content in this chat. Writing the lesson text here is FORBIDDEN.
2. ONLY output the signal [REGENERATE_FULL_LESSON] or [UPDATE_PART] with the JSON block.
3. You must use the tools to update the page. Do not just talk about it.
`;
        contents.push({
            role: 'user',
            parts: [{ text: message + "\n\n" + reinforcement }]
        })

        const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 1500,
                    },
                }),
            }
        )

        if (!aiResponse.ok) {
            const errText = await aiResponse.text()
            console.error('Gemini API error:', aiResponse.status, errText)
            if (aiResponse.status === 429) {
                return new Response(
                    JSON.stringify({ reply: 'عذرًا، تم تجاوز حد الطلبات. حاول مرة أخرى بعد قليل. ⏳' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            throw new Error(`Gemini API error: ${aiResponse.status}`)
        }

        const aiData = await aiResponse.json()
        const reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text

        if (!reply) throw new Error('No response from Gemini')

        return new Response(
            JSON.stringify({ reply }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('lesson-chat error:', error)
        return new Response(
            JSON.stringify({ reply: 'عذرًا، حدث خطأ. حاول مرة أخرى. 🙏' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
