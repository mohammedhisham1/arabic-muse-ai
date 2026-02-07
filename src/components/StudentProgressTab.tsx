import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { styleData } from '@/data/styles';
import type { StudentLessonProgress } from '@/types/database';

interface StudentProgressTabProps {
    studentId: string;
    writingStyle?: string;
}

const StudentProgressTab = ({ studentId, writingStyle }: StudentProgressTabProps) => {
    const [progress, setProgress] = useState<StudentLessonProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgress();
    }, [studentId, writingStyle]);

    const loadProgress = async () => {
        setLoading(true);
        let query = (supabase as any)
            .from('student_lesson_progress')
            .select('*')
            .eq('user_id', studentId)
            .order('lesson_index', { ascending: true });

        if (writingStyle) {
            query = query.eq('writing_style', writingStyle);
        }

        const { data } = await query;
        if (data) setProgress(data);
        setLoading(false);
    };

    // Get lessons from style data
    const style = writingStyle && styleData[writingStyle as keyof typeof styleData];
    const lessons = style?.lessons || [];

    const completedCount = progress.filter(p => p.completed).length;
    const totalLessons = lessons.length || progress.length || 0;
    const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="font-amiri text-lg font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            تقدم الطالب
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            أكمل {completedCount} من {totalLessons} درس
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{Math.round(progressPercent)}%</p>
                            <p className="text-xs text-muted-foreground">مكتمل</p>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    />
                </div>
            </motion.div>

            {/* Lessons List */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    الدروس
                </h4>

                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
                ) : totalLessons === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        لم يبدأ الطالب مسار التعلم بعد
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(lessons.length > 0 ? lessons : Array.from({ length: totalLessons })).map((lesson: any, idx: number) => {
                            const lessonProgress = progress.find(p => p.lesson_index === idx);
                            const isCompleted = lessonProgress?.completed;
                            const score = lessonProgress?.score;
                            const completedAt = lessonProgress?.completed_at;

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${isCompleted
                                            ? 'border-primary/30 bg-primary/5'
                                            : 'border-border bg-background'
                                        }`}
                                >
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${isCompleted
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <Circle className="h-4 w-4" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-foreground">
                                            الدرس {idx + 1}{lesson?.title ? `: ${lesson.title}` : ''}
                                        </p>
                                        {completedAt && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(completedAt).toLocaleDateString('ar')}
                                            </p>
                                        )}
                                    </div>

                                    {score !== undefined && score !== null && (
                                        <div className="text-center">
                                            <p className={`text-lg font-bold ${score >= 7 ? 'text-primary' : score >= 4 ? 'text-accent' : 'text-destructive'
                                                }`}>
                                                {score.toFixed(1)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">الدرجة</p>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProgressTab;
