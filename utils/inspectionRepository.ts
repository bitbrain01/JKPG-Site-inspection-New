import { InspectionDraft, InspectionSavePayload, InspectionSubmitResult } from '../types';
import { getSupabaseClient } from './supabaseClient';

const LOCAL_STORAGE_KEY = 'site-inspection-audits';
const DEFAULT_STORAGE_BUCKET = 'inspection-photos';
const STORAGE_BUCKET = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) || DEFAULT_STORAGE_BUCKET;
const uploadedPhotoCache = new Map<string, string>();

interface SupabaseDraftRow {
  id: string;
  payload: InspectionSavePayload;
  created_at: string;
  updated_at: string;
}

export interface InspectionRepository {
  saveDraft(draft: InspectionDraft): Promise<InspectionDraft>;
  saveInspection(payload: InspectionSavePayload, draftId?: string): Promise<InspectionDraft>;
  getDraft(id: string): Promise<InspectionDraft | null>;
  listDrafts(): Promise<InspectionDraft[]>;
  listCompleted(): Promise<InspectionDraft[]>;
  listByDate(date: string): Promise<InspectionDraft[]>;
  listByDateAndStation(date: string, station: string): Promise<InspectionDraft[]>;
  getActiveDraftForStationDate(station: string, date: string): Promise<InspectionDraft | null>;
  deleteDraft(id: string): Promise<void>;
  submitDraft(id: string): Promise<InspectionSubmitResult>;
}

const createDraftId = (): string => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export const createInspectionDraft = (payload: InspectionSavePayload): InspectionDraft => {
  const timestamp = new Date().toISOString();
  return {
    id: createDraftId(),
    recordType: 'draft',
    payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const createInspectionDraftFromExisting = (
  payload: InspectionSavePayload,
  existing: InspectionDraft
): InspectionDraft => ({
  ...existing,
  recordType: 'draft',
  payload,
  updatedAt: new Date().toISOString(),
});

const readLocalDrafts = (): InspectionDraft[] => {
  if (typeof window === 'undefined') {
    throw new Error('Inspection repository is only available in a browser environment.');
  }

  const rawValue = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? (parsed as InspectionDraft[]) : [];
  } catch {
    return [];
  }
};

const writeLocalDrafts = (drafts: InspectionDraft[]): void => {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));
};

const sortByUpdatedDesc = (records: InspectionDraft[]): InspectionDraft[] =>
  [...records].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

const toSupabaseRow = (draft: InspectionDraft): SupabaseDraftRow => ({
  id: draft.id,
  payload: {
    ...draft.payload,
    __recordType: draft.recordType,
    __completedAt: draft.completedAt,
  } as InspectionSavePayload,
  created_at: draft.createdAt,
  updated_at: draft.updatedAt,
});

const isImageDataUrl = (value: string): boolean => value.startsWith('data:image/');

const getImageMetaFromDataUrl = (dataUrl: string): { mimeType: string; extension: string } => {
  const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';')) || 'image/jpeg';
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  return { mimeType, extension };
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [metaPart, dataPart] = dataUrl.split(',');
  const binary = window.atob(dataPart);
  const array = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    array[index] = binary.charCodeAt(index);
  }

  const mimeType = metaPart.substring(metaPart.indexOf(':') + 1, metaPart.indexOf(';')) || 'image/jpeg';
  return new Blob([array], { type: mimeType });
};

const uploadPhotoIfNeeded = async (
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  draftId: string,
  questionId: string,
  photoIndex: number,
  value: string
): Promise<string> => {
  if (!isImageDataUrl(value)) {
    return value;
  }

  const cachedPath = uploadedPhotoCache.get(value);
  if (cachedPath) {
    return cachedPath;
  }

  const { mimeType, extension } = getImageMetaFromDataUrl(value);
  const objectPath = `${draftId}/${questionId}-${photoIndex}.${extension}`;
  const fileBlob = dataUrlToBlob(value);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, fileBlob, { contentType: mimeType, upsert: true });

  if (error) {
    throw new Error(`Image upload failed for ${questionId}: ${error.message}`);
  }

  const storageReference = `supabase://${STORAGE_BUCKET}/${objectPath}`;
  uploadedPhotoCache.set(value, storageReference);
  return storageReference;
};

const buildRemotePayloadWithStorageRefs = async (
  payload: InspectionSavePayload,
  draftId: string,
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>
): Promise<InspectionSavePayload> => {
  const remotePhotos: InspectionSavePayload['photos'] = {};

  for (const [questionId, questionPhotos] of Object.entries(payload.photos || {})) {
    if (!questionPhotos || questionPhotos.length === 0) {
      remotePhotos[questionId] = questionPhotos;
      continue;
    }

    const uploadedPhotos = await Promise.all(
      questionPhotos.map((photo, index) => uploadPhotoIfNeeded(supabase, draftId, questionId, index, photo))
    );

    remotePhotos[questionId] = uploadedPhotos;
  }

  return {
    ...payload,
    photos: remotePhotos,
  };
};

