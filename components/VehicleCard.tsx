
import React, { useState, useMemo, useEffect } from 'react';
import { VehiculoServicio, Producto, PriceLevel } from '../types';
import { FuelIcon, GridIcon, OilCanIcon, SparklesIcon, ToolIcon, WindIcon, SwitchVerticalIcon, FileTextIcon, WhatsAppIcon, ClipboardCheckIcon, PackageIcon, InfoIcon } from './IconComponents';

interface OilQuoteProps {
  vehicle: VehiculoServicio;
  products: Producto[];
  laborRate: number;
  priceLevel: PriceLevel;
}

const getContainerVolume = (description: string): number => {
  const match = description.match(/(\d+(\.\d+)?)\s*L/i);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return 1;
};

const selectPrice = (product: Producto, level: PriceLevel): number => {
    if (level === 'taller' && typeof product.precio_taller === 'number') {
        return product.precio_taller;
    }
    if (level === 'costo' && typeof product.precio_costo === 'number') {
        return product.precio_costo;
    }
    return product.precio || 0;
};

const OilInfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <InfoIcon className="w-6 h-6 text-indigo-400" />
                        Guía Rápida: Tipos de Aceite
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>
                <div className="p-6 space-y-6 text-gray-300 leading-relaxed">
                    
                    {/* Sección 1 */}
                    <div className="border-l-4 border-green-500 pl-4 bg-green-900/10 p-3 rounded-r-lg">
                        <h4 className="font-bold text-green-400 text-lg mb-1">1. De Mineral → Semisintético o Sintético</h4>
                        <p className="font-semibold text-white mb-2">✅ Sí, se puede. Es recomendable.</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li><strong className="text-gray-400">Cuándo:</strong> Autos más modernos, búsqueda de mayor protección y limpieza.</li>
                            <li><strong className="text-gray-400">Precaución:</strong> En motores muy antiguos con mucho desgaste, puede aumentar levemente el consumo por la limpieza interna.</li>
                        </ul>
                    </div>

                    {/* Sección 2 */}
                    <div className="border-l-4 border-green-500 pl-4 bg-green-900/10 p-3 rounded-r-lg">
                        <h4 className="font-bold text-green-400 text-lg mb-1">2. De Semisintético → Sintético</h4>
                        <p className="font-semibold text-white mb-2">✅ Sí, sin problema. Es el cambio ideal.</p>
                        <p className="text-sm">Ofrece mayor estabilidad térmica, menos depósitos y menor desgaste.</p>
                    </div>

                    {/* Sección 3 */}
                    <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-900/10 p-3 rounded-r-lg">
                        <h4 className="font-bold text-yellow-400 text-lg mb-1">3. De Sintético → Semisintético</h4>
                        <p className="font-semibold text-white mb-2">⚠️ Posible, pero no recomendable.</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Solo si el manual lo permite explícitamente y no altera la viscosidad.</li>
                            <li><strong className="text-gray-400">Riesgo:</strong> Reduce la protección en motores diseñados para aceites de alta exigencia (ej: 0W-20, 5W-30 modernos).</li>
                        </ul>
                    </div>

                    {/* Sección 4 */}
                    <div className="border-l-4 border-red-500 pl-4 bg-red-900/10 p-3 rounded-r-lg">
                        <h4 className="font-bold text-red-400 text-lg mb-1">4. De Sintético → Mineral</h4>
                        <p className="font-semibold text-white mb-2">❌ No debe hacerse (salvo excepciones).</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Solo en motores muy viejos (años 80/90) o con desgaste extremo.</li>
                            <li><strong className="text-gray-400">Riesgo:</strong> Pérdida de protección en frío, más sedimentos y mayor desgaste.</li>
                        </ul>
                    </div>

                     {/* Sección 5 */}
                     <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-900/10 p-3 rounded-r-lg">
                        <h4 className="font-bold text-yellow-400 text-lg mb-1">5. De Semisintético → Mineral</h4>
                        <p className="font-semibold text-white mb-2">⚠️ Posible solo si el fabricante lo permite.</p>
                        <p className="text-sm">Normalmente no tiene sentido en autos modernos.</p>
                    </div>

                    <div className="bg-indigo-900/30 border border-indigo-500/50 p-4 rounded-lg text-center">
                        <h4 className="text-lg font-bold text-white mb-2">🏆 Regla de Oro</h4>
                        <p className="mb-2">Siempre <span className="text-green-400 font-bold">subir de calidad</span> es seguro. <span className="text-red-400 font-bold">Bajar de calidad</span> puede ser problemático.</p>
                        <p className="text-sm font-mono text-indigo-300">La viscosidad recomendada por el fabricante NO se toca.<br/>(Ej: Si pide 0W-20, va 0W-20).</p>
                    </div>

                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-800 rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

