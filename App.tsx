import React, { useState } from 'react';
import { VehiculoServicio, PriceLevel } from './types';
import { useVehicles } from './hooks/useVehicles';
import Header from './components/Header';
import { LoadingSpinner, OilCanIcon, BeltIcon, ArrowLeftIcon } from './components/IconComponents';
import VehicleSearch from './components/FilterSidebar';
import OilQuote from './components/VehicleCard'; 
import BeltQuote from './components/BeltQuote'; 
import Footer from './components/Footer';

const AuthModal: React.FC<{
  levelToUnlock: 'taller' | 'costo';
  onClose: () => void;
  onUnlock: (password: string) => void;
  error: string | null;
}> = ({ levelToUnlock, onClose, onUnlock, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnlock(password);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-fast">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-2">Acceso Restringido</h3>
        <p className="text-gray-400 mb-4">
          Introduce la clave para ver los precios de <span className="font-bold text-indigo-400">{levelToUnlock}</span>.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-3 mb-4 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="Contraseña"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition">
              Desbloquear
            </button>
          </div>
        </form>
      </div>
      <style>{`.animate-fade-in-fast { animation: fade-in 0.2s ease-out forwards; }`}</style>
    </div>
  );
};


export default function App(): React.ReactNode {
  const { vehicles, products, laborRate, authKeys, loading, error, warning, lastUpdated, refreshData } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState<VehiculoServicio | null>(null);
  const [serviceType, setServiceType] = useState<'oil' | 'belt'>('oil');
  
  // State for price level and authentication
  const [priceLevel, setPriceLevel] = useState<PriceLevel>('publico');
  const [unlockedLevels, setUnlockedLevels] = useState<PriceLevel[]>(['publico']);
  const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; level: 'taller' | 'costo' | null }>({ isOpen: false, level: null });
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLevelChange = (level: PriceLevel) => {
    if (unlockedLevels.includes(level)) {
      setPriceLevel(level);
    } else if (level === 'taller' || level === 'costo') {
      setAuthError(null);
      setModalInfo({ isOpen: true, level });
    }
  };

  const handleUnlockAttempt = (password: string) => {
    const levelToUnlock = modalInfo.level;
    if (!levelToUnlock) return;

    if (authKeys[levelToUnlock] && password === authKeys[levelToUnlock]) {
      setUnlockedLevels(prev => [...prev, levelToUnlock]);
      setPriceLevel(levelToUnlock);
      setModalInfo({ isOpen: false, level: null });
    } else {
      setAuthError('Clave incorrecta. Inténtalo de nuevo.');
    }
  };

  const handleVehicleSelect = (vehicle: VehiculoServicio) => {
    setSelectedVehicle(vehicle);
    setServiceType('oil'); // Default to oil service view
  };

  const handleReset = () => {
    setSelectedVehicle(null);
  };

  const renderContent = () => {
    if (loading && vehicles.length === 0) {
      return (
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner className="w-16 h-16 text-indigo-400" />
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</div>;
    }

    if (selectedVehicle) {
        const canQuoteBelt = selectedVehicle.tiempo_mano_obra_correa_minutos && selectedVehicle.tiempo_mano_obra_correa_minutos > 0;
        
        return (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <p className="text-xl font-bold text-indigo-300">{selectedVehicle.marca}</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 cursor-help" title={`Código del Vehículo: ${selectedVehicle.cod_vehiculo}`}>
                          {selectedVehicle.modelo}
                        </h2>
                    </div>
                    <button onClick={handleReset} className="flex-shrink-0 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold self-start sm:self-center">
                         <ArrowLeftIcon className="w-5 h-5" />
                         Elegir otro vehículo
                    </button>
                </div>

                <div className="mb-8 flex border-b border-gray-700">
                    <button onClick={() => setServiceType('oil')} className={`flex items-center gap-2 py-3 px-4 sm:px-6 font-semibold transition-colors duration-200 ${serviceType === 'oil' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
                        <OilCanIcon className="w-6 h-6 text-yellow-400" />
                        <span className="text-sm sm:text-base">Cambio de Aceite</span>
                    </button>
                    <button onClick={() => canQuoteBelt && setServiceType('belt')} disabled={!canQuoteBelt} className={`flex items-center gap-2 py-3 px-4 sm:px-6 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${serviceType === 'belt' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`} title={canQuoteBelt ? "Cotizar servicio de correa" : "Servicio de correa no disponible"}>
                        <BeltIcon className="w-6 h-6 text-cyan-400" />
                        <span className="text-sm sm:text-base">Cambio de Correa</span>
                    </button>
                </div>
                
                {serviceType === 'oil' && (
                    <OilQuote vehicle={selectedVehicle} products={products} laborRate={laborRate} priceLevel={priceLevel} />
                )}
                {serviceType === 'belt' && canQuoteBelt && (
                    <BeltQuote vehicle={selectedVehicle} products={products} laborRate={laborRate} priceLevel={priceLevel} />
                )}
                <style dangerouslySetInnerHTML={{ __html: `@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }`}}/>
            </div>
      );
    }

    return <VehicleSearch vehicles={vehicles} onVehicleSelect={handleVehicleSelect} />;
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100 flex flex-col">
      <Header 
        onRefresh={refreshData} 
        isLoading={loading} 
        priceLevel={priceLevel}
        unlockedLevels={unlockedLevels}
        onLevelChange={handleLevelChange}
      />
      {modalInfo.isOpen && modalInfo.level && (
        <AuthModal
          levelToUnlock={modalInfo.level}
          onClose={() => setModalInfo({ isOpen: false, level: null })}
          onUnlock={handleUnlockAttempt}
          error={authError}
        />
      )}
      <main className="container mx-auto px-4 py-8 flex-grow">
        {warning && (
          <div className="mb-6 text-center text-yellow-300 bg-yellow-900/40 p-4 rounded-lg border border-yellow-700/50" role="alert">
            <strong className="font-semibold">Advertencia:</strong> {warning}
          </div>
        )}
        {renderContent()}
      </main>
      <Footer 
        lastUpdated={lastUpdated} 
        vehicleCount={vehicles.length}
        productCount={products.length}
        laborRate={laborRate}
      />
    </div>
  );
}