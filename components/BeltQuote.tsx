
import React from 'react';
import { VehiculoServicio, Producto } from '../types';
import { CogIcon, ToolIcon, WaterDropIcon } from './IconComponents';

interface BeltQuoteProps {
  vehicle: VehiculoServicio;
  products: Producto[];
  laborRate: number;
}

const BeltQuote: React.FC<BeltQuoteProps> = ({ vehicle, products, laborRate }) => {
    
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  }

  const serviceParts = [
    { key: 'correa_distribucion_codigo', label: 'Kit Distribución', icon: <CogIcon className="w-6 h-6 text-cyan-400" /> },
    { key: 'bomba_agua_codigo', label: 'Bomba de Agua', icon: <WaterDropIcon className="w-6 h-6 text-blue-400" /> },
  ];

  const quoteItems = serviceParts.map(part => {
    const code = vehicle[part.key as keyof VehiculoServicio] as string;
    
    const product = code ? products.find(p => p.codigo && typeof p.codigo === 'string' && p.codigo.trim().toLowerCase() === code.trim().toLowerCase()) : undefined;
    
    let cost = 0;
    let mainDescription = `${part.label}: `;
    let details = `Cod: ${product && code ? code.trim() : 'Falta Código'}`;
    let hasIssue = !product && !!code;

    if (product) {
      mainDescription += product.marca || product.descripcion.split(" ")[0]; // Prioritize brand name
      details = `${product.descripcion} | ${details}`;
      cost = product.precio;
    } else {
        if (code) { // Code was specified but not found
          mainDescription += 'Producto no encontrado';
        } else { // No code specified
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
                {hasMissingData ? (
                    <p className="text-2xl font-bold text-yellow-400">Faltan Códigos</p>
                ) : (
                    <p className="text-3xl sm:text-4xl font-extrabold text-green-400">{formatCurrency(totalCost)}</p>
                )}
            </div>
        </div>
    </>
  );
};

export default BeltQuote;
