export interface VehiculoServicio {
  cod_vehiculo: number;
  marca: string;
  modelo: string;
  version?: string;
  ano?: number;
  motor_cil?: string;
  motor_cod?: string;
  tipo_aceite: string;
  nomenclatura_aceite: string;
  aceite_codigo: string;
  litros_aceite: number;
  intervalo_cambio?: string;
  filtro_aire_codigo: string;
  filtro_aceite_codigo: string;
  filtro_combustible_codigo: string;
  filtro_habitaculo_codigo: string;
  tiempo_mano_obra_minutos: number;
  // --- Campos para el servicio de Correa de Distribución ---
  correa_distribucion_codigo?: string;
  bomba_agua_codigo?: string;
  tiempo_mano_obra_correa_minutos?: number;
}

export interface Producto {
  codigo: string;
  descripcion: string;
  precio: number;
  marca?: string;
}