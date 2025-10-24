import { useState, useEffect, useCallback } from 'react';
import { VehiculoServicio, Producto } from '../types';
import { supabase } from '../services/supabaseClient';
import { SUPABASE_URL } from '../config';

// Función para manejar errores específicos y dar mensajes claros al usuario.
const getErrorMessage = (error: any): string => {
  let errorMessage: string;

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message && typeof error.message === 'string') {
    errorMessage = error.message;
  } else if (error?.details && typeof error.details === 'string') {
    errorMessage = error.details;
  } else {
    errorMessage = 'Ocurrió un error desconocido al procesar la solicitud.';
    console.error("Se encontró un objeto de error sin una propiedad .message o .details legible:", error);
    try {
      const serializedError = JSON.stringify(error);
      if (serializedError !== '{}') {
        errorMessage += ` Detalles: ${serializedError}`;
      }
    } catch (e) {
      // Ignorar errores de serialización (ej. referencias circulares)
    }
  }

  if (errorMessage.includes("No se pudo encontrar la clave 'precio-hora'") || errorMessage.includes("no es un número válido")) {
    return `Error de Configuración: ${errorMessage} Por favor, verifica que la clave 'precio-hora' exista en la tabla 'variables' y tenga un valor numérico.`;
  }
    
  const relationMatch = /relation "(.+?)" does not exist/.exec(errorMessage);
  if (relationMatch && relationMatch[1]) {
      const tableName = relationMatch[1];
      if (tableName === 'variables') {
        return `Error de Base de Datos: La tabla "variables" no se encontró. Por favor, crea la tabla y asegúrate de que contenga la clave 'precio-hora'.`;
      }
      return `Error de Base de Datos: La tabla "${tableName}" no se encontró. Verifica que las tablas 'vehiculos' y 'productos' existan en Supabase (en minúsculas) y que los permisos de RLS estén habilitados.`;
  }
  
  const columnMatch = /column "(.+?)" does not exist/.exec(errorMessage);
  if (columnMatch && columnMatch[1]) {
      return `Error de Base de Datos: La columna "${columnMatch[1]}" no se encontró. Por favor, verifica que los nombres de las columnas en Supabase coincidan con los esperados por la aplicación.`;
  }

  if (errorMessage.includes("Failed to fetch") || errorMessage.includes("invalid URL")) {
    if (SUPABASE_URL.includes('dashboard')) {
        return "Error de Configuración: La URL de Supabase en 'config.ts' parece ser la del panel de control. Por favor, usa la URL de la API que encuentras en 'Project Settings' > 'API'.";
    }
    return 'Error de Conexión: No se pudo conectar a los servicios. Verifica la URL en config.ts y tu conexión a internet.';
  }
  
  return `Error al cargar datos: ${errorMessage}`;
}


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
      setError("ATENCIÓN: Las credenciales de Supabase no están configuradas en 'config.ts'. Por favor, añade tu URL y tu clave anónima pública.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setWarning(null);
      
      const vehicleQuery = `
        cod_vehiculo:cod, marca, modelo, version, ano, motor_cil, motor_cod,
        tipo_aceite, nomenclatura_aceite:viscosidad, litros_aceite:lts,
        intervalo_cambio:invervalo_cambio,
        filtro_aire_codigo:filtro_aire,
        filtro_aceite_codigo:filtro_aceite,
        filtro_combustible_codigo:filtro_combustible,
        filtro_habitaculo_codigo:filtro_habitaculo,
        aceite_codigo:aceite,
        tiempo_mano_obra_minutos:tiempo_aceite,
        correa_distribucion_codigo:correa,
        bomba_agua_codigo:bomba,
        tiempo_mano_obra_correa_minutos:tiempo_correa
      `;
      
      const productQuery = `
        codigo:cod_marca, 
        descripcion, 
        marca, 
        precio:publico,
        precio_taller:taller,
        precio_costo:costo_c_iva
      `;

      const fetchAllProducts = async (): Promise<Producto[]> => {
          const allProducts: Producto[] = [];
          let page = 0;
          const pageSize = 1000;
          while (true) {
              const from = page * pageSize;
              const to = from + pageSize - 1;
              const { data: productPage, error: productError } = await supabase
                  .from('productos')
                  .select(productQuery)
                  .range(from, to);
              if (productError) throw productError;
              if (productPage) allProducts.push(...(productPage as Producto[]));
              if (!productPage || productPage.length < pageSize) break;
              page++;
          }
          return allProducts;
      };

      // Se obtienen todos los datos en paralelo. La tarifa es un dato crítico.
      const [
        variablesResult,
        vehiclesResult,
        productsResult
      ] = await Promise.all([
        supabase.from('variables').select('clave, valor').in('clave', ['precio-hora', 'clave_taller', 'clave_costo']),
        supabase.from('vehiculos').select(vehicleQuery).limit(5000),
        fetchAllProducts()
      ]);

      // --- Manejo de las variables (tarifa y claves) ---
      if (variablesResult.error) throw variablesResult.error;
      if (!variablesResult.data) throw new Error("No se pudo obtener datos de la tabla 'variables'.");
      
      const variablesMap = variablesResult.data.reduce((acc, curr) => {
        acc[curr.clave] = curr.valor;
        return acc;
      }, {} as Record<string, string>);

      const rateStr = variablesMap['precio-hora'];
      if (!rateStr) throw new Error("No se pudo encontrar la clave 'precio-hora' en la tabla 'variables'.");
      
      const newRate = parseFloat(rateStr);
      if (isNaN(newRate)) throw new Error("El valor de 'precio-hora' no es un número válido.");
      
      setLaborRate(newRate);
      setAuthKeys({
        taller: variablesMap['clave_taller'] || '',
        costo: variablesMap['clave_costo'] || ''
      });
      
      // --- Manejo del resto de los datos ---
      if (vehiclesResult.error) throw vehiclesResult.error;

      setVehicles(vehiclesResult.data as VehiculoServicio[]);
      setProducts(productsResult);
      setLastUpdated(new Date().toISOString());

    } catch (err: any) {
      console.error("Error detallado al cargar datos:");
      // Usar console.dir para una mejor inspección del objeto en la consola del navegador.
      if (typeof console.dir === 'function') {
          console.dir(err);
      } else {
          console.error(err);
      }
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