const OilQuote: React.FC<OilQuoteProps> = ({ vehicle, products, laborRate, priceLevel }) => {
  const [selectedProductCodes, setSelectedProductCodes] = useState<Record<string, string>>({});
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [includedItems, setIncludedItems] = useState<Set<string>>(new Set());
  const [isCopied, setIsCopied] = useState(false);
  const [selectedComboCode, setSelectedComboCode] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const priceColorClass =
    priceLevel === 'taller' ? 'text-yellow-400' :
    priceLevel === 'costo' ? 'text-red-400' :
    'text-white';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  }

  const serviceParts = useMemo(() => [
    { key: 'aceite_motor_cod', label: 'Aceite', icon: <OilCanIcon className="w-6 h-6 text-yellow-400" />, isOil: true },
    { key: 'filtro_aceite_cod', label: 'Filtro de Aceite', icon: <SparklesIcon className="w-6 h-6 text-blue-400" /> },
    { key: 'filtro_aire_cod', label: 'Filtro de Aire', icon: <WindIcon className="w-6 h-6 text-cyan-400" /> },
    { key: 'filtro_combustible_cod', label: 'Filtro de Combustible', icon: <FuelIcon className="w-6 h-6 text-orange-400" /> },
    { key: 'filtro_habitaculo_cod', label: 'Filtro de Habitáculo', icon: <GridIcon className="w-6 h-6 text-purple-400" /> },
  ], []);

  // Recuperar los combos/kits asignados al vehículo
  const assignedCombos = useMemo(() => {
      const codes = vehicle.combos_cod || [];
      return codes
        .map(code => products.find(p => p.codigo === code))
        .filter((p): p is Producto => p !== undefined);
  }, [vehicle.combos_cod, products]);

  const quoteItemsData = useMemo(() => {
    return serviceParts.map(part => {
        if (part.isOil) {
            const defaultCodes = vehicle.aceite_motor_cod || [];
            const defaultProducts = defaultCodes
                .map(code => products.find(p => p.codigo?.trim().toLowerCase() === code.trim().toLowerCase()))
                .filter((p): p is Producto => p !== undefined);

            let alternativesFromSearch: Producto[] = [];
            const searchTerm = vehicle.nomenclatura_aceite?.trim().toLowerCase();

            if (searchTerm) {
                const normalizedForCheck = searchTerm.replace(/[-\s]/g, '');
                const isViscositySearch = /^\d+w\d+$/i.test(normalizedForCheck) && searchTerm.includes('w');

                if (isViscositySearch) {
                    const pattern = normalizedForCheck.replace(/w/i, 'w[\\s-]?');
                    const regex = new RegExp(`(^|[^\\d])(${pattern})`, 'i');
                    alternativesFromSearch = products.filter(p => {
                        const isOilProduct = p.subrubro?.toLowerCase() === 'aceite motor' || p.rubro?.toLowerCase() === 'aceite';
                        if (!isOilProduct) return false;
                        const desc = p.descripcion || '';
                        const code = p.codigo || '';
                        return regex.test(desc) || regex.test(code);
                    });
                } else {
                    const normalizedSearch = searchTerm.replace(/[-\s]/g, '');
                    alternativesFromSearch = products.filter(p => {
                        const isOilProduct = p.subrubro?.toLowerCase() === 'aceite motor' || p.rubro?.toLowerCase() === 'aceite';
                        if (!isOilProduct) return false;
                        const desc = p.descripcion?.toLowerCase() || '';
                        const normalizedDesc = desc.replace(/[-\s]/g, '');
                        return normalizedDesc.includes(normalizedSearch);
                    });
                }
            }
            
            const combinedAlternatives = new Map<string, Producto>();
            defaultProducts.forEach(p => combinedAlternatives.set(p.codigo, p));
            alternativesFromSearch.forEach(p => {
                if (!combinedAlternatives.has(p.codigo)) {
                    combinedAlternatives.set(p.codigo, p);
                }
            });
            
            const defaultProductCodes = new Set(defaultProducts.map(p => p.codigo));
            const finalAlternatives = Array.from(combinedAlternatives.values()).filter(p => {
                if (defaultProductCodes.has(p.codigo)) {
                    return true;
                }
                const volume = getContainerVolume(p.descripcion);
                return volume <= 4;
            });

            const unavailableCodes = defaultCodes.filter(code => !products.some(p => p.codigo?.trim().toLowerCase() === code.trim().toLowerCase()));
            const potentialCodes = finalAlternatives.map(p => p.codigo);

            return { ...part, alternatives: finalAlternatives, unavailableCodes, potentialCodes };
        }

        const potentialCodes = (vehicle[part.key as keyof VehiculoServicio] as string[] | null) || [];
        const alternatives = potentialCodes
            .map(code => products.find(p => p.codigo?.trim().toLowerCase() === code.trim().toLowerCase()))
            .filter((p): p is Producto => p !== undefined);
        
        const unavailableCodes = potentialCodes.filter(code => !products.some(p => p.codigo?.trim().toLowerCase() === code.trim().toLowerCase()));

        return { ...part, alternatives, unavailableCodes, potentialCodes };
    });
  }, [vehicle, products, serviceParts]);

  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    const initialInclusions = new Set<string>();
    
    quoteItemsData.forEach(item => {
      if (item.alternatives.length > 0) {
        // Only set a default if one isn't already selected for this item key
        if (!selectedProductCodes[item.key]) {
            initialSelections[item.key] = item.alternatives[0].codigo;
        }
        initialInclusions.add(item.key);
      }
    });

    initialInclusions.add('mano_obra_aceite');
    
    // Merge new initial selections with existing ones to preserve choices
    setSelectedProductCodes(prev => ({...prev, ...initialSelections}));
    setIncludedItems(initialInclusions);
    setExpandedRowKey(null);
    setSelectedComboCode(null); // Reset selected combo on vehicle change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle]); // Depend only on vehicle to reset defaults.
  
  // Effect to update selected product if it disappears from alternatives
  useEffect(() => {
    const newSelections = { ...selectedProductCodes };
    let changed = false;
    quoteItemsData.forEach(item => {
        const currentSelection = newSelections[item.key];
        if (currentSelection && !item.alternatives.some(alt => alt.codigo === currentSelection)) {
            // The selected product is no longer in the list of alternatives
            if (item.alternatives.length > 0) {
                newSelections[item.key] = item.alternatives[0].codigo; // Select the new first one
                changed = true;
            } else {
                delete newSelections[item.key]; // No alternatives left
                changed = true;
            }
        }
    });
    if (changed) {
        setSelectedProductCodes(newSelections);
    }
  }, [quoteItemsData, selectedProductCodes]);

  const handleProductSelect = (itemKey: string, productCode: string) => {
    setSelectedProductCodes(prev => ({ ...prev, [itemKey]: productCode }));
  };
  
  const handleComboSelect = (comboCode: string) => {
      if (selectedComboCode === comboCode) {
          // Deselect Combo
          setSelectedComboCode(null);
          
          // Restore filters (keep Oil and Labor as is)
          setIncludedItems(prev => {
              const newSet = new Set(prev);
              quoteItemsData.forEach(item => {
                  if (!item.isOil && item.alternatives.length > 0) {
                      newSet.add(item.key);
                  }
              });
              return newSet;
          });
      } else {
          // Select Combo
          setSelectedComboCode(comboCode);
          
          // Uncheck filters (keep Oil and Labor as is)
          setIncludedItems(prev => {
              const newSet = new Set(prev);
              quoteItemsData.forEach(item => {
                  if (!item.isOil) {
                      newSet.delete(item.key);
                  }
              });
              return newSet;
          });
      }
  };

  const handleToggleIncluded = (itemKey: string) => {
    const itemIsOil = itemKey === 'aceite_motor_cod';
    const itemIsLabor = itemKey === 'mano_obra_aceite';
    const isFilter = !itemIsOil && !itemIsLabor;

    // If we are enabling a filter (checking it) and a combo is active, deselect the combo
    // because the combo replaces filters.
    if (selectedComboCode && !includedItems.has(itemKey) && isFilter) {
        setSelectedComboCode(null);
    }

    setIncludedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemKey)) {
            newSet.delete(itemKey);
        } else {
            newSet.add(itemKey);
        }
        return newSet;
    });
  };

  const toggleExpandRow = (itemKey: string) => {
    setExpandedRowKey(prev => (prev === itemKey ? null : itemKey));
  };

  const quoteItems = quoteItemsData.map(itemData => {
    const selectedCode = selectedProductCodes[itemData.key];
    const product = itemData.alternatives.find(p => p.codigo === selectedCode);
    
    let cost = 0;
    let mainDescription = `${itemData.label}: `;
    let details = '';
    let hasIssue = false;

    if (product) {
      mainDescription += `${product.marca || 'Marca desconocida'}`;
      if (priceLevel === 'costo') {
        mainDescription += ` (${product.proveedor || 'Genérico'})`;
      }
      
      if (itemData.isOil) {
          const requiredLiters = vehicle.litros_aceite || 0;
          const containerVolume = getContainerVolume(product.descripcion);
          const containerPrice = selectPrice(product, priceLevel);
          let cotizadoStr = '';

          if (containerVolume > 0 && requiredLiters > 0) {
              if (requiredLiters <= containerVolume) {
                  cost = containerPrice;
                  const leftover = containerVolume - requiredLiters;
                  const leftoverStr = leftover % 1 === 0 ? leftover.toString() : leftover.toFixed(2);
                  cotizadoStr = `1 x ${containerVolume}L (Sobra ${leftoverStr}L)`;
              } else {
                  const fullContainersNeeded = Math.floor(requiredLiters / containerVolume);
                  const looseOilLiters = requiredLiters % containerVolume;
                  const pricePerLiter = containerPrice / containerVolume;

                  cost = (fullContainersNeeded * containerPrice) + (looseOilLiters > 0.01 ? looseOilLiters * pricePerLiter : 0);
                  
                  const detailParts = [];
                  if (fullContainersNeeded > 0) detailParts.push(`${fullContainersNeeded} x ${containerVolume}L`);
                  if (looseOilLiters > 0.01) detailParts.push(`${looseOilLiters.toFixed(2)}L suelto`);
                  cotizadoStr = detailParts.join(' + ');
              }
          } else {
              cost = containerPrice;
              cotizadoStr = '1 envase';
          }
          details = `Cotizado: ${cotizadoStr}. Requiere ${requiredLiters}L. | ${product.descripcion} | Cod: ${product.codigo}`;
      } else {
          cost = selectPrice(product, priceLevel);
          details = `${product.descripcion} | Cod: ${product.codigo}`;
      }
    } else {
        cost = 0;
        if (itemData.potentialCodes.length > 0) {
            mainDescription += 'Producto no encontrado';
            details = `Cod: ${itemData.potentialCodes.join(' / ')} (no encontrado)`;
            hasIssue = true;
        } else {
            mainDescription += 'No especificado';
            details = 'Cod: No especificado';
        }
    }

    return { ...itemData, description: mainDescription, details, price: cost, hasIssue };
  });
  
  const laborCost = ((vehicle.tiempo_mano_obra_minutos || 0) / 60) * laborRate;
  
  const finalQuoteItems = [...quoteItems, {
    key: 'mano_obra_aceite',
    icon: <ToolIcon className="w-6 h-6 text-green-400" />,
    description: 'Mano de Obra (Aceite)',
    details: `${vehicle.tiempo_mano_obra_minutos || 0} min`,
    price: laborCost,
    hasIssue: false,
    alternatives: [],
    potentialCodes: [],
    unavailableCodes: [],
  }];
  
  let totalCost = finalQuoteItems.reduce((sum, item) => {
    if (includedItems.has(item.key)) {
      return sum + item.price;
    }
    return sum;
  }, 0);

  if (selectedComboCode) {
      const combo = assignedCombos.find(c => c.codigo === selectedComboCode);
      if (combo) {
          totalCost += selectPrice(combo, priceLevel);
      }
  }

  const hasMissingData = finalQuoteItems.some(item => item.hasIssue && includedItems.has(item.key));

  const breakdownItems: {label: string, value: string, quantity: string}[] = [];
  
  if (selectedComboCode) {
      const combo = assignedCombos.find(c => c.codigo === selectedComboCode);
      if (combo) {
          breakdownItems.push({ label: 'Kit / Combo', value: `${combo.descripcion} (${combo.codigo})`, quantity: '1 u.' });
      }
  }

  const oilItem = quoteItems.find(item => item.isOil);
  
  if (oilItem && includedItems.has(oilItem.key)) {
      const selectedOilProduct = oilItem.alternatives.find(p => p.codigo === selectedProductCodes[oilItem.key]);
      if (selectedOilProduct) {
          const requiredLiters = vehicle.litros_aceite || 0;
          const containerVolume = getContainerVolume(selectedOilProduct.descripcion);
          if (containerVolume > 0 && requiredLiters > 0) {
              if (requiredLiters <= containerVolume) {
                  breakdownItems.push({ label: 'Aceite (Envase)', value: selectedOilProduct.codigo, quantity: '1 u.' });
              } else {
                  const fullContainersNeeded = Math.floor(requiredLiters / containerVolume);
                  const looseOilLiters = requiredLiters % containerVolume;
                  if (fullContainersNeeded > 0) breakdownItems.push({ label: 'Aceite (Envase)', value: selectedOilProduct.codigo, quantity: `${fullContainersNeeded} u.` });
                  if (looseOilLiters > 0.01) breakdownItems.push({ label: 'Aceite Suelto', value: '', quantity: `${looseOilLiters.toFixed(2)} L` });
              }
          } else {
               breakdownItems.push({ label: 'Aceite', value: selectedOilProduct.codigo, quantity: '1 u.' });
          }
      } else if (vehicle.aceite_motor_cod && vehicle.aceite_motor_cod.length > 0) {
          breakdownItems.push({ label: 'Aceite', value: vehicle.aceite_motor_cod[0], quantity: '-' });
      }
  }

  quoteItems.filter(item => !item.isOil && includedItems.has(item.key)).forEach(item => {
      const selectedProduct = item.alternatives.find(p => p.codigo === selectedProductCodes[item.key]);
      breakdownItems.push({
          label: item.label,
          value: selectedProduct?.codigo || item.potentialCodes.join(' / ') || 'No especificado',
          quantity: selectedProduct ? '1 u.' : '-',
      });
  });

  const generalInfoItems = [
      {label: 'Tipo de Aceite', value: `${vehicle.tipo_aceite || ''} ${vehicle.nomenclatura_aceite || ''}`.trim()},
      {label: 'Próximo Cambio', value: vehicle.intervalo_cambio || 'No especificado'},
  ];

  const handleCopyToClipboard = () => {
    let quoteText = `🚗 *Nova - Cambio de Aceite* 🚗\n\n`;
    quoteText += `*Vehículo:* ${vehicle.marca} ${vehicle.modelo} ${vehicle.version || ''}\n`;
    quoteText += `--------------------\n`;
    quoteText += `*Detalle del Servicio:*\n`;

    if (selectedComboCode) {
         const combo = assignedCombos.find(c => c.codigo === selectedComboCode);
         if (combo) {
             quoteText += `- Kit/Combo: ${combo.descripcion} (${combo.codigo}): ${formatCurrency(selectPrice(combo, priceLevel))}\n`;
         }
    }

    finalQuoteItems.forEach(item => {
        if (includedItems.has(item.key) && item.price > 0) {
            const product = item.alternatives?.find(p => p.codigo === selectedProductCodes[item.key]);
            let line = `- ${item.description}`;
            if (product) {
                line += ` (${product.marca} / ${product.codigo})`;
            }
             line += `: ${formatCurrency(item.price)}\n`;
            quoteText += line;
        }
    });

    quoteText += `--------------------\n`;
    quoteText += `*TOTAL ESTIMADO:* *${formatCurrency(totalCost)}*\n\n`;
    quoteText += `¡Gracias por cotizar con nosotros! 😊\n\n`;
    quoteText += `¡Reserva tu turno ahora y asegura tu lugar! 📲`;


    navigator.clipboard.writeText(quoteText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <>
      {showInfoModal && <OilInfoModal onClose={() => setShowInfoModal(false)} />}
      <div className="bg-gray-900/50 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-white">Cotización de Cambio de Aceite</h3>
            <button 
                onClick={() => setShowInfoModal(true)}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-500/30"
            >
                <InfoIcon className="w-4 h-4" />
                Información Útil
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-300 border-b border-gray-700 pb-4 mb-6 text-sm">
            {vehicle.litros_aceite ? (
                <div className="flex items-center gap-2" title="Litros de aceite requeridos">
                    <OilCanIcon className="w-5 h-5 text-yellow-500" />
                    <div>
                        <span className="text-xs text-gray-500">Capacidad</span>
                        <p className="font-bold">{vehicle.litros_aceite} Litros</p>
                    </div>
                </div>
            ) : null}
            {(vehicle.nomenclatura_aceite || vehicle.tipo_aceite) ? (
                <div className="flex items-center gap-2" title="Especificación del aceite">
                    <FileTextIcon className="w-5 h-5 text-blue-400" />
                    <div>
                        <span className="text-xs text-gray-500">Especificación</span>
                        <p className="font-bold">{[vehicle.nomenclatura_aceite, vehicle.tipo_aceite].filter(Boolean).join(' / ')}</p>
                    </div>
                </div>
            ) : null}
          </div>

          {assignedCombos.length > 0 && (
              <div className="mb-6 bg-indigo-900/20 rounded-lg border border-indigo-900/50 p-4">
                  <h4 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                      <PackageIcon className="w-5 h-5" />
                      Kits / Combos Recomendados
                  </h4>
                  <div className="space-y-3">
                      {assignedCombos.map(combo => {
                          const isSelected = selectedComboCode === combo.codigo;
                          return (
                              <label key={combo.codigo} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-indigo-600/30 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:border-indigo-500/50'}`}>
                                  <div className="flex items-start gap-3">
                                      <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          onChange={() => handleComboSelect(combo.codigo)}
                                          className="mt-1 form-checkbox h-5 w-5 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-500"
                                      />
                                      <div>
                                          <p className="font-bold text-white text-sm">{combo.descripcion}</p>
                                          <p className="text-xs text-gray-400">{combo.marca} - {combo.codigo}</p>
                                      </div>
                                  </div>
                                  <div className="mt-2 sm:mt-0 self-end sm:self-center">
                                      <p className={`font-bold text-lg ${priceColorClass}`}>
                                          {formatCurrency(selectPrice(combo, priceLevel))}
                                      </p>
                                  </div>
                              </label>
                          );
                      })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic text-center">
                      Seleccionar un kit reemplaza los filtros individuales. El aceite se cotiza aparte.
                  </p>
              </div>
          )}

          <div className="space-y-3 mb-6">
              {finalQuoteItems.map((item) => {
                  const hasOptions = item.alternatives.length > 1;
                  const isIncluded = includedItems.has(item.key);

                  return (
                      <div key={item.key} className={`bg-gray-800 rounded-lg transition-all duration-300 ${!isIncluded ? 'opacity-50' : 'hover:shadow-lg'}`}>
                          <div 
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-2"
                          >
                              <div className="flex items-center gap-4">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={() => handleToggleIncluded(item.key)}
                                  className="form-checkbox h-5 w-5 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-500 focus:ring-offset-gray-800 flex-shrink-0"
                                  aria-label={`Incluir ${item.description}`}
                                />
                                  {item.icon}
                                  <div>
                                      <p className="font-semibold text-white">{item.description}</p>
                                      <p className="text-sm text-gray-400">{item.details}</p>
                                  </div>
                              </div>
                              <div 
                                className={`flex items-center gap-4 self-end sm:self-center ml-auto ${hasOptions ? 'cursor-pointer' : ''}`}
                                onClick={() => hasOptions && toggleExpandRow(item.key)}
                              >
                                <p className={`font-bold text-lg transition-colors ${item.hasIssue ? 'text-yellow-400' : priceColorClass}`}>
                                    {formatCurrency(item.price)}
                                </p>
                                {hasOptions && (
                                    <SwitchVerticalIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedRowKey === item.key ? 'text-indigo-400 rotate-180' : ''}`} />
                                )}
                              </div>
                          </div>
                          {expandedRowKey === item.key && (
                            <div className="p-4 border-t border-gray-700/50 animate-fade-in-fast">
                              <p className="text-sm font-semibold text-gray-300 mb-3">Opciones disponibles:</p>
                              {item.alternatives.length > 0 && (
                                <fieldset className="space-y-2">
                                  <legend className="sr-only">Seleccionar producto</legend>
                                  {item.alternatives.map(alt => {
                                      const isSelected = selectedProductCodes[item.key] === alt.codigo;
                                      return (
                                        <label key={alt.codigo} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600/30' : 'hover:bg-indigo-600/10'}`}>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                  type="radio" 
                                                  name={`product-option-${item.key}`}
                                                  value={alt.codigo}
                                                  checked={isSelected}
                                                  onChange={() => handleProductSelect(item.key, alt.codigo)}
                                                  className="form-radio h-4 w-4 text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-500 focus:ring-offset-gray-800"
                                                />
                                                <div>
                                                    <p className="font-semibold text-white">{alt.marca} - {alt.descripcion}</p>
                                                    {priceLevel === 'costo' && (
                                                      <p className="text-xs text-gray-400">Proveedor: {alt.proveedor || 'No especificado'}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 font-mono">Cod: {alt.codigo}</p>
                                                </div>
                                            </div>
                                            <p className={`font-bold ${priceColorClass}`}>{formatCurrency(selectPrice(alt, priceLevel))}</p>
                                        </label>
                                      );
                                  })}
                                </fieldset>
                              )}
                              {item.unavailableCodes.length > 0 && (
                                <div className="mt-4 p-3 bg-yellow-900/40 rounded-lg text-sm border border-yellow-700/50">
                                  <p className="font-semibold text-yellow-300 mb-2">Códigos no encontrados en la base de productos:</p>
                                  <ul className="list-disc list-inside text-yellow-400 space-y-1">
                                    {item.unavailableCodes.map(code => <li key={code}><span className="font-mono bg-gray-700 px-1 rounded">{code}</span></li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                  )
              })}
          </div>

          <div className="border-t-2 border-dashed border-gray-700 my-6"></div>

          <div className="flex justify-between items-center text-white">
              <p className="text-2xl font-bold">TOTAL</p>
              <div className="flex items-center gap-3">
                    <button onClick={handleCopyToClipboard} className="relative group p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200">
                      {isCopied ? <ClipboardCheckIcon className="w-6 h-6 text-green-400" /> : <WhatsAppIcon className="w-6 h-6 text-green-500" />}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs text-white bg-gray-900/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {isCopied ? '¡Copiado!' : 'Copiar para WhatsApp'}
                      </span>
                    </button>
                    <div className="text-right">
                        <p className={`text-3xl sm:text-4xl font-extrabold ${hasMissingData ? 'text-gray-500' : 'text-green-400'}`}>
                            {formatCurrency(totalCost)}
                        </p>
                        {hasMissingData && (
                            <p className="text-sm font-semibold text-yellow-400 mt-1">Faltan Códigos</p>
                        )}
                    </div>
              </div>
          </div>
      </div>

      <div className="mt-8 bg-gray-900/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Desglose de Repuestos</h3>
          {breakdownItems.length > 0 ? (
            <ul className="space-y-1 text-gray-300">
                <li className="flex justify-between border-b-2 border-gray-700 pb-2 mb-2 font-semibold text-gray-400 text-sm">
                    <span className="w-2/5">Repuesto</span>
                    <span className="w-2/5 text-right">Código</span>
                    <span className="w-1/5 text-right">Cantidad</span>
                </li>
                {breakdownItems.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-b-0">
                        <span className="w-2/5">{item.label}</span>
                        <span className="w-2/5 text-right text-gray-500 font-mono break-words">{item.value}</span>
                        <span className="w-1/s text-right font-semibold">{item.quantity}</span>
                    </li>
                ))}
            </ul>
           ) : (
            <p className="text-gray-500 text-center py-4">Ningún repuesto seleccionado para el desglose.</p>
           )}
           {generalInfoItems.length > 0 && (
              <>
                  <div className="border-t border-gray-700 my-4"></div>
                  <ul className="space-y-2 text-gray-300">
                      {generalInfoItems.map(info => (
                         info.value && <li key={info.label} className="flex justify-between py-1 text-sm">
                              <span className="font-semibold text-gray-400">{info.label}:</span>
                              <span className="text-right">{info.value}</span>
                          </li>
                      ))}
                  </ul>
              </>
          )}
      </div>
      <style>{`.animate-fade-in-fast { animation: fade-in 0.2s ease-out forwards; } @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } } .form-radio { appearance: none; border-radius: 50%; border-width: 2px; } .form-radio:checked { background-color: currentColor; } .form-radio:checked::before { content: ""; display: block; width: 0.5rem; height: 0.5rem; border-radius: 50%; background-color: #fff; margin: 2px; } .form-checkbox { appearance: none; border-radius: 4px; border-width: 2px; } .form-checkbox:checked { background-color: currentColor; } .form-checkbox:checked::before { content: "✓"; display: block; color: #fff; text-align: center; line-height: 1; font-size: 0.8rem; }`}</style>
    </>
  );
};
export default OilQuote;
