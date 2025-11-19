
import { supabase } from './supabaseClient';
import { VehiculoServicio, Producto } from '../types';
import { vehicleServiceToSupabase, supabaseToVehicleService, supabaseToProductList } from './mapper';

const getSupabaseErrorMessage = (error: any): string => {
  if (!error) return 'Error desconocido';

  // Intentamos obtener una representación en string del error para buscar patrones conocidos
  let errorString = '';
  try {
      errorString = JSON.stringify(error);
  } catch (e) {
      // Si falla la serialización (ej. estructura circular), usamos lo que podamos
      errorString = String(error);
  }

  const errorMessageProp = (error && typeof error === 'object' && 'message' in error) ? error.message : '';

  // Detectar error específico de columna faltante (común al agregar nuevas features)
  if (errorString.includes("Could not find the 'combos' column") || 
      (typeof errorMessageProp === 'string' && errorMessageProp.includes("Could not find the 'combos' column"))) {
      return "La columna 'combos' no existe en la tabla 'vehiculos' de Supabase. Por favor ve a tu panel de Supabase y agrega una columna llamada 'combos' de tipo 'text[]' (Array de Texto).";
  }

  // Si es un error estándar de JS
  if (error instanceof Error) {
      return error.message;
  }

  // Si tiene una propiedad message (común en Supabase/PostgREST)
  if (typeof error === 'object' && error !== null && 'message' in error) {
      let msg = error.message;
      if (error.details) msg += ` (Detalles: ${error.details})`;
      if (error.hint) msg += ` (Pista: ${error.hint})`;
      return msg;
  }

  // Si es solo un string
  if (typeof error === 'string') {
    return error;
  }

  // Fallback: devolver la representación string que pudimos obtener
  if (errorString && errorString !== '{}') {
      return errorString;
  }

  return 'Ocurrió un error inesperado y no se pudo leer el detalle.';
};

export const getVehicleById = async (id: number): Promise<VehiculoServicio | null> => {
    const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('cod', id)
        .single();

    if (error) {
        console.error('Error fetching vehicle:', JSON.stringify(error));
        throw new Error(getSupabaseErrorMessage(error));
    }
    
    return data ? supabaseToVehicleService(data) : null;
};

export const createVehicle = async (vehicleData: Partial<Omit<VehiculoServicio, 'cod_vehiculo'>>) => {
    const supabaseRecord = vehicleServiceToSupabase(vehicleData);
    delete supabaseRecord.cod;

    const { error } = await supabase
        .from('vehiculos')
        .insert([supabaseRecord]);

    if (error) {
        const friendlyMsg = getSupabaseErrorMessage(error);
        if (friendlyMsg.includes("La columna 'combos' no existe")) {
            console.warn("Supabase Schema Warning:", friendlyMsg);
        } else {
            console.error("Error creating vehicle:", JSON.stringify(error));
        }
        throw new Error(friendlyMsg);
    }
};

export const updateVehicle = async (id: number, vehicleData: Partial<Omit<VehiculoServicio, 'cod_vehiculo'>>) => {
    const supabaseRecord = vehicleServiceToSupabase(vehicleData);

    const { error } = await supabase
        .from('vehiculos')
        .update(supabaseRecord)
        .eq('cod', id);

    if (error) {
        const friendlyMsg = getSupabaseErrorMessage(error);
        if (friendlyMsg.includes("La columna 'combos' no existe")) {
            console.warn("Supabase Schema Warning:", friendlyMsg);
        } else {
            console.error("Error updating vehicle:", JSON.stringify(error));
        }
        throw new Error(friendlyMsg);
    }
};

export const deleteVehicle = async (id: number) => {
  const { error } = await supabase
    .from('vehiculos')
    .delete()
    .eq('cod', id);

  if (error) {
    console.error("Error deleting vehicle:", JSON.stringify(error));
    throw new Error(getSupabaseErrorMessage(error));
  }
};

export const searchProducts = async (term: string, rubro: string, subrubro: string, proveedor: string, marca: string): Promise<Producto[]> => {
    let query = supabase
        .from('productos')
        .select('*');

    if (term) {
        query = query.or(`cod_marca.ilike.%${term}%,descripcion.ilike.%${term}%`);
    }
    if (rubro) {
        query = query.eq('rubro', rubro);
    }
    if (subrubro) {
        query = query.eq('subrubro', subrubro);
    }
    if (proveedor) {
        query = query.eq('proveedor', proveedor);
    }
    if (marca) {
        query = query.eq('marca', marca);
    }

    const { data, error } = await query.limit(50);

    if (error) {
        console.error("Error searching products:", JSON.stringify(error));
        throw new Error(getSupabaseErrorMessage(error));
    }
    return supabaseToProductList(data || []);
};

export interface AuditLogFilters {
    startDate?: string;
    endDate?: string;
    userEmail?: string;
    recordId?: string;
    action?: string;
}

export const getAuditLogs = async (filters: AuditLogFilters, page: number, pageSize: number) => {
    let query = supabase
        .from('auditoria_log')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false });

    if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
    }
    if (filters.userEmail) {
        query = query.ilike('user_email', `%${filters.userEmail}%`);
    }
    if (filters.recordId) {
        query = query.eq('record_id', filters.recordId);
    }
    if (filters.action) {
        query = query.eq('action', filters.action);
    }
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
        console.error("Error fetching audit logs:", JSON.stringify(error));
        throw new Error(getSupabaseErrorMessage(error));
    }
    return { data, count };
}
