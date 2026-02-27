import React, { useState, useMemo, useEffect } from 'react';
import { Producto, PriceLevel, Presupuesto, PresupuestoItem } from '../types';
import { SearchIcon, PlusIcon, DeleteIcon, PackageIcon, ClipboardCheckIcon, SaveIcon, LoadingSpinner, UserCircleIcon } from './IconComponents';
import { useAuth } from '../auth/AuthContext';
import { savePresupuesto } from '../services/adminService';

interface ManualQuoteProps {
  products: Producto[];
  priceLevel: PriceLevel;
}

interface QuoteItem {
  producto: Producto;
  cantidad: number;
}

const ManualQuote: React.FC<ManualQuoteProps> = ({ products, priceLevel }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const [filterSubrubro, setFilterSubrubro] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  
  const [clientName, setClientName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Obtener valores únicos para los filtros con lógica cruzada (acumulativa)
  const rubros = useMemo(() => {
    let filtered = products;
    if (filterSubrubro) filtered = filtered.filter(p => p.subrubro === filterSubrubro);
    if (filterMarca) filtered = filtered.filter(p => p.marca === filterMarca);
    return Array.from(new Set(filtered.map(p => p.rubro).filter(Boolean))).sort();
  }, [products, filterSubrubro, filterMarca]);

  const subrubros = useMemo(() => {
    let filtered = products;
    if (filterRubro) filtered = filtered.filter(p => p.rubro === filterRubro);
    if (filterMarca) filtered = filtered.filter(p => p.marca === filterMarca);
    return Array.from(new Set(filtered.map(p => p.subrubro).filter(Boolean))).sort();
  }, [products, filterRubro, filterMarca]);

  const marcas = useMemo(() => {
    let filtered = products;
    if (filterRubro) filtered = filtered.filter(p => p.rubro === filterRubro);
    if (filterSubrubro) filtered = filtered.filter(p => p.subrubro === filterSubrubro);
    return Array.from(new Set(filtered.map(p => p.marca).filter(Boolean))).sort();
  }, [products, filterRubro, filterSubrubro]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm.length >= 2) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.codigo.toLowerCase().includes(term) || 
        p.descripcion.toLowerCase().includes(term) ||
        (p.marca && p.marca.toLowerCase().includes(term))
      );
    } else if (!filterRubro && !filterSubrubro && !filterMarca) {
      return [];
    }

    if (filterRubro) filtered = filtered.filter(p => p.rubro === filterRubro);
    if (filterSubrubro) filtered = filtered.filter(p => p.subrubro === filterSubrubro);
    if (filterMarca) filtered = filtered.filter(p => p.marca === filterMarca);

    return filtered.slice(0, 20); // Aumentamos un poco el límite
  }, [searchTerm, filterRubro, filterSubrubro, filterMarca, products]);

  const addToQuote = (producto: Producto) => {
    setQuoteItems(prev => {
      const existing = prev.find(item => item.producto.codigo === producto.codigo);
      if (existing) {
        return prev.map(item => 
          item.producto.codigo === producto.codigo 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setSearchTerm('');
  };

  const updateQuantity = (codigo: string, delta: number) => {
    setQuoteItems(prev => prev.map(item => {
      if (item.producto.codigo === codigo) {
        const newQty = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const removeItem = (codigo: string) => {
    setQuoteItems(prev => prev.filter(item => item.producto.codigo !== codigo));
  };

  const getPrice = (p: Producto) => {
    if (priceLevel === 'taller') return p.precio_taller || p.precio;
    if (priceLevel === 'costo') return p.precio_costo || p.precio;
    return p.precio;
  };

  const total = quoteItems.reduce((acc, item) => acc + (getPrice(item.producto) * item.cantidad), 0);

  const handleSavePresupuesto = async () => {
    if (quoteItems.length === 0) return;
    if (!clientName.trim() && !user) {
      setSaveMessage({ text: 'Por favor, ingresa el nombre del cliente.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const items: PresupuestoItem[] = quoteItems.map(item => ({
        codigo: item.producto.codigo,
        descripcion: item.producto.descripcion,
        cantidad: item.cantidad,
        precio_unitario: getPrice(item.producto),
        subtotal: getPrice(item.producto) * item.cantidad
      }));

      const nuevoPresupuesto: Omit<Presupuesto, 'id' | 'created_at'> = {
        fecha: new Date().toISOString(),
        cliente_id: null,
        cliente_nombre: clientName || (user ? 'Venta Taller' : 'Consumidor Final'),
        usuario_email: user?.email || null,
        items,
        total,
        nivel_precio: priceLevel,
        estado: 'pendiente',
        notas: null
      };

      await savePresupuesto(nuevoPresupuesto);
      setSaveMessage({ text: 'Presupuesto guardado correctamente.', type: 'success' });
      
      // Limpiar después de un éxito (opcional, podrías querer dejarlo para imprimir)
      // setQuoteItems([]);
      // setClientName('');
    } catch (error: any) {
      console.error('Error al guardar presupuesto:', error);
      setSaveMessage({ text: `Error: ${error.message || 'No se pudo guardar el presupuesto'}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna de Búsqueda */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <SearchIcon className="w-5 h-5 text-indigo-400" />
              Buscar Productos
            </h3>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Código, descripción o marca..."
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl text-white p-4 pl-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>

            <div className="grid grid-cols-1 gap-3 mt-4">
              <select 
                value={filterRubro} 
                onChange={(e) => { setFilterRubro(e.target.value); setFilterSubrubro(''); }}
                className="bg-gray-900 border border-gray-700 rounded-lg text-sm text-white p-2 outline-none focus:border-indigo-500"
              >
                <option value="">Todos los Rubros</option>
                {rubros.map(r => <option key={r} value={r!}>{r}</option>)}
              </select>

              <select 
                value={filterSubrubro} 
                onChange={(e) => setFilterSubrubro(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg text-sm text-white p-2 outline-none focus:border-indigo-500"
              >
                <option value="">Todos los Subrubros</option>
                {subrubros.map(s => <option key={s} value={s!}>{s}</option>)}
              </select>

              <select 
                value={filterMarca} 
                onChange={(e) => setFilterMarca(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg text-sm text-white p-2 outline-none focus:border-indigo-500"
              >
                <option value="">Todas las Marcas</option>
                {marcas.map(m => <option key={m} value={m!}>{m}</option>)}
              </select>

              {(filterRubro || filterSubrubro || filterMarca || searchTerm) && (
                <button 
                  onClick={() => { setSearchTerm(''); setFilterRubro(''); setFilterSubrubro(''); setFilterMarca(''); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 text-right font-semibold"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {filteredProducts.length > 0 && (
              <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredProducts.map(product => (
                  <button
                    key={product.codigo}
                    onClick={() => addToQuote(product)}
                    className="w-full text-left bg-gray-700/50 hover:bg-gray-700 p-3 rounded-xl border border-gray-600 transition-colors group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-indigo-300 font-mono text-xs font-bold">{product.codigo}</p>
                        <p className="text-white text-sm font-medium line-clamp-2">{product.descripcion}</p>
                        <p className="text-gray-400 text-xs mt-1">{product.marca || 'Sin marca'} | {product.proveedor || 'Sin proveedor'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-emerald-400 font-bold text-sm">
                          ${(getPrice(product) || 0).toLocaleString('es-AR')}
                        </span>
                        <PlusIcon className="w-5 h-5 text-indigo-400 group-hover:scale-125 transition-transform" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchTerm.length >= 2 && filteredProducts.length === 0 && (
              <p className="text-gray-500 text-center mt-4 text-sm italic">No se encontraron productos</p>
            )}
            {searchTerm.length > 0 && searchTerm.length < 2 && (
              <p className="text-gray-500 text-center mt-4 text-xs">Escribe al menos 2 caracteres...</p>
            )}
          </div>
        </div>

        {/* Columna de Presupuesto */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-6 border-b border-gray-700 bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ClipboardCheckIcon className="w-6 h-6 text-emerald-400" />
                Presupuesto Libre
              </h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={user ? "Nombre del Cliente (Opcional)" : "Nombre del Cliente"}
                    className="bg-gray-900 border border-gray-700 rounded-lg text-sm text-white py-2 px-3 pl-9 focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-64"
                  />
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
                <span className="hidden sm:inline bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                  {priceLevel}
                </span>
              </div>
            </div>

            {saveMessage && (
              <div className={`mx-6 mt-4 p-3 rounded-lg text-sm font-medium flex justify-between items-center ${saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <span>{saveMessage.text}</span>
                <button onClick={() => setSaveMessage(null)} className="text-xs opacity-50 hover:opacity-100">✕</button>
              </div>
            )}

            <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {quoteItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-50">
                  <PackageIcon className="w-16 h-16" />
                  <p className="text-lg font-medium">El presupuesto está vacío</p>
                  <p className="text-sm">Busca productos a la izquierda para agregarlos</p>
                </div>
              ) : (
                quoteItems.map(item => (
                  <div key={item.producto.codigo} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 animate-slide-in">
                    <div className="flex-grow w-full">
                      <p className="text-indigo-400 font-mono text-xs font-bold">{item.producto.codigo}</p>
                      <p className="text-white font-medium">{item.producto.descripcion}</p>
                      <p className="text-gray-500 text-xs">{item.producto.marca} | {item.producto.proveedor}</p>
                    </div>
                    
                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.producto.codigo, -1)}
                          className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          <span className="text-xl font-bold leading-none">−</span>
                        </button>
                        <span className="w-10 text-center font-bold text-white">{item.cantidad}</span>
                        <button 
                          onClick={() => updateQuantity(item.producto.codigo, 1)}
                          className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <p className="text-xs text-gray-500">Subtotal</p>
                        <p className="text-white font-bold">${((getPrice(item.producto) || 0) * item.cantidad).toLocaleString('es-AR')}</p>
                      </div>

                      <button 
                        onClick={() => removeItem(item.producto.codigo)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Eliminar ítem"
                      >
                        <DeleteIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {quoteItems.length > 0 && (
              <div className="p-6 bg-gray-900 border-t border-gray-700 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 font-medium">Total Presupuestado</span>
                  <span className="text-3xl font-black text-emerald-400">${(total || 0).toLocaleString('es-AR')}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={handleSavePresupuesto}
                    disabled={isSaving}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? <LoadingSpinner className="w-5 h-5" /> : <SaveIcon className="w-5 h-5 text-indigo-400" />}
                    Guardar Registro
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ClipboardCheckIcon className="w-5 h-5" />
                    Imprimir / PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
        @keyframes slide-in { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.2s ease-out forwards; }
      `}} />
    </div>
  );
};

export default ManualQuote;
