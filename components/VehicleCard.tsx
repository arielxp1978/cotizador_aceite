
import React from 'react';
import { VehiculoServicio, Producto } from '../types';
import { CalendarIcon, FuelIcon, GridIcon, OilCanIcon, SparklesIcon, ToolIcon, WindIcon } from './IconComponents';

interface OilQuoteProps {
  vehicle: VehiculoServicio;
  products: Producto[];
  laborRate: number;
}

// Helper function to extract volume from description string (e.g., "Caja 4 x 4L" -> 4)
const getContainerVolume = (description: string): number => {
  const match = description.match(/(\d+(\.\d+)?)\s*L/i); // Matches "4L", "5 L", "1.5L" etc.
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return 1; // Default to 1L if not specified
};


const OilQuote: React.FC<OilQuoteProps> = ({ vehicle, products, laborRate }) => {
    
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
    const code = vehicle[part.key as keyof VehiculoServicio] as string | null | undefined;
    const trimmedCode = code?.trim();
    // Robust product finding, ignoring whitespace and case-insensitivity
    const product = trimmedCode ? products.find(p => p.codigo && typeof p.codigo === 'string' && p.codigo.trim().toLowerCase() === trimmedCode.toLowerCase()) : undefined;
    
    let cost = 0;
    let mainDescription = `${part.label}: `;
    let details = '';
    let hasIssue = false;

    if (product) {
      mainDescription += product.marca || product.descripcion.split(" ")[0]; // Prioritize brand name
      details = `${product.descripcion} | Cod: ${trimmedCode}`;
      if (part.isOil) {
          const requiredLiters = vehicle.litros_aceite || 0;
          const containerVolume = getContainerVolume(product.descripcion);
          const containersNeeded = containerVolume > 0 ? Math.ceil(requiredLiters / containerVolume) : 0;
          cost = containersNeeded * product.precio;
          details = `Cotizado: ${containersNeeded} x ${containerVolume}L. Requiere ${requiredLiters}L. | ${details}`;
      } else {
          cost = product.precio;
      }
    } else {
        cost = 0;
        if (trimmedCode) {
            mainDescription += 'Producto no encontrado';
            details = `Cod: ${trimmedCode} (no encontrado)`;
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

  const additionalInfoParts = [
      {label: 'Tipo de Aceite', value: `${vehicle.tipo_aceite || ''} ${vehicle.nomenclatura_aceite || ''}`.trim()},
      {label: 'Código de Aceite', value: vehicle.aceite_codigo || 'No especificado'},
      {label: 'Filtro de Aceite', value: vehicle.filtro_aceite_codigo || 'No especificado'},
      {label: 'Filtro de Aire', value: vehicle.filtro_aire_codigo || 'No especificado'},
      {label: 'Filtro de Combustible', value: vehicle.filtro_combustible_codigo || 'No especificado'},
      {label: 'Filtro de Habitáculo', value: vehicle.filtro_habitaculo_codigo || 'No especificado'},
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
                {hasMissingData ? (
                    <p className="text-2xl font-bold text-yellow-400">Faltan Códigos</p>
                ) : (
                    <p className="text-3xl sm:text-4xl font-extrabold text-green-400">{formatCurrency(totalCost)}</p>
                )}
            </div>
        </div>

        <div className="mt-8 bg-gray-900/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Información de Repuestos (Servicio de Aceite)</h3>
            <ul className="space-y-2 text-gray-300">
                {additionalInfoParts.map(info => (
                    <li key={info.label} className="flex justify-between border-b border-gray-700/50 py-2">
                        <span className="font-semibold text-gray-400">{info.label}:</span>
                        <span className="text-right">{info.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    </>
  );
};

export default OilQuote;
