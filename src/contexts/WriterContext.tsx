import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WritingStyle, StyleProfile } from '@/types/writer';
import { statements, TOTAL_STATEMENTS } from '@/data/questionnaire';

interface WriterContextType {
  answers: Record<number, boolean | null>;
  setAnswer: (statementId: number, value: boolean) => void;
  profile: StyleProfile | null;
  calculateProfile: () => void;
  reset: () => void;
  answeredCount: number;
  totalStatements: number;
}

const WriterContext = createContext<WriterContextType | undefined>(undefined);

const ALL_STYLES: WritingStyle[] = [
  'empathetic', 'imaginative', 'descriptive', 'analytical', 'justificatory',
  'unique', 'meticulous', 'immersed', 'deliberate',
];

export function WriterProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [profile, setProfile] = useState<StyleProfile | null>(null);

  const answeredCount = Object.values(answers).filter(v => v !== null && v !== undefined).length;

  const setAnswer = useCallback((statementId: number, value: boolean) => {
    setAnswers(prev => ({ ...prev, [statementId]: value }));
  }, []);

  const calculateProfile = useCallback(() => {
    const scores: Record<WritingStyle, number> = {} as Record<WritingStyle, number>;
    ALL_STYLES.forEach(s => (scores[s] = 0));

    statements.forEach(statement => {
      if (answers[statement.id] === true) {
        scores[statement.style] += 1;
      }
    });

    const topStyle = ALL_STYLES.reduce((a, b) => (scores[a] >= scores[b] ? a : b));
    setProfile({ style: topStyle, scores });
  }, [answers]);

  const reset = useCallback(() => {
    setAnswers({});
    setProfile(null);
  }, []);

  return (
    <WriterContext.Provider value={{ answers, setAnswer, profile, calculateProfile, reset, answeredCount, totalStatements: TOTAL_STATEMENTS }}>
      {children}
    </WriterContext.Provider>
  );
}

export function useWriter() {
  const ctx = useContext(WriterContext);
  if (!ctx) throw new Error('useWriter must be used within WriterProvider');
  return ctx;
}
