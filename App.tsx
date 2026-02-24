
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { INSPECTION_DATA, ACCENT_COLOR, LOCATIONS, LocationName } from './constants';
import {
  SelectedAnswers,
  NumericInputValues,
  Comments,
  Photos,
  PumpStatus,
  InspectionScoreSummary,
  ToastType,
  InspectionSavePayload,
  InspectionDraft,
} from './types';
import ScoreHeader from './components/ScoreHeader';
import AccordionItem from './components/AccordionItem';
import QuestionCard from './components/QuestionCard';
import PumpCompliance from './components/PumpCompliance';
import ProgressTracker from './components/ProgressTracker';
import Toast from './components/Toast';
import CameraModal from './components/CameraModal';
import AuditInfo from './components/AuditInfo';
import { generatePdf } from './utils/pdf';
import {
  createInspectionDraft,
  createInspectionDraftFromExisting,
  localInspectionRepository,
} from './utils/inspectionRepository';

const DEFAULT_PUMP_COUNT = 10;
const MIN_PUMP_COUNT = 1;
const MAX_PUMP_COUNT = 20;
const MAX_PHOTOS_PER_QUESTION = 6;

const ALL_QUESTIONS = INSPECTION_DATA.flatMap((section) => section.questions);
const QUESTION_BY_ID = new Map(ALL_QUESTIONS.map((question) => [question.id, question]));
const FIRST_SECTION_ID = INSPECTION_DATA.length > 0 ? INSPECTION_DATA[0].id : null;

const getTodayIsoDate = (): string => new Date().toISOString().split('T')[0];

const createDefaultPumpStatuses = (count: number): PumpStatus[] => Array(count).fill('compliant');

const isScorableQuestion = (questionId: string): boolean => {
  const question = QUESTION_BY_ID.get(questionId);
  if (!question) {
    return false;
  }

  return question.maxPoints > 0 || question.options.some((option) => option.points !== '-');
};

const calculateScoreSummary = (answers: SelectedAnswers): InspectionScoreSummary => {
  let liveScore = 0;
  let totalPossibleScore = 0;
  let totalQuestions = 0;

  ALL_QUESTIONS.forEach((question) => {
    if (isScorableQuestion(question.id)) {
      totalQuestions += 1;
    }

    const selectedAnswerText = answers[question.id];
    let isApplicable = true;

    if (selectedAnswerText) {
      const selectedOption = question.options.find((option) => option.text === selectedAnswerText);
      if (selectedOption) {
        if (typeof selectedOption.points === 'number') {
          liveScore += selectedOption.points;
        }
        if (selectedOption.points === 'N/A') {
          isApplicable = false;
        }
      }
    }

    if (isApplicable) {
      totalPossibleScore += question.maxPoints;
    }
  });

  const answeredQuestions = Object.keys(answers).filter((questionId) => isScorableQuestion(questionId)).length;

  return {
    liveScore,
    totalPossibleScore,
    totalQuestions,
    answeredQuestions,
  };
};

const clampPumpCount = (count: number): number => Math.max(MIN_PUMP_COUNT, Math.min(MAX_PUMP_COUNT, count));

const resizePumpStatuses = (currentStatuses: PumpStatus[], desiredCount: number): PumpStatus[] => {
  const nextStatuses = createDefaultPumpStatuses(desiredCount);
  for (let index = 0; index < Math.min(currentStatuses.length, desiredCount); index += 1) {
    nextStatuses[index] = currentStatuses[index];
  }
  return nextStatuses;
};

const isLocationName = (value: string): value is LocationName => LOCATIONS.includes(value as LocationName);

const App: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [numericInputValues, setNumericInputValues] = useState<NumericInputValues>({});
  const [comments, setComments] = useState<Comments>({});
  const [photos, setPhotos] = useState<Photos>({});
  const [openSectionId, setOpenSectionId] = useState<string | null>(FIRST_SECTION_ID);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [allSectionsOpenForPdf, setAllSectionsOpenForPdf] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationName>(LOCATIONS[0]);

  const [inspectorName, setInspectorName] = useState<string>('');
  const [inspectionDate, setInspectionDate] = useState<string>(getTodayIsoDate());

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeQuestionIdForPhoto, setActiveQuestionIdForPhoto] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<InspectionDraft | null>(null);
  const [recordsForDate, setRecordsForDate] = useState<InspectionDraft[]>([]);
  
  // State for the new Pump Compliance feature
  const [numberOfPumps, setNumberOfPumps] = useState<number>(DEFAULT_PUMP_COUNT);
  const [pumpStatuses, setPumpStatuses] = useState<PumpStatus[]>(createDefaultPumpStatuses(DEFAULT_PUMP_COUNT));

  const handleNumberOfPumpsChange = useCallback((newCount: number) => {
    const clampedCount = clampPumpCount(newCount);
    setNumberOfPumps(clampedCount);
    setPumpStatuses((currentStatuses) => resizePumpStatuses(currentStatuses, clampedCount));
  }, []);

  const handlePumpStatusChange = useCallback((pumpIndex: number) => {
    setPumpStatuses(currentStatuses => {
        const newStatuses = [...currentStatuses];
        newStatuses[pumpIndex] = newStatuses[pumpIndex] === 'compliant' ? 'non-compliant' : 'compliant';
        return newStatuses;
    });
  }, []);

  const handleInspectorNameChange = useCallback((name: string) => {
    setInspectorName(name);
  }, []);

  const clearInspectionForm = useCallback(() => {
    setSelectedAnswers({});
    setNumericInputValues({});
    setComments({});
    setPhotos({});
    setNumberOfPumps(DEFAULT_PUMP_COUNT);
    setPumpStatuses(createDefaultPumpStatuses(DEFAULT_PUMP_COUNT));
    setOpenSectionId(FIRST_SECTION_ID);
    setActiveDraft(null);
  }, []);

  const handleInspectionDateChange = useCallback((date: string) => {
    setInspectionDate(date);
    clearInspectionForm();
  }, [clearInspectionForm]);

  const handleAnswerChange = useCallback((questionId: string, answerText: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerText }));
  }, []);

  const handleNumericInputChange = useCallback((questionId:string, value: string) => {
    setNumericInputValues(prev => ({ ...prev, [questionId]: value }));
  }, []);
  
  const handleCommentChange = useCallback((questionId: string, value: string) => {
    setComments(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const handleOpenCapture = useCallback((questionId: string) => {
    setActiveQuestionIdForPhoto(questionId);
    setIsCameraOpen(true);
  }, []);

  const handleCloseCapture = useCallback(() => {
    setIsCameraOpen(false);
    setActiveQuestionIdForPhoto(null);
  }, []);

  const handleAddPhoto = useCallback((photoDataUrl: string) => {
    if (activeQuestionIdForPhoto) {
      setPhotos((prev) => {
        const existingPhotos = prev[activeQuestionIdForPhoto] || [];
        if (existingPhotos.length >= MAX_PHOTOS_PER_QUESTION) {
          setToast({ message: `Maximum ${MAX_PHOTOS_PER_QUESTION} photos per question.`, type: 'error' });
          return prev;
        }
        return {
          ...prev,
          [activeQuestionIdForPhoto]: [...existingPhotos, photoDataUrl]
        };
      });
    }
    handleCloseCapture();
  }, [activeQuestionIdForPhoto, handleCloseCapture]);

  const handleRemovePhoto = useCallback((questionId: string, photoIndex: number) => {
    setPhotos(prev => {
      const existingPhotos = prev[questionId] || [];
      const updatedPhotos = existingPhotos.filter((_, index) => index !== photoIndex);
      return {
        ...prev,
        [questionId]: updatedPhotos
      };
    });
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSectionId(prevOpenId => {
      const newOpenId = prevOpenId === sectionId ? null : sectionId;
      
      // If we are opening a section (newOpenId is not null)
      if (newOpenId) {
        // Use a timeout to allow the DOM to update before trying to scroll
        setTimeout(() => {
          const sectionElement = document.getElementById(`section-wrapper-${sectionId}`);
          if (sectionElement) {
            const headerElement = document.querySelector<HTMLElement>('.sticky.top-0'); // The sticky ScoreHeader
            const headerHeight = headerElement ? headerElement.offsetHeight : 0;
            const elementPosition = sectionElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerHeight - 16; // 16px for extra space

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }, 100);
      }
      
      return newOpenId;
    });
  }, []);
  
  const handleLocationChange = useCallback((newLocation: string) => {
    if (!isLocationName(newLocation)) {
      return;
    }

    if (newLocation !== selectedLocation) {
      setSelectedLocation(newLocation);
      clearInspectionForm();
    }
  }, [clearInspectionForm, selectedLocation]);

  const { liveScore, totalPossibleScore, totalQuestions, answeredQuestions } = useMemo(() => {
    return calculateScoreSummary(selectedAnswers);
  }, [selectedAnswers]);

  const isFormComplete = totalQuestions > 0 && totalQuestions === answeredQuestions;

  const loadRecordsForDate = useCallback(async (targetDate: string) => {
    try {
      const records = await localInspectionRepository.listByDate(targetDate);
      setRecordsForDate(records);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load saved inspections.';
      setToast({ message: errorMessage, type: 'error' });
    }
  }, []);

  const hydrateFormFromRecord = useCallback((record: InspectionDraft) => {
    const payload = record.payload;

    if (isLocationName(payload.locationName)) {
      setSelectedLocation(payload.locationName);
    }
    setInspectorName(payload.inspectorName || '');
    setInspectionDate(payload.inspectionDate || getTodayIsoDate());
    setSelectedAnswers(payload.selectedAnswers || {});
    setNumericInputValues(payload.numericInputValues || {});
    setComments(payload.comments || {});
    setPhotos(payload.photos || {});
    setNumberOfPumps(payload.numberOfPumps || DEFAULT_PUMP_COUNT);
    setPumpStatuses(payload.pumpStatuses?.length ? payload.pumpStatuses : createDefaultPumpStatuses(DEFAULT_PUMP_COUNT));
    setOpenSectionId(FIRST_SECTION_ID);
    setActiveDraft(record.recordType === 'draft' ? record : null);
  }, []);

  const buildDraftPayload = useCallback((): InspectionSavePayload => ({
    locationName: selectedLocation,
    inspectorName,
    inspectionDate,
    selectedAnswers,
    numericInputValues,
    comments,
    photos,
    numberOfPumps,
    pumpStatuses,
    liveScore,
    totalPossibleScore,
    savedAt: new Date().toISOString(),
  }), [
    comments,
    inspectionDate,
    inspectorName,
    liveScore,
    numberOfPumps,
    numericInputValues,
    photos,
    pumpStatuses,
    selectedAnswers,
    selectedLocation,
    totalPossibleScore,
  ]);

  const saveDraftInternal = useCallback(async (shouldNotify: boolean): Promise<void> => {
    const payload = buildDraftPayload();

    const draft = activeDraft
      ? createInspectionDraftFromExisting(payload, activeDraft)
      : createInspectionDraft(payload);

    try {
      const savedDraft = await localInspectionRepository.saveDraft(draft);
      setActiveDraft(savedDraft);
      await loadRecordsForDate(savedDraft.payload.inspectionDate);

      if (shouldNotify) {
        setToast({ message: `Draft saved for ${selectedLocation}.`, type: 'success' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to save audit.';
      if (shouldNotify) {
        setToast({ message: `Save failed: ${errorMessage}`, type: 'error' });
      }
    }
  }, [
    activeDraft,
    buildDraftPayload,
    loadRecordsForDate,
    selectedLocation,
  ]);

  const handleSaveAudit = useCallback(async () => {
    await saveDraftInternal(true);
  }, [saveDraftInternal]);

  useEffect(() => {
    void loadRecordsForDate(inspectionDate);
  }, [inspectionDate, loadRecordsForDate]);

  const handleOpenDraft = useCallback((draft: InspectionDraft) => {
    hydrateFormFromRecord(draft);
    setToast({ message: 'Draft loaded. Continue your inspection.', type: 'success' });
  }, [hydrateFormFromRecord]);

  const handleSaveInspection = useCallback(async () => {
    if (!isFormComplete) {
      setToast({ message: 'Complete all scorable questions before saving inspection.', type: 'error' });
      return;
    }

    try {
      const savedRecord = await localInspectionRepository.saveInspection(buildDraftPayload(), activeDraft?.id);
      await loadRecordsForDate(savedRecord.payload.inspectionDate);
      clearInspectionForm();
      setToast({ message: `Inspection saved for ${savedRecord.payload.locationName}. Ready for a new inspection.`, type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to save inspection.';
      setToast({ message: `Save failed: ${errorMessage}`, type: 'error' });
    }
  }, [activeDraft?.id, buildDraftPayload, clearInspectionForm, isFormComplete, loadRecordsForDate]);

  const handleStartNewInspection = useCallback(() => {
    clearInspectionForm();
    setToast({ message: 'Started a fresh inspection for selected station/date.', type: 'success' });
  }, [clearInspectionForm]);

  const handleDeleteDraft = useCallback(async (draftId: string) => {
    try {
      await localInspectionRepository.deleteDraft(draftId);
      if (activeDraft?.id === draftId) {
        clearInspectionForm();
      }
      await loadRecordsForDate(inspectionDate);
      setToast({ message: 'Draft deleted.', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to delete draft.';
      setToast({ message: errorMessage, type: 'error' });
    }
  }, [activeDraft?.id, clearInspectionForm, inspectionDate, loadRecordsForDate]);

  const draftsForDate = useMemo(
    () => recordsForDate.filter((record) => record.recordType === 'draft'),
    [recordsForDate]
  );

  const completedForDate = useMemo(
    () => recordsForDate.filter((record) => record.recordType === 'completed'),
    [recordsForDate]
  );

  const handleDownloadPdf = async () => {
    setAllSectionsOpenForPdf(true);
    setIsGeneratingPdf(true);
    
    // Brief delay to allow UI to re-render with all sections open for capture
    await new Promise(resolve => setTimeout(resolve, 100));

    let pumpComplianceImage: string | null = null;
    try {
        const pumpElement = document.getElementById('pump-compliance-visual-for-pdf');
        if (pumpElement && window.html2canvas) {
           const canvas = await window.html2canvas(pumpElement, {
                scale: 2, // Higher resolution
                backgroundColor: '#f9fafb', // Match accordion background
           });
           pumpComplianceImage = canvas.toDataURL('image/png');
        }
    } catch (error) {
       console.error("Error capturing pump compliance element with html2canvas:", error);
    }

    try {
        await generatePdf({
          locationName: selectedLocation,
          inspectorName,
          inspectionDate,
          liveScore,
          totalPossibleScore,
          sections: INSPECTION_DATA.filter(s => s.id !== 'pump_compliance'), // Exclude placeholder section
          answers: selectedAnswers,
          comments,
          photos,
          pumpComplianceImage
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setToast({ message: `PDF Generation Failed: ${errorMessage}`, type: 'error' });
        console.error("Error generating PDF:", error);
    } finally {
        setIsGeneratingPdf(false);
        setAllSectionsOpenForPdf(false);
    }
  };


  return (
    <div id="app-container" className="min-h-screen bg-gray-100 text-gray-800">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
       {isCameraOpen && (
        <CameraModal
          onCapture={handleAddPhoto}
          onClose={handleCloseCapture}
        />
      )}
      <ScoreHeader
        liveScore={liveScore}
        totalPossibleScore={totalPossibleScore}
        locations={LOCATIONS}
        selectedLocation={selectedLocation}
        onLocationChange={handleLocationChange}
      />
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <AuditInfo
          inspectorName={inspectorName}
          inspectionDate={inspectionDate}
          onInspectorNameChange={handleInspectorNameChange}
          onInspectionDateChange={handleInspectionDateChange}
        />
        <ProgressTracker current={answeredQuestions} total={totalQuestions} />
        {INSPECTION_DATA.map(section => (
          <div id={`section-wrapper-${section.id}`} key={section.id}>
            <AccordionItem
              title={section.title}
              isOpen={openSectionId === section.id}
              onToggle={() => toggleSection(section.id)}
              forceOpen={allSectionsOpenForPdf}
            >
              {section.id === 'pump_compliance' ? (
                <PumpCompliance
                  numberOfPumps={numberOfPumps}
                  pumpStatuses={pumpStatuses}
                  onNumberOfPumpsChange={handleNumberOfPumpsChange}
                  onPumpStatusChange={handlePumpStatusChange}
                />
              ) : (
                section.questions.map(question => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    selectedAnswer={selectedAnswers[question.id]}
                    numericValue={numericInputValues[question.id]}
                    comment={comments[question.id]}
                    photos={photos[question.id]}
                    onAnswerChange={handleAnswerChange}
                    onCommentChange={handleCommentChange}
                    onNumericInputChange={question.type === 'numericInput' ? handleNumericInputChange : undefined}
                    onAddPhotoClick={handleOpenCapture}
                    onRemovePhoto={handleRemovePhoto}
                  />
                ))
              )}
            </AccordionItem>
          </div>
        ))}
        <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            id="submit-audit-button"
            onClick={handleSaveAudit}
            className="w-full sm:w-auto flex-grow text-white font-bold py-3 px-6 rounded-lg shadow-md hover:opacity-90 transition-opacity duration-150 text-lg disabled:cursor-not-allowed"
            style={{ backgroundColor: isGeneratingPdf ? '#9CA3AF' /* gray-400 */ : ACCENT_COLOR }}
            disabled={isGeneratingPdf}
          >
            Save Draft
          </button>
          <button
            id="save-inspection-button"
            onClick={handleSaveInspection}
            className="w-full sm:w-auto flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-150 text-lg disabled:opacity-50"
            disabled={isGeneratingPdf || !isFormComplete}
          >
            Save Inspection
          </button>
          <button
            id="start-new-inspection-button"
            onClick={handleStartNewInspection}
            className="w-full sm:w-auto flex-grow bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-150 text-lg"
            disabled={isGeneratingPdf}
          >
            Start New
          </button>
          <button
            id="download-pdf-button"
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto flex-grow bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-150 text-lg disabled:opacity-50"
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? 'Generating PDF...' : 'Download as PDF'}
          </button>
        </div>

        <section className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800">Saved Inspections for {inspectionDate}</h2>

          <div className="mt-4">
            <h3 className="text-md font-semibold text-gray-700">Drafts</h3>
            {draftsForDate.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">No drafts for this date.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {draftsForDate.map((record) => (
                  <li key={record.id} className="border border-gray-200 rounded-md p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800">{record.payload.locationName}</p>
                      <p className="text-xs text-gray-500">Updated: {new Date(record.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDraft(record)}
                        className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
                      >
                        Open Draft
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(record.id)}
                        className="px-3 py-1.5 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-700">Completed</h3>
            {completedForDate.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">No completed inspections for this date.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {completedForDate.map((record) => (
                  <li key={record.id} className="border border-gray-200 rounded-md p-3">
                    <p className="font-medium text-gray-800">{record.payload.locationName}</p>
                    <p className="text-sm text-gray-600">Score: {record.payload.liveScore} / {record.payload.totalPossibleScore}</p>
                    <p className="text-xs text-gray-500">Saved: {new Date(record.completedAt || record.updatedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <footer className="text-center p-4 text-sm text-gray-500 mt-8">
        © {new Date().getFullYear()} JKPG AIMZTECH Site Inspection App
      </footer>
    </div>
  );
};

export default App;