const syncDraftToSupabase = async (draft: InspectionDraft): Promise<InspectionDraft> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ...draft, syncStatus: 'local-only', syncError: undefined };
  }

  let remotePayload: InspectionSavePayload;
  try {
    remotePayload = await buildRemotePayloadWithStorageRefs(draft.payload, draft.id, supabase);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Photo upload failed.';
    return {
      ...draft,
      syncStatus: 'sync-failed',
      syncError: errorMessage,
    };
  }

  const { error } = await supabase
    .from('inspection_drafts')
    .upsert(
      {
        ...toSupabaseRow(draft),
        payload: remotePayload,
      },
      { onConflict: 'id' }
    );

  if (error) {
    return {
      ...draft,
      syncStatus: 'sync-failed',
      syncError: error.message,
    };
  }

  return {
    ...draft,
    syncStatus: 'synced',
    syncError: undefined,
    lastSyncedAt: new Date().toISOString(),
  };
};

const replaceDraftInStorage = (draft: InspectionDraft): void => {
  const drafts = readLocalDrafts();
  const index = drafts.findIndex((item) => item.id === draft.id);
  if (index >= 0) {
    drafts[index] = draft;
    writeLocalDrafts(drafts);
  }
};

const upsertRecord = (records: InspectionDraft[], nextRecord: InspectionDraft): InspectionDraft[] => {
  const index = records.findIndex((record) => record.id === nextRecord.id);
  if (index >= 0) {
    const updated = [...records];
    updated[index] = nextRecord;
    return updated;
  }
  return [...records, nextRecord];
};

const getDraftIdentityMatch = (
  records: InspectionDraft[],
  payload: InspectionSavePayload,
  explicitId?: string
): InspectionDraft | null => {
  if (explicitId) {
    return records.find((record) => record.id === explicitId && record.recordType === 'draft') ?? null;
  }

  return sortByUpdatedDesc(records).find((record) => (
    record.recordType === 'draft'
    && record.payload.locationName === payload.locationName
    && record.payload.inspectionDate === payload.inspectionDate
  )) ?? null;
};

export const localInspectionRepository: InspectionRepository = {
  async saveDraft(draft: InspectionDraft): Promise<InspectionDraft> {
    const existingRecords = readLocalDrafts();
    const matchingDraft = getDraftIdentityMatch(existingRecords, draft.payload, draft.id);

    const nextDraft: InspectionDraft = {
      ...(matchingDraft ?? draft),
      id: matchingDraft?.id ?? draft.id,
      recordType: 'draft',
      payload: draft.payload,
      createdAt: matchingDraft?.createdAt ?? draft.createdAt,
      updatedAt: new Date().toISOString(),
      completedAt: undefined,
    };

    writeLocalDrafts(upsertRecord(existingRecords, nextDraft));

    const syncedDraft = await syncDraftToSupabase(nextDraft);
    replaceDraftInStorage(syncedDraft);

    return syncedDraft;
  },

  async getDraft(id: string): Promise<InspectionDraft | null> {
    const existingDrafts = readLocalDrafts();
    return existingDrafts.find((draft) => draft.id === id) ?? null;
  },

  async listDrafts(): Promise<InspectionDraft[]> {
    const existingDrafts = readLocalDrafts().filter((record) => record.recordType === 'draft');
    return sortByUpdatedDesc(existingDrafts);
  },

  async listCompleted(): Promise<InspectionDraft[]> {
    const completed = readLocalDrafts().filter((record) => record.recordType === 'completed');
    return sortByUpdatedDesc(completed);
  },

  async listByDate(date: string): Promise<InspectionDraft[]> {
    const records = readLocalDrafts().filter((record) => record.payload.inspectionDate === date);
    return sortByUpdatedDesc(records);
  },

  async listByDateAndStation(date: string, station: string): Promise<InspectionDraft[]> {
    const records = readLocalDrafts().filter((record) => (
      record.payload.inspectionDate === date && record.payload.locationName === station
    ));
    return sortByUpdatedDesc(records);
  },

  async getActiveDraftForStationDate(station: string, date: string): Promise<InspectionDraft | null> {
    const records = await this.listByDateAndStation(date, station);
    return records.find((record) => record.recordType === 'draft') ?? null;
  },

  async deleteDraft(id: string): Promise<void> {
    const existingDrafts = readLocalDrafts();
    writeLocalDrafts(existingDrafts.filter((draft) => draft.id !== id));
  },

  async saveInspection(payload: InspectionSavePayload, draftId?: string): Promise<InspectionDraft> {
    const records = readLocalDrafts();
    const timestamp = new Date().toISOString();

    const matchingDraft = getDraftIdentityMatch(records, payload, draftId);

    const completedRecord: InspectionDraft = {
      id: matchingDraft?.id ?? createDraftId(),
      recordType: 'completed',
      payload,
      createdAt: matchingDraft?.createdAt ?? timestamp,
      updatedAt: timestamp,
      completedAt: timestamp,
      syncStatus: matchingDraft?.syncStatus,
      lastSyncedAt: matchingDraft?.lastSyncedAt,
      syncError: matchingDraft?.syncError,
    };

    writeLocalDrafts(upsertRecord(records, completedRecord));

    const syncedRecord = await syncDraftToSupabase(completedRecord);
    replaceDraftInStorage(syncedRecord);
    return syncedRecord;
  },

  async submitDraft(id: string): Promise<InspectionSubmitResult> {
    const draft = await this.getDraft(id);
    if (!draft) {
      throw new Error('Draft not found.');
    }

    return {
      remoteId: `local-${draft.id}`,
      submittedAt: new Date().toISOString(),
    };
  },
};
