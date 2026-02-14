import { useState, useEffect } from 'react';
import { Bell, Mail, User, Clock, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TeacherMessage {
    id: string;
    content: string;
    created_at: string;
    type: 'intervention' | 'message';
    sender_name: string;
    intervention_type?: string;
}

const TeacherMessages = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<TeacherMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [lastReadTime, setLastReadTime] = useState<string>(() => {
        return localStorage.getItem('teacher_messages_last_read') || new Date(0).toISOString();
    });

    useEffect(() => {
        if (!user) return;
        fetchMessages();

        // Subscribe to both tables
        const channel = supabase.channel('teacher_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teacher_interventions', filter: `student_id=eq.${user.id}` }, fetchMessages)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, fetchMessages)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const fetchMessages = async () => {
        if (!user) return;

        const msgs: TeacherMessage[] = [];

        // 1. Fetch Interventions
        const { data: interventions } = await (supabase as any)
            .from('teacher_interventions')
            .select('*')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (interventions) {
            // Fetch teacher names
            const teacherIds = [...new Set(interventions.map((i: any) => i.teacher_id))];
            const { data: profiles } = await (supabase as any)
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', teacherIds);

            interventions.forEach((i: any) => {
                const name = profiles?.find((p: any) => p.user_id === i.teacher_id)?.full_name || 'معلم';
                msgs.push({
                    id: i.id,
                    content: i.content,
                    created_at: i.created_at,
                    type: 'intervention',
                    sender_name: name,
                    intervention_type: i.intervention_type
                });
            });
        }

        // 2. Fetch Direct Messages
        const { data: directMsgs } = await supabase
            .from('messages')
            .select('*')
            .eq('receiver_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (directMsgs) {
            // Assume direct messages are from teacher
            // Ideally fetch profiles too, but for now:
            directMsgs.forEach((m: any) => {
                msgs.push({
                    id: m.id,
                    content: m.content,
                    created_at: m.created_at,
                    type: 'message',
                    sender_name: 'رسالة خاصة', // Or fetch name
                });
            });
        }

        // Sort combined
        msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setMessages(msgs);

        // Calculate unread based on local storage timestamp
        const count = msgs.filter(m => new Date(m.created_at) > new Date(lastReadTime)).length;
        setUnreadCount(count);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            const now = new Date().toISOString();
            setLastReadTime(now);
            localStorage.setItem('teacher_messages_last_read', now);
            setUnreadCount(0);
        }
    };

    const getTypeLabel = (type: string | undefined) => {
        if (!type) return 'رسالة';
        switch (type) {
            case 'suggestion': return 'اقتراح';
            case 'praise': return 'تشجيع';
            case 'correction': return 'تصحيح';
            default: return 'ملاحظة';
        }
    };

    const getTypeColor = (type: string | undefined) => {
        switch (type) {
            case 'suggestion': return 'text-blue-600 bg-blue-50';
            case 'praise': return 'text-green-600 bg-green-50';
            case 'correction': return 'text-amber-600 bg-amber-50';
            default: return 'text-primary bg-primary/5';
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="group relative flex items-center gap-2 h-10 rounded-full px-3 hover:bg-muted/50">
                    <div className="relative">
                        <Bell className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                        {unreadCount > 0 && (
                            <Badge
                                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive p-0 text-[10px]"
                            >
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    <span className="hidden sm:inline font-medium text-sm text-muted-foreground group-hover:text-foreground transition-colors">الرسائل</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                    <h4 className="font-semibold text-sm">رسائل وتوجيهات المعلم</h4>
                    {unreadCount > 0 && <span className="text-xs text-primary">{unreadCount} جديدة</span>}
                </div>
                <ScrollArea className="max-h-[300px] overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            لا توجد رسائل حالياً
                        </div>
                    ) : (
                        <div className="grid gap-0 divide-y">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col gap-1.5 p-4 text-right transition-colors hover:bg-muted/50 ${new Date(msg.created_at) > new Date(lastReadTime) ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ar })}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-xs text-foreground">{msg.sender_name}</span>
                                            <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-muted`}>
                                                <User className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTypeColor(msg.intervention_type)}`}>
                                            {msg.type === 'intervention' ? getTypeLabel(msg.intervention_type) : 'رسالة خاصة'}
                                        </span>
                                    </div>

                                    <p className="text-sm leading-relaxed text-foreground/90 mt-1 whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

export default TeacherMessages;
