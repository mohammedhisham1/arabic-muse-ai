import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ACHIEVEMENTS, type StudentAchievement } from '@/types/database';

interface StudentAchievementsTabProps {
    studentId: string;
}

const StudentAchievementsTab = ({ studentId }: StudentAchievementsTabProps) => {
    const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAchievements();
    }, [studentId]);

    const loadAchievements = async () => {
        setLoading(true);
        const { data } = await (supabase as any)
            .from('student_achievements')
            .select('*')
            .eq('user_id', studentId)
            .order('achieved_at', { ascending: false });

        if (data) setAchievements(data);
        setLoading(false);
    };

    const allAchievementTypes = Object.keys(ACHIEVEMENTS) as (keyof typeof ACHIEVEMENTS)[];
    const earnedTypes = achievements.map(a => a.achievement_type);
    const earnedCount = achievements.length;
    const totalCount = allAchievementTypes.length;

    return (
        <div className="space-y-6">
            {/* Summary */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-primary/5 p-6"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="font-amiri text-lg font-bold text-foreground flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-accent" />
                            الإنجازات والشارات
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            حصل على {earnedCount} من {totalCount} شارة
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {achievements.slice(0, 3).map((a) => {
                            const def = ACHIEVEMENTS[a.achievement_type as keyof typeof ACHIEVEMENTS];
                            return def ? (
                                <span key={a.id} className="text-2xl" title={def.name}>
                                    {def.icon}
                                </span>
                            ) : null;
                        })}
                        {earnedCount > 3 && (
                            <span className="text-sm text-muted-foreground">+{earnedCount - 3}</span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Achievements Grid */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <h4 className="font-bold text-foreground mb-4">جميع الشارات</h4>

                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {allAchievementTypes.map((type, idx) => {
                            const def = ACHIEVEMENTS[type];
                            const earned = earnedTypes.includes(type);
                            const achievement = achievements.find(a => a.achievement_type === type);

                            return (
                                <motion.div
                                    key={type}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative rounded-2xl border p-4 text-center transition-all ${earned
                                            ? 'border-accent/30 bg-accent/5'
                                            : 'border-border bg-muted/30 opacity-60'
                                        }`}
                                >
                                    {/* Badge Icon */}
                                    <div
                                        className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${earned
                                                ? 'bg-gradient-to-br from-accent/20 to-primary/20'
                                                : 'bg-muted'
                                            }`}
                                    >
                                        {earned ? def.icon : <Lock className="h-6 w-6 text-muted-foreground" />}
                                    </div>

                                    {/* Badge Info */}
                                    <h5 className={`font-bold text-sm ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {def.name}
                                    </h5>
                                    <p className="text-xs text-muted-foreground mt-1">{def.description}</p>

                                    {/* Earned Date */}
                                    {earned && achievement && (
                                        <p className="text-[10px] text-accent mt-2">
                                            {new Date(achievement.achieved_at).toLocaleDateString('ar')}
                                        </p>
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

export default StudentAchievementsTab;
