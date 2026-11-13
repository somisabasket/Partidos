import * as XLSX from 'xlsx';
import { Match, RamaType, EstadoPartido } from '../types/fixture';

// Helper to assign coach based on category, branch and Somisa team
export const assignDefaultCoach = (item: {
  categoria: string;
  rama: string;
  local: string;
  visitante: string;
}): { entrenador: string; entrenadorTel: string } => {
  const cat = (item.categoria || '').toLowerCase();
  const isTeamB = (item.local || '').includes('Somisa B') || (item.visitante || '').includes('Somisa B');
  const isFem = (item.rama || '').toUpperCase() === 'F';

  if (isFem) {
    if (cat.includes('mini') || cat.includes('u11')) {
      return { entrenador: 'Prof. Ruso', entrenadorTel: '+54 9 336 422-9900' };
    }
    return { entrenador: 'Prof. Juan', entrenadorTel: '+54 9 336 455-6677' };
  }

  if (cat.includes('21') || cat.includes('proximo')) {
    return { entrenador: 'Prof. Diego', entrenadorTel: '+54 9 336 488-3344' };
  }

  if (cat.includes('mayor') || cat.includes('1°')) {
    if (isTeamB) {
      return { entrenador: 'Prof. Ruso', entrenadorTel: '+54 9 336 422-9900' };
    }
    return { entrenador: 'Prof. Diego', entrenadorTel: '+54 9 336 488-3344' };
  }

  if (cat.includes('17') || cat.includes('juvenil')) {
    if (isTeamB) {
      return { entrenador: 'Prof. Juan', entrenadorTel: '+54 9 336 455-6677' };
    }
    return { entrenador: 'Prof. Lucas', entrenadorTel: '+54 9 336 433-1122' };
  }

  if (cat.includes('15') || cat.includes('cadete')) {
    if (isTeamB) {
      return { entrenador: 'Prof. Franco', entrenadorTel: '+54 9 336 477-8899' };
    }
    return { entrenador: 'Prof. Lucas', entrenadorTel: '+54 9 336 433-1122' };
  }

  if (cat.includes('mini') || cat.includes('u11')) {
    if (isTeamB) {
      return { entrenador: 'Prof. Franco', entrenadorTel: '+54 9 336 477-8899' };
    }
    return { entrenador: 'Prof. Naza', entrenadorTel: '+54 9 336 411-2233' };
  }

  if (cat.includes('u9') || cat.includes('pre mini') || cat.includes('u7') || cat.includes('u5')) {
    return { entrenador: 'Prof. Naza', entrenadorTel: '+54 9 336 411-2233' };
  }

  return { entrenador: 'Prof. Naza', entrenadorTel: '+54 9 336 411-2233' };
};

// Format Excel dates (handles both serial numbers, Date objects and strings)
const parseExcelDate = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel serial number
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const d = String(date.d).padStart(2, '0');
      const m = String(date.m).padStart(2, '0');
      const y = date.y;
      return `${d}/${m}/${y}`;
    }
  }
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const str = String(val).trim();
  // If already DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.split('T')[0].split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return str;
};

// Format Excel times (handles decimal fractions and strings)
const parseExcelTime = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  // Match HH:MM
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return str;
};

// Clean string field
const cleanStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

