import React, { useState, useEffect } from 'react';
import { Presupuesto } from '../../types';
import { getPresupuestos, updatePresupuestoStatus } from '../../services/adminService';
import { LoadingSpinner, ClipboardCheckIcon, UserCircleIcon, ChevronDownIcon, CheckIcon, DeleteIcon } from '../IconComponents';

const QuotesListPage: React.FC = () => {
  const [quotes, setQuotes] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Presupuesto | null>(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const data = await getPresupuestos();
      setQuotes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Presupuesto['estado']) => {
    try {
      await updatePresupuestoStatus(id, newStatus);
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, estado: newStatus } : q));
      if (selectedQuote?.id === id) {
        setSelectedQuote(prev => prev ? { ...prev, estado: newStatus } : null);
      }
    } catch (err: any) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rechazado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner className="w-12 h-12 text-indigo-400" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardCheckIcon className="w-7 h-7 text-indigo-400" />
          Gestión de Presupuestos
        </h2>
        <button 
          onClick={fetchQuotes}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors"
        >
          Actualizar Lista
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Lista de Presupuestos */}
        <div className="xl:col-span-2 space-y-3">
          {quotes.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700 text-gray-500">
              No hay presupuestos registrados aún.
            </div>
          ) : (
            quotes.map(quote => (
              <button
                key={quote.id}
                onClick={() => setSelectedQuote(quote)}
                className={`w-full text-left bg-gray-800 p-4 rounded-xl border transition-all hover:border-indigo-500/50 ${selectedQuote?.id === quote.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-700'}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-mono">
                      {new Date(quote.fecha).toLocaleString('es-AR')}
                    </p>
                    <p className="text-white font-bold text-lg">
                      {quote.cliente_nombre || 'Cliente sin nombre'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <UserCircleIcon className="w-3 h-3" />
                      {quote.usuario_email || 'Venta Directa'}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xl font-black text-emerald-400">
                      ${(quote.total || 0).toLocaleString('es-AR')}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(quote.estado)}`}>
                      {quote.estado}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detalle del Presupuesto Seleccionado */}
        <div className="xl:col-span-1">
          {selectedQuote ? (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl sticky top-24 overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
              <div className="p-6 border-b border-gray-700 bg-gray-800/50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">Detalle</h3>
                  <button onClick={() => setSelectedQuote(null)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Estado del Presupuesto:</p>
                  <div className="flex gap-2">
                    {(['pendiente', 'aprobado', 'rechazado'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedQuote.id!, status)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${selectedQuote.estado === status ? getStatusColor(status) : 'border-gray-700 text-gray-500 hover:bg-gray-700'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-grow space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Cliente</p>
                  <p className="text-white font-bold">{selectedQuote.cliente_nombre}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Nivel de Precio</p>
                  <p className="text-indigo-400 font-bold uppercase text-sm">{selectedQuote.nivel_precio}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Ítems</p>
                  {selectedQuote.items.map((item, idx) => (
                    <div key={idx} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 text-sm">
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="text-gray-400 font-mono text-[10px]">{item.codigo}</span>
                        <span className="text-white font-bold">x{item.cantidad}</span>
                      </div>
                      <p className="text-gray-200 text-xs mb-2">{item.descripcion}</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">${(item.precio_unitario || 0).toLocaleString('es-AR')} c/u</span>
                        <span className="text-emerald-400 font-bold">${(item.subtotal || 0).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-gray-900 border-t border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-medium">Total</span>
                  <span className="text-2xl font-black text-emerald-400">${(selectedQuote.total || 0).toLocaleString('es-AR')}</span>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ClipboardCheckIcon className="w-5 h-5" />
                  Imprimir PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-700 p-12 text-center text-gray-500 flex flex-col items-center justify-center h-64">
              <ClipboardCheckIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>Selecciona un presupuesto para ver el detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotesListPage;
