import React from 'react';

interface AuditInfoProps {
  inspectorName: string;
  inspectionDate: string;
  onInspectorNameChange: (name: string) => void;
  onInspectionDateChange: (date: string) => void;
}

const AuditInfo: React.FC<AuditInfoProps> = ({
  inspectorName,
  inspectionDate,
  onInspectorNameChange,
  onInspectionDateChange,
}) => {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="inspector-name" className="block text-sm font-medium text-gray-700 mb-1">
          Inspector's Name
        </label>
        <input
          type="text"
          id="inspector-name"
          value={inspectorName}
          onChange={(e) => onInspectorNameChange(e.target.value)}
          placeholder="Enter your name"
          className="mt-1 block w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm transition-shadow duration-150"
        />
      </div>
      <div>
        <label htmlFor="inspection-date" className="block text-sm font-medium text-gray-700 mb-1">
          Inspection Date
        </label>
        <input
          type="date"
          id="inspection-date"
          value={inspectionDate}
          onChange={(e) => onInspectionDateChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-sm transition-shadow duration-150"
        />
      </div>
    </div>
  );
};

export default AuditInfo;
