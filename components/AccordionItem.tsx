
import React from 'react';
import { ChevronDownIcon } from './icons';
import { ACCENT_COLOR } from '../constants';

interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  forceOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, isOpen, onToggle, children, forceOpen = false }) => {
  const isEffectivelyOpen = forceOpen || isOpen;
  
  return (
    <div className="border border-gray-200 rounded-lg shadow-sm mb-3 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 text-left text-lg font-semibold focus:outline-none"
        style={{ color: isEffectivelyOpen ? ACCENT_COLOR : '#1f2937' /* gray-800 */ }}
        aria-expanded={isEffectivelyOpen}
      >
        {title}
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform duration-200 ${isEffectivelyOpen ? 'transform rotate-180' : ''}`}
        />
      </button>
      {isEffectivelyOpen && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionItem;