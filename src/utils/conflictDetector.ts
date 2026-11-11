import { Match } from '../types/fixture';
import { parseMatchDateTime } from './calendarExport';

export interface ConflictNotice {
  id: string;
  type: 'cancha' | 'entrenador' | 'pendiente';
  nivel: 'alerta' | 'advertencia' | 'info';
  titulo: string;
  mensaje: string;
  partidosInvolucrados: string[];
}

export function detectFixtureConflicts(matches: Match[]): ConflictNotice[] {
  const notices: ConflictNotice[] = [];

  // 1. Check for missing date/time
  const pendingMatches = matches.filter((m) => !m.fecha || !m.hora);
  if (pendingMatches.length > 0) {
    notices.push({
      id: 'pending-matches-notice',
      type: 'pendiente',
      nivel: 'advertencia',
      titulo: `${pendingMatches.length} partido(s) pendiente(s) de día u horario`,
      mensaje: `Hay encuentros que aún no tienen fecha u hora fijada (ej. ${pendingMatches.map((m) => `${m.categoria} ${m.local} vs ${m.visitante}`).slice(0, 2).join(', ')}).`,
      partidosInvolucrados: pendingMatches.map((m) => m.id),
    });
  }

  // 2. Group home games by date and court to detect overlaps
  const homeMatchesWithTime = matches.filter(
    (m) => m.local.toLowerCase().includes('somisa') && m.fecha && m.hora
  );

  for (let i = 0; i < homeMatchesWithTime.length; i++) {
    for (let j = i + 1; j < homeMatchesWithTime.length; j++) {
      const m1 = homeMatchesWithTime[i];
      const m2 = homeMatchesWithTime[j];

      if (m1.fecha === m2.fecha) {
        // Compare courts: if both have explicit court or both default to same main court
        const court1 = m1.observCancha?.toLowerCase().includes('gim 2') ? 'Gim 2' : (m1.canchaAsignada || 'Gimnasio Principal');
        const court2 = m2.observCancha?.toLowerCase().includes('gim 2') ? 'Gim 2' : (m2.canchaAsignada || 'Gimnasio Principal');

        if (court1 === court2) {
          const d1 = parseMatchDateTime(m1.fecha, m1.hora);
          const d2 = parseMatchDateTime(m2.fecha, m2.hora);

          if (d1 && d2) {
            const diffMinutes = Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60);

            // If same start time -> direct conflict!
            if (diffMinutes === 0) {
              notices.push({
                id: `conflict-time-${m1.id}-${m2.id}`,
                type: 'cancha',
                nivel: 'alerta',
                titulo: `¡Conflicto de Cancha en ${court1}!`,
                mensaje: `${m1.categoria} (${m1.local} vs ${m1.visitante}) y ${m2.categoria} (${m2.local} vs ${m2.visitante}) están asignados exactamente a las ${m1.hora} hs en la misma cancha.`,
                partidosInvolucrados: [m1.id, m2.id],
              });
            } else if (diffMinutes < 60) {
              // Less than 60 mins gap -> very tight
              notices.push({
                id: `warning-gap-${m1.id}-${m2.id}`,
                type: 'cancha',
                nivel: 'advertencia',
                titulo: `Horario muy ajustado en ${court1}`,
                mensaje: `Solo hay ${diffMinutes} min entre ${m1.categoria} (${m1.hora} hs) y ${m2.categoria} (${m2.hora} hs). Un partido de formativas suele requerir entre 75 y 90 min.`,
                partidosInvolucrados: [m1.id, m2.id],
              });
            }
          }
        }
      }
    }
  }

  // 3. Check for coach overlaps
  for (let i = 0; i < matches.length; i++) {
    for (let j = i + 1; j < matches.length; j++) {
      const m1 = matches[i];
      const m2 = matches[j];

      if (m1.entrenador && m2.entrenador && m1.entrenador === m2.entrenador && m1.fecha === m2.fecha && m1.hora && m2.hora) {
        const d1 = parseMatchDateTime(m1.fecha, m1.hora);
        const d2 = parseMatchDateTime(m2.fecha, m2.hora);

        if (d1 && d2) {
          const diffMinutes = Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60);
          if (diffMinutes === 0) {
            notices.push({
              id: `coach-overlap-${m1.id}-${m2.id}`,
              type: 'entrenador',
              nivel: 'alerta',
              titulo: `Superposición de Entrenador (${m1.entrenador})`,
              mensaje: `El ${m1.entrenador} tiene dos partidos asignados el mismo día ${m1.fecha} a las ${m1.hora} hs (${m1.categoria} y ${m2.categoria}).`,
              partidosInvolucrados: [m1.id, m2.id],
            });
          }
        }
      }
    }
  }

  return notices;
}
