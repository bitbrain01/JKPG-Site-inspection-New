import React from 'react';
import { Question, AnswerOption } from '../types';
import { ACCENT_COLOR } from '../constants';
import { CameraIcon, XCircleIcon, CheckCircleIcon } from './icons';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: string;
  numericValue?: string;
  comment?: string;
  photos?: string[];
  onAnswerChange: (questionId: string, answerText: string) => void;
  onNumericInputChange?: (questionId: string, value: string) => void;
  onCommentChange: (questionId: string, comment: string) => void;
  onAddPhotoClick: (questionId: string) => void;
  onRemovePhoto: (questionId: string, photoIndex: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  numericValue,
  comment,
  photos,
  onAnswerChange,
  onNumericInputChange,
  onCommentChange,
  onAddPhotoClick,
  onRemovePhoto,
}) => {
  const showNumericInput =
    question.type === 'numericInput' &&
    question.conditionalNumericInputTriggers?.includes(selectedAnswer || '');

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onNumericInputChange) {
      onNumericInputChange(question.id, e.target.value);
    }
  };

  const getOptionStyling = (option: AnswerOption): string => {
    let baseClasses = 'flex justify-between items-center p-3 my-1.5 rounded-md border cursor-pointer transition-all duration-150';
    let stateClasses = '';

    if (selectedAnswer === option.text) {
      stateClasses = 'ring-2 shadow-md '; // Base selected style
      if (option.isPositive) {
        stateClasses += `ring-green-500 border-green-500 bg-green-50`;
      } else if (option.points !== 'N/A' && typeof option.points === 'number' && option.points === 0) {
        stateClasses += 'ring-red-300 border-red-300 bg-red-50';
      } else if (option.points === 'N/A') {
        stateClasses += 'ring-yellow-400 border-yellow-400 bg-yellow-50';
      } else { // Default selected state (neither explicitly positive, negative (0 points), nor N/A)
        stateClasses += `ring-green-500 border-green-500 bg-green-50`;
      }
    } else {
      stateClasses = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'; // Not selected
    }
    return `${baseClasses} ${stateClasses}`;
  };


  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 transition-all duration-300 hover:shadow-lg border border-gray-100">
      <div className="flex items-start mb-3">
        <span
          className="px-3 py-1 text-sm font-bold text-white rounded-full mr-3 shrink-0"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          {question.id}
        </span>
        <h3 className="text-md sm:text-lg font-medium text-gray-800">{question.text}</h3>
      </div>

      <div role="radiogroup" aria-labelledby={`question-${question.id}-label`}>
        <span id={`question-${question.id}-label`} className="sr-only">{question.text}</span>
        {question.options.map((option) => {
            const isSelected = selectedAnswer === option.text;
            
            let textStyle = 'font-medium';
            if (isSelected) {
                textStyle = 'font-semibold ';
                if (option.isPositive || (typeof option.points === 'number' && option.points > 0)) {
                    textStyle += 'text-green-700';
                } else if (typeof option.points === 'number' && option.points === 0) {
                    textStyle += 'text-red-700';
                } else if (option.points === 'N/A') {
                    textStyle += 'text-yellow-800';
                } else {
                    textStyle += 'text-gray-900';
                }
            }
            
            return (
              <label
                key={option.text}
                className={getOptionStyling(option)}
                onClick={() => onAnswerChange(question.id, option.text)}
              >
                <div className="flex items-center">
                   {isSelected && option.points !== 'N/A' ? (
                     <>
                        { (typeof option.points === 'number' && option.points === 0) ? (
                            <XCircleIcon className="w-6 h-6 mr-3 text-red-500 shrink-0" />
                        ) : (
                            <CheckCircleIcon className="w-6 h-6 mr-3 text-green-500 shrink-0" />
                        )}
                     </>
                  ) : (
                     <input
                        type="radio"
                        name={question.id}
                        value={option.text}
                        checked={isSelected}
                        onChange={() => onAnswerChange(question.id, option.text)}
                        className="h-4 w-4 mr-3 focus:ring-offset-0 focus:ring-2 shrink-0"
                        style={{ accentColor: option.points === 'N/A' ? '#f59e0b' /* yellow-500 */ : ACCENT_COLOR }}
                      />
                  )}
                  <span className={`text-sm sm:text-base ${textStyle}`}>
                    {option.text}
                  </span>
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium py-0.5 px-2 rounded-full
                    ${option.points === 'N/A' ? 'bg-yellow-100 text-yellow-700' :
                      (typeof option.points === 'number' && option.points > 0 && option.isPositive) ? 'bg-green-100 text-green-700' :
                      (typeof option.points === 'number' && option.points === 0) ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}
                >
                  {option.points}
                </span>
              </label>
            );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200/80">
        <label htmlFor={`comment-${question.id}`} className="block text-sm font-medium text-gray-700 mb-1">
          Comment
        </label>
        <textarea
          id={`comment-${question.id}`}
          rows={3}
          value={comment || ''}
          onChange={(e) => onCommentChange(question.id, e.target.value)}
          placeholder="Add any relevant details, observations, or required actions..."
          className="mt-1 block w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm transition-shadow duration-150"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200/80">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
          {photos?.map((photo, index) => (
            <div key={index} className="relative group">
              <img src={photo} alt={`Evidence photo ${index + 1}`} className="w-full h-24 object-cover rounded-md border border-gray-200" />
              <button
                onClick={() => onRemovePhoto(question.id, index)}
                className="absolute top-0.5 right-0.5 bg-black bg-opacity-50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => onAddPhotoClick(question.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-500 transition-colors"
        >
          <CameraIcon className="w-5 h-5" />
          Add Photo
        </button>
      </div>
      
      {showNumericInput && onNumericInputChange && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <label htmlFor={`numeric-input-${question.id}`} className="block text-sm font-medium text-gray-700 mb-1">
            Number of lights out or flickering:
          </label>
          <input
            type="number"
            id={`numeric-input-${question.id}`}
            value={numericValue || ''}
            onChange={handleNumericChange}
            className="mt-1 block w-full sm:w-1/2 px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm"
            min="0"
          />
        </div>
      )}
    </div>
  );
};

export default QuestionCard;