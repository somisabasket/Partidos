import React, { useState, useEffect, useMemo } from 'react';
import { Match, MesaAssignment } from '../types/fixture';
import { SOMISA_CREST_URL } from '../utils/assets';
import { 
  ClipboardList, 
  Copy, 
  Check, 
  Send, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Filter,
  Sparkles,
  RefreshCw,
  UserCheck,
  ChevronRight
} from 'lucide-react';

interface MesaDeControlProps {
  matches: Match[];
}

// Rule: Mesa de Control is ONLY for categories from Mini (U11) onwards.
// Categories U5, U7, U9 (Pre-Mini, Escuelita, Mosquitos) do NOT use official score table.
export const isEligibleForMesa = (categoria: string): boolean => {
  const cat = (categoria || '').toLowerCase().trim();
  if (
    /\bu[-\s]?[579]\b/i.test(cat) ||
    cat.includes('pre mini') ||
    cat.includes('pre-mini') ||
    cat.includes('premini') ||
    cat.includes('escuelita') ||
    cat.includes('cebollita') ||
    cat.includes('mosquito')
  ) {
    return false;
  }
  return true;
};

export const MesaDeControl: React.FC<MesaDeControlProps> = ({ matches }) => {
  // Filter only home matches that require Mesa de Control (Mini U11 onwards, excluding U5, U7, U9)
  const homeMatches = useMemo(() => {
    return matches
      .filter((m) => m.local.toLowerCase().includes('somisa') && isEligibleForMesa(m.categoria))
      .sort((a, b) => {
        // Sort by date then time
        if (a.fecha === b.fecha) {
          return (a.hora || '99:99').localeCompare(b.hora || '99:99');
        }
        return (a.fecha || '99/99/9999').localeCompare(b.fecha || '99/99/9999');
      });
  }, [matches]);

  // Count matches excluded because they are U5, U7 or U9
  const excludedYoungMatchesCount = useMemo(() => {
    return matches.filter(
      (m) => m.local.toLowerCase().includes('somisa') && !isEligibleForMesa(m.categoria)
    ).length;
  }, [matches]);

  // Extract unique dates with local matches that need mesa
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(homeMatches.map((m) => m.fecha).filter(Boolean)));
    return dates;
  }, [homeMatches]);

  // Selected date filter (defaults to first available date or 'todas')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return availableDates.length > 0 ? availableDates[0] : 'todas';
  });

  // Keep selectedDate valid when fixture matches change (e.g. after importing a new annual/semester fixture)
  useEffect(() => {
    if (selectedDate !== 'todas' && !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates.length > 0 ? availableDates[0] : 'todas');
    }
  }, [availableDates, selectedDate]);

  const [includeConditionals, setIncludeConditionals] = useState<boolean>(true);
  const [selectedCancha, setSelectedCancha] = useState<string>('todas');
  const [copied, setCopied] = useState<boolean>(false);

  // Mesa assignments stored in localStorage
  const [assignments, setAssignments] = useState<Record<string, MesaAssignment>>(() => {
    try {
      const saved = localStorage.getItem('somisa_mesa_assignments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading mesa assignments:', e);
    }
    return {};
  });

  // Save assignments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('somisa_mesa_assignments', JSON.stringify(assignments));
    } catch (e) {
      console.error('Error saving mesa assignments:', e);
    }
  }, [assignments]);

  // Options for message generation
  const [includeReminders, setIncludeReminders] = useState<boolean>(true);
  const [includeCourtNotes, setIncludeCourtNotes] = useState<boolean>(true);
  const [highlightVacancies, setHighlightVacancies] = useState<boolean>(true);

  // Helper to check if category needs 24" shot clock (U13 onwards)
  const requiresShotClock = (categoria: string): boolean => {
    const cat = categoria.toLowerCase();
    if (!isEligibleForMesa(cat)) return false;
    if (cat.includes('mini') || /\bu[-\s]?11\b/i.test(cat)) return false;
    return true; // U13, U15, U17, U21, Mayores all use 24s shot clock
  };

  // Filtered home matches for current view
  const currentMatches = useMemo(() => {
    return homeMatches.filter((m) => {
      if (selectedDate !== 'todas' && m.fecha !== selectedDate) return false;
      if (!includeConditionals && m.esCondicional) return false;
      if (selectedCancha !== 'todas') {
        const court = m.canchaAsignada || m.observCancha || '';
        if (!court.toLowerCase().includes(selectedCancha.toLowerCase())) return false;
      }
      return true;
    });
  }, [homeMatches, selectedDate, includeConditionals, selectedCancha]);

  // Handler to update an assignment field
  const handleUpdateAssignment = (matchId: string, field: keyof MesaAssignment, value: string) => {
    setAssignments((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { matchId }),
        [field]: value,
      },
    }));
  };

  // Copy assignment from previous match in current list
  const handleCopyFromPrevious = (index: number) => {
    if (index === 0) return;
    const prevMatch = currentMatches[index - 1];
    const targetMatch = currentMatches[index];
    const prevData = assignments[prevMatch.id];
    if (!prevData) return;

    setAssignments((prev) => ({
      ...prev,
      [targetMatch.id]: {
        matchId: targetMatch.id,
        planillero: prevData.planillero || '',
        cronometrista: prevData.cronometrista || '',
        operador24: requiresShotClock(targetMatch.categoria) ? prevData.operador24 || '' : '',
        responsable: prevData.responsable || '',
      },
    }));
  };

  // Statistics
  const stats = useMemo(() => {
    let totalSlots = 0;
    let coveredSlots = 0;

    currentMatches.forEach((m) => {
      const needs24 = requiresShotClock(m.categoria);
      const assign = assignments[m.id] || { matchId: m.id };

      // Planilla
      totalSlots++;
      if (assign.planillero?.trim()) coveredSlots++;

      // Cronómetro
      totalSlots++;
      if (assign.cronometrista?.trim()) coveredSlots++;

      // 24s
      if (needs24) {
        totalSlots++;
        if (assign.operador24?.trim()) coveredSlots++;
      }
    });

    const vacantSlots = totalSlots - coveredSlots;
    const percent = totalSlots > 0 ? Math.round((coveredSlots / totalSlots) * 100) : 0;

    return { totalSlots, coveredSlots, vacantSlots, percent };
  }, [currentMatches, assignments]);

  // Format date readable (e.g. Sábado 14/11/2026)
  const formatDateLabel = (dateStr: string): string => {
    if (!dateStr) return 'Fecha a coordinar';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const dateObj = new Date(y, m, d);
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = days[dateObj.getDay()] || '';
      return `${dayName} ${dateStr}`;
    }
    return dateStr;
  };

  // Generate WhatsApp message text
  const whatsappMessage = useMemo(() => {
    if (currentMatches.length === 0) {
      return 'No hay partidos de local seleccionados para este criterio.';
    }

    const dateHeader = selectedDate !== 'todas' ? formatDateLabel(selectedDate) : 'PRÓXIMOS ENCUENTROS DE LOCAL';

    let msg = `🏀 *CLUB SOMISA - CONVOCATORIA GRUPO MESA DE CONTROL* 🔵⚪\n`;
    msg += `👥 *Mensaje para:* Grupo de WhatsApp de Mesa de Control / Colaboradores\n`;
    msg += `📍 *Sede:* Club SOMISA (San Nicolás)\n`;
    msg += `📅 *${dateHeader.toUpperCase()}*\n\n`;
    msg += `¡Hola a todos! 👋 Convocamos a las familias, delegados y colaboradores para cubrir la mesa de control de los partidos de *LOCAL* en nuestro club.\n`;
    msg += `ℹ️ _(Recordatorio reglamentario: las categorías U5, U7 y U9 no llevan mesa de control oficial; la mesa inicia a partir de Mini U11 en adelante)._\n\n`;
    msg += `📋 *CRONOGRAMA Y PUESTOS A CUBRIR:*\n\n`;

    // Group current matches by date if 'todas'
    const grouped: Record<string, Match[]> = {};
    currentMatches.forEach((m) => {
      const key = m.fecha || 'Sin fecha';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });

    Object.entries(grouped).forEach(([dateKey, matchList]) => {
      if (selectedDate === 'todas') {
        msg += `═════════════════════════\n`;
        msg += `📆 *${formatDateLabel(dateKey).toUpperCase()}*\n`;
        msg += `═════════════════════════\n\n`;
      }

      matchList.forEach((m) => {
        const horaStr = m.hora ? `${m.hora} hs` : 'Horario a confirmar';
        const needs24 = requiresShotClock(m.categoria);
        const assign = assignments[m.id] || { matchId: m.id };
        const cancha = m.observCancha || m.canchaAsignada || 'Gimnasio Principal';

        msg += `🔹 *${horaStr}* | *${m.categoria}* (${m.rama})\n`;
        msg += `   ⚔️ *${m.local} vs ${m.visitante}*\n`;
        if (includeCourtNotes) {
          msg += `   📍 Cancha: ${cancha}\n`;
        }
        if (m.observaciones) {
          msg += `   ℹ️ Nota: ${m.observaciones}\n`;
        }

        // Planilla
        const planilleroText = assign.planillero?.trim() 
          ? `✅ ${assign.planillero}` 
          : highlightVacancies ? `⚠️ *VACANTE (Se busca voluntario/a)*` : `_A confirmar_`;
        msg += `   • *Planilla:* ${planilleroText}\n`;

        // Cronómetro
        const cronoText = assign.cronometrista?.trim() 
          ? `✅ ${assign.cronometrista}` 
          : highlightVacancies ? `⚠️ *VACANTE (Se busca voluntario/a)*` : `_A confirmar_`;
        msg += `   • *Cronómetro:* ${cronoText}\n`;

        // 24 Segundos (Only for U13+)
        if (needs24) {
          const reloj24Text = assign.operador24?.trim() 
            ? `✅ ${assign.operador24}` 
            : highlightVacancies ? `⚠️ *VACANTE (Se busca voluntario/a)*` : `_A confirmar_`;
          msg += `   • *Reloj 24":* ${reloj24Text}\n`;
        }

        if (assign.responsable?.trim()) {
          msg += `   • *Responsable:* ✅ ${assign.responsable}\n`;
        }

        msg += `\n`;
      });
    });

    msg += `👉 *¿CÓMO ANOTARTE EN EL GRUPO?*\n`;
    msg += `Por favor, respondan en este grupo indicando qué *partido* y *puesto* (Planilla, Cronómetro o 24") pueden cubrir. ¡El aporte de todos es clave para que los chicos jueguen!\n\n`;

    if (includeReminders) {
      msg += `📌 *RECORDATORIOS IMPORTANTES:*\n`;
      msg += `• Presentarse *20 minutos antes* del inicio del encuentro para verificar planillas y cronómetro.\n`;
      msg += `• Cargar planillas digitales (GES Deportiva) / actas con tiempo.\n`;
      msg += `• Reloj de posesión de 24" obligatorio a partir de U13.\n\n`;
    }

    msg += `¡Muchas gracias a todas las familias y colaboradores por el compromiso de siempre! 🙌\n`;
    msg += `🔵⚪ *¡VAMOS SOMISA!* 🔵⚪`;

    return msg;
  }, [currentMatches, selectedDate, assignments, includeReminders, includeCourtNotes, highlightVacancies]);

  // Copy to clipboard
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('Error al copiar:', e);
    }
  };

  // Open direct WhatsApp web/app
  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with SOMISA Crest */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img 
              src={SOMISA_CREST_URL} 
              alt="Club SOMISA" 
              className="w-12 h-12 md:w-14 md:h-14 object-contain shrink-0 drop-shadow-xs" 
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
                <ClipboardList className="w-3 h-3 text-emerald-700" />
                Convocatoria Grupo de WhatsApp
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Mesa de Control - Partidos de Local
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Generador de mensajes para el grupo de WhatsApp de Mesa de Control y colaboradores del Club SOMISA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={handleCopyMessage}
              className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado para el Grupo!' : 'Copiar para Grupo de WA'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 text-xs md:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-xs flex items-center gap-2"
              title="Abrir WhatsApp para enviar al grupo de Mesa de Control"
            >
              <Send className="w-4 h-4" />
              <span>Enviar al Grupo de WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Regulatory callout regarding U5, U7, U9 */}
        <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Reglamento de Mesa de Control:</span> Las categorías formativas iniciales (<strong>U5</strong>, <strong>U7</strong> y <strong>U9 / Pre-Mini</strong>) no llevan mesa de control oficial. Los turnos de mesa y cronometristas inician a partir de <strong>Mini (U11) en adelante</strong> (U11, U13, U15, U17, U21 y Mayores).
            {excludedYoungMatchesCount > 0 && (
              <span className="ml-1 text-blue-700 font-semibold">
                ({excludedYoungMatchesCount} encuentros de U9/Pre-Mini de local excluidos automáticamente).
              </span>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Jornada / Fecha:
            </label>
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="todas">Todos los partidos de Local ({homeMatches.length})</option>
                {availableDates.map((dateStr) => {
                  const count = homeMatches.filter((m) => m.fecha === dateStr).length;
                  return (
                    <option key={dateStr} value={dateStr}>
                      {formatDateLabel(dateStr)} ({count} partidos)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Court Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Cancha / Gimnasio:
            </label>
            <select
              value={selectedCancha}
              onChange={(e) => setSelectedCancha(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todas">Todas las canchas</option>
              <option value="principal">Gimnasio Principal</option>
              <option value="gim 2">Gimnasio 2</option>
            </select>
          </div>

          {/* Conditional Match Checkbox */}
          <div className="flex items-center sm:pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={includeConditionals}
                onChange={(e) => setIncludeConditionals(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>Incluir condicionales (J3 si es necesario)</span>
            </label>
          </div>

          {/* Coverage Summary KPI */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">Cobertura de Mesa:</span>
              <span className={`font-bold font-mono ${stats.percent === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {stats.coveredSlots}/{stats.totalSlots} ({stats.percent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${stats.percent === 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {stats.vacantSlots === 0 ? '🎉 Todos los puestos cubiertos' : `⚠️ Faltan cubrir ${stats.vacantSlots} lugares`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Match List with Role Assignments (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Partidos de Local</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 font-mono">
                {currentMatches.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500">
              Completá los nombres de los voluntarios que ya confirmaron
            </span>
          </div>

          {currentMatches.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No hay partidos de local con los filtros seleccionados.</p>
              <button
                onClick={() => {
                  setSelectedDate('todas');
                  setSelectedCancha('todas');
                  setIncludeConditionals(true);
                }}
                className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-800 underline"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            currentMatches.map((match, idx) => {
              const needs24 = requiresShotClock(match.categoria);
              const assign = assignments[match.id] || { matchId: match.id };
              const isMatchComplete = assign.planillero?.trim() && assign.cronometrista?.trim() && (!needs24 || assign.operador24?.trim());
              const cancha = match.observCancha || match.canchaAsignada || 'Gimnasio Principal';

              return (
                <div 
                  key={match.id}
                  className={`bg-white rounded-xl border transition-all ${
                    match.esCondicional 
                      ? 'border-amber-300 bg-amber-50/20' 
                      : isMatchComplete 
                        ? 'border-emerald-200' 
                        : 'border-slate-200 hover:border-blue-300'
                  } p-4 shadow-2xs`}
                >
                  {/* Match Header Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md text-xs font-extrabold bg-blue-700 text-white font-mono">
                        {match.hora || 'A conf.'}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {match.categoria} ({match.rama})
                        </span>
                        <span className="text-xs text-slate-500 ml-1.5 font-medium">
                          vs <strong className="text-slate-800">{match.visitante}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {cancha}
                      </span>
                      {match.fecha && (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {match.fecha}
                        </span>
                      )}
                      {isMatchComplete ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Mesa completa
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Lugares vacantes
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {/* Planillero */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
                        <span>Planilla (GES):</span>
                        {assign.planillero?.trim() ? (
                          <span className="text-emerald-600 text-[10px] font-bold">✓ Cubierto</span>
                        ) : (
                          <span className="text-amber-600 text-[10px] font-bold">⚠️ Vacante</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Marcos Pérez"
                        value={assign.planillero || ''}
                        onChange={(e) => handleUpdateAssignment(match.id, 'planillero', e.target.value)}
                        className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400 font-medium"
                      />
                    </div>

                    {/* Cronometrista */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
                        <span>Cronómetro:</span>
                        {assign.cronometrista?.trim() ? (
                          <span className="text-emerald-600 text-[10px] font-bold">✓ Cubierto</span>
                        ) : (
                          <span className="text-amber-600 text-[10px] font-bold">⚠️ Vacante</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Valeria Rossi"
                        value={assign.cronometrista || ''}
                        onChange={(e) => handleUpdateAssignment(match.id, 'cronometrista', e.target.value)}
                        className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400 font-medium"
                      />
                    </div>

                    {/* 24 Segundos (Only for U13+) */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
                        <span>Reloj 24":</span>
                        {needs24 ? (
                          assign.operador24?.trim() ? (
                            <span className="text-emerald-600 text-[10px] font-bold">✓ Cubierto</span>
                          ) : (
                            <span className="text-amber-600 text-[10px] font-bold">⚠️ Vacante</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[10px]">No aplica</span>
                        )}
                      </label>
                      {needs24 ? (
                        <input
                          type="text"
                          placeholder="Ej: Lucas D."
                          value={assign.operador24 || ''}
                          onChange={(e) => handleUpdateAssignment(match.id, 'operador24', e.target.value)}
                          className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400 font-medium"
                        />
                      ) : (
                        <div className="text-xs bg-slate-100 text-slate-400 italic rounded-lg px-2.5 py-1.5 border border-slate-200 select-none">
                          Sin reloj 24" (Mini/U9)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom helper row */}
                  {idx > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => handleCopyFromPrevious(idx)}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                        title="Repite los mismos voluntarios del partido anterior si se quedan en la mesa"
                      >
                        <RefreshCw className="w-3 h-3 text-blue-600" />
                        <span>Misma mesa que partido anterior ({currentMatches[idx - 1].hora})</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live WhatsApp Message Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Vista Previa para WhatsApp
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {whatsappMessage.length} caracteres
              </span>
            </div>

            {/* Config Toggles */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 mb-4 text-xs font-medium text-slate-700">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Destacar vacantes con ⚠️</span>
                <input
                  type="checkbox"
                  checked={highlightVacancies}
                  onChange={(e) => setHighlightVacancies(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Incluir cancha y gimnasio</span>
                <input
                  type="checkbox"
                  checked={includeCourtNotes}
                  onChange={(e) => setIncludeCourtNotes(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Incluir recordatorios importantes</span>
                <input
                  type="checkbox"
                  checked={includeReminders}
                  onChange={(e) => setIncludeReminders(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>

            {/* Chat Bubble Simulation */}
            <div className="bg-[#0b141a] text-slate-100 p-4 rounded-xl font-sans text-xs leading-relaxed max-h-[480px] overflow-y-auto border border-slate-800 shadow-inner select-text">
              <div className="whitespace-pre-wrap font-mono text-[11px] text-[#e9edef] leading-5">
                {whatsappMessage}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCopyMessage}
                className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
              </button>

              <button
                onClick={handleOpenWhatsApp}
                className="w-full py-2.5 px-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir WhatsApp</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3">
              Al tocar "Abrir WhatsApp", se abrirá el chat con el texto pre-cargado para seleccionar el grupo de Mesa de Control o Subcomisión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
