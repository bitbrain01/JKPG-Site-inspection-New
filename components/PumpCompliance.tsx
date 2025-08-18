import React from 'react';
import { PumpIcon, CheckIconSolid, AlertTriangleIcon, PlusIcon, MinusIcon } from './icons';
import { PumpStatus } from '../types';

interface PumpComplianceProps {
  numberOfPumps: number;
  pumpStatuses: PumpStatus[];
  onNumberOfPumpsChange: (newCount: number) => void;
  onPumpStatusChange: (pumpIndex: number) => void;
}

const PumpCompliance: React.FC<PumpComplianceProps> = ({
  numberOfPumps,
  pumpStatuses,
  onNumberOfPumpsChange,
  onPumpStatusChange,
}) => {
  const handleIncrease = () => onNumberOfPumpsChange(numberOfPumps + 1);
  const handleDecrease = () => onNumberOfPumpsChange(numberOfPumps - 1);

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 transition-all duration-300 border border-gray-100">
        {/* Controls for number of pumps */}
        <div className="flex items-center justify-between mb-4 print:hidden">
            <h3 className="text-md sm:text-lg font-medium text-gray-800">Set Number of Pumps</h3>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleDecrease} 
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    aria-label="Decrease number of pumps"
                >
                    <MinusIcon className="w-5 h-5 text-gray-700"/>
                </button>
                <span className="text-lg font-bold w-10 text-center" aria-live="polite">{numberOfPumps}</span>
                <button 
                    onClick={handleIncrease} 
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    aria-label="Increase number of pumps"
                >
                    <PlusIcon className="w-5 h-5 text-gray-700"/>
                </button>
            </div>
        </div>

        {/* Visual display for UI and PDF capture */}
        <div id="pump-compliance-visual-for-pdf" className="bg-gray-50 p-4 rounded-lg">
             <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Compliance of your pumps</h3>
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                 {pumpStatuses.map((status, index) => (
                     <button
                         key={index}
                         onClick={() => onPumpStatusChange(index)}
                         aria-label={`Pump ${index + 1}, status: ${status}. Click to change.`}
                         className={`relative rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            status === 'compliant' ? 'focus:ring-green-500' : 'focus:ring-orange-500'
                         }`}
                     >
                        {/* Pump number positioned over the pump graphic */}
                        <div className="absolute top-0 right-2 text-black font-extrabold text-base pointer-events-none">{index + 1}</div>
                        
                        {/* The colored pump icon itself */}
                        <PumpIcon className={`w-full h-auto ${status === 'compliant' ? 'text-green-500' : 'text-orange-500'}`} />

                        {/* The black status icon (check or alert) overlaid */}
                        <div className="absolute inset-0 flex items-center justify-center mt-4 pointer-events-none">
                            {status === 'compliant' ?
                                <CheckIconSolid className="w-8 h-8 sm:w-10 sm:h-10 text-black"/> :
                                <AlertTriangleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-black"/>
                            }
                        </div>
                     </button>
                 ))}
             </div>
        </div>
    </div>
  );
};

export default PumpCompliance;