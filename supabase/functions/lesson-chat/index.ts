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

قواعد مهمة:
1. أجب بالعربية الفصحى الواضحة والبسيطة.
2. كن ودودًا ومشجعًا.
3. إذا سألك الطالب سؤالًا خارج نطاق الدرس، أجبه بلطف ثم وجهه للعودة لمحتوى الدرس.
4. قدم أمثلة عملية عندما يكون ذلك مناسبًا.
5. اجعل إجاباتك مختصرة ومركزة (لا تتجاوز 200 كلمة).
6. استخدم الرموز التعبيرية باعتدال لجعل المحادثة أكثر حيوية.`

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

        // Add the current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
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
                        maxOutputTokens: 500,
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
