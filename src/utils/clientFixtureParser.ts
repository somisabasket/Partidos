import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Match, RamaType, EstadoPartido } from '../types/fixture';
import { assignDefaultCoach } from './excelParser';

// Configure PDF.js worker using Vite asset URL so it works both in dev and static GitHub Pages
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
}

export interface PdfExtractionResult {
  text: string;
  lines: string[];
  pageCount: number;
}

/**
 * Extracts readable lines (preserving column breaks with " | ") from a PDF file 100% in the browser.
 */
export const extractTextFromPdf = async (file: File): Promise<PdfExtractionResult> => {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const items: PdfTextItem[] = [];
    for (const raw of content.items as any[]) {
      if (!raw || typeof raw.str !== 'string') continue;
      const trimmed = raw.str.trim();
      if (!trimmed) continue;
      const transform = Array.isArray(raw.transform) ? raw.transform : [1, 0, 0, 1, 0, 0];
      items.push({
        str: raw.str,
        x: Number(transform[4] || 0),
        y: Number(transform[5] || 0),
        width: Number(raw.width || 0),
      });
    }

    // Sort top-to-bottom (higher Y first in PDF coordinates), then left-to-right
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 4) {
        return b.y - a.y;
      }
      return a.x - b.x;
    });

    // Group into rows based on Y proximity (4pt tolerance)
    const rows: PdfTextItem[][] = [];
    for (const item of items) {
      const lastRow = rows[rows.length - 1];
      if (!lastRow || Math.abs(lastRow[0].y - item.y) > 4) {
        rows.push([item]);
      } else {
        lastRow.push(item);
      }
    }

    for (const row of rows) {
      row.sort((a, b) => a.x - b.x);
      let line = '';
      let prevEnd = -1;
      for (const cell of row) {
        const cleanCell = cell.str.trim();
        if (!cleanCell) continue;
        if (prevEnd >= 0) {
          const gap = cell.x - prevEnd;
          if (gap > 12) {
            line += ' | ';
          } else {
            line += ' ';
          }
        }
        line += cleanCell;
        prevEnd = cell.x + (cell.width > 0 ? cell.width : cleanCell.length * 4.5);
      }
      if (line.trim()) {
        allLines.push(line.trim());
      }
    }
  }

  return {
    text: allLines.join('\n'),
    lines: allLines,
    pageCount: pdf.numPages,
  };
};

// Regex helpers
const DATE_FULL_RE = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/;
const DATE_SHORT_RE = /\b(\d{1,2})[\/\-](\d{1,2})\b/;
const TIME_RE = /\b(\d{1,2})[:.](\d{2})(?:\s*hs?)?\b/i;
const JORNADA_RE = /\b((?:fecha|jornada|ronda|nro\.?)\s*(?:n[°º]?\s*)?\d+|cuartos(?:\s+de\s+final)?|semifinal(?:es)?|final(?:\s+copa\s+(?:oro|plata))?|play[\s-]?off)\b/i;
const CATEGORY_TOKEN_RE = /\b(u[\s-]?(?:5|7|9|11|12|13|14|15|16|17|18|19|21|23)|pre[\s-]?mini|mini(?:\s*\(u11\))?|infantiles?(?:\s*\(u13\))?|cadetes?(?:\s*\(u15\))?|juveniles?(?:\s*\(u17\))?|pr[oó]ximo(?:\s*\(u21\))?|mayores?(?:\s*\(1[°º]?\))?|primera|1[°º]\s*div(?:isi[oó]n)?|escuelita|mosquitos?)\b/i;

const normalizeDateStr = (text: string): string => {
  const full = text.match(DATE_FULL_RE);
  if (full) {
    const d = full[1].padStart(2, '0');
    const m = full[2].padStart(2, '0');
    let y = full[3];
    if (y.length === 2) y = `20${y}`;
    return `${d}/${m}/${y}`;
  }
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }
  const short = text.match(DATE_SHORT_RE);
  if (short) {
    const d = short[1].padStart(2, '0');
    const m = short[2].padStart(2, '0');
    const dayNum = parseInt(d, 10);
    const monNum = parseInt(m, 10);
    if (dayNum >= 1 && dayNum <= 31 && monNum >= 1 && monNum <= 12) {
      return `${d}/${m}/${new Date().getFullYear()}`;
    }
  }
  return '';
};

