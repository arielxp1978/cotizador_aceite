
import React, { useState, useMemo, useEffect } from 'react';
import { VehiculoServicio, Producto } from '../../types';
import { updateVehicle } from '../../services/adminService';
import { LoadingSpinner, SearchIcon, PackageIcon, PlusIcon, DeleteIcon, CarIcon, RefreshIcon } from '../IconComponents';

interface ComboManagerPageProps {
    vehicles: VehiculoServicio[];
    allProducts: Producto[];
    loading: boolean;
    onRefresh: () => void;
}

const ComboManagerPage: React.FC<ComboManagerPageProps> = ({ vehicles, allProducts, loading: globalLoading, onRefresh }) => {
    // Estado local para manejo optimista (Optimistic UI)
    const [localVehicles, setLocalVehicles] = useState<VehiculoServicio[]>(vehicles);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
    const [selectedCombo, setSelectedCombo] = useState<Producto | null>(null);
    const [processingVehicleId, setProcessingVehicleId] = useState<number | null>(null);
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');

    // Sincronizar el estado local cuando llegan datos nuevos del servidor
    useEffect(() => {
        setLocalVehicles(vehicles);
    }, [vehicles]);

    // Filtrar productos que son Combos
    const combos = useMemo(() => {
        return allProducts.filter(p => 
            (p.rubro?.toLowerCase() === 'aceite' && p.subrubro?.toLowerCase() === 'combo') || 
            p.descripcion.toLowerCase().startsWith('kit ')
        );
    }, [allProducts]);

    // Mapear qué vehículos tienen asignado cada combo usando el ESTADO LOCAL
    const comboAssignments = useMemo(() => {
        const map = new Map<string, VehiculoServicio[]>();
        combos.forEach(c => map.set(c.codigo, []));
        
        localVehicles.forEach(v => {
            if (v.combos_cod) {
                v.combos_cod.forEach(code => {
                    if (map.has(code)) {
                        map.get(code)?.push(v);
                    }
                });
            }
        });
        return map;
    }, [localVehicles, combos]);

    const filteredCombos = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return combos.filter(c => {
            const matchesSearch = c.descripcion.toLowerCase().includes(term) || c.codigo.toLowerCase().includes(term);
            const isUnassigned = (comboAssignments.get(c.codigo)?.length || 0) === 0;
            
            if (showOnlyUnassigned && !isUnassigned) return false;
            return matchesSearch;
        });
    }, [combos, searchTerm, showOnlyUnassigned, comboAssignments]);

    // Filtrar vehículos para el modal de asignación usando el ESTADO LOCAL
    const filteredVehiclesForModal = useMemo(() => {
        if (!vehicleSearchTerm.trim()) return [];
        const terms = vehicleSearchTerm.toLowerCase().split(' ');
        return localVehicles.filter(v => {
             const text = `${v.marca} ${v.modelo} ${v.version || ''} ${v.motor_cod || ''} ${v.ano || ''}`.toLowerCase();
             return terms.every(t => text.includes(t));
        }).slice(0, 10);
    }, [localVehicles, vehicleSearchTerm]);

    const handleAssign = async (vehicle: VehiculoServicio) => {
        if (!selectedCombo) return;
        
        // 1. Actualización Optimista: Actualizar UI inmediatamente
        const previousVehicles = [...localVehicles];
        const updatedVehicles = localVehicles.map(v => {
            if (v.cod_vehiculo === vehicle.cod_vehiculo) {
                const currentCombos = v.combos_cod || [];
                if (!currentCombos.includes(selectedCombo.codigo)) {
                    return { ...v, combos_cod: [...currentCombos, selectedCombo.codigo] };
                }
            }
            return v;
        });
        setLocalVehicles(updatedVehicles);
        setProcessingVehicleId(vehicle.cod_vehiculo);

        try {
            // 2. Llamada al Servidor
            const currentCombos = vehicle.combos_cod || [];
            if (!currentCombos.includes(selectedCombo.codigo)) {
                await updateVehicle(vehicle.cod_vehiculo, {
                    combos_cod: [...currentCombos, selectedCombo.codigo]
                });
                // No llamamos a onRefresh() inmediatamente para no romper la ilusión de velocidad,
                // el estado local ya está actualizado.
            }
        } catch (error: any) {
            // 3. Revertir si falla (Rollback)
            setLocalVehicles(previousVehicles);
            
            // Mensaje amigable si falta la columna
            const msg = error.message || String(error);
            const isMissingColumnError = msg.includes("La columna 'combos' no existe") || msg.includes("column 'combos' no existe") || msg.includes("Could not find the 'combos' column");
            
            if (isMissingColumnError) {
                console.warn("Configuración incompleta:", msg);
                alert("⚠️ ERROR DE CONFIGURACIÓN\n\nPara usar los Combos, necesitas agregar una columna a tu base de datos en Supabase.\n\n1. Ve a Supabase -> Table Editor -> vehiculos\n2. Agrega nueva columna:\n   - Name: combos\n   - Type: text[] (Array of Text)\n3. Guarda y recarga esta página.");
            } else {
                console.error("Error asignando combo:", error);
                alert(`Error al asignar: ${msg}`);
            }
        } finally {
            setProcessingVehicleId(null);
            setVehicleSearchTerm('');
        }
    };

    const handleUnassign = async (vehicle: VehiculoServicio) => {
        if (!selectedCombo) return;
        if (!confirm(`¿Quitar este combo del vehículo ${vehicle.marca} ${vehicle.modelo}?`)) return;
        
        // 1. Actualización Optimista
        const previousVehicles = [...localVehicles];
        const updatedVehicles = localVehicles.map(v => {
             if (v.cod_vehiculo === vehicle.cod_vehiculo) {
                 const currentCombos = v.combos_cod || [];
                 return { ...v, combos_cod: currentCombos.filter(c => c !== selectedCombo.codigo) };
             }
             return v;
        });
        setLocalVehicles(updatedVehicles);
        setProcessingVehicleId(vehicle.cod_vehiculo);

        try {
            // 2. Llamada al Servidor
            const currentCombos = vehicle.combos_cod || [];
            const newCombos = currentCombos.filter(c => c !== selectedCombo.codigo);
            await updateVehicle(vehicle.cod_vehiculo, {
                combos_cod: newCombos
            });
        } catch (error: any) {
            // 3. Revertir si falla
            setLocalVehicles(previousVehicles);
            console.error("Error desasignando combo:", error);
            alert(`Error al quitar: ${error.message || error}`);
        } finally {
            setProcessingVehicleId(null);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <PackageIcon className="w-8 h-8 text-orange-400" />
                    <h2 className="text-2xl font-bold text-white">Gestor de Combos</h2>
                </div>
                <div className="flex items-center gap-4 bg-gray-900 p-2 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={showOnlyUnassigned} 
                            onChange={e => setShowOnlyUnassigned(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-300">Solo sin asignar</span>
                    </label>
                    <button onClick={onRefresh} className="p-1 text-gray-400 hover:text-white" title="Refrescar datos del servidor">
                        <RefreshIcon className={`w-5 h-5 ${globalLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="mb-4 relative flex-shrink-0">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar combo por descripción o código..."
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>

            <div className="flex-grow overflow-auto">
                {globalLoading && localVehicles.length === 0 ? (
                    <div className="flex justify-center p-8"><LoadingSpinner className="w-10 h-10 text-indigo-400" /></div>
                ) : (
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Descripción del Kit</th>
                                <th className="px-4 py-3 text-center">Vehículos</th>
                                <th className="px-4 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCombos.map(combo => {
                                const assignedCount = comboAssignments.get(combo.codigo)?.length || 0;
                                return (
                                    <tr key={combo.codigo} className="border-b border-gray-700 hover:bg-gray-700/40">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{combo.codigo}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">{combo.descripcion}</div>
                                            <div className="text-xs text-gray-500">{combo.marca}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${assignedCount > 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                                {assignedCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => setSelectedCombo(combo)}
                                                className="text-indigo-400 hover:text-indigo-300 font-medium text-sm hover:underline"
                                            >
                                                Gestionar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredCombos.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">
                                        No se encontraron combos con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Asignación */}
            {selectedCombo && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCombo(null)}>
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-700 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-700 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <PackageIcon className="w-6 h-6 text-orange-400" />
                                    Gestionar Asignaciones
                                </h3>
                                <p className="text-indigo-300 mt-1 font-medium">{selectedCombo.descripcion}</p>
                                <p className="text-xs text-gray-500 font-mono mt-1">{selectedCombo.codigo} - {selectedCombo.marca}</p>
                            </div>
                            <button onClick={() => setSelectedCombo(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-5">
                            {/* Lista de Asignados */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Vehículos Asignados Actualmente</h4>
                                <div className="space-y-2">
                                    {(comboAssignments.get(selectedCombo.codigo) || []).length > 0 ? (
                                        (comboAssignments.get(selectedCombo.codigo) || []).map(v => (
                                            <div key={v.cod_vehiculo} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                                                <div className="flex items-center gap-3">
                                                    <CarIcon className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="font-bold text-white">{v.marca} {v.modelo}</p>
                                                        <p className="text-xs text-gray-400">{v.version} {v.motor_cod} {v.ano}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleUnassign(v)}
                                                    disabled={processingVehicleId === v.cod_vehiculo}
                                                    className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition disabled:opacity-50"
                                                    title="Desvincular"
                                                >
                                                    {processingVehicleId === v.cod_vehiculo ? <LoadingSpinner className="w-5 h-5" /> : <DeleteIcon className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">Este combo no está asignado a ningún vehículo aún.</p>
                                    )}
                                </div>
                            </div>

                            {/* Buscador para Asignar */}
                            <div className="border-t border-gray-700 pt-6">
                                <h4 className="text-sm font-bold text-indigo-400 uppercase mb-3">Asignar a nuevo vehículo</h4>
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        value={vehicleSearchTerm}
                                        onChange={e => setVehicleSearchTerm(e.target.value)}
                                        placeholder="Buscar vehículo (ej: Ranger 3.0)..."
                                        className="w-full bg-gray-900 border-2 border-indigo-900/50 rounded-lg text-white p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoFocus
                                    />
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                                </div>

                                <div className="space-y-2">
                                    {filteredVehiclesForModal.map(v => {
                                        const isAlreadyAssigned = (comboAssignments.get(selectedCombo.codigo) || []).some(cv => cv.cod_vehiculo === v.cod_vehiculo);
                                        if (isAlreadyAssigned) return null;

                                        return (
                                            <div key={v.cod_vehiculo} className="flex justify-between items-center bg-indigo-900/20 p-3 rounded-lg border border-indigo-900/30 hover:bg-indigo-900/30 transition">
                                                <div>
                                                    <p className="font-bold text-white">{v.marca} {v.modelo}</p>
                                                    <p className="text-xs text-gray-400">{v.version} {v.motor_cod} {v.ano}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleAssign(v)}
                                                    disabled={processingVehicleId === v.cod_vehiculo}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                                                >
                                                    {processingVehicleId === v.cod_vehiculo ? <LoadingSpinner className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                                    Asignar
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {vehicleSearchTerm && filteredVehiclesForModal.length === 0 && (
                                        <p className="text-center text-gray-500 text-sm py-2">No se encontraron vehículos.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-800 rounded-b-xl">
                            <button onClick={() => setSelectedCombo(null)} className="px-6 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComboManagerPage;
