import React from 'react';
import { VehiculoServicio, Producto, PriceLevel } from '../types';
import { FuelIcon, GridIcon, OilCanIcon, SparklesIcon, ToolIcon, WindIcon } from './IconComponents';

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
    
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  }

  const serviceParts = [
    { key: 'aceite_codigo', label: 'Aceite', icon: <OilCanIcon className="w-6 h-6 text-yellow-400" />, isOil: true },
    { key: 'filtro_aceite_codigo', label: 'Filtro de Aceite', icon: <SparklesIcon className="w-6 h-6 text-blue-400" /> },
    { key: 'filtro_aire_codigo', label: 'Filtro de Aire', icon: <WindIcon className="w-6 h-6 text-cyan-400" /> },
    { key: 'filtro_combustible_codigo', label: 'Filtro de Combustible', icon: <FuelIcon className="w-6 h-6 text-orange-400" /> },
    { key: 'filtro_habitaculo_codigo', label: 'Filtro de Habitáculo', icon: <GridIcon className="w-6 h-6 text-purple-400" /> },
  ];

  const quoteItems = serviceParts.map(part => {
    const codeString = vehicle[part.key as keyof VehiculoServicio] as string | null | undefined;
    
    let product: Producto | undefined = undefined;
    let foundCode: string | undefined = undefined;

    if (codeString) {
        const potentialCodes = codeString.split(/\s+\/\s+|\s*,\s*|\s*;\s*/).map(c => c.trim()).filter(Boolean);
        for (const code of potentialCodes) {
            const foundProduct = products.find(p => p.codigo && typeof p.codigo === 'string' && p.codigo.trim().toLowerCase() === code.toLowerCase());
            if (foundProduct) {
                product = foundProduct;
                foundCode = code;
                break;
            }
        }
    }
    
    let cost = 0;
    let mainDescription = `${part.label}: `;
    let details = '';
    let hasIssue = false;

    if (product && foundCode) {
      mainDescription += product.marca || product.descripcion.split(" ")[0];
      
      if (part.isOil) {
          const requiredLiters = vehicle.litros_aceite || 0;
          const containerVolume = getContainerVolume(product.descripcion);
          const containerPrice = selectPrice(product, priceLevel);
          let cotizadoStr = '';

          if (containerVolume > 0 && requiredLiters > 0) {
              const fullContainersNeeded = Math.floor(requiredLiters / containerVolume);
              const looseOilLiters = requiredLiters % containerVolume;
              const pricePerLiter = containerPrice / containerVolume;

              const fullContainersCost = fullContainersNeeded * containerPrice;
              const looseOilCost = looseOilLiters > 0.01 ? looseOilLiters * pricePerLiter : 0;
              cost = fullContainersCost + looseOilCost;
              
              const detailParts = [];
              if (fullContainersNeeded > 0) detailParts.push(`${fullContainersNeeded} x ${containerVolume}L`);
              if (looseOilLiters > 0.01) detailParts.push(`${looseOilLiters.toFixed(2)}L suelto`);
              cotizadoStr = detailParts.join(' + ');

          } else {
              cost = containerPrice;
              cotizadoStr = '1 envase';
          }
          details = `Cotizado: ${cotizadoStr}. Requiere ${requiredLiters}L. | ${product.descripcion} | Cod: ${foundCode}`;
      } else {
          cost = selectPrice(product, priceLevel);
          details = `${product.descripcion} | Cod: ${foundCode}`;
      }
    } else {
        cost = 0;
        if (codeString?.trim()) {
            mainDescription += 'Producto no encontrado';
            details = `Cod: ${codeString.trim()} (no encontrado)`;
            hasIssue = true;
        } else {
            mainDescription += 'No especificado';
            details = 'Cod: No especificado';
        }
    }

    return {
      icon: part.icon,
      description: mainDescription,
      details: details,
      price: cost,
      hasIssue: hasIssue,
    };
  });
  
  const laborCost = ((vehicle.tiempo_mano_obra_minutos || 0) / 60) * laborRate;
  quoteItems.push({
    icon: <ToolIcon className="w-6 h-6 text-green-400" />,
    description: 'Mano de Obra (Aceite)',
    details: `${vehicle.tiempo_mano_obra_minutos || 0} min`,
    price: laborCost,
    hasIssue: false,
  });
  
  const hasMissingData = quoteItems.some(item => item.hasIssue);
  const totalCost = quoteItems.reduce((sum, item) => sum + item.price, 0);

  const breakdownItems: {label: string, value: string, quantity: string}[] = [];

  const oilCodeString = vehicle.aceite_codigo;
  let oilProduct;
  if (oilCodeString) {
      const potentialCodes = oilCodeString.split(/\s+\/\s+|\s*,\s*|\s*;\s*/).map(c => c.trim()).filter(Boolean);
      for (const code of potentialCodes) {
          const foundProduct = products.find(p => p.codigo?.trim().toLowerCase() === code.toLowerCase());
          if (foundProduct) {
              oilProduct = foundProduct;
              break;
          }
      }
  }

  if (oilProduct) {
      const requiredLiters = vehicle.litros_aceite || 0;
      const containerVolume = getContainerVolume(oilProduct.descripcion);
      if (containerVolume > 0 && requiredLiters > 0) {
          const fullContainersNeeded = Math.floor(requiredLiters / containerVolume);
          const looseOilLiters = requiredLiters % containerVolume;

          if (fullContainersNeeded > 0) {
              breakdownItems.push({ label: 'Aceite (Envase)', value: oilProduct.codigo, quantity: `${fullContainersNeeded} u.` });
          }
          if (looseOilLiters > 0.01) {
              breakdownItems.push({ label: 'Aceite Suelto', value: '', quantity: `${looseOilLiters.toFixed(2)} L` });
          }
      } else if (vehicle.aceite_codigo) {
           breakdownItems.push({ label: 'Aceite', value: vehicle.aceite_codigo, quantity: '1 u.' });
      }
  } else if (vehicle.aceite_codigo) {
      breakdownItems.push({ label: 'Aceite', value: vehicle.aceite_codigo, quantity: '-' });
  }

  const filterParts = [
    { label: 'Filtro de Aceite', code: vehicle.filtro_aceite_codigo },
    { label: 'Filtro de Aire', code: vehicle.filtro_aire_codigo },
    { label: 'Filtro de Combustible', code: vehicle.filtro_combustible_codigo },
    { label: 'Filtro de Habitáculo', code: vehicle.filtro_habitaculo_codigo },
  ];
  filterParts.forEach(part => {
    breakdownItems.push({
      label: part.label,
      value: part.code || 'No especificado',
      quantity: part.code ? '1 u.' : '-',
    });
  });
  
  const generalInfoItems = [
      {label: 'Tipo de Aceite', value: `${vehicle.tipo_aceite || ''} ${vehicle.nomenclatura_aceite || ''}`.trim()},
      {label: 'Próximo Cambio', value: vehicle.intervalo_cambio || 'No especificado'},
  ]

  return (
    <>
        <div className="bg-gray-900/50 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Cotización de Cambio de Aceite</h3>
            <div className="space-y-4 mb-6">
                {quoteItems.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-800 rounded-lg gap-2">
                        <div className="flex items-center gap-4">
                            {item.icon}
                            <div>
                                <p className="font-semibold text-white">{item.description}</p>
                                <p className="text-sm text-gray-400">{item.details}</p>
                            </div>
                        </div>
                        <p className={`font-bold text-lg sm:ml-auto ${item.hasIssue ? 'text-yellow-400' : 'text-white'}`}>
                            {formatCurrency(item.price)}
                        </p>
                    </div>
                ))}
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
                        <span className="w-2/5 text-right text-gray-500 font-mono break-all">{item.value}</span>
                        <span className="w-1/s text-right font-semibold">{item.quantity}</span>
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
    </>
  );
};

export default OilQuote;