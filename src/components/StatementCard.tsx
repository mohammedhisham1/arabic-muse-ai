import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Statement } from '@/types/writer';

interface StatementCardProps {
  statement: Statement;
  answer: boolean | null | undefined;
  onAnswer: (value: boolean) => void;
  index: number;
}

const StatementCard = ({ statement, answer, onAnswer, index }: StatementCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`flex items-center justify-between gap-4 rounded-xl border-2 p-4 transition-all duration-200 ${
        answer === true
          ? 'border-primary bg-primary/5'
          : answer === false
          ? 'border-muted bg-muted/30'
          : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      <span className="flex-1 text-right text-sm leading-relaxed sm:text-base">
        {statement.id}. {statement.text}
      </span>

      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => onAnswer(true)}
          className={`flex h-10 w-14 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all ${
            answer === true
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
          }`}
        >
          <Check className="mr-0.5 h-4 w-4" />
          نعم
        </button>
        <button
          onClick={() => onAnswer(false)}
          className={`flex h-10 w-14 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all ${
            answer === false
              ? 'border-muted-foreground bg-muted-foreground text-background shadow-sm'
              : 'border-border text-muted-foreground hover:border-muted-foreground/50'
          }`}
        >
          <X className="mr-0.5 h-4 w-4" />
          لا
        </button>
      </div>
    </motion.div>
  );
};

export default StatementCard;
