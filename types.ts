
export type PumpStatus = 'compliant' | 'non-compliant';

export interface AnswerOption {
  text: string;
  points: number | 'N/A' | '-';
  isPositive?: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: AnswerOption[];
  type: 'standard' | 'numericInput' | 'informational';
  conditionalNumericInputTriggers?: string[]; // Answer texts that show numeric input
  maxPoints: number; // Max points for this question if applicable
}

export interface SectionData {
  id:string; // Unique ID for managing accordion state
  title: string;
  questions: Question[];
}

export type SelectedAnswers = Record<string, string | undefined>; // questionId: selectedAnswerText
export type NumericInputValues = Record<string, string | undefined>; // questionId: numericValue (as string)
export type Comments = Record<string, string | undefined>; // questionId: commentText
export type Photos = Record<string, string[] | undefined>; // questionId: base64 image data URLs