// Main function to parse Excel buffer or file
export const parseExcelFixture = async (file: File): Promise<Match[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });

  const allMatches: Match[] = [];

  // Iterate over each sheet in the workbook
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to array of rows (headers included)
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rawRows.length < 2) continue;

    // Find header row by looking for keywords
    let headerRowIndex = -1;
    let colIndices: Record<string, number> = {};

    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      const row = rawRows[r].map((cell) => String(cell || '').toLowerCase().trim());

      const catIdx = row.findIndex((c) => c.includes('categ') || c.includes('divis') || c === 'cat');
      const localIdx = row.findIndex((c) => c === 'local' || c.includes('equipo local') || c.includes('club local'));
      const visitIdx = row.findIndex((c) => c === 'visitante' || c.includes('equipo vis') || c.includes('visita'));

      if (catIdx !== -1 || (localIdx !== -1 && visitIdx !== -1)) {
        headerRowIndex = r;
        colIndices = {
          categoria: catIdx !== -1 ? catIdx : row.findIndex((c) => c.includes('cat')),
          rama: row.findIndex((c) => c.includes('rama') || c.includes('gener') || c === 'f/m' || c === 'sexo'),
          local: localIdx,
          visitante: visitIdx,
          jornada: row.findIndex((c) => c.includes('jornad') || c.includes('nro fech') || c.includes('fecha n') || c === 'nro' || c.includes('ronda')),
          fecha: row.findIndex((c) => (c.includes('fech') || c.includes('dia') || c.includes('date')) && !c.includes('nro fech') && !c.includes('fecha n')),
          hora: row.findIndex((c) => c.includes('hor') || c.includes('time')),
          observCancha: row.findIndex((c) => c.includes('cancha') || c.includes('gim') || c.includes('estadio') || c.includes('sede')),
          observaciones: row.findIndex((c) => c.includes('observ') || c.includes('nota') || c.includes('coment') || c.includes('torneo')),
        };
        break;
      }
    }

    // If no explicit header was found, use standard 8-column ABSN fallback
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      colIndices = {
        categoria: 0,
        rama: 1,
        local: 2,
        visitante: 3,
        jornada: -1,
        fecha: 4,
        hora: 5,
        observCancha: 6,
        observaciones: 7,
      };
    }

    // Process data rows
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const categoria = cleanStr(row[colIndices.categoria]);
      const local = cleanStr(row[colIndices.local]);
      const visitante = cleanStr(row[colIndices.visitante]);

      // Skip empty or separator rows
      if (!categoria && !local && !visitante) continue;
      if (!local && !visitante) continue;

      let rama: RamaType = 'Mixto';
      const rawRama = cleanStr(row[colIndices.rama]).toUpperCase();
      if (rawRama === 'F' || rawRama.includes('FEM')) {
        rama = 'F';
      } else if (rawRama === 'M' || rawRama.includes('MASC')) {
        rama = 'M';
      } else if (rawRama.includes('MIX')) {
        rama = 'Mixto';
      }

      let jornada = colIndices.jornada >= 0 ? cleanStr(row[colIndices.jornada]) : '';
      let fecha = parseExcelDate(row[colIndices.fecha]);
      if (fecha && /^(fecha|jornada|f\.?)\s*\d+/i.test(fecha) && !jornada) {
        jornada = fecha;
        fecha = '';
      }

      const hora = parseExcelTime(row[colIndices.hora]);
      const observCancha = cleanStr(row[colIndices.observCancha]);
      const observaciones = cleanStr(row[colIndices.observaciones]);

      const isSomisaLocal = local.toLowerCase().includes('somisa');

      let estado: EstadoPartido = 'Confirmado';
      const esCondicional = observaciones.toLowerCase().includes('necesario') || observaciones.toLowerCase().includes('j3');
      if (esCondicional) {
        estado = 'Condicional';
      } else if (!fecha || !hora) {
        estado = 'A Coordinar';
      }

      let canchaAsignada = '';
      if (observCancha.toLowerCase().includes('gim 2')) {
        canchaAsignada = 'Gimnasio 2';
      } else if (isSomisaLocal) {
        canchaAsignada = 'Gimnasio Principal';
      } else {
        canchaAsignada = `${local || 'Club Rival'} (Visitante)`;
      }

      const coachInfo = assignDefaultCoach({ categoria, rama, local, visitante });

      allMatches.push({
        id: `match-excel-${Date.now()}-${allMatches.length + 1}`,
        categoria: categoria || 'Mini (U11)',
        rama,
        local: local || 'Somisa',
        visitante: visitante || 'Rival',
        fecha,
        hora,
        jornada,
        observCancha,
        observaciones,
        esCondicional,
        estado,
        canchaAsignada,
        entrenador: coachInfo.entrenador,
        entrenadorTel: coachInfo.entrenadorTel,
        padresGrupo: `${categoria} ${rama} Somisa`,
        citacionMinutos: categoria.toLowerCase().includes('mayor') ? 60 : 45,
      });
    }
  }

  return allMatches;
};

