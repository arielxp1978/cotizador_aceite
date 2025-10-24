import React from 'react';
import { VehiculoServicio, Producto, PriceLevel } from '../types';
import { CogIcon, ToolIcon, WaterDropIcon } from './IconComponents';

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
    
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  }

  const serviceParts = [
    { key: 'correa_distribucion_codigo', label: 'Kit Distribución', icon: <CogIcon className="w-6 h-6 text-cyan-400" /> },
    { key: 'bomba_agua_codigo', label: 'Bomba de Agua', icon: <WaterDropIcon className="w-6 h-6 text-blue-400" /> },
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
      details = `${product.descripcion} | Cod: ${foundCode}`;
      cost = selectPrice(product, priceLevel);
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
  
  const laborCost = ((vehicle.tiempo_mano_obra_correa_minutos || 0) / 60) * laborRate;
  quoteItems.push({
    icon: <ToolIcon className="w-6 h-6 text-green-400" />,
    description: 'Mano de Obra (Correa)',
    details: `${vehicle.tiempo_mano_obra_correa_minutos || 0} min`,
    price: laborCost,
    hasIssue: false,
  });
  
  const hasMissingData = quoteItems.some(item => item.hasIssue);
  const totalCost = quoteItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
        <div className="bg-gray-900/50 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Cotización de Cambio de Correa</h3>
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
    </>
  );
};

export default BeltQuote;