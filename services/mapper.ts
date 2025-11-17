import { VehiculoServicio, Producto } from '../types';

// Lógica inteligente para parsear códigos: maneja arrays nativos, 
// strings con " / " y strings simples.
const smartParseCodes = (value: any): string[] | null => {
    if (Array.isArray(value)) {
        const trimmedArray = value.map(s => (typeof s === 'string' ? s.trim() : s)).filter(Boolean);
        return trimmedArray.length > 0 ? trimmedArray : null;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        if (value.includes(' / ')) {
            return value.split(' / ').map(s => s.trim()).filter(Boolean);
        }
        return [value.trim()];
    }
    return null;
};


// Mapea un único registro de la tabla 'vehiculos' de Supabase al tipo del servicio
export const supabaseToVehicleService = (item: any): VehiculoServicio => ({
    cod_vehiculo: item.cod,
    marca: item.marca,
    modelo: item.modelo,
    version: item.version,
    ano: item.ano,
    motor_cil: item.motor_cil,
    motor_cod: item.motor_cod,
    tipo_aceite: item.tipo_aceite,
    nomenclatura_aceite: item.viscosidad,
    litros_aceite: item.lts,
    intervalo_cambio: item.invervalo_cambio,
    tiempo_mano_obra_minutos: item.tiempo_aceite,
    aceite_motor_cod: smartParseCodes(item.aceite),
    filtro_aceite_cod: smartParseCodes(item.filtro_aceite),
    filtro_aire_cod: smartParseCodes(item.filtro_aire),
    filtro_combustible_cod: smartParseCodes(item.filtro_combustible),
    filtro_habitaculo_cod: smartParseCodes(item.filtro_habitaculo),
    correa_distribucion_cod: smartParseCodes(item.correa),
    tensor_distribucion_cod: smartParseCodes(item.tensor),
    rodillos_cod: smartParseCodes(item.rodillos),
    bomba_agua_cod: smartParseCodes(item.bomba),
    tiempo_mano_obra_correa_minutos: item.tiempo_correa,
    observaciones: item.extras,
});

// Mapea una lista de registros de 'vehiculos'
export const supabaseToVehicleServiceList = (data: any[]): VehiculoServicio[] => {
    return data.map(supabaseToVehicleService);
};

// Mapea un objeto del servicio de vuelta a un registro para Supabase
export const vehicleServiceToSupabase = (vehicle: Partial<VehiculoServicio>): any => ({
    cod: vehicle.cod_vehiculo,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    version: vehicle.version,
    ano: vehicle.ano,
    motor_cil: vehicle.motor_cil,
    motor_cod: vehicle.motor_cod,
    tipo_aceite: vehicle.tipo_aceite,
    viscosidad: vehicle.nomenclatura_aceite,
    lts: vehicle.litros_aceite,
    invervalo_cambio: vehicle.intervalo_cambio,
    tiempo_aceite: vehicle.tiempo_mano_obra_minutos,
    aceite: vehicle.aceite_motor_cod,
    filtro_aceite: vehicle.filtro_aceite_cod,
    filtro_aire: vehicle.filtro_aire_cod,
    filtro_combustible: vehicle.filtro_combustible_cod,
    filtro_habitaculo: vehicle.filtro_habitaculo_cod,
    correa: vehicle.correa_distribucion_cod,
    tensor: vehicle.tensor_distribucion_cod,
    rodillos: vehicle.rodillos_cod,
    bomba: vehicle.bomba_agua_cod,
    tiempo_correa: vehicle.tiempo_mano_obra_correa_minutos,
    extras: vehicle.observaciones,
});

// Mapea un único registro de la tabla 'productos' de Supabase
export const supabaseToProduct = (item: any): Producto => ({
    codigo: item.cod_marca,
    descripcion: item.descripcion,
    marca: item.marca,
    proveedor: item.proveedor,
    rubro: item.rubro,
    subrubro: item.subrubro,
    precio: item.publico,
    precio_taller: item.taller,
    precio_costo: item.costo_c_iva,
});

// Mapea una lista de registros de 'productos'
export const supabaseToProductList = (data: any[]): Producto[] => {
    return data.map(supabaseToProduct);
};