import React, { useState, useEffect, useMemo } from 'react';
import { Producto } from '../../types';
import { LoadingSpinner } from '../IconComponents';

interface ProductSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedCodes: string[]) => void;
    title: string;
    initialSelectedCodes: string[];
    allProducts: Producto[];
    defaultSearchTerm?: string;
}

const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title,
    initialSelectedCodes,
    allProducts,
    defaultSearchTerm
}) => {
    const [searchTerm, setSearchTerm] = useState(defaultSearchTerm || '');
    const [rubroFilter, setRubroFilter] = useState('');
    const [subrubroFilter, setSubrubroFilter] = useState('');
    const [proveedorFilter, setProveedorFilter] = useState('');
    const [marcaFilter, setMarcaFilter] = useState('');
    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set(initialSelectedCodes));

    const rubros = useMemo(() => [...new Set(allProducts.map(p => p.rubro).filter(Boolean))].sort(), [allProducts]);
    const subrubros = useMemo(() => {
        if (!rubroFilter) return [];
        return [...new Set(allProducts.filter(p => p.rubro === rubroFilter).map(p => p.subrubro).filter(Boolean))].sort();
    }, [allProducts, rubroFilter]);
    const proveedores = useMemo(() => [...new Set(allProducts.map(p => p.proveedor).filter(Boolean))].sort(), [allProducts]);
    const marcas = useMemo(() => [...new Set(allProducts.map(p => p.marca).filter(Boolean))].sort(), [allProducts]);
    
    const searchResults = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        let filtered = allProducts;

        if (rubroFilter) filtered = filtered.filter(p => p.rubro === rubroFilter);
        if (subrubroFilter) filtered = filtered.filter(p => p.subrubro === subrubroFilter);
        if (proveedorFilter) filtered = filtered.filter(p => p.proveedor === proveedorFilter);
        if (marcaFilter) filtered = filtered.filter(p => p.marca === marcaFilter);

        if (trimmedSearch) {
            const normalizedForCheck = trimmedSearch.replace(/[-\s]/g, '');
            const isViscositySearch = /^\d+w\d+$/i.test(normalizedForCheck);

            if (isViscositySearch) {
                const pattern = normalizedForCheck.replace(/w/i, 'w[\\s-]?');
                const regex = new RegExp(`(^|[^\\d])(${pattern})`, 'i');
                filtered = filtered.filter(p => {
                    const desc = p.descripcion || '';
                    const code = p.codigo || '';
                    return regex.test(desc) || regex.test(code);
                });
            } else {
                const normalizedSearch = trimmedSearch.replace(/[-\s]/g, '');
                if (normalizedSearch) {
                    filtered = filtered.filter(p => {
                        const normalizedDesc = (p.descripcion || '').toLowerCase().replace(/[-\s]/g, '');
                        const normalizedCode = (p.codigo || '').toLowerCase().replace(/[-\s]/g, '');
                        return normalizedDesc.includes(normalizedSearch) || normalizedCode.includes(normalizedSearch);
                    });
                }
            }
        }
        
        return filtered.slice(0, 100);

    }, [searchTerm, rubroFilter, subrubroFilter, proveedorFilter, marcaFilter, allProducts]);

    useEffect(() => {
        setSubrubroFilter('');
    }, [rubroFilter]);

    if (!isOpen) return null;
    
    const handleToggleSelection = (code: string) => {
        setSelectedCodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(code)) {
                newSet.delete(code);
            } else {
                newSet.add(code);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        onSelect(Array.from(selectedCodes));
        onClose();
    };
    
    const selectedProducts = useMemo(() => {
        return Array.from(selectedCodes).map(code => allProducts.find(p => p.codigo === code)).filter((p): p is Producto => p !== undefined);
    }, [selectedCodes, allProducts]);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-bold text-white">Seleccionar: {title}</h3>
                </div>
                <div className="flex flex-col md:flex-row flex-grow min-h-0">
                    <div className="w-full md:w-2/3 p-4 flex flex-col">
                        {/* Filters */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 flex-shrink-0">
                            <div className="col-span-2 sm:col-span-4">
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por código/desc..." className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="rubroFilter" className="text-xs text-gray-400 mb-1 block">Rubro</label>
                                <select id="rubroFilter" value={rubroFilter} onChange={e => setRubroFilter(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Todos los R...</option>
                                    {rubros.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subrubroFilter" className="text-xs text-gray-400 mb-1 block">SubRubro</label>
                                <select id="subrubroFilter" value={subrubroFilter} onChange={e => setSubrubroFilter(e.target.value)} disabled={!rubroFilter} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50">
                                    <option value="">Todos los S...</option>
                                    {subrubros.map(sr => <option key={sr} value={sr}>{sr}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="proveedorFilter" className="text-xs text-gray-400 mb-1 block">Proveedor</label>
                                <select id="proveedorFilter" value={proveedorFilter} onChange={e => setProveedorFilter(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Todos los P...</option>
                                    {proveedores.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="marcaFilter" className="text-xs text-gray-400 mb-1 block">Marca</label>
                                <select id="marcaFilter" value={marcaFilter} onChange={e => setMarcaFilter(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Todas las M...</option>
                                    {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        {/* Search Results */}
                        <div className="flex-grow overflow-y-auto">
                            <ul className="space-y-2">
                                {searchResults.map(product => (
                                    <li key={product.codigo}>
                                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedCodes.has(product.codigo) ? 'bg-indigo-600/30' : 'hover:bg-indigo-600/10'}`}>
                                            <input type="checkbox" checked={selectedCodes.has(product.codigo)} onChange={() => handleToggleSelection(product.codigo)} className="form-checkbox h-5 w-5 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-500 focus:ring-offset-gray-800" />
                                            <div>
                                                <p className="font-semibold text-white">{product.marca} - {product.descripcion}</p>
                                                <p className="text-xs text-gray-400">{product.proveedor || 'Proveedor no especificado'}</p>
                                                <p className="font-mono text-xs text-gray-500">{product.codigo}</p>
                                            </div>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                            {searchResults.length === 0 && <p className="text-center text-gray-500 py-8">No se encontraron productos.</p>}
                        </div>
                    </div>
                    <div className="w-full md:w-1/3 bg-gray-900/50 p-4 flex flex-col border-t md:border-t-0 md:border-l border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-3 flex-shrink-0">Seleccionados ({selectedCodes.size})</h4>
                        <div className="flex-grow overflow-y-auto space-y-2">
                             {selectedProducts.map(p => (
                                <div key={p.codigo} className="flex items-center justify-between bg-gray-800 p-2 rounded text-sm">
                                    <div>
                                        <p className="font-semibold text-white">{p.marca}</p>
                                        <p className="text-xs text-gray-400">{p.proveedor || 'Sin prov.'}</p>
                                        <p className="font-mono text-xs text-gray-500">{p.codigo}</p>
                                    </div>
                                    <button onClick={() => handleToggleSelection(p.codigo)} className="p-1 text-red-500 hover:text-red-400">&times;</button>
                                </div>
                             ))}
                             {selectedProducts.length === 0 && <p className="text-center text-gray-500 pt-8">Ningún producto seleccionado.</p>}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition">Cancelar</button>
                    <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition">Confirmar Selección</button>
                </div>
                 <style>{`.form-checkbox { appearance: none; border-radius: 4px; border-width: 2px; } .form-checkbox:checked { background-color: currentColor; } .form-checkbox:checked::before { content: "✓"; display: block; color: #fff; text-align: center; line-height: 1; font-size: 0.8rem; }`}</style>
            </div>
        </div>
    );
};

export default ProductSelectorModal;