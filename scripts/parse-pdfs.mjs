/**
 * Script: parse-pdfs.mjs
 * Extrae el pensum de cada PDF en src/data/ y genera src/data/careers.ts
 *
 * Uso: node scripts/parse-pdfs.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/data');
const OUT_FILE = join(DATA_DIR, 'careers.ts');

// ─── Extractor de texto ────────────────────────────────────────────────────
async function extractText(filePath) {
  const data = new Uint8Array(readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise;
  const pageTexts = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Agrupar ítems por posición Y para reconstruir líneas
    const byY = new Map();
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = Math.round(item.transform[5]);
      const row = byY.get(y) ?? [];
      row.push({ x: item.transform[4], str: item.str });
      byY.set(y, row);
    }
    const sortedYs = [...byY.keys()].sort((a, b) => b - a);
    const lines = sortedYs
      .map(y => byY.get(y).sort((a, b) => a.x - b.x).map(i => i.str).join(' ').trim())
      .filter(Boolean);
    pageTexts.push(lines.join('\n'));
  }
  return pageTexts.join('\n');
}

// ─── Parser de pensum UNICARIBE ────────────────────────────────────────────
const CODE_RE = /^([A-Z]{2,5}-[0-9]{2,3})\s*/i;
const END_RE  = /\s+(\d+)\s+(.+)$/;

function parsePensum(fullText, filename) {
  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Nombre de la carrera
  const headerIdx = lines.findIndex(l => l.includes('CLAVE') && l.includes('NOMBRE') && l.includes('PRE'));
  const rawName = lines.slice(0, headerIdx)
    .filter(l => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(l))
    .join(' ')
    .trim();

  // El PDF a veces repite el título dos veces; tomamos la primera mitad única
  function dedupeName(name) {
    // Quitar "PRIMER CUATRIMESTRE" del final
    name = name.replace(/\s*(PRIMER|SEGUNDO)\s+CUATRIMESTRE.*/i, '').trim();
    // Si la cadena contiene su propia primera mitad repetida, quedarnos solo con la primera
    const words = name.split(/\s+/);
    const half = Math.ceil(words.length / 2);
    const first = words.slice(0, half).join(' ');
    const second = words.slice(half).join(' ');
    if (second.startsWith(first) || first === second) return first;
    // Si hay un texto que empieza igual (ej. "Ing de X Ing de X Datos")
    const match = name.match(/^(.{10,}?)\s+\1/i);
    if (match) return match[1];
    return name;
  }

  const careerName = dedupeName(rawName) || basename(filename, '.pdf').replace(/_/g, ' ');

  const id = filename
    .replace(/\.pdf$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const subjects = [];
  let semester = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('CLAVE') && line.includes('NOMBRE') && /PRE/i.test(line)) {
      semester++;
      continue;
    }
    if (/^(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO|UND[EÉ]CIMO|DUOD[EÉ]CIMO)\s+CUATRIMESTRE/i.test(line)) continue;
    if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) continue;
    if (/^TOTAL\s/i.test(line)) continue;

    const codeMatch = line.match(CODE_RE);
    if (!codeMatch) continue;
    const code = codeMatch[1].toUpperCase();
    const rest = line.slice(codeMatch[0].length);
    const endMatch = rest.match(END_RE);
    if (!endMatch) continue;

    let name = rest.slice(0, rest.length - endMatch[0].length).trim();

    // Nombre vacío o muy corto: tomar la línea anterior como nombre (PDFs con nombre partido)
    if (name.length < 3) {
      const prev = lines[i - 1] ?? '';
      if (prev && !CODE_RE.test(prev) && !prev.includes('CLAVE') &&
          !/^(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO|UND[EÉ]CIMO|DUOD[EÉ]CIMO)\s+CUATRIMESTRE/i.test(prev)) {
        // Puede haber una continuación en la siguiente línea sin código
        const nextLine = lines[i + 1] ?? '';
        const continuation = (!CODE_RE.test(nextLine) && nextLine.length > 0 && !/^(CLAVE|PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO|UND[EÉ]CIMO|DUOD[EÉ]CIMO)/i.test(nextLine))
          ? ' ' + nextLine : '';
        name = (prev + continuation).trim();
      }
    }

    if (!name) continue;

    const prereqRaw = endMatch[2].trim();
    let prerequisites = [];
    if (prereqRaw && prereqRaw !== '-') {
      if (/TODAS/i.test(prereqRaw)) {
        prerequisites = ['*ALL*'];
      } else if (!/\d+(MO|NO|RO|TO|VO)?\.?\s*CUAT/i.test(prereqRaw)) {
        prerequisites = prereqRaw
          .split(/[\s,;/]+/)
          .filter(c => /^[A-Z]{2,5}-[0-9]{2,3}$/i.test(c))
          .map(c => c.toUpperCase());
      }
    }

    subjects.push({ id: code, name, semester, prerequisites });
  }

  // Resolver *ALL*
  const allIds = subjects.map(s => s.id);
  for (const s of subjects) {
    if (s.prerequisites.includes('*ALL*')) {
      s.prerequisites = allIds.filter(id => id !== s.id);
    }
  }

  return { id, name: careerName, type: 'grado', subjects };
}

// ─── Generar TypeScript ────────────────────────────────────────────────────
function subjectToTs(s, indent = '    ') {
  const prereqs = s.prerequisites.map(p => `'${p}'`).join(', ');
  return `${indent}{ id: '${s.id}', name: ${JSON.stringify(s.name)}, semester: ${s.semester}, prerequisites: [${prereqs}] }`;
}

function careerToTs(c) {
  const lines = c.subjects.map(s => subjectToTs(s)).join(',\n');
  return `  {
    id: '${c.id}',
    name: ${JSON.stringify(c.name)},
    type: '${c.type}',
    subjects: [
${lines}
    ],
  }`;
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const files = readdirSync(DATA_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .filter((f, i, arr) => {
      // Eliminar duplicados: si hay "(1)" preferir el que no tiene
      const withoutSuffix = f.replace(/\s*\(1\)/, '');
      if (f !== withoutSuffix && arr.includes(withoutSuffix)) return false;
      return true;
    })
    .sort();

  console.log(`Procesando ${files.length} PDF(s):\n  ${files.join('\n  ')}\n`);

  const careers = [];
  for (const file of files) {
    console.log(`→ Leyendo: ${file}`);
    const text = await extractText(join(DATA_DIR, file));
    const career = parsePensum(text, file);
    console.log(`  ✓ ${career.name}  (${career.subjects.length} materias, ${Math.max(...career.subjects.map(s => s.semester))} cuatrimestres)`);
    careers.push(career);
  }

  const ts = `// AUTO-GENERADO por scripts/parse-pdfs.mjs – no editar manualmente
import type { Career } from '../types';

export const careers: Career[] = [
${careers.map(careerToTs).join(',\n')}
];
`;

  writeFileSync(OUT_FILE, ts, 'utf8');
  console.log(`\n✅ Generado: ${OUT_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
