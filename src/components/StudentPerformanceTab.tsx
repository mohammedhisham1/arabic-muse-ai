import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Heart, Fingerprint } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import type { WritingEvaluation } from '@/types/database';

interface StudentPerformanceTabProps {
    studentId: string;
}

interface EvaluationData {
    id: string;
    date: string;
    word_precision: number;
    feeling_depth: number;
    linguistic_identity: number;
    avg: number;
}

const StudentPerformanceTab = ({ studentId }: StudentPerformanceTabProps) => {
    const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvaluations();
    }, [studentId]);

    const loadEvaluations = async () => {
        setLoading(true);

        // Get writings for this student
        const { data: writings } = await (supabase as any)
            .from('writings')
            .select('id, created_at')
            .eq('user_id', studentId)
            .order('created_at', { ascending: true });

        if (!writings || writings.length === 0) {
            setEvaluations([]);
            setLoading(false);
            return;
        }

        // Get evaluations for those writings
        const writingIds = writings.map((w: any) => w.id);
        const { data: evals } = await (supabase as any)
            .from('writing_evaluations')
            .select('*')
            .in('writing_id', writingIds);

        if (evals) {
            const formatted = writings
                .map((w: any) => {
                    const evaluation = evals.find((e: WritingEvaluation) => e.writing_id === w.id);
                    if (!evaluation) return null;

                    const wp = Number(evaluation.word_precision);
                    const fd = Number(evaluation.feeling_depth);
                    const li = Number(evaluation.linguistic_identity);

                    return {
                        id: w.id,
                        date: new Date(w.created_at).toLocaleDateString('ar', { month: 'short', day: 'numeric' }),
                        word_precision: wp,
                        feeling_depth: fd,
                        linguistic_identity: li,
                        avg: (wp + fd + li) / 3,
                    };
                })
                .filter(Boolean) as EvaluationData[];

            setEvaluations(formatted);
        }

        setLoading(false);
    };

    // Calculate averages for radar chart
    const avgScores = evaluations.length > 0
        ? {
            word_precision: evaluations.reduce((sum, e) => sum + e.word_precision, 0) / evaluations.length,
            feeling_depth: evaluations.reduce((sum, e) => sum + e.feeling_depth, 0) / evaluations.length,
            linguistic_identity: evaluations.reduce((sum, e) => sum + e.linguistic_identity, 0) / evaluations.length,
        }
        : { word_precision: 0, feeling_depth: 0, linguistic_identity: 0 };

    const radarData = [
        { skill: 'دقة الكلمات', value: avgScores.word_precision, fullMark: 10 },
        { skill: 'عمق المشاعر', value: avgScores.feeling_depth, fullMark: 10 },
        { skill: 'الهوية اللغوية', value: avgScores.linguistic_identity, fullMark: 10 },
    ];

    const overallAvg = evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + e.avg, 0) / evaluations.length
        : 0;

    const scoreColor = (score: number) => {
        if (score >= 7) return 'text-primary';
        if (score >= 4) return 'text-accent';
        return 'text-destructive';
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4 text-center"
                >
                    <BarChart3 className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className={`text-2xl font-bold ${scoreColor(overallAvg)}`}>{overallAvg.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">المتوسط العام</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-xl border border-border bg-card p-4 text-center"
                >
                    <Target className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                    <p className={`text-2xl font-bold ${scoreColor(avgScores.word_precision)}`}>
                        {avgScores.word_precision.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">دقة الكلمات</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-border bg-card p-4 text-center"
                >
                    <Heart className="h-5 w-5 text-red-500 mx-auto mb-2" />
                    <p className={`text-2xl font-bold ${scoreColor(avgScores.feeling_depth)}`}>
                        {avgScores.feeling_depth.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">عمق المشاعر</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-xl border border-border bg-card p-4 text-center"
                >
                    <Fingerprint className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                    <p className={`text-2xl font-bold ${scoreColor(avgScores.linguistic_identity)}`}>
                        {avgScores.linguistic_identity.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">الهوية اللغوية</p>
                </motion.div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
            ) : evaluations.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                    لا توجد تقييمات بعد. سيظهر الأداء بعد أن يكتب الطالب ويتم تقييمه.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Line Chart - Progress Over Time */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border border-border bg-card p-6"
                    >
                        <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            تطور الأداء عبر الوقت
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={evaluations}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avg"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ fill: 'hsl(var(--primary))' }}
                                    name="المتوسط"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Radar Chart - Skill Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border border-border bg-card p-6"
                    >
                        <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            توزيع المهارات
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                                <Radar
                                    name="المهارات"
                                    dataKey="value"
                                    stroke="hsl(var(--primary))"
                                    fill="hsl(var(--primary))"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default StudentPerformanceTab;
