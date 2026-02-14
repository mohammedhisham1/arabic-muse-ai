import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot, User, ClipboardCheck, CheckCircle2, XCircle, ArrowUpRightFromSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { QuizQuestion } from '@/types/writer';
import logo from '@/assets/qalam_logo_1771102518872.jpg';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    /** If present, show a "go to assessment" button */
    gotoAssessment?: boolean;
    /** If present, render inline quiz questions */
    inlineQuiz?: QuizQuestion[];
}

interface FloatingLessonChatProps {
    lessonTitle: string;
    lessonIndex: number;
    lessonContent: {
        introduction?: string;
        explanation?: string;
        examples?: string[];
        key_takeaway?: string;
    } | null;
    onRegenerateLesson?: () => void;
    onUpdateLesson?: (partialLesson: any) => void;
}

const DEFAULT_GREETING: ChatMessage = { role: 'assistant', text: 'أهلًا! 😊 أنا مساعدك في هذا الدرس. اسألني أي شيء!' };

const getStorageKey = (lessonIndex: number) => `lesson_chat_${lessonIndex}`;

const loadMessages = (lessonIndex: number): ChatMessage[] => {
    try {
        const saved = localStorage.getItem(getStorageKey(lessonIndex));
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch { }
    return [DEFAULT_GREETING];
};

/**
 * Client-side keywords that indicate the user wants to go to the lesson quiz.
 * This is a safety net — if the AI fails to include [GOTO_ASSESSMENT], we detect
 * the intent from the user's message and force the button to appear.
 */
const ASSESSMENT_KEYWORDS = [
    'اختبار', 'الاختبار', 'اختبار الدرس', 'خذني للاختبار', 'خذني لاختبار',
    'خذني إلى الاختبار', 'خذني الى الاختبار', 'أريد الاختبار', 'ابدأ الاختبار',
    'أين الاختبار', 'الأسئلة', 'خذني للأسئلة', 'خذني إلى الأسئلة',
    'أسئلة الدرس', 'اختبر نفسي', 'أريد أن أختبر', 'quiz',
];

function userAskedForAssessment(userMessage: string): boolean {
    const normalized = userMessage.trim().toLowerCase();
    return ASSESSMENT_KEYWORDS.some(kw => normalized.includes(kw));
}



/**
 * Parse assistant reply to extract special markers:
 * - [GOTO_ASSESSMENT] => show a button to navigate to assessment
 * - [QUIZ_START]...[QUIZ_END] => parse inline quiz questions
 * - [REGENERATE_FULL_LESSON] => trigger full regeneration
 * - [UPDATE_PART] => trigger partial update with JSON payload
 */
function parseAssistantReply(reply: string): {
    text: string;
    gotoAssessment: boolean;
    inlineQuiz: QuizQuestion[] | undefined;
    regenerateLesson: boolean;
    updatePart: any | undefined;
} {
    let gotoAssessment = false;
    let inlineQuiz: QuizQuestion[] | undefined = undefined;
    let regenerateLesson = false;
    let updatePart: any | undefined = undefined;

    // Check for [GOTO_ASSESSMENT]
    if (reply.includes('[GOTO_ASSESSMENT]')) {
        gotoAssessment = true;
        reply = reply.replace(/\[GOTO_ASSESSMENT\]/g, '').trim();
    }

    // Check for [REGENERATE_FULL_LESSON]
    if (reply.includes('[REGENERATE_FULL_LESSON]')) {
        regenerateLesson = true;
        reply = reply.replace(/\[REGENERATE_FULL_LESSON\]/g, '').trim();
    }

    // Check for [UPDATE_PART] with JSON block
    if (reply.includes('[UPDATE_PART]')) {
        const jsonMatch = reply.match(/\[JSON_START\]([\s\S]*?)\[JSON_END\]/);
        if (jsonMatch) {
            try {
                updatePart = JSON.parse(jsonMatch[1].trim());
            } catch (e) {
                console.error('Failed to parse update part JSON:', e);
            }
            // Remove the JSON block from text
            reply = reply.replace(/\[JSON_START\][\s\S]*?\[JSON_END\]/, '').trim();
        }
        reply = reply.replace(/\[UPDATE_PART\]/g, '').trim();
    }

    // Check for [QUIZ_START]...[QUIZ_END]
    const quizMatch = reply.match(/\[QUIZ_START\]([\s\S]*?)\[QUIZ_END\]/);
    if (quizMatch) {
        const jsonStr = quizMatch[1].trim();
        try {
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
                inlineQuiz = parsed;
            }
        } catch (e) {
            console.error('Failed to parse inline quiz JSON:', e);
        }
        // Remove the quiz block from displayed text
        reply = reply.replace(/\[QUIZ_START\][\s\S]*?\[QUIZ_END\]/, '').trim();
    }

    return { text: reply, gotoAssessment, inlineQuiz, regenerateLesson, updatePart };
}

