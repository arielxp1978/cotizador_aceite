import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('tu-url-de-proyecto')) {
  console.error("********************************************************************************");
  console.error("ATENCIÓN: Las credenciales de Supabase no están configuradas en 'config.ts'.");
  console.error("Por favor, añade tu URL y tu clave anónima pública para conectar la aplicación.");
  console.error("********************************************************************************");
}

// Inicializa el cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
