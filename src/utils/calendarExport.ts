import { Match } from '../types/fixture';

// Helper to convert DD/MM/YYYY and HH:MM to Date
export function parseMatchDateTime(fechaStr: string, horaStr: string): Date | null {
  if (!fechaStr || !horaStr) return null;
  const parts = fechaStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const timeParts = horaStr.split(':');
  if (timeParts.length < 2) return null;
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
    return null;
  }

  return new Date(year, month, day, hour, minute);
}

// Format date to ICS format (YYYYMMDDTHHmmssZ or local YYYYMMDDTHHmmss)
function formatIcsDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

// Generate Google Calendar Link
export function getGoogleCalendarUrl(match: Match): string {
  const startDate = parseMatchDateTime(match.fecha, match.hora);
  if (!startDate) return '';

  const endDate = new Date(startDate.getTime() + 90 * 60 * 1000); // 1.5 hs duration

  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const title = encodeURIComponent(`Básquet: ${match.categoria} (${match.rama}) ${match.local} vs ${match.visitante}`);
  const dates = `${fmt(startDate)}/${fmt(endDate)}`;
  const location = encodeURIComponent(
    match.canchaAsignada || (match.local.toLowerCase().includes('somisa') ? 'Club SOMISA, San Nicolás' : match.local)
  );
  
  let detailsText = `Partido oficial torneo formativas y mini básquet.\nCategoría: ${match.categoria} (${match.rama})\nLocal: ${match.local} | Visitante: ${match.visitante}\n`;
  if (match.observCancha) detailsText += `Cancha: ${match.observCancha}\n`;
  if (match.observaciones) detailsText += `Observaciones: ${match.observaciones}\n`;
  if (match.entrenador) detailsText += `Entrenador: ${match.entrenador} (${match.entrenadorTel || ''})\n`;
  if (match.citacionMinutos) detailsText += `Citación jugadores: ${match.citacionMinutos} minutos antes.\n`;

  const details = encodeURIComponent(detailsText);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;
}

// Export .ICS file for Apple Calendar, Outlook, Google Calendar
export function downloadIcsCalendar(matches: Match[], filename = 'SOMISA_Basquet_Calendario.ics'): void {
  const validMatches = matches.filter((m) => m.fecha && m.hora && parseMatchDateTime(m.fecha, m.hora));

  if (validMatches.length === 0) {
    alert('No hay partidos con fecha y hora confirmada para exportar.');
    return;
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Club SOMISA//Fixture Coordinador Basquet//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SOMISA Básquetbol - Cronograma Oficial',
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
  ];

  validMatches.forEach((m) => {
    const start = parseMatchDateTime(m.fecha, m.hora);
    if (!start) return;
    const end = new Date(start.getTime() + 90 * 60 * 1000);

    const isHome = m.local.toLowerCase().includes('somisa');
    const location = m.canchaAsignada || (isHome ? 'Club SOMISA, San Nicolás de los Arroyos' : `Cancha de ${m.local}`);

    const summary = `🏀 ${m.categoria} (${m.rama}): ${m.local} vs ${m.visitante}`;
    const description = `Partido Formativas / Mini Básquet.\\nLocal: ${m.local}\\nVisitante: ${m.visitante}\\nCancha: ${m.observCancha || m.canchaAsignada || 'Principal'}\\nDetalles: ${m.observaciones || 'Ninguna'}\\nDT: ${m.entrenador || 'A confirmar'} (${m.entrenadorTel || ''})\\nCitación: ${m.citacionMinutos || 45} min antes.`;

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:somisa-${m.id}-${Date.now()}@somisabasquet.org`);
    icsContent.push(`DTSTAMP:${formatIcsDate(new Date())}Z`);
    icsContent.push(`DTSTART:${formatIcsDate(start)}`);
    icsContent.push(`DTEND:${formatIcsDate(end)}`);
    icsContent.push(`SUMMARY:${summary}`);
    icsContent.push(`LOCATION:${location}`);
    icsContent.push(`DESCRIPTION:${description}`);
    icsContent.push('STATUS:CONFIRMED');
    // 2-hour alert
    icsContent.push('BEGIN:VALARM');
    icsContent.push('TRIGGER:-PT2H');
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:Recordatorio: ${summary}`);
    icsContent.push('END:VALARM');
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