// Function to generate and download a standard Excel template for ABSN tournaments
export const downloadSampleExcelTemplate = () => {
  const templateRows = [
    {
      'JORNADA': 'Fecha 1',
      'CATEGORIA': 'U9',
      'RAMA (F/M)': 'Mixto',
      'LOCAL': 'Somisa A',
      'VISITANTE': 'Social',
      'FECHA (DD/MM/YYYY)': '11/11/2026',
      'HORA (HH:MM)': '18:30',
      'OBSERV. CANCHA': 'Gim 2',
      'OBSERVACIONES': '',
    },
    {
      'JORNADA': 'Fecha 1',
      'CATEGORIA': 'Mini (U11)',
      'RAMA (F/M)': 'Mixto',
      'LOCAL': 'Somisa A',
      'VISITANTE': 'Social',
      'FECHA (DD/MM/YYYY)': '11/11/2026',
      'HORA (HH:MM)': '19:30',
      'OBSERV. CANCHA': 'Gim 2',
      'OBSERVACIONES': 'Promo',
    },
    {
      'JORNADA': 'Fecha 1',
      'CATEGORIA': 'Cadetes (U15)',
      'RAMA (F/M)': 'M',
      'LOCAL': 'Somisa A',
      'VISITANTE': 'Regatas B',
      'FECHA (DD/MM/YYYY)': '14/11/2026',
      'HORA (HH:MM)': '17:30',
      'OBSERV. CANCHA': '',
      'OBSERVACIONES': '',
    },
    {
      'JORNADA': 'Fecha 1',
      'CATEGORIA': 'Juveniles (U17)',
      'RAMA (F/M)': 'M',
      'LOCAL': 'Somisa A',
      'VISITANTE': 'Regatas B',
      'FECHA (DD/MM/YYYY)': '14/11/2026',
      'HORA (HH:MM)': '19:15',
      'OBSERV. CANCHA': '',
      'OBSERVACIONES': '',
    },
    {
      'JORNADA': 'Fecha 2',
      'CATEGORIA': 'Cadetes (U15)',
      'RAMA (F/M)': 'F',
      'LOCAL': 'Somisa',
      'VISITANTE': 'Sacachispas',
      'FECHA (DD/MM/YYYY)': '15/11/2026',
      'HORA (HH:MM)': '19:00',
      'OBSERV. CANCHA': '',
      'OBSERVACIONES': 'Final Copa oro J1',
    },
    {
      'JORNADA': 'Fecha 2',
      'CATEGORIA': 'Mayores (1°)',
      'RAMA (F/M)': 'M',
      'LOCAL': 'Defensores',
      'VISITANTE': 'Somisa A',
      'FECHA (DD/MM/YYYY)': '20/11/2026',
      'HORA (HH:MM)': '21:00',
      'OBSERV. CANCHA': '',
      'OBSERVACIONES': 'Final Copa oro J2',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // JORNADA
    { wch: 16 }, // CATEGORIA
    { wch: 12 }, // RAMA
    { wch: 18 }, // LOCAL
    { wch: 18 }, // VISITANTE
    { wch: 18 }, // FECHA
    { wch: 14 }, // HORA
    { wch: 16 }, // OBSERV. CANCHA
    { wch: 24 }, // OBSERVACIONES
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fixture SOMISA');
  XLSX.writeFile(workbook, 'Plantilla_Fixture_SOMISA.xlsx');
};
