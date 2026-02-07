import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bell, X, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TeacherNote {
    id: string;
    teacher_id: string;
    content: string;
    intervention_type: string;
    created_at: string;
    teacher_name?: string;
}

const TeacherFeedbackSection = () => {
    const { user, role } = useAuth();
    const [notes, setNotes] = useState<TeacherNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        if (user && role === 'student') {
            loadNotes();
        } else {
            setLoading(false);
        }
    }, [user, role]);

    const loadNotes = async () => {
        if (!user) return;

        try {
            // Get teacher interventions for this student
            const { data: interventions, error } = await (supabase as any)
                .from('teacher_interventions')
                .select('id, teacher_id, content, intervention_type, created_at')
                .eq('student_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            if (interventions && interventions.length > 0) {
                // Get teacher names
                const teacherIds = [...new Set(interventions.map((i: any) => i.teacher_id))];
                const { data: profiles } = await (supabase as any)
                    .from('profiles')
                    .select('user_id, full_name')
                    .in('user_id', teacherIds);

                const enriched = interventions.map((note: any) => ({
                    ...note,
                    teacher_name: profiles?.find((p: any) => p.user_id === note.teacher_id)?.full_name || 'معلم',
                }));

                setNotes(enriched);
            }
        } catch (err) {
            console.error('Error loading teacher notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = (id: string) => {
        setDismissedIds(prev => [...prev, id]);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} أيام`;
        return date.toLocaleDateString('ar');
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'suggestion': return 'اقتراح';
            case 'praise': return 'تشجيع';
            case 'correction': return 'تصحيح';
            default: return 'ملاحظة';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'suggestion': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'praise': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'correction': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default: return 'bg-primary/10 text-primary';
        }
    };

    // Don't show if not a student or no notes
    if (!user || role !== 'student') return null;

    const visibleNotes = notes.filter(n => !dismissedIds.includes(n.id));
    if (loading || visibleNotes.length === 0) return null;

    return (
        <section className="py-12 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-amiri text-xl font-bold text-foreground">
                                رسائل من معلمك
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {visibleNotes.length} رسالة جديدة
                            </p>
                        </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-4">
                        <AnimatePresence>
                            {visibleNotes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20, height: 0 }}
                                    className="relative rounded-2xl border border-border bg-card p-5 shadow-sm"
                                >
                                    {/* Dismiss button */}
                                    <button
                                        onClick={() => handleDismiss(note.id)}
                                        className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-muted transition-colors"
                                        aria-label="إخفاء"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>

                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-foreground text-sm">
                                                {note.teacher_name}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(note.created_at)}
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(note.intervention_type)}`}>
                                            {getTypeLabel(note.intervention_type)}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="pr-12">
                                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                            {note.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TeacherFeedbackSection;
