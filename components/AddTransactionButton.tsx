import React, { useState, useRef } from 'react';
import type { FC } from 'react';
import { ActionType, ActiveView } from '../types';


interface AddTransactionButtonProps {
  onQuickAdd: () => void;
  onSelectType: (type: ActionType) => void;
  activeView: ActiveView;
}

const AddTransactionButton: FC<AddTransactionButtonProps> = ({ onQuickAdd, onSelectType, activeView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pressTimer = useRef<number | null>(null);
  // This ref acts as a lock to prevent both a tap and a long-press action
  // from firing during the same user interaction.
  const actionTriggered = useRef(false);

  const handleSelect = async (type: ActionType) => {
    try {
      onSelectType(type);
      setIsOpen(false);
    } catch (error) {
      console.error('Error tracking option selection:', error);
    }
  };

  const handlePressStart = () => {
    actionTriggered.current = false; // Reset on new press
    pressTimer.current = window.setTimeout(() => {
      // If a tap action hasn't already been triggered, execute the long-press action.
      if (actionTriggered.current === false) {
        actionTriggered.current = true;
        setIsOpen(true); // Open menu on long press
      }
    }, 350); // ms threshold for long press
  };

  const handlePressEnd = () => {
    // If the timer is still running, it means it was a short press.
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // If no action has been triggered yet (i.e., it wasn't a long press).
    if (actionTriggered.current === false) {
      actionTriggered.current = true;
      if (isOpen) {
        // If the menu is already open, a quick tap on the button closes it.
        setIsOpen(false);
      } else {
        // If the menu is closed, a quick tap triggers the default action.
        onQuickAdd();
      }
    }
  };
  
  const baseButtonClasses = "flex items-center gap-3 w-max bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-full shadow-lg transform transition-all duration-200 ease-out";
  
  const fabOptionClasses = (isOpenState: boolean, delay: string) => 
    `${baseButtonClasses} ${isOpenState ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${delay}`;

  const getQuickAddLabel = () => {
    switch (activeView) {
        case 'transactions': return 'Add Expense';
        case 'debts': return 'Add Debt';
        case 'investments': return 'Add Investment';
        default: return 'Add Item';
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-30 ${!isOpen ? 'pointer-events-none' : ''}`}>
      {/* This container now handles pointer events to prevent blocking clicks when closed */}
      <div className={`relative flex flex-col items-end ${!isOpen ? 'pointer-events-none' : ''}`}>
        {/* Action Buttons Container */}
        <div 
          className={`flex flex-col items-end mb-4 space-y-3 transition-opacity duration-300 ${!isOpen ? 'opacity-0' : 'opacity-100'}`}
          aria-hidden={!isOpen}
        >
          <button 
            onClick={() => handleSelect(ActionType.INVESTMENT)} 
            className={`${fabOptionClasses(isOpen, 'delay-150')} hover:scale-105 hover:bg-purple-100 dark:hover:bg-purple-600`}
            tabIndex={isOpen ? 0 : -1}
          >
            Investment / முதலீடு
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </button>
          <button 
            onClick={() => handleSelect(ActionType.DEBT)} 
            className={`${fabOptionClasses(isOpen, 'delay-100')} hover:scale-105 hover:bg-blue-100 dark:hover:bg-blue-600`}
            tabIndex={isOpen ? 0 : -1}
          >
            Debt / கடன்
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 9m18 3V9" />
            </svg>
          </button>
          <button 
            onClick={() => handleSelect(ActionType.TRANSACTION)} 
            className={`${fabOptionClasses(isOpen, 'delay-75')} hover:scale-105 hover:bg-green-100 dark:hover:bg-green-600`}
            tabIndex={isOpen ? 0 : -1}
          >
            Transaction / பரிவர்த்தனை
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
        
        {/* Main FAB - remains clickable due to pointer-events-auto */}
        <button
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          // Prevent default context menu on long press
          onContextMenu={(e) => e.preventDefault()}
          className={`btn-press flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 transition-all duration-300 transform pointer-events-auto ${isOpen ? 'rotate-45' : 'hover:scale-110'}`}
          aria-label={`${getQuickAddLabel()} (long-press for more options)`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AddTransactionButton;