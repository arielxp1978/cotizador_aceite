import React, { useState, useEffect } from 'react';
import { CalculatorIcon, LoadingSpinner, RefreshIcon, CheckCircleIcon, XCircleIcon } from './IconComponents';

const WEBHOOK_URL = 'https://n8n.srv803796.hstgr.cloud/webhook/7c15387b-d281-4b09-ba78-273acc11a311';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (syncStatus !== 'idle') {
      const timer = setTimeout(() => setSyncStatus('idle'), 3000); // Reset status after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  const handleSync = async () => {
    if (isSyncing || isLoading) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      // Ahora que CORS está configurado en el servidor de n8n,
      // podemos hacer una solicitud normal y leer la respuesta.
      const response = await fetch(WEBHOOK_URL, {
        method: 'GET', // Cambiado a GET para coincidir con la configuración del webhook
      });
      
      // Verificamos si la respuesta del servidor fue exitosa (ej: status 200).
      if (!response.ok) {
        throw new Error(`El servidor de n8n respondió con un error: ${response.statusText}`);
      }
      
      // Si la respuesta es OK, significa que el flujo de n8n se completó correctamente.
      setSyncStatus('success');

    } catch (error) {
      // Este bloque ahora captura errores de red o respuestas de error del servidor.
      console.error("Error al sincronizar con el webhook de n8n:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.ctrlKey || event.metaKey) { // metaKey for Command on Mac
      event.preventDefault();
      handleSync();
    } else {
      onRefresh();
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return { icon: <LoadingSpinner className="w-5 h-5" />, text: 'Actualizando...', style: 'bg-indigo-900/50' };
    }
    if (isSyncing) {
      return { icon: <LoadingSpinner className="w-5 h-5" />, text: 'Sincronizando...', style: 'bg-indigo-900/50' };
    }
    if (syncStatus === 'success') {
      // Ahora este estado es una confirmación real del servidor.
      return { icon: <CheckCircleIcon className="w-5 h-5" />, text: 'Sincronizado', style: 'bg-green-600' };
    }
    if (syncStatus === 'error') {
      return { icon: <XCircleIcon className="w-5 h-5" />, text: 'Error de Sinc.', style: 'bg-red-600' };
    }
    return { icon: <RefreshIcon className="w-5 h-5" />, text: 'Actualizar', style: 'bg-indigo-600/80 hover:bg-indigo-600' };
  };

  const { icon, text, style } = getButtonContent();

  return (
    <header className="bg-gray-900/70 backdrop-blur-lg sticky top-0 z-20 shadow-lg shadow-indigo-500/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CalculatorIcon className="w-10 h-10 text-indigo-400" />
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Cotizador de Cambio de Aceite
          </h1>
        </div>
        
        <div className="relative group">
          <button
            onClick={handleClick}
            disabled={isLoading || isSyncing}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg disabled:cursor-not-allowed transition-all duration-300 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${style}`}
            aria-label="Actualizar datos"
          >
            {icon}
            <span className="hidden sm:inline">{text}</span>
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 text-xs font-medium text-white bg-gray-900/80 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <span className="font-bold">Ctrl + Click</span> para sincronizar con la base de datos central.
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/80"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;