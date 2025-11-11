import React, { useState, useEffect, useCallback } from 'react';
import { getAuditLogs, AuditLogFilters } from '../../services/adminService';
import { LoadingSpinner, SearchIcon, FileTextIcon } from '../IconComponents';

interface LogEntry {
    id: number;
    timestamp: string;
    user_email: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    table_name: string;
    record_id: string;
    changes: { old?: any; new?: any };
}

const ChangeDetailModal: React.FC<{ log: LogEntry; onClose: () => void }> = ({ log, onClose }) => {
    const oldData = log.changes.old || {};
    const newData = log.changes.new || {};
    const allKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])].sort();

    const formatValue = (value: any) => {
        if (value === null || value === undefined) return <span className="text-gray-500">null</span>;
        if (Array.isArray(value)) return `[ ${value.join(', ')} ]`;
        return String(value);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Detalles del Cambio</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong className="text-gray-400">Usuario:</strong> <span className="font-mono">{log.user_email}</span>
                    </div>
                    <div>
                        <strong className="text-gray-400">Fecha:</strong> {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div>
                        <strong className="text-gray-400">Acción:</strong> {log.action} en <span className="font-mono">{log.table_name}</span>
                    </div>
                    <div>
                        <strong className="text-gray-400">ID Registro:</strong> <span className="font-mono">{log.record_id}</span>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-600">
                                <th className="text-left py-2 px-2 uppercase text-gray-400 font-semibold w-1/4">Campo</th>
                                <th className="text-left py-2 px-2 uppercase text-gray-400 font-semibold">Valor Anterior</th>
                                <th className="text-left py-2 px-2 uppercase text-gray-400 font-semibold">Valor Nuevo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allKeys.map(key => {
                                const oldValue = oldData[key];
                                const newValue = newData[key];
                                const isChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

                                return (
                                    <tr key={key} className={`border-b border-gray-700 ${isChanged ? 'bg-yellow-900/20' : ''}`}>
                                        <td className="py-2 px-2 font-mono text-gray-300 w-1/4 align-top">{key}</td>
                                        <td className={`py-2 px-2 font-mono ${log.action === 'INSERT' ? 'text-gray-500' : 'text-red-400'} align-top break-words`}>
                                            {log.action !== 'INSERT' ? formatValue(oldValue) : '–'}
                                        </td>
                                        <td className={`py-2 px-2 font-mono ${log.action === 'DELETE' ? 'text-gray-500' : 'text-green-400'} align-top break-words`}>
                                            {log.action !== 'DELETE' ? formatValue(newValue) : '–'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition">Cerrar</button>
                </div>
            </div>
        </div>
    );
};


const AuditLogPage: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filters, setFilters] = useState<AuditLogFilters>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 15;

    const fetchLogs = useCallback(async (filtersToUse: AuditLogFilters, pageToUse: number) => {
        setLoading(true);
        setError(null);
        try {
            const { data, count } = await getAuditLogs(filtersToUse, pageToUse, pageSize);
            setLogs(data || []);
            setTotalCount(count || 0);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs(filters, page);
    }, [fetchLogs, page]); // No incluir filters aquí para que solo se recargue al cambiar de página
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset page to 1 on new filter
        fetchLogs(filters, 1);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'INSERT': return 'bg-green-600 text-green-100';
            case 'UPDATE': return 'bg-yellow-600 text-yellow-100';
            case 'DELETE': return 'bg-red-600 text-red-100';
            default: return 'bg-gray-600 text-gray-100';
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
             {selectedLog && <ChangeDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
            <h2 className="text-2xl font-bold text-white mb-6">Registro de Auditoría</h2>
            
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-end">
                <div className="lg:col-span-2">
                    <label className="text-sm font-medium text-gray-300 block mb-1">Rango de Fechas</label>
                    <div className="flex gap-2">
                         <input type="date" name="startDate" onChange={handleFilterChange} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                         <input type="date" name="endDate" onChange={handleFilterChange} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                </div>
                <div>
                     <label htmlFor="userEmail" className="text-sm font-medium text-gray-300 block mb-1">Usuario (Email)</label>
                     <input type="text" id="userEmail" name="userEmail" onChange={handleFilterChange} placeholder="ej: admin@mail.com" className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <label htmlFor="recordId" className="text-sm font-medium text-gray-300 block mb-1">ID Vehículo</label>
                    <input type="text" id="recordId" name="recordId" onChange={handleFilterChange} placeholder="ej: 363" className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-2 rounded-lg flex items-center justify-center gap-2">
                    <SearchIcon className="w-5 h-5"/>
                    <span>Filtrar</span>
                </button>
            </form>

            {loading && <div className="flex justify-center p-8"><LoadingSpinner className="w-8 h-8" /></div>}
            {error && <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</div>}

            {!loading && !error && (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Acción</th>
                                    <th className="px-4 py-3">ID Registro</th>
                                    <th className="px-4 py-3"><span className="sr-only">Detalles</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/40">
                                        <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-gray-400">{log.user_email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionBadge(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono">{log.record_id}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => setSelectedLog(log)} className="p-2 text-indigo-400 hover:text-indigo-300 rounded-md hover:bg-gray-600">
                                                <FileTextIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && <p className="text-center p-8 text-gray-400">No se encontraron registros de auditoría.</p>}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 text-sm">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50">Anterior</button>
                            <span>Página {page} de {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50">Siguiente</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLogPage;
