import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
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

const FloatingLessonChat = ({ lessonTitle, lessonIndex, lessonContent }: FloatingLessonChatProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(lessonIndex));
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
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

            const reply = data?.reply || 'عذرًا، لم أستطع الرد. حاول مرة أخرى.';
            setMessages(prev => [...prev, { role: 'assistant', text: reply }]);

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
        'ما هي أهم نقطة في الدرس؟',
    ];

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="فتح المحادثة"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X className="h-6 w-6" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <MessageCircle className="h-6 w-6" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Unread badge */}
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
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
                        className="fixed bottom-24 left-6 z-50 flex w-[420px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                        style={{ height: '560px' }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-foreground truncate">المساعد الذكي</h3>
                                <p className="text-xs text-muted-foreground truncate">{lessonTitle || 'الدرس'}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" dir="rtl">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === 'user'
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-accent/10 text-accent'
                                        }`}>
                                        {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                    </div>
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-muted text-foreground rounded-bl-sm'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-end gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                                        <Bot className="h-3.5 w-3.5" />
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
            </AnimatePresence>
        </>
    );
};

export default FloatingLessonChat;
