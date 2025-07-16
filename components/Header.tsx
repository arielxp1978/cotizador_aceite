import React from 'react';
import { CalculatorIcon, LoadingSpinner, RefreshIcon } from './IconComponents';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading }) => {
  return (
    <header className="bg-gray-900/70 backdrop-blur-lg sticky top-0 z-20 shadow-lg shadow-indigo-500/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CalculatorIcon className="w-10 h-10 text-indigo-400" />
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Cotizador de Cambio de Aceite
          </h1>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-colors text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
          aria-label="Actualizar datos"
        >
          {isLoading ? (
            <LoadingSpinner className="w-5 h-5" />
          ) : (
            <RefreshIcon className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
