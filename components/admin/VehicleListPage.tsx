import React, { useState, useMemo } from 'react';
import { VehiculoServicio } from '../../types';
import { LoadingSpinner, SearchIcon, PlusIcon, EditIcon, DeleteIcon, RefreshIcon } from '../IconComponents';
import { deleteVehicle } from '../../services/adminService';

interface VehicleListPageProps {
    vehicles: VehiculoServicio[];
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
}

const VehicleListPage: React.FC<VehicleListPageProps> = ({ vehicles, loading, error, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredVehicles = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        if (!trimmedSearch) {
            return vehicles;
        }
        const searchKeywords = trimmedSearch.split(/\s+/).filter(Boolean);
        return vehicles.filter(v => {
            const vehicleText = [v.marca, v.modelo, v.version || '', v.cod_vehiculo.toString()].join(' ').toLowerCase();
            return searchKeywords.every(keyword => vehicleText.includes(keyword));
        });
    }, [searchTerm, vehicles]);

    const handleDelete = async (vehicleId: number, vehicleName: string) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el vehículo "${vehicleName}"? Esta acción no se puede deshacer.`)) {
            try {
                await deleteVehicle(vehicleId);
                alert('Vehículo eliminado con éxito.');
                onRefresh();
            } catch (error: any) {
                alert(`Error al eliminar el vehículo: ${error.message}`);
            }
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">Gestión de Vehículos</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition disabled:opacity-50"
                        aria-label="Actualizar datos"
                        >
                        <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => window.location.hash = '#/admin/vehicles/new'} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition">
                        <PlusIcon className="w-5 h-5" />
                        <span>Nuevo Vehículo</span>
                    </button>
                </div>
            </div>

            <div className="relative mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por marca, modelo o código..."
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>

            {loading && <div className="flex justify-center p-8"><LoadingSpinner className="w-8 h-8" /></div>}
            {error && <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</div>}
            
            {!loading && !error && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-3">Código</th>
                                <th scope="col" className="px-4 py-3">Marca</th>
                                <th scope="col" className="px-4 py-3">Modelo</th>
                                <th scope="col" className="px-4 py-3">Versión</th>
                                <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehicles.map(v => (
                                <tr key={v.cod_vehiculo} className="border-b border-gray-700 hover:bg-gray-700/40">
                                    <td className="px-4 py-3 font-mono text-gray-400">{v.cod_vehiculo}</td>
                                    <th scope="row" className="px-4 py-3 font-medium text-white whitespace-nowrap">{v.marca}</th>
                                    <td className="px-4 py-3">{v.modelo}</td>
                                    <td className="px-4 py-3">{v.version || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex gap-2">
                                            <button onClick={() => window.location.hash = `#/admin/vehicles/edit/${v.cod_vehiculo}`} className="p-2 text-indigo-400 hover:text-indigo-300 rounded-md hover:bg-gray-600">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(v.cod_vehiculo, `${v.marca} ${v.modelo}`)} className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-gray-600">
                                                <DeleteIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredVehicles.length === 0 && (
                        <p className="text-center p-8 text-gray-400">No se encontraron vehículos.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleListPage;