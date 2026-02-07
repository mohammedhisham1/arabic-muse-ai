import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Message } from '@/types/database';

interface TeacherStudentChatProps {
    otherUserId: string;
    otherUserName?: string;
}

const TeacherStudentChat = ({ otherUserId, otherUserName }: TeacherStudentChatProps) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!user) return;
        loadMessages();
        markMessagesAsRead();

        // Subscribe to realtime messages
        const channel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (newMsg.sender_id === otherUserId) {
                        setMessages((prev) => [...prev, newMsg]);
                        markMessagesAsRead();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, otherUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        if (!user) return;

        const { data } = await (supabase as any)
            .from('messages')
            .select('*')
            .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
            )
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const markMessagesAsRead = async () => {
        if (!user) return;

        await (supabase as any)
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', user.id)
            .is('read_at', null);
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !user) return;

        setSending(true);
        try {
            const { data, error } = await (supabase as any)
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: otherUserId,
                    content: newMessage.trim(),
                })
                .select()
                .single();

            if (error) throw error;
            setMessages((prev) => [...prev, data]);
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: Message[] }[] = [];
    messages.forEach((msg) => {
        const msgDate = new Date(msg.created_at).toDateString();
        const lastGroup = groupedMessages[groupedMessages.length - 1];
        if (lastGroup && new Date(lastGroup.messages[0].created_at).toDateString() === msgDate) {
            lastGroup.messages.push(msg);
        } else {
            groupedMessages.push({ date: msg.created_at, messages: [msg] });
        }
    });

    return (
        <div className="rounded-2xl border border-border bg-card flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">محادثة مع {otherUserName || 'المستخدم'}</h3>
                    <p className="text-xs text-muted-foreground">{messages.length} رسالة</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        لا توجد رسائل بعد. ابدأ المحادثة!
                    </div>
                )}

                <AnimatePresence>
                    {groupedMessages.map((group, gIdx) => (
                        <div key={gIdx}>
                            {/* Date separator */}
                            <div className="flex items-center justify-center my-4">
                                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                    {formatDate(group.date)}
                                </span>
                            </div>

                            {/* Messages in group */}
                            {group.messages.map((msg) => {
                                const isMine = msg.sender_id === user?.id;

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isMine ? 'justify-start' : 'justify-end'} mb-2`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMine
                                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                    : 'bg-muted text-foreground rounded-bl-sm'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <div
                                                className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-start' : 'justify-end'
                                                    }`}
                                            >
                                                <span
                                                    className={`text-[10px] ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                                        }`}
                                                >
                                                    {formatTime(msg.created_at)}
                                                </span>
                                                {isMine && (
                                                    <span className="text-primary-foreground/70">
                                                        {msg.read_at ? (
                                                            <CheckCheck className="h-3 w-3" />
                                                        ) : (
                                                            <Check className="h-3 w-3" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="اكتب رسالتك..."
                        className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        rows={1}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        size="icon"
                        className="h-11 w-11 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TeacherStudentChat;