const normalizeTimeStr = (text: string): string => {
  // Avoid confusing DD.MM dates or categories with hours: require 00-23 hour and 00-59 min
  const m = text.match(TIME_RE);
  if (!m) return '';
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (hh >= 7 && hh <= 23 && mm >= 0 && mm <= 59) {
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  return '';
};

const normalizeCategory = (raw: string): string => {
  const s = raw.trim();
  if (!s) return '';
  const low = s.toLowerCase();
  if (low.includes('u5') || low.includes('u-5')) return 'U5';
  if (low.includes('u7') || low.includes('u-7')) return 'U7';
  if (low.includes('pre mini') || low.includes('pre-mini') || low.includes('premini')) return 'U9 (Pre mini)';
  if (low.includes('u9') || low.includes('u-9')) return 'U9';
  if (low.includes('u11') || low.includes('u-11') || low.includes('mini')) return 'Mini (U11)';
  if (low.includes('u13') || low.includes('u-13') || low.includes('infantil')) return 'Infantiles (U13)';
  if (low.includes('u15') || low.includes('u-15') || low.includes('cadete')) return 'Cadetes (U15)';
  if (low.includes('u17') || low.includes('u-17') || low.includes('juvenil')) return 'Juveniles (U17)';
  if (low.includes('u21') || low.includes('u-21') || low.includes('proximo') || low.includes('próximo')) return 'Proximo (U21)';
  if (low.includes('mayor') || low.includes('primera') || low.includes('1°') || low.includes('1º')) return 'Mayores (1°)';
  return s;
};

const detectRama = (raw: string, fallback: RamaType = 'Mixto'): RamaType => {
  const up = raw.toUpperCase();
  if (/\b(FEM|FEMENINO|FEMENINA|F)\b/.test(up) || up === 'F') return 'F';
  if (/\b(MASC|MASCULINO|MASCULINA|M)\b/.test(up) || up === 'M') return 'M';
  if (/\bMIX(TO|TA)?\b/.test(up)) return 'Mixto';
  return fallback;
};

const isHeaderLine = (cells: string[]): boolean => {
  const joined = cells.join(' ').toLowerCase();
  const hasCat = joined.includes('categ');
  const hasLocVis = joined.includes('local') && joined.includes('visit');
  return (hasCat && (joined.includes('local') || joined.includes('fecha'))) || hasLocVis;
};

const isGarbageLine = (line: string): boolean => {
  const low = line.toLowerCase().trim();
  if (!low || low.length < 4) return true;
  if (/^p[aá]gina\s+\d+/i.test(low)) return true;
  if (/^fixture\s+(oficial|torneo|anual|semestral)?$/i.test(low)) return true;
  if (/^asociaci[oó]n\s+de\s+b[aá]squet/i.test(low)) return true;
  return false;
};

const buildMatch = (
  idx: number,
  fields: {
    categoria: string;
    rama: RamaType;
    local: string;
    visitante: string;
    fecha: string;
    hora: string;
    jornada: string;
    observCancha: string;
    observaciones: string;
  }
): Match => {
  const isSomisaLocal = fields.local.toLowerCase().includes('somisa');
  const esCondicional =
    fields.observaciones.toLowerCase().includes('necesario') ||
    fields.observaciones.toLowerCase().includes('j3') ||
    fields.observaciones.toLowerCase().includes('condicional');

  let estado: EstadoPartido = 'Confirmado';
  if (esCondicional) {
    estado = 'Condicional';
  } else if (!fields.fecha || !fields.hora) {
    estado = 'A Coordinar';
  }

  let canchaAsignada = '';
  if (fields.observCancha.toLowerCase().includes('gim 2') || fields.observCancha.toLowerCase().includes('gimnasio 2')) {
    canchaAsignada = 'Gimnasio 2';
  } else if (isSomisaLocal) {
    canchaAsignada = 'Gimnasio Principal';
  } else {
    canchaAsignada = `${fields.local || 'Club Rival'} (Visitante)`;
  }

  const coachInfo = assignDefaultCoach({
    categoria: fields.categoria,
    rama: fields.rama,
    local: fields.local,
    visitante: fields.visitante,
  });

  return {
    id: `match-local-${Date.now()}-${idx}`,
    categoria: fields.categoria || 'Mini (U11)',
    rama: fields.rama || 'Mixto',
    local: fields.local,
    visitante: fields.visitante,
    fecha: fields.fecha,
    hora: fields.hora,
    jornada: fields.jornada,
    observCancha: fields.observCancha,
    observaciones: fields.observaciones,
    esCondicional,
    estado,
    canchaAsignada,
    entrenador: coachInfo.entrenador,
    entrenadorTel: coachInfo.entrenadorTel,
    padresGrupo: `${fields.categoria || 'Básquet'} ${fields.rama} Somisa`,
    citacionMinutos:
      fields.categoria.toLowerCase().includes('mayor') ||
      fields.categoria.toLowerCase().includes('21')
        ? 60
        : 45,
  };
};

/**
 * Parses raw text or PDF-extracted lines into Match[] 100% client-side without external API calls.
 */
export const parseRawTextFixtureClientSide = (rawText: string): Match[] => {
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const matches: Match[] = [];

  let currentJornada = '';
  let currentCategoria = '';
  let currentRama: RamaType = 'Mixto';
  let currentFecha = '';

  let headerCols: Record<string, number> | null = null;

  for (const line of rawLines) {
    if (isGarbageLine(line)) continue;

    // Split by pipe, tab, semicolon, or 2+ spaces
    const cells = line
      .split(/\s*\|\s*|\t+|;| {2,}/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    // Detect table header row
    if (cells.length >= 3 && isHeaderLine(cells)) {
      const low = cells.map((c) => c.toLowerCase());
      headerCols = {
        jornada: low.findIndex((c) => c.includes('jornad') || c.includes('nro') || c.includes('ronda')),
        categoria: low.findIndex((c) => c.includes('categ') || c === 'cat'),
        rama: low.findIndex((c) => c.includes('rama') || c.includes('gener') || c === 'f/m'),
        local: low.findIndex((c) => c === 'local' || c.includes('equipo local') || c.includes('club local')),
        visitante: low.findIndex((c) => c === 'visitante' || c.includes('equipo vis') || c.includes('visita')),
        fecha: low.findIndex((c) => (c.includes('fech') || c.includes('dia')) && !c.includes('nro')),
        hora: low.findIndex((c) => c.includes('hor')),
        observCancha: low.findIndex((c) => c.includes('cancha') || c.includes('gim') || c.includes('sede')),
        observaciones: low.findIndex((c) => c.includes('observ') || c.includes('nota') || c.includes('coment')),
      };
      continue;
    }

    // Check if the line is a standalone section header (Jornada / Categoría / Fecha)
    const hasVs = /\bvs\.?\b|\s-\s/i.test(line);
    if (cells.length <= 2 && !hasVs) {
      const jMatch = line.match(JORNADA_RE);
      if (jMatch && line.length < 48) {
        currentJornada = jMatch[1].replace(/\s+/g, ' ').trim();
      }
      const cMatch = line.match(CATEGORY_TOKEN_RE);
      if (cMatch && line.length < 48) {
        currentCategoria = normalizeCategory(cMatch[1]);
        currentRama = detectRama(line, currentCategoria.includes('U9') || currentCategoria.includes('Mini') ? 'Mixto' : 'M');
      } else {
        const rOnly = detectRama(line, currentRama);
        if (rOnly !== currentRama && line.length < 30) currentRama = rOnly;
      }
      const dStr = normalizeDateStr(line);
      if (dStr && line.length < 40) {
        currentFecha = dStr;
      }
      if (jMatch || cMatch || dStr) {
        continue;
      }
    }

    // Strategy 1: If we detected explicit table headers and row aligns reasonably
    if (headerCols && headerCols.local >= 0 && headerCols.visitante >= 0 && cells.length >= 3) {
      const local = (cells[headerCols.local] || '').trim();
      const visitante = (cells[headerCols.visitante] || '').trim();
      if (local && visitante && local.toLowerCase() !== 'local') {
        const catCell = headerCols.categoria >= 0 ? cells[headerCols.categoria] || '' : '';
        const ramaCell = headerCols.rama >= 0 ? cells[headerCols.rama] || '' : '';
        const fechaCell = headerCols.fecha >= 0 ? cells[headerCols.fecha] || '' : '';
        const horaCell = headerCols.hora >= 0 ? cells[headerCols.hora] || '' : '';
        const jornCell = headerCols.jornada >= 0 ? cells[headerCols.jornada] || '' : '';
        const canchaCell = headerCols.observCancha >= 0 ? cells[headerCols.observCancha] || '' : '';
        const obsCell = headerCols.observaciones >= 0 ? cells[headerCols.observaciones] || '' : '';

        const categoria = normalizeCategory(catCell) || currentCategoria || 'Mini (U11)';
        const defaultRama: RamaType = categoria.includes('U9') || categoria.includes('Mini') ? 'Mixto' : 'M';
        const rama = detectRama(ramaCell || line, defaultRama);

        matches.push(
          buildMatch(matches.length, {
            categoria,
            rama,
            local,
            visitante,
            fecha: normalizeDateStr(fechaCell) || currentFecha,
            hora: normalizeTimeStr(horaCell),
            jornada: jornCell || currentJornada,
            observCancha: canchaCell,
            observaciones: obsCell,
          })
        );
        continue;
      }
    }

    // Strategy 2: Check for "Local vs Visitante" or "Local - Visitante" inside line or across cells
    let local = '';
    let visitante = '';
    let categoria = '';
    let rama: RamaType | null = null;
    let fecha = '';
    let hora = '';
    let jornada = currentJornada;
    let observCancha = '';
    let observaciones = '';

    // Check cells for date, time, category, rama, jornada, vs
    const textCandidates: string[] = [];

    for (const cell of cells) {
      const jM = cell.match(JORNADA_RE);
      if (jM && cell.length <= 24) {
        jornada = jM[1].trim();
        continue;
      }

      const dM = normalizeDateStr(cell);
      if (dM && cell.length <= 20) {
        fecha = dM;
        continue;
      }

      const tM = normalizeTimeStr(cell);
      if (tM && cell.length <= 12) {
        hora = tM;
        continue;
      }

      if (/^(mixto|m|f|masculino|femenino)$/i.test(cell)) {
        rama = detectRama(cell);
        continue;
      }

      const catM = cell.match(CATEGORY_TOKEN_RE);
      if (catM && cell.length <= 26 && !/\bvs\.?\b/i.test(cell)) {
        categoria = normalizeCategory(cell);
        const cellRama = detectRama(cell, 'Mixto');
        if (/\b(f|fem|m|masc|mix)/i.test(cell)) rama = cellRama;
        continue;
      }

      if (/\b(gim\s*2|gimnasio\s*2|gimnasio\s*principal|cancha\s*\d|amistoso)\b/i.test(cell) && cell.length <= 28) {
        observCancha = cell;
        continue;
      }

      if (/\b(promo|copa\s*oro|copa\s*plata|necesario|j3|final|desempate)\b/i.test(cell)) {
        observaciones = observaciones ? `${observaciones} · ${cell}` : cell;
        continue;
      }

      // Check if cell itself holds "Local vs Visitante" or "Local - Visitante"
      const vsSplit = cell.split(/\s+(?:vs\.?|-|–)\s+/i);
      if (vsSplit.length === 2 && vsSplit[0].trim() && vsSplit[1].trim()) {
        local = vsSplit[0].trim();
        visitante = vsSplit[1].trim();
        continue;
      }

      textCandidates.push(cell);
    }

    // If not found via "vs", check if textCandidates has [Local, Visitante] (e.g., 2 separate columns in PDF/Excel copy)
    if ((!local || !visitante) && textCandidates.length >= 2) {
      // Ignore pure numbers like match #
      const teamCandidates = textCandidates.filter((c) => !/^\d{1,3}$/.test(c));
      if (teamCandidates.length >= 2) {
        local = teamCandidates[0];
        visitante = teamCandidates[1];
        if (teamCandidates.length > 2) {
          const rest = teamCandidates.slice(2).join(' ');
          if (!observaciones) observaciones = rest;
        }
      }
    }

    // Fallback: regex on the whole line if it has "A vs B" mixed with dates/times
    if ((!local || !visitante) && /\bvs\.?\b/i.test(line)) {
      let cleaned = line;
      const jm = cleaned.match(JORNADA_RE);
      if (jm) {
        jornada = jm[1].trim();
        cleaned = cleaned.replace(jm[0], ' ');
      }
      const dm = cleaned.match(DATE_FULL_RE) || cleaned.match(DATE_SHORT_RE);
      if (dm) {
        fecha = normalizeDateStr(dm[0]);
        cleaned = cleaned.replace(dm[0], ' ');
      }
      const tm = cleaned.match(TIME_RE);
      if (tm) {
        hora = normalizeTimeStr(tm[0]);
        cleaned = cleaned.replace(tm[0], ' ');
      }
      const cm = cleaned.match(CATEGORY_TOKEN_RE);
      if (cm) {
        categoria = normalizeCategory(cm[1]);
        cleaned = cleaned.replace(cm[0], ' ');
      }
      const parts = cleaned.split(/\s+vs\.?\s+/i);
      if (parts.length === 2) {
        local = parts[0].replace(/[|\-;]+/g, ' ').trim();
        visitante = parts[1].replace(/[|\-;]+/g, ' ').trim();
      }
    }

    // Guard: ensure local & visitante look like valid club names (not dates/numbers/headers)
    if (
      local &&
      visitante &&
      local.length >= 2 &&
      visitante.length >= 2 &&
      !/^\d+$/.test(local) &&
      !/^\d+$/.test(visitante) &&
      local.toLowerCase() !== 'local' &&
      visitante.toLowerCase() !== 'visitante'
    ) {
      if (!fecha) fecha = normalizeDateStr(line) || currentFecha;
      if (!hora) hora = normalizeTimeStr(line);
      if (!categoria) {
        const cm = line.match(CATEGORY_TOKEN_RE);
        categoria = cm ? normalizeCategory(cm[1]) : currentCategoria || 'Mini (U11)';
      }
      const defaultRama: RamaType =
        categoria.includes('U9') || categoria.includes('Mini') || categoria.includes('U7') || categoria.includes('U5')
          ? 'Mixto'
          : 'M';
      const resolvedRama = rama || detectRama(line, currentRama || defaultRama);

      matches.push(
        buildMatch(matches.length, {
          categoria,
          rama: resolvedRama,
          local,
          visitante,
          fecha,
          hora,
          jornada,
          observCancha,
          observaciones,
        })
      );
    }
  }

  return matches;
};

/**
 * Full browser-side PDF fixture parser (works offline and on GitHub Pages).
 */
export const parsePdfFixtureClientSide = async (
  file: File
): Promise<{ matches: Match[]; extractedCharCount: number; pageCount: number }> => {
  const { text, pageCount } = await extractTextFromPdf(file);
  const cleanLen = text.replace(/\s+/g, '').length;
  const matches = parseRawTextFixtureClientSide(text);
  return {
    matches,
    extractedCharCount: cleanLen,
    pageCount,
  };
};
