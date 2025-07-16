
import React, { useState, useMemo } from 'react';
import { VehiculoServicio } from '../types';
import { SearchIcon } from './IconComponents';

interface VehicleSearchProps {
  vehicles: VehiculoServicio[];
  onVehicleSelect: (vehicle: VehiculoServicio) => void;
}

const VehicleSearch: React.FC<VehicleSearchProps> = ({ vehicles, onVehicleSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (!trimmedSearch) {
      return [];
    }

    const searchKeywords = trimmedSearch.split(/\s+/).filter(Boolean);

    return vehicles
      .filter(v => {
        const vehicleText = [
          v.marca,
          v.modelo,
          v.version || '',
          v.motor_cod || '',
          v.ano?.toString() || ''
        ].join(' ').toLowerCase();

        return searchKeywords.every(keyword => vehicleText.includes(keyword));
      })
      .slice(0, 15); // Limit results for performance and clarity
  }, [searchTerm, vehicles]);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-indigo-300 mb-2">Consultar Servicio</h2>
      <p className="text-center text-gray-400 mb-8">Busca por marca, modelo, versión o año para obtener una cotización.</p>
      
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ej: Amarok V6 2018, Corolla 1.8, Ranger 3.2..."
          className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg shadow-sm text-white text-lg p-4 pl-12 focus:ring-indigo-500 focus:border-indigo-500 transition"
          aria-label="Buscar vehículo"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
      </div>

      {searchTerm.trim() && (
        <ul className="mt-4 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map(vehicle => (
              <li key={vehicle.cod_vehiculo}>
                <button
                  onClick={() => onVehicleSelect(vehicle)}
                  className="w-full text-left p-4 hover:bg-indigo-600/20 transition duration-150 border-b border-gray-700/50 last:border-b-0"
                  aria-label={`Seleccionar ${vehicle.marca} ${vehicle.modelo} ${vehicle.version || ''}`}
                >
                   <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white">{vehicle.marca} {vehicle.modelo}</p>
                            <p className="text-sm text-gray-400">{[vehicle.version, vehicle.motor_cod].filter(Boolean).join(' | ')}</p>
                        </div>
                        {vehicle.ano && <span className="text-sm font-semibold bg-gray-700 text-gray-300 px-2 py-1 rounded">{vehicle.ano}</span>}
                    </div>
                </button>
              </li>
            ))
          ) : (
             <li className="p-4 text-center text-gray-400">No se encontraron vehículos.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default VehicleSearch;
