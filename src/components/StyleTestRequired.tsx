import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenLine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

const StyleTestRequired = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-md text-center"
                >
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <PenLine className="h-10 w-10 text-primary" />
                    </div>

                    <h1 className="font-amiri text-3xl font-bold text-foreground mb-3">
                        اكتشف أسلوبك أولًا!
                    </h1>

                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        لتتمكن من الوصول إلى هذه الصفحة، تحتاج أولًا إلى إكمال اختبار الأسلوب الكتابي.
                        سيساعدنا ذلك في تخصيص محتوى تعليمي يناسب شخصيتك الإبداعية.
                    </p>

                    <Button
                        variant="hero"
                        size="lg"
                        onClick={() => navigate('/style-test')}
                        className="gap-2 w-full sm:w-auto"
                    >
                        <Sparkles className="h-5 w-5" />
                        ابدأ اختبار الأسلوب
                    </Button>
                </motion.div>
            </main>
        </div>
    );
};

export default StyleTestRequired;
