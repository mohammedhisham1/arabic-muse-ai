import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ScoreGaugeProps {
  label: string;
  value: number;
  icon: LucideIcon;
  max?: number;
}

const ScoreGauge = ({ label, value, icon: Icon, max = 10 }: ScoreGaugeProps) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 7) return 'text-primary stroke-primary';
    if (score >= 4) return 'text-accent stroke-accent';
    return 'text-destructive stroke-destructive';
  };

  const colorClass = getColor(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            strokeWidth="6"
            className="stroke-muted"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={colorClass}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`h-4 w-4 mb-0.5 ${colorClass.split(' ')[0]}`} />
          <span className={`text-lg font-bold ${colorClass.split(' ')[0]}`}>
            {Number(value).toFixed(1)}
          </span>
        </div>
      </div>
      <p className="text-xs font-bold text-muted-foreground text-center">{label}</p>
    </div>
  );
};

export default ScoreGauge;
