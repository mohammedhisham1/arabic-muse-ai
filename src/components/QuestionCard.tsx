import { motion } from 'framer-motion';
import { Question } from '@/types/writer';

interface QuestionCardProps {
  question: Question;
  selectedOption: number;
  onSelect: (optionIndex: number) => void;
}

const QuestionCard = ({ question, selectedOption, onSelect }: QuestionCardProps) => {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <h2 className="mb-8 font-amiri text-2xl font-bold leading-relaxed text-foreground sm:text-3xl">
        {question.text}
      </h2>

      <div className="space-y-3">
        {question.options.map((option, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(idx)}
            className={`group w-full rounded-xl border-2 p-5 text-right transition-all duration-200 ${
              selectedOption === idx
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                  selectedOption === idx
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50'
                }`}
              >
                {['أ', 'ب', 'ج', 'د'][idx]}
              </div>
              <span className="text-base leading-relaxed">{option.text}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuestionCard;
