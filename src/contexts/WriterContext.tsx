import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WritingStyle, StyleProfile } from '@/types/writer';
import { questions } from '@/data/questionnaire';

interface WriterContextType {
  answers: number[];
  setAnswer: (questionIndex: number, optionIndex: number) => void;
  profile: StyleProfile | null;
  calculateProfile: () => void;
  reset: () => void;
}

const WriterContext = createContext<WriterContextType | undefined>(undefined);

const ALL_STYLES: WritingStyle[] = [
  'emotional', 'logical', 'analytical', 'descriptive', 'detailed',
  'introspective', 'rationalistic', 'reasoning', 'reflective',
];

export function WriterProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [profile, setProfile] = useState<StyleProfile | null>(null);

  const setAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }, []);

  const calculateProfile = useCallback(() => {
    const scores: Record<WritingStyle, number> = {} as Record<WritingStyle, number>;
    ALL_STYLES.forEach(s => (scores[s] = 0));

    answers.forEach((optionIndex, qIndex) => {
      if (optionIndex < 0) return;
      const option = questions[qIndex].options[optionIndex];
      if (!option) return;
      Object.entries(option.scores).forEach(([style, points]) => {
        scores[style as WritingStyle] += points;
      });
    });

    const topStyle = ALL_STYLES.reduce((a, b) => (scores[a] >= scores[b] ? a : b));
    setProfile({ style: topStyle, scores });
  }, [answers]);

  const reset = useCallback(() => {
    setAnswers(Array(questions.length).fill(-1));
    setProfile(null);
  }, []);

  return (
    <WriterContext.Provider value={{ answers, setAnswer, profile, calculateProfile, reset }}>
      {children}
    </WriterContext.Provider>
  );
}

export function useWriter() {
  const ctx = useContext(WriterContext);
  if (!ctx) throw new Error('useWriter must be used within WriterProvider');
  return ctx;
}
