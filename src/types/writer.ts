export type WritingStyle =
  | 'empathetic'
  | 'imaginative'
  | 'descriptive'
  | 'analytical'
  | 'justificatory'
  | 'unique'
  | 'meticulous'
  | 'immersed'
  | 'deliberate';

export interface Statement {
  id: number;
  text: string;
  style: WritingStyle;
}

export interface StatementGroup {
  style: WritingStyle;
  label: string;
  statements: Statement[];
}

export interface StyleProfile {
  style: WritingStyle;
  scores: Record<WritingStyle, number>;
}

export interface StyleInfo {
  name: string;
  icon: string;
  description: string;
  characteristics: string[];
  creativeFeatures: string[];
  challenges: string[];
  sampleText: {
    title: string;
    content: string;
    analysis: {
      titleType: string;
      languageStyle: string;
      characters: string;
      conflict: string;
    };
  };
  lessons: {
    title: string;
    objectives: string[];
  }[];
}

export interface HighlightedPhrase {
  phrase: string;
  characteristic: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StyleCompatibility {
  strong: WritingStyle[];
  moderate: WritingStyle[];
}
