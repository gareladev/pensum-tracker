#!/usr/bin/env node
/**
 * Verifica que la tabla user_progress exista en Supabase.
 * Requiere .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
 */
import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const path = new URL('../.env', import.meta.url);
  if (!existsSync(path)) {
    console.error('No se encontró .env. Copia .env.example y configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
    process.exit(1);
  }
  const raw = readFileSync(path, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

// Mostrar a qué proyecto nos conectamos (sin revelar clave)
const projectRef = url.match(/https:\/\/([^.]+)/)?.[1] || '?';
console.log('Conectando a proyecto:', projectRef);

const supabase = createClient(url, key);
const { data, error } = await supabase.from('user_progress').select('id').limit(1);

if (error) {
  const msg = error.message || '';
  const schemaCacheError = msg.includes('schema cache') || msg.includes('Could not find the table');
  if (schemaCacheError || msg.includes('does not exist') || error.code === '42P01') {
    console.error('');
    console.error('La tabla user_progress no existe o Supabase aún no la ve.');
    console.error('');
    console.error('Haz esto:');
    console.error('1. Entra a https://supabase.com/dashboard y abre el proyecto:', projectRef);
    console.error('2. Menú izquierdo → SQL Editor → New query');
    console.error('3. Copia y ejecuta el SQL de: supabase/migrations/20250305000000_create_user_progress.sql');
    console.error('4. Verifica en Table Editor que exista la tabla "user_progress"');
    console.error('5. Si el .env apunta a otro proyecto, crea la tabla ahí o corrige VITE_SUPABASE_URL');
    console.error('');
    process.exit(1);
  }
  console.error('Error:', msg);
  process.exit(1);
}

console.log('OK: tabla user_progress existe.');
