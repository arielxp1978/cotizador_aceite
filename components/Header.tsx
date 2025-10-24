import React, { useState, useRef, useEffect } from 'react';
import { PriceLevel } from '../types';
import { RefreshIcon, LockIcon, UnlockIcon, ChevronDownIcon, CheckIcon } from './IconComponents';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  priceLevel: PriceLevel;
  unlockedLevels: PriceLevel[];
  onLevelChange: (level: PriceLevel) => void;
}

const levelLabels: Record<PriceLevel, string> = {
  publico: 'Público',
  taller: 'Taller',
  costo: 'Costo',
};

const priceLevels: PriceLevel[] = ['publico', 'taller', 'costo'];

const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading, priceLevel, unlockedLevels, onLevelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cierra el menú desplegable si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleSelect = (level: PriceLevel) => {
    onLevelChange(level);
    setIsOpen(false);
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">Cotizador Rápido</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative" ref={wrapperRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                aria-haspopup="true"
                aria-expanded={isOpen}
              >
                <span className="font-bold text-white">{levelLabels[priceLevel]}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-50 animate-fade-in-fast"
                  role="menu"
                >
                  {priceLevels.map((level) => {
                    const isUnlocked = unlockedLevels.includes(level);
                    const isActive = priceLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => handleSelect(level)}
                        className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-200 hover:bg-indigo-600/30 transition-colors"
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2">
                          {isUnlocked || level === 'publico' ? <UnlockIcon className="w-4 h-4 text-green-400" /> : <LockIcon className="w-4 h-4 text-red-400" />}
                          <span>{levelLabels[level]}</span>
                        </div>
                        {isActive && <CheckIcon className="w-5 h-5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition disabled:opacity-50 disabled:cursor-wait"
              aria-label="Actualizar datos"
            >
              <RefreshIcon className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      <style>{`.animate-fade-in-fast { animation: fade-in 0.1s ease-out forwards; } @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </header>
  );
};

export default Header;