import React from 'react';
import { ACCENT_COLOR } from '../constants';
import { CheckIconSolid } from './icons';

interface ScoreHeaderProps {
  liveScore: number;
  totalPossibleScore: number;
  locations: string[];
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}

const ScoreHeader: React.FC<ScoreHeaderProps> = ({ liveScore, totalPossibleScore, locations, selectedLocation, onLocationChange }) => {
  return (
    <div className="sticky top-0 bg-white shadow-lg p-4 z-20 border-b border-gray-200">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">
          <label htmlFor="location-select" className="sr-only">Select Location</label>
           <h1 className="text-xl sm:text-2xl font-bold text-gray-800 shrink-0">Site Inspection:</h1>
           <select
              id="location-select"
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="text-lg sm:text-xl font-bold p-2 rounded-md border-2 border-transparent focus:border-green-500 focus:outline-none focus:ring-green-500"
              style={{ color: ACCENT_COLOR, backgroundColor: '#f9fafb' /* gray-50 */ }}
            >
              {locations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
        </div>
        <div 
          className="text-lg font-semibold py-2 px-4 rounded-lg flex items-center shrink-0"
          style={{ backgroundColor: ACCENT_COLOR, color: 'white' }}
        >
          <CheckIconSolid className="w-5 h-5 mr-2" />
          Score: {liveScore} / {totalPossibleScore}
        </div>
      </div>
    </div>
  );
};

export default ScoreHeader;