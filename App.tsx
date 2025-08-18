
import React, { useState, useCallback, useMemo } from 'react';
import { INSPECTION_DATA, ACCENT_COLOR, LOCATIONS } from './constants';
import { SelectedAnswers, NumericInputValues, Comments, Photos, PumpStatus } from './types';
import ScoreHeader from './components/ScoreHeader';
import AccordionItem from './components/AccordionItem';
import QuestionCard from './components/QuestionCard';
import PumpCompliance from './components/PumpCompliance';
import ProgressTracker from './components/ProgressTracker';
import Toast from './components/Toast';
import CameraModal from './components/CameraModal';
import AuditInfo from './components/AuditInfo';
import { generatePdf } from './utils/pdf';

const App: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [numericInputValues, setNumericInputValues] = useState<NumericInputValues>({});
  const [comments, setComments] = useState<Comments>({});
  const [photos, setPhotos] = useState<Photos>({});
  const [openSectionId, setOpenSectionId] = useState<string | null>(INSPECTION_DATA.length > 0 ? INSPECTION_DATA[0].id : null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [allSectionsOpenForPdf, setAllSectionsOpenForPdf] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>(LOCATIONS[0]);

  const [inspectorName, setInspectorName] = useState<string>('');
  const [inspectionDate, setInspectionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeQuestionIdForPhoto, setActiveQuestionIdForPhoto] = useState<string | null>(null);
  
  // State for the new Pump Compliance feature
  const [numberOfPumps, setNumberOfPumps] = useState<number>(10);
  const [pumpStatuses, setPumpStatuses] = useState<PumpStatus[]>(Array(10).fill('compliant'));

  const handleNumberOfPumpsChange = useCallback((newCount: number) => {
    const clampedCount = Math.max(1, Math.min(20, newCount)); // Clamp between 1 and 20
    setNumberOfPumps(clampedCount);
    setPumpStatuses(currentStatuses => {
        const newStatuses: PumpStatus[] = Array(clampedCount).fill('compliant');
        // Preserve old statuses if possible
        for (let i = 0; i < Math.min(currentStatuses.length, clampedCount); i++) {
            newStatuses[i] = currentStatuses[i];
        }
        return newStatuses;
    });
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

  const handleInspectionDateChange = useCallback((date: string) => {
    setInspectionDate(date);
  }, []);

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
      setPhotos(prev => {
        const existingPhotos = prev[activeQuestionIdForPhoto] || [];
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
  
  const handleLocationChange = (newLocation: string) => {
    if (newLocation !== selectedLocation) {
      // Reset the state for a new inspection
      setSelectedLocation(newLocation);
      setSelectedAnswers({});
      setNumericInputValues({});
      setComments({});
      setPhotos({});
      setNumberOfPumps(10); // Reset pumps
      setPumpStatuses(Array(10).fill('compliant'));
      setOpenSectionId(INSPECTION_DATA.length > 0 ? INSPECTION_DATA[0].id : null);
      setToast(null); // Clear any existing toasts
      setInspectorName('');
      setInspectionDate(new Date().toISOString().split('T')[0]);
    }
  };

  const { liveScore, totalPossibleScore, totalQuestions, answeredQuestions } = useMemo(() => {
    let currentLiveScore = 0;
    let currentTotalPossibleScore = 0;
    let totalQuestionsCount = 0;

    INSPECTION_DATA.forEach(section => {
      section.questions.forEach(question => {
        if (question.maxPoints > 0 || question.options.some(o => o.points !== '-')) {
             totalQuestionsCount++;
        }
        
        const selectedAnswerText = selectedAnswers[question.id];
        let isApplicable = true;

        if (selectedAnswerText) {
          const selectedOption = question.options.find(opt => opt.text === selectedAnswerText);
          if (selectedOption) {
            if (typeof selectedOption.points === 'number') {
              currentLiveScore += selectedOption.points;
            }
            if (selectedOption.points === 'N/A') {
              isApplicable = false;
            }
          }
        }
        
        if (isApplicable) {
          currentTotalPossibleScore += question.maxPoints;
        }
      });
    });
    const answeredCount = Object.keys(selectedAnswers).filter(qId => {
      const question = INSPECTION_DATA.flatMap(s => s.questions).find(q => q.id === qId);
      return question ? (question.maxPoints > 0 || question.options.some(o => o.points !== '-')) : false;
    }).length;

    return { 
      liveScore: currentLiveScore, 
      totalPossibleScore: currentTotalPossibleScore,
      totalQuestions: totalQuestionsCount,
      answeredQuestions: answeredCount
    };
  }, [selectedAnswers]);

  const isFormComplete = totalQuestions > 0 && totalQuestions === answeredQuestions;

  const handleSaveAudit = () => {
    if (!isFormComplete) return;
    console.log("Audit Saved:", { selectedLocation, inspectorName, inspectionDate, selectedAnswers, numericInputValues, comments, photos, liveScore, totalPossibleScore, numberOfPumps, pumpStatuses });
    setToast({ message: `Audit for ${selectedLocation} Saved! Score: ${liveScore} / ${totalPossibleScore}`, type: 'success' });
  };

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
            style={{ backgroundColor: (!isFormComplete || isGeneratingPdf) ? '#9CA3AF' /* gray-400 */ : ACCENT_COLOR }}
            disabled={!isFormComplete || isGeneratingPdf}
          >
            Save Audit
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
      </main>
      <footer className="text-center p-4 text-sm text-gray-500 mt-8">
        © {new Date().getFullYear()} JKPG AIMZTECH Site Inspection App
      </footer>
    </div>
  );
};

export default App;
