
import React, { useState } from 'react';
import { VehiculoServicio } from './types';
import { useVehicles } from './hooks/useVehicles';
import Header from './components/Header';
import { LoadingSpinner, OilCanIcon, BeltIcon, ArrowLeftIcon } from './components/IconComponents';
import VehicleSearch from './components/FilterSidebar';
import OilQuote from './components/VehicleCard'; 
import BeltQuote from './components/BeltQuote'; 
import Footer from './components/Footer';

export default function App(): React.ReactNode {
  const { vehicles, products, laborRate, loading, error, warning, lastUpdated, refreshData } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState<VehiculoServicio | null>(null);
  const [serviceType, setServiceType] = useState<'oil' | 'belt'>('oil');

  const handleVehicleSelect = (vehicle: VehiculoServicio) => {
    setSelectedVehicle(vehicle);
    setServiceType('oil'); // Por defecto, mostrar el servicio de aceite
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
                {/* Encabezado del vehículo seleccionado y botón para volver */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <p className="text-xl font-bold text-indigo-300">{selectedVehicle.marca}</p>
                        <h2 
                          className="text-3xl sm:text-4xl font-extrabold text-white mt-1 cursor-help"
                          title={`Código del Vehículo: ${selectedVehicle.cod_vehiculo}`}
                        >
                          {selectedVehicle.modelo}
                        </h2>
                    </div>
                    <button onClick={handleReset} className="flex-shrink-0 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold self-start sm:self-center">
                         <ArrowLeftIcon className="w-5 h-5" />
                         Elegir otro vehículo
                    </button>
                </div>

                {/* Navegación por Pestañas */}
                <div className="mb-8 flex border-b border-gray-700">
                    <button
                        onClick={() => setServiceType('oil')}
                        className={`flex items-center gap-2 py-3 px-4 sm:px-6 font-semibold transition-colors duration-200 ${
                            serviceType === 'oil' 
                            ? 'text-white border-b-2 border-indigo-500' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <OilCanIcon className="w-6 h-6 text-yellow-400" />
                        <span className="text-sm sm:text-base">Cambio de Aceite</span>
                    </button>
                    <button
                        onClick={() => canQuoteBelt && setServiceType('belt')}
                        disabled={!canQuoteBelt}
                        className={`flex items-center gap-2 py-3 px-4 sm:px-6 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            serviceType === 'belt' 
                            ? 'text-white border-b-2 border-indigo-500' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title={canQuoteBelt ? "Cotizar servicio de correa" : "Servicio de correa no disponible para este modelo"}
                    >
                        <BeltIcon className="w-6 h-6 text-cyan-400" />
                        <span className="text-sm sm:text-base">Cambio de Correa</span>
                    </button>
                </div>
                
                {/* Renderizado condicional de la cotización */}
                {serviceType === 'oil' && (
                    <OilQuote
                      vehicle={selectedVehicle}
                      products={products}
                      laborRate={laborRate}
                    />
                )}
                {serviceType === 'belt' && canQuoteBelt && (
                    <BeltQuote
                      vehicle={selectedVehicle}
                      products={products}
                      laborRate={laborRate}
                    />
                )}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
                `}}/>
            </div>
      );
    }

    return <VehicleSearch vehicles={vehicles} onVehicleSelect={handleVehicleSelect} />;
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100 flex flex-col">
      <Header onRefresh={refreshData} isLoading={loading} />
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