/** Inline quiz widget rendered inside chat */
const InlineQuizWidget = ({ questions }: { questions: QuizQuestion[] }) => {
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);

    const question = questions[currentQ];

    const handleAnswer = (idx: number) => {
        if (showResult) return;
        setSelected(idx);
        setShowResult(true);
        if (idx === question.correctIndex) setScore(prev => prev + 1);
    };

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(prev => prev + 1);
            setSelected(null);
            setShowResult(false);
        } else {
            setDone(true);
        }
    };

    if (done) {
        const percent = Math.round((score / questions.length) * 100);
        return (
            <div className="mt-2 rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
                <span className="text-2xl block mb-1">{percent >= 60 ? '🎉' : '📚'}</span>
                <p className="text-sm font-bold text-foreground">
                    {percent >= 60 ? 'أحسنت!' : 'حاول مرة أخرى'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {score} من {questions.length} إجابات صحيحة ({percent}%)
                </p>
            </div>
        );
    }

    return (
        <div className="mt-2 rounded-xl bg-muted/30 border border-border p-3 space-y-2">
            <p className="text-xs font-bold text-primary mb-1">
                سؤال {currentQ + 1} من {questions.length}
            </p>
            <p className="text-sm font-medium text-foreground leading-relaxed">{question.question}</p>
            <div className="space-y-1.5">
                {question.options.map((opt, oIdx) => {
                    let classes = 'border-border bg-background hover:border-primary/30';
                    if (showResult) {
                        if (oIdx === question.correctIndex) {
                            classes = 'border-primary bg-primary/10';
                        } else if (oIdx === selected && oIdx !== question.correctIndex) {
                            classes = 'border-destructive bg-destructive/10';
                        }
                    } else if (selected === oIdx) {
                        classes = 'border-primary/50 bg-primary/5';
                    }

                    return (
                        <button
                            key={oIdx}
                            onClick={() => handleAnswer(oIdx)}
                            disabled={showResult}
                            className={`w-full rounded-lg border ${classes} px-3 py-2 text-right text-xs transition-all flex items-center gap-2 ${!showResult ? 'cursor-pointer' : ''}`}
                        >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${showResult && oIdx === question.correctIndex
                                ? 'border-primary bg-primary text-primary-foreground'
                                : showResult && oIdx === selected
                                    ? 'border-destructive bg-destructive text-white'
                                    : 'border-border bg-muted'
                                }`}>
                                {showResult && oIdx === question.correctIndex
                                    ? <CheckCircle2 className="h-3 w-3" />
                                    : showResult && oIdx === selected && oIdx !== question.correctIndex
                                        ? <XCircle className="h-3 w-3" />
                                        : oIdx + 1}
                            </span>
                            <span className="text-foreground">{opt}</span>
                        </button>
                    );
                })}
            </div>
            {showResult && (
                <div className={`rounded-lg p-2 text-xs ${selected === question.correctIndex ? 'bg-primary/10 text-foreground' : 'bg-accent/10 text-foreground'}`}>
                    <span className="font-bold">{selected === question.correctIndex ? '✅ صحيح!' : '💡 الصحيح:'}</span>{' '}
                    {question.explanation}
                </div>
            )}
            {showResult && (
                <button
                    onClick={handleNext}
                    className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    {currentQ < questions.length - 1 ? 'السؤال التالي ←' : 'عرض النتيجة'}
                </button>
            )}
        </div>
    );
};

const FloatingLessonChat = ({ lessonTitle, lessonIndex, lessonContent, onRegenerateLesson, onUpdateLesson }: FloatingLessonChatProps) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(lessonIndex));
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Resize state
    const [size, setSize] = useState({ width: 400, height: 600 });
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startW: size.width,
            startH: size.height
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !resizeRef.current) return;

            const { startX, startY, startW, startH } = resizeRef.current;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newWidth = Math.max(320, Math.min(800, startW + deltaX));
            const newHeight = Math.max(400, Math.min(window.innerHeight - 120, startH - deltaY));

            setSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            resizeRef.current = null;
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(getStorageKey(lessonIndex), JSON.stringify(messages));
        } catch { }
    }, [messages, lessonIndex]);

    // Reset messages if lessonIndex changes (navigating between lessons)
    useEffect(() => {
        setMessages(loadMessages(lessonIndex));
    }, [lessonIndex]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            setHasUnread(false);
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const sendMessage = async (directText?: string) => {
        const trimmed = (directText || input).trim();
        if (!trimmed || loading) return;

        const userMessage: ChatMessage = { role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Prepare chat history (skip the initial greeting)
            const chatHistory = messages.slice(1).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                text: m.text
            }));

            const { data, error } = await supabase.functions.invoke('lesson-chat', {
                body: {
                    message: trimmed,
                    lessonTitle,
                    lessonContent,
                    chatHistory,
                },
            });

            if (error) throw error;

            const rawReply = data?.reply || 'عذرًا، لم أستطع الرد. حاول مرة أخرى.';
            const parsed = parseAssistantReply(rawReply);

            // Handle lesson updates/regeneration
            if (parsed.regenerateLesson && onRegenerateLesson) {
                onRegenerateLesson();
            }
            if (parsed.updatePart && onUpdateLesson) {
                onUpdateLesson(parsed.updatePart);
            }

            // Client-side safety net: if the user asked for the quiz but the AI
            // didn't include [GOTO_ASSESSMENT], force the button to appear anyway.
            const forceAssessment = !parsed.gotoAssessment && userAskedForAssessment(trimmed);

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: parsed.text,
                gotoAssessment: parsed.gotoAssessment || forceAssessment || undefined,
                inlineQuiz: parsed.inlineQuiz,
            }]);

            if (!isOpen) setHasUnread(true);
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: 'عذرًا، حدث خطأ في الاتصال. حاول مرة أخرى. 🙏'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSuggestedQuestion = (q: string) => {
        sendMessage(q);
    };

    const suggestedQuestions = [
        'اشرح لي هذا المفهوم ببساطة',
        'أعطني مثالًا إضافيًا',
        'خذني إلى اختبار الدرس',
        'أريد أسئلة تدريبية جديدة',
    ];

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                layout
                className={`fixed bottom-6 left-6 z-50 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all ${isOpen
                        ? "h-12 w-12 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "h-14 px-6 gap-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:scale-105"
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isOpen ? "إغلاق المحادثة" : "تحدث مع الذكاء الاصطناعي"}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="h-6 w-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <MessageCircle className="h-5 w-5" />
                            <span className="font-bold text-base whitespace-nowrap hidden sm:inline">تحدث مع الذكاء الاصطناعي</span>
                            <span className="font-bold text-base whitespace-nowrap sm:hidden">مساعدك</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Unread badge */}
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm border border-white animate-pulse">
                        !
                    </span>
                )}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 left-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-background/80 backdrop-blur-xl shadow-2xl"
                        style={{ width: size.width, height: size.height }}
                    >
                        {/* Resize Handle (Top-Right) */}
                        <div
                            onMouseDown={startResizing}
                            className="absolute top-0 right-0 w-6 h-6 z-50 cursor-ne-resize flex items-center justify-center opacity-50 hover:opacity-100"
                        >
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-transparent border-t-[8px] border-t-primary/50 border-r-[8px] border-r-primary/50 rounded-tr-md" />
                        </div>

                        {/* Header */}
                        <div
                            className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 select-none"
                            onDoubleClick={() => setSize({ width: 400, height: 600 })} // Reset on double click
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm overflow-hidden border border-primary/10">
                                <img src={logo} alt="Logo" className="h-full w-full object-cover scale-110" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-foreground truncate">المساعد الذكي</h3>
                                <p className="text-xs text-muted-foreground truncate">{lessonTitle || 'الدرس'}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/20 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" dir="rtl">
                            {messages.map((msg, i) => (
                                <div key={i}>
                                    <div
                                        className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden border ${msg.role === 'user'
                                            ? 'bg-primary/10 text-primary border-primary/20'
                                            : 'bg-white border-primary/10'
                                            }`}>
                                            {msg.role === 'user' ? <User className="h-4 w-4" /> : <img src={logo} alt="Bot" className="h-full w-full object-cover" />}
                                        </div>

                                        <div
                                            className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed border ${msg.role === 'user'
                                                ? 'bg-primary/10 text-primary border-primary/20 rounded-br-sm'
                                                : 'bg-white text-foreground border-primary/10 rounded-bl-sm'
                                                } prose prose-sm max-w-none break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4`}
                                        >
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <p dir="auto" {...props} />,
                                                    a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" className="text-primary underline" {...props} />
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Go to Assessment Button */}
                                    {
                                        msg.gotoAssessment && (
                                            <div className="mr-9 mt-2">
                                                <button
                                                    onClick={() => navigate(`/assessment/${lessonIndex}`)}
                                                    className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <ClipboardCheck className="h-4 w-4" />
                                                    الانتقال إلى اختبار الدرس
                                                </button>
                                            </div>
                                        )
                                    }

                                    {/* Inline Quiz */}
                                    {
                                        msg.inlineQuiz && msg.inlineQuiz.length > 0 && (
                                            <div className="mr-9 mt-1">
                                                <InlineQuizWidget questions={msg.inlineQuiz} />
                                            </div>
                                        )
                                    }
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-end gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border border-primary/10 overflow-hidden">
                                        <img src={logo} alt="Bot" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="rounded-2xl bg-muted px-4 py-3 rounded-bl-sm">
                                        <div className="flex gap-1">
                                            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggested Questions (only if few messages) */}
                        {messages.length <= 2 && (
                            <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide" dir="rtl">
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSuggestedQuestion(q)}
                                        className="shrink-0 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all whitespace-nowrap"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex items-center gap-2 border-t border-border px-3 py-2.5" dir="rtl">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="اكتب سؤالك..."
                                disabled={loading}
                                className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={loading || !input.trim()}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-opacity hover:opacity-90"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence >
        </>
    );
};

export default FloatingLessonChat;
