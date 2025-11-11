import React, { useState, useMemo, useEffect } from 'react';
import { VehiculoServicio, Producto, PriceLevel } from '../types';
import { FuelIcon, GridIcon, OilCanIcon, SparklesIcon, ToolIcon, WindIcon, SwitchVerticalIcon } from './IconComponents';

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

const OilQuote: React.FC<OilQuoteProps> = ({ vehicle, products, laborRate, priceLevel }) => {
  const [selectedProductCodes, setSelectedProductCodes] = useState<Record<string, string>>({});
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

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

  const quoteItemsData = useMemo(() => {
    return serviceParts.map(part => {
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
    quoteItemsData.forEach(item => {
      if (item.alternatives.length > 0) {
        initialSelections[item.key] = item.alternatives[0].codigo;
      }
    });
    setSelectedProductCodes(initialSelections);
    setExpandedRowKey(null);
  }, [quoteItemsData]);

  const handleProductSelect = (itemKey: string, productCode: string) => {
    setSelectedProductCodes(prev => ({ ...prev, [itemKey]: productCode }));
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
      mainDescription += product.marca || 'Marca desconocida';
      
      if (itemData.isOil) {
          const requiredLiters = vehicle.litros_aceite || 0;
          const containerVolume = getContainerVolume(product.descripcion);
          const containerPrice = selectPrice(product, priceLevel);
          let cotizadoStr = '';

          if (containerVolume > 0 && requiredLiters > 0) {
              const fullContainersNeeded = Math.floor(requiredLiters / containerVolume);
              const looseOilLiters = requiredLiters % containerVolume;
              const pricePerLiter = containerPrice / containerVolume;

              cost = (fullContainersNeeded * containerPrice) + (looseOilLiters > 0.01 ? looseOilLiters * pricePerLiter : 0);
              
              const detailParts = [];
              if (fullContainersNeeded > 0) detailParts.push(`${fullContainersNeeded} x ${containerVolume}L`);
              if (looseOilLiters > 0.01) detailParts.push(`${looseOilLiters.toFixed(2)}L suelto`);
              cotizadoStr = detailParts.join(' + ');
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
  
  const totalCost = finalQuoteItems.reduce((sum, item) => sum + item.price, 0);
  const hasMissingData = finalQuoteItems.some(item => item.hasIssue);

  const breakdownItems: {label: string, value: string, quantity: string}[] = [];
  const oilItem = quoteItems.find(item => item.isOil);
  const selectedOilProduct = oilItem?.alternatives.find(p => p.codigo === selectedProductCodes[oilItem.key]);
  
  if (selectedOilProduct) {
      const requiredLiters = vehicle.litros_aceite || 0;
      const containerVolume = getContainerVolume(selectedOilProduct.descripcion);
      if (containerVolume > 0 && requiredLiters > 0) {
          const fullContainersNeeded = Math.floor(requiredLiters / containerVolume);
          const looseOilLiters = requiredLiters % containerVolume;
          if (fullContainersNeeded > 0) breakdownItems.push({ label: 'Aceite (Envase)', value: selectedOilProduct.codigo, quantity: `${fullContainersNeeded} u.` });
          if (looseOilLiters > 0.01) breakdownItems.push({ label: 'Aceite Suelto', value: '', quantity: `${looseOilLiters.toFixed(2)} L` });
      } else {
           breakdownItems.push({ label: 'Aceite', value: selectedOilProduct.codigo, quantity: '1 u.' });
      }
  } else if (vehicle.aceite_motor_cod && vehicle.aceite_motor_cod.length > 0) {
      breakdownItems.push({ label: 'Aceite', value: vehicle.aceite_motor_cod[0], quantity: '-' });
  }

  quoteItems.filter(item => !item.isOil).forEach(item => {
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

  return (
    <>
      <div className="bg-gray-900/50 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6">Cotización de Cambio de Aceite</h3>
          <div className="space-y-3 mb-6">
              {finalQuoteItems.map((item) => {
                  const hasOptions = item.potentialCodes.length > 1;
                  return (
                      <div key={item.key} className="bg-gray-800 rounded-lg transition-shadow hover:shadow-lg">
                          <div 
                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-2 ${hasOptions ? 'cursor-pointer' : ''}`}
                            onClick={() => hasOptions && toggleExpandRow(item.key)}
                          >
                              <div className="flex items-center gap-4">
                                  {item.icon}
                                  <div>
                                      <p className="font-semibold text-white">{item.description}</p>
                                      <p className="text-sm text-gray-400">{item.details}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4 self-end sm:self-center ml-auto">
                                <p className={`font-bold text-lg ${item.hasIssue ? 'text-yellow-400' : priceColorClass}`}>
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

      <div className="mt-8 bg-gray-900/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Desglose de Repuestos</h3>
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
                      <span className="w-1/5 text-right font-semibold">{item.quantity}</span>
                  </li>
              ))}
          </ul>
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
      <style>{`.animate-fade-in-fast { animation: fade-in 0.2s ease-out forwards; } @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } } .form-radio { appearance: none; border-radius: 50%; border-width: 2px; } .form-radio:checked { background-color: currentColor; } .form-radio:checked::before { content: ""; display: block; width: 0.5rem; height: 0.5rem; border-radius: 50%; background-color: #fff; margin: 2px; }`}</style>
    </>
  );
};
export default OilQuote;