
import React from 'react';

interface FooterProps {
  lastUpdated: string;
  vehicleCount: number;
  productCount: number;
  laborRate: number;
}

const Footer: React.FC<FooterProps> = ({ lastUpdated, vehicleCount, productCount, laborRate }) => {
  const formattedDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';
    
  const formattedVehicleCount = new Intl.NumberFormat('es-AR').format(vehicleCount);
  const formattedProductCount = new Intl.NumberFormat('es-AR').format(productCount);
  const formattedLaborRate = laborRate > 0 
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(laborRate)
    : 'N/A';

  return (
    <footer className="bg-gray-900 py-4 mt-8 border-t border-gray-800">
      <div className="container mx-auto px-4 text-center text-sm text-gray-500">
        <p>
          Última actualización: {formattedDate}
          <span className="mx-2 text-gray-600">|</span>
          Vehículos: <strong className="text-gray-400">{formattedVehicleCount}</strong>
          <span className="mx-2 text-gray-600">|</span>
          Productos: <strong className="text-gray-400">{formattedProductCount}</strong>
          {laborRate > 0 && (
            <>
              <span className="mx-2 text-gray-600">|</span>
              Tarifa/Hora: <strong className="text-gray-400">{formattedLaborRate}</strong>
            </>
          )}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
