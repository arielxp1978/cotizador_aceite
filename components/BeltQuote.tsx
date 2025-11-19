import React, { useState, useMemo, useEffect } from 'react';
import { VehiculoServicio, Producto, PriceLevel } from '../types';
import { CogIcon, ToolIcon, WaterDropIcon, SwitchVerticalIcon, WhatsAppIcon, ClipboardCheckIcon } from './IconComponents';

interface BeltQuoteProps {
  vehicle: VehiculoServicio;
  products: Producto[];
  laborRate: number;
  priceLevel: PriceLevel;
}

const selectPrice = (product: Producto, level: PriceLevel): number => {
    if (level === 'taller' && typeof product.precio_taller === 'number') {
        return product.precio_taller;
    }
    if (level === 'costo' && typeof product.precio_costo === 'number') {
        return product.precio_costo;
    }
    return product.precio || 0;
};

const BeltQuote: React.FC<BeltQuoteProps> = ({ vehicle, products, laborRate, priceLevel }) => {
  const [selectedProductCodes, setSelectedProductCodes] = useState<Record<string, string>>({});
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const priceColorClass =
    priceLevel === 'taller' ? 'text-yellow-400' :
    priceLevel === 'costo' ? 'text-red-400' :
    'text-white';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  }

  const serviceParts = useMemo(() => [
    { key: 'correa_distribucion_cod', label: 'Kit Distribución', icon: <CogIcon className="w-6 h-6 text-cyan-400" /> },
    { key: 'tensor_distribucion_cod', label: 'Tensor Distribución', icon: <CogIcon className="w-6 h-6 text-cyan-300" /> },
    { key: 'rodillos_cod', label: 'Rodillos', icon: <CogIcon className="w-6 h-6 text-cyan-200" /> },
    { key: 'bomba_agua_cod', label: 'Bomba de Agua', icon: <WaterDropIcon className="w-6 h-6 text-blue-400" /> },
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
      mainDescription += `${product.marca || 'Marca desconocida'}`;
      if (priceLevel === 'costo') {
        mainDescription += ` (${product.proveedor || 'Genérico'})`;
      }
      details = `${product.descripcion} | Cod: ${product.codigo}`;
      cost = selectPrice(product, priceLevel);
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
  
  const laborCost = ((vehicle.tiempo_mano_obra_correa_minutos || 0) / 60) * laborRate;
  const finalQuoteItems = [...quoteItems, {
    key: 'mano_obra_correa',
    icon: <ToolIcon className="w-6 h-6 text-green-400" />,
    description: 'Mano de Obra (Correa)',
    details: `${vehicle.tiempo_mano_obra_correa_minutos || 0} min`,
    price: laborCost,
    hasIssue: false,
    alternatives: [],
    potentialCodes: [],
    unavailableCodes: [],
  }];
  
  const totalCost = finalQuoteItems.reduce((sum, item) => sum + item.price, 0);
  const hasMissingData = finalQuoteItems.some(item => item.hasIssue);

  const handleCopyToClipboard = () => {
    let quoteText = `⚙️ *Nova - Cambio de Correa* ⚙️\n\n`;
    quoteText += `*Vehículo:* ${vehicle.marca} ${vehicle.modelo} ${vehicle.version || ''}\n`;
    quoteText += `--------------------\n`;
    quoteText += `*Detalle del Servicio:*\n`;

    finalQuoteItems.forEach(item => {
        if (item.price > 0) {
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
        <div className="bg-gray-900/50 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Cotización de Cambio de Correa</h3>
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
                    );
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
        <style>{`.animate-fade-in-fast { animation: fade-in 0.2s ease-out forwards; } @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } } .form-radio { appearance: none; border-radius: 50%; border-width: 2px; } .form-radio:checked { background-color: currentColor; } .form-radio:checked::before { content: ""; display: block; width: 0.5rem; height: 0.5rem; border-radius: 50%; background-color: #fff; margin: 2px; }`}</style>
    </>
  );
};

export default BeltQuote;