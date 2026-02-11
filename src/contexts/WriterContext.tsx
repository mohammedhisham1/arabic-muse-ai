import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { WritingStyle, StyleProfile } from '@/types/writer';
import { statements, TOTAL_STATEMENTS } from '@/data/questionnaire';
import { supabase } from '@/integrations/supabase/client';
import { styleData, styleNames } from '@/data/styles';

interface WriterContextType {
  answers: Record<number, boolean | null>;
  setAnswer: (statementId: number, value: boolean) => void;
  profile: StyleProfile | null;
  calculateProfile: () => void;
  reset: () => void;
  answeredCount: number;
  totalStatements: number;
  loadingProfile: boolean;
}

const WriterContext = createContext<WriterContextType | undefined>(undefined);

const ALL_STYLES: WritingStyle[] = [
  'empathetic', 'imaginative', 'descriptive', 'analytical', 'justificatory',
  'unique', 'meticulous', 'immersed', 'deliberate',
];

export function WriterProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load saved style from database on mount
  useEffect(() => {
    loadSavedProfile();

    // Listen for auth changes to reload profile
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadSavedProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setAnswers({});
        setLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resolveStyleKey = (saved: string): WritingStyle | null => {
    // If already a valid key like 'empathetic'
    if (ALL_STYLES.includes(saved as WritingStyle)) {
      return saved as WritingStyle;
    }
    // If it was saved as Arabic name like 'العاطفي', reverse-lookup
    for (const key of ALL_STYLES) {
      if (styleData[key]?.name === saved) {
        return key;
      }
    }
    // Try matching via styleNames map
    for (const [key, name] of Object.entries(styleNames)) {
      if (name === saved) {
        return key as WritingStyle;
      }
    }
    return null;
  };

  const loadSavedProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('writing_style')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.writing_style) {
        const resolvedStyle = resolveStyleKey(data.writing_style);
        if (resolvedStyle) {
          const scores: Record<WritingStyle, number> = {} as Record<WritingStyle, number>;
          ALL_STYLES.forEach(s => (scores[s] = s === resolvedStyle ? 10 : 0));
          setProfile({ style: resolvedStyle, scores });
          console.log('Profile loaded from DB:', resolvedStyle);
        } else {
          console.warn('Unknown writing_style in DB:', data.writing_style);
        }
      }
    } catch (err) {
      console.error('Error loading saved profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveProfileToDatabase = async (style: WritingStyle) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use update (not upsert) since the profile row is created by the signup trigger
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ writing_style: style })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving writing style:', error);
      } else {
        console.log('Writing style saved to database:', style);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

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

    // Save to database
    saveProfileToDatabase(topStyle);
  }, [answers]);

  const reset = useCallback(() => {
    setAnswers({});
    setProfile(null);
  }, []);

  return (
    <WriterContext.Provider value={{ answers, setAnswer, profile, calculateProfile, reset, answeredCount, totalStatements: TOTAL_STATEMENTS, loadingProfile }}>
      {children}
    </WriterContext.Provider>
  );
}

export function useWriter() {
  const ctx = useContext(WriterContext);
  if (!ctx) throw new Error('useWriter must be used within WriterProvider');
  return ctx;
}
