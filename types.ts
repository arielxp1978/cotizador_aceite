export type PriceLevel = 'publico' | 'taller' | 'costo';

export interface Producto {
  codigo: string;
  descripcion: string;
  marca: string | null;
  rubro: string | null;
  subrubro: string | null;
  precio: number;
  precio_taller: number | null;
  precio_costo: number | null;
}

export interface VehiculoServicio {
  cod_vehiculo: number;
  marca: string;
  modelo: string;
  version: string | null;
  ano: number | null;
  motor_cil: string | null;
  motor_cod: string | null;
  
  // Servicio de Aceite
  tipo_aceite: string | null;
  nomenclatura_aceite: string | null;
  litros_aceite: number | null;
  intervalo_cambio: string | null;
  tiempo_mano_obra_minutos: number | null;
  aceite_motor_cod: string[] | null;
  filtro_aceite_cod: string[] | null;
  filtro_aire_cod: string[] | null;
  filtro_combustible_cod: string[] | null;
  filtro_habitaculo_cod: string[] | null;

  // Servicio de Correa
  correa_distribucion_cod: string[] | null;
  tensor_distribucion_cod: string[] | null;
  rodillos_cod: string[] | null;
  bomba_agua_cod: string[] | null;
  tiempo_mano_obra_correa_minutos: number | null;
  
  // Extras y Observaciones
  observaciones: string | null;
}
