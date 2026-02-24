
export type PumpStatus = 'compliant' | 'non-compliant';
export type ToastType = 'success' | 'error';

export interface AuditMeta {
  locationName: string;
  inspectorName: string;
  inspectionDate: string;
}

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

export type QuestionId = string;
export type SelectedAnswers = Record<QuestionId, string | undefined>; // questionId: selectedAnswerText
export type NumericInputValues = Record<QuestionId, string | undefined>; // questionId: numericValue (as string)
export type Comments = Record<QuestionId, string | undefined>; // questionId: commentText
export type Photos = Record<QuestionId, string[] | undefined>; // questionId: base64 image data URLs

export interface InspectionScoreSummary {
  liveScore: number;
  totalPossibleScore: number;
  totalQuestions: number;
  answeredQuestions: number;
}

export interface InspectionSavePayload extends AuditMeta {
  selectedAnswers: SelectedAnswers;
  numericInputValues: NumericInputValues;
  comments: Comments;
  photos: Photos;
  numberOfPumps: number;
  pumpStatuses: PumpStatus[];
  liveScore: number;
  totalPossibleScore: number;
  savedAt: string;
}

export type InspectionRecordType = 'draft' | 'completed';

export interface InspectionDraft {
  id: string;
  recordType: InspectionRecordType;
  payload: InspectionSavePayload;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  syncStatus?: 'local-only' | 'synced' | 'sync-failed';
  lastSyncedAt?: string;
  syncError?: string;
}

export interface InspectionSubmitResult {
  remoteId: string;
  submittedAt: string;
}