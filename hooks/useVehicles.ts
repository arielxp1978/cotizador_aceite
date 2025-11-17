import { useState, useEffect, useCallback } from 'react';
import { VehiculoServicio, Producto } from '../types';
import { supabase } from '../services/supabaseClient';
import { supabaseToVehicleServiceList, supabaseToProductList } from '../services/mapper';
import { SUPABASE_URL } from '../config';

const getErrorMessage = (error: any): string => {
  // Caso 1: El error tiene una propiedad 'message' que es un string.
  // Esto cubre objetos Error estándar, errores de Supabase y otros errores personalizados.
  if (error && typeof error.message === 'string') {
    const message = error.message;

    // Error de red específico
    if (message.includes("Failed to fetch")) {
      return "Error de Conexión: No se pudo conectar a la base de datos. Verifica tu conexión a internet y la configuración de Supabase.";
    }

    // Error específico de Supabase: tabla no encontrada
    if (message.includes("relation") && message.includes("does not exist")) {
        const match = message.match(/relation "public\.(.+?)" does not exist/);
        const tableName = match ? match[1] : 'desconocida';
        return `Error de Base de Datos: La tabla '${tableName}' no fue encontrada. Por favor, verifica que la base de datos esté configurada correctamente.`;
    }

    // Error específico de Supabase: columna no encontrada
    if (message.includes("column") && message.includes("does not exist")) {
        return `Error de Base de Datos: Una columna necesaria no existe. Detalle: ${message}`;
    }
    
    // Error genérico tipo Supabase (con detalles opcionales)
    let friendlyMessage = `Error al cargar datos: ${message}`;
    if (error.details) friendlyMessage += ` (Detalles: ${error.details})`;
    return friendlyMessage;
  }
  
  // Caso 2: El error es simplemente un string.
  if (typeof error === 'string') {
    return error;
  }

  // Caso 3: Fallback para otros tipos de errores (objetos sin mensaje, etc.)
  // Intentamos serializarlo a JSON para evitar "[object Object]".
  try {
    return `Ocurrió un error inesperado: ${JSON.stringify(error)}`;
  } catch (e) {
    // Si la serialización falla (ej. referencias circulares)
    return 'Ocurrió un error desconocido e in-serializable. Revisa la consola del navegador para más detalles técnicos.';
  }
};


export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<VehiculoServicio[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [laborRate, setLaborRate] = useState<number>(0);
  const [authKeys, setAuthKeys] = useState<{ taller: string, costo: string }>({ taller: '', costo: '' });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const loadData = useCallback(async () => {
    if (SUPABASE_URL.includes('tu-url-de-proyecto')) {
      setError("ATENCIÓN: Las credenciales de Supabase no están configuradas en 'config.ts'.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      const fetchAllProducts = async (): Promise<any[]> => {
          const allProductsData: any[] = [];
          let page = 0;
          const pageSize = 1000;
          while (true) {
              const from = page * pageSize;
              const to = from + pageSize - 1;
              const { data: productPage, error: productError } = await supabase
                  .from('productos')
                  .select('*')
                  .range(from, to);
              if (productError) throw productError;
              if (productPage) allProductsData.push(...productPage);
              if (!productPage || productPage.length < pageSize) break;
              page++;
          }
          return allProductsData;
      };

      const [
        variablesResult,
        vehiclesResult,
        productsResult
      ] = await Promise.all([
        supabase.from('variables').select('clave, valor').in('clave', ['precio-hora', 'clave_taller', 'clave_costo']),
        supabase.from('vehiculos').select('*').order('marca').order('modelo'),
        fetchAllProducts()
      ]);

      if (variablesResult.error) throw variablesResult.error;
      const variablesMap = (variablesResult.data || []).reduce((acc, curr) => {
        acc[curr.clave] = curr.valor;
        return acc;
      }, {} as Record<string, string>);

      const rateStr = variablesMap['precio-hora'];
      if (rateStr) {
          const newRate = parseFloat(rateStr);
          if (isNaN(newRate)) {
              setWarning("El valor de 'precio-hora' en la base de datos no es un número válido. La mano de obra no se calculará.");
              setLaborRate(0);
          } else {
              setLaborRate(newRate);
          }
      } else {
          setWarning("No se encontró la tarifa por hora ('precio-hora') en la configuración. La mano de obra no se calculará.");
          setLaborRate(0);
      }
      
      setAuthKeys({
        taller: variablesMap['clave_taller'] || '',
        costo: variablesMap['clave_costo'] || ''
      });
      
      if (vehiclesResult.error) throw vehiclesResult.error;
      setVehicles(supabaseToVehicleServiceList(vehiclesResult.data || []));
      
      setProducts(supabaseToProductList(productsResult || []));
      setLastUpdated(new Date().toISOString());

    } catch (err: any) {
      console.error("Error detallado al cargar datos:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    vehicles,
    products,
    laborRate,
    authKeys,
    loading,
    error,
    warning,
    lastUpdated,
    refreshData,
  };
};