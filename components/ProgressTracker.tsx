import React from 'react';
import { ACCENT_COLOR } from '../constants';

interface ProgressTrackerProps {
  current: number;
  total: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ current, total }) => {
  const progressPercentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-semibold text-gray-700">Audit Progress</h3>
        <p className="text-sm font-medium text-gray-600">
          {current} / {total} Answered
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%`, backgroundColor: ACCENT_COLOR }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressTracker;