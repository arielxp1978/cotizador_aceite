import { useState, useEffect, useCallback } from 'react';
import { VehiculoServicio, Producto } from '../types';
import { supabase } from '../services/supabaseClient';
import { supabaseToVehicleServiceList, supabaseToProductList } from '../services/mapper';
import { SUPABASE_URL } from '../config';

const getErrorMessage = (error: any): string => {
  if (error?.message) {
    if (error.message.includes("Failed to fetch")) {
        return "Error de Conexión: No se pudo conectar a la base de datos. Verifica tu conexión a internet y la configuración de Supabase.";
    }
    if (error.message.includes("relation \"public.vehiculos\" does not exist")) {
        return "Error de Base de Datos: La tabla 'vehiculos' no fue encontrada. Por favor, verifica que exista.";
    }
    if (error.message.includes("column") && error.message.includes("does not exist")) {
        return `Error de Base de Datos: Una columna necesaria no existe. Detalle: ${error.message}`;
    }
    return `Error al cargar datos: ${error.message}`;
  }
  return 'Ocurrió un error desconocido.';
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
      if (!rateStr) throw new Error("No se encontró la clave 'precio-hora' en la tabla 'variables'.");
      const newRate = parseFloat(rateStr);
      if (isNaN(newRate)) throw new Error("El valor de 'precio-hora' no es un número válido.");
      
      setLaborRate(newRate);
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
