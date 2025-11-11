import { supabase } from './supabaseClient';
import { VehiculoServicio, Producto } from '../types';
import { vehicleServiceToSupabase, supabaseToVehicleService, supabaseToProductList } from './mapper';

export const getVehicleById = async (id: number): Promise<VehiculoServicio | null> => {
    const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('cod', id)
        .single();

    if (error) {
        console.error('Error fetching vehicle:', error);
        throw new Error(error.message);
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
        console.error("Error creating vehicle:", error);
        throw new Error(error.message);
    }
};

export const updateVehicle = async (id: number, vehicleData: Partial<Omit<VehiculoServicio, 'cod_vehiculo'>>) => {
    const supabaseRecord = vehicleServiceToSupabase(vehicleData);

    const { error } = await supabase
        .from('vehiculos')
        .update(supabaseRecord)
        .eq('cod', id);

    if (error) {
        console.error("Error updating vehicle:", error);
        throw new Error(error.message);
    }
};

export const deleteVehicle = async (id: number) => {
  const { error } = await supabase
    .from('vehiculos')
    .delete()
    .eq('cod', id);

  if (error) {
    console.error("Error deleting vehicle:", error);
    throw new Error(error.message);
  }
};

export const searchProducts = async (term: string, rubro: string, subrubro: string): Promise<Producto[]> => {
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

    const { data, error } = await query.limit(50);

    if (error) {
        console.error("Error searching products:", error);
        throw new Error(error.message);
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
        console.error("Error fetching audit logs:", error);
        throw new Error(error.message);
    }
    return { data, count };
}
