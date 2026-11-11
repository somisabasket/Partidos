import React, { useState } from 'react';
import { Match } from '../types/fixture';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, ChevronRight, Zap } from 'lucide-react';
import { ConflictNotice } from '../utils/conflictDetector';
import { SOMISA_CREST_URL } from '../utils/assets';

interface ScheduleCoordinatorProps {
  matches: Match[];
  onUpdateMatch: (updated: Match) => void;
  conflicts: ConflictNotice[];
}

export const ScheduleCoordinator: React.FC<ScheduleCoordinatorProps> = ({
  matches,
  onUpdateMatch,
  conflicts,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    matches.find((m) => !m.fecha || !m.hora)?.id || matches[0]?.id || ''
  );
  const [filterView, setFilterView] = useState<'todos' | 'local' | 'visitante' | 'conflictos'>('local');

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  // Filter matches
  const displayedMatches = matches.filter((m) => {
    const isSomisaLocal = m.local.toLowerCase().includes('somisa');
    if (filterView === 'local') return isSomisaLocal;
    if (filterView === 'visitante') return !isSomisaLocal;
    if (filterView === 'conflictos') {
      return conflicts.some((c) => c.partidosInvolucrados.includes(m.id));
    }
    return true;
  });

  const handleUpdateCurrent = (field: keyof Match, value: any) => {
    if (!selectedMatch) return;
    const updated = { ...selectedMatch, [field]: value };
    if (field === 'fecha' || field === 'hora') {
      if (updated.fecha && updated.hora) {
        updated.estado = updated.esCondicional ? 'Condicional' : 'Confirmado';
      } else {
        updated.estado = 'A Coordinar';
      }
    }
    onUpdateMatch(updated);
  };

  const handleApplyPresetSlot = (fecha: string, hora: string, cancha: string, obsCancha = '') => {
    if (!selectedMatch) return;
    const updated: Match = {
      ...selectedMatch,
      fecha,
      hora,
      canchaAsignada: cancha,
      observCancha: obsCancha || (cancha.includes('2') ? 'Gim 2' : ''),
      estado: selectedMatch.esCondicional ? 'Condicional' : 'Confirmado',
    };
    onUpdateMatch(updated);
  };

  // Preset typical weekend game days
  const weekendPresets = [
    { label: 'Sábado Mañana (Mini)', fecha: '14/11/2026', hora: '10:00', cancha: 'Gimnasio Principal' },
    { label: 'Sábado Mediodía (Pre-Mini)', fecha: '14/11/2026', hora: '11:30', cancha: 'Gimnasio Principal' },
    { label: 'Sábado Tarde (U15 Cadetes)', fecha: '14/11/2026', hora: '14:00', cancha: 'Gimnasio Principal' },
    { label: 'Sábado Tarde (U17 Juveniles)', fecha: '14/11/2026', hora: '15:45', cancha: 'Gimnasio Principal' },
    { label: 'Sábado Noche (U17 / Primera)', fecha: '14/11/2026', hora: '19:15', cancha: 'Gimnasio Principal' },
    { label: 'Domingo Tarde (Femenino)', fecha: '15/11/2026', hora: '18:00', cancha: 'Gimnasio Principal' },
    { label: 'Domingo Noche (Primera)', fecha: '15/11/2026', hora: '20:00', cancha: 'Gimnasio Principal' },
    { label: 'Simultáneo Gim 2 (Mini/Escuela)', fecha: '14/11/2026', hora: '10:30', cancha: 'Gimnasio 2', obs: 'Gim 2' },
  ];

  return (
    <div className="space-y-4">
      {/* Overview header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo SOMISA"
              className="w-11 h-11 object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Coordinador de Días, Horarios y Canchas
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                SOMISA es tu equipo. Define los horarios de local en Gimnasio Principal o Gim 2, y valida la disponibilidad.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterView('local')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterView === 'local' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SOMISA Local
            </button>
            <button
              onClick={() => setFilterView('visitante')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterView === 'visitante' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SOMISA Visitante
            </button>
            <button
              onClick={() => setFilterView('todos')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterView === 'todos' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos los Partidos
            </button>
            {conflicts.length > 0 && (
              <button
                onClick={() => setFilterView('conflictos')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                  filterView === 'conflictos'
                    ? 'bg-amber-100 text-amber-900 shadow-2xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Alertas ({conflicts.length})
              </button>
            )}
          </div>
        </div>

        {/* Conflict notices if any */}
        {conflicts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  c.nivel === 'alerta'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    c.nivel === 'alerta' ? 'text-red-600' : 'text-amber-600'
                  }`}
                />
                <div className="flex-1">
                  <div className="font-bold">{c.titulo}</div>
                  <div className="text-[11px] opacity-90 mt-0.5">{c.mensaje}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Workspace: 2-column split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: List of matches to coordinate */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[640px]">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Partidos ({displayedMatches.length})</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Selecciona para programar horario
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {displayedMatches.map((m) => {
              const isSelected = m.id === selectedMatchId;
              const isSomisaLocal = m.local.toLowerCase().includes('somisa');
              const hasConflict = conflicts.some((c) => c.partidosInvolucrados.includes(m.id));

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 border-l-4 border-l-blue-700'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {m.categoria} <span className="text-slate-500 font-normal">({m.rama})</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        m.fecha && m.hora
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.fecha && m.hora ? `${m.fecha} · ${m.hora} hs` : 'A Coordinar'}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {m.local} vs {m.visitante}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isSomisaLocal ? '🏟️ Local' : '🚌 Visitante'}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Cancha: {m.observCancha || m.canchaAsignada || 'A confirmar'}</span>
                    {hasConflict && (
                      <span className="text-red-600 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        Conflicto
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Interactive scheduling card */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between space-y-4">
          {selectedMatch ? (
            <div className="space-y-4">
              {/* Match Header */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-blue-700">{selectedMatch.categoria}</span>
                    <span>·</span>
                    <span>Rama: {selectedMatch.rama}</span>
                    <span>·</span>
                    <span>
                      {selectedMatch.local.toLowerCase().includes('somisa')
                        ? 'SOMISA (Local)'
                        : 'SOMISA (Visitante)'}
                    </span>
                  </div>
                  {selectedMatch.esCondicional && (
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                      J3 Condicional
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  {selectedMatch.local} vs {selectedMatch.visitante}
                </h3>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    Fecha del Encuentro (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    value={selectedMatch.fecha}
                    onChange={(e) => handleUpdateCurrent('fecha', e.target.value)}
                    placeholder="Ej: 14/11/2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <div className="flex gap-1 mt-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrent('fecha', '14/11/2026')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      Sáb 14/11
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrent('fecha', '15/11/2026')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      Dom 15/11
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrent('fecha', '20/11/2026')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      Vie 20/11
                    </button>
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-700" />
                    Horario de Inicio (HH:MM)
                  </label>
                  <input
                    type="text"
                    value={selectedMatch.hora}
                    onChange={(e) => handleUpdateCurrent('hora', e.target.value)}
                    placeholder="Ej: 10:00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold tabular-nums focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <div className="flex gap-1 mt-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrent('hora', '10:00')}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      10:00
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrent('hora', '14:00')}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      14:00
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrent('hora', '17:30')}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      17:30
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrent('hora', '19:15')}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      19:15
                    </button>
                  </div>
                </div>

                {/* Court */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-700" />
                    Cancha / Sede
                  </label>
                  <select
                    value={selectedMatch.canchaAsignada || 'Gimnasio Principal'}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateCurrent('canchaAsignada', val);
                      if (val.includes('2')) {
                        handleUpdateCurrent('observCancha', 'Gim 2');
                      } else if (selectedMatch.observCancha === 'Gim 2') {
                        handleUpdateCurrent('observCancha', '');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Gimnasio Principal">Gimnasio Principal (SOMISA)</option>
                    <option value="Gimnasio 2">Gimnasio 2 (SOMISA)</option>
                    <option value="Cancha 1 (Estadio Cubierto)">Cancha 1 (Estadio Cubierto)</option>
                    <option value={`${selectedMatch.local} (Visitante)`}>
                      {selectedMatch.local} (Cancha Visitante)
                    </option>
                  </select>
                </div>

                {/* Observación Cancha (e.g. Gim 2) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Texto Observación Cancha (Planilla)
                  </label>
                  <input
                    type="text"
                    value={selectedMatch.observCancha}
                    onChange={(e) => handleUpdateCurrent('observCancha', e.target.value)}
                    placeholder="Ej: Gim 2 o Amistoso"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Observaciones Generales */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Observaciones Oficiales (Ej: Promo, Final Copa Oro, etc.)
                  </label>
                  <input
                    type="text"
                    value={selectedMatch.observaciones}
                    onChange={(e) => handleUpdateCurrent('observaciones', e.target.value)}
                    placeholder="Ej: Promo, Final Copa oro J1, J3 Si es necesario"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Entrenador & Citación */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Entrenador Asignado (SOMISA)
                  </label>
                  <input
                    type="text"
                    value={selectedMatch.entrenador || ''}
                    onChange={(e) => handleUpdateCurrent('entrenador', e.target.value)}
                    placeholder="Nombre del DT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Citación Jugadores (minutos antes)
                  </label>
                  <input
                    type="number"
                    value={selectedMatch.citacionMinutos || 45}
                    onChange={(e) => handleUpdateCurrent('citacionMinutos', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tabular-nums focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Preset Time Slots for SOMISA Home Tiras */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-blue-700" />
                  Horarios Habituales de Tiras en SOMISA (1-clic)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {weekendPresets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPresetSlot(p.fecha, p.hora, p.cancha, p.obs)}
                      className="p-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 text-left transition-colors"
                    >
                      <div className="font-semibold text-slate-900 truncate">{p.label}</div>
                      <div className="text-[11px] text-blue-700 font-mono tabular-nums mt-0.5">
                        {p.hora} hs · {p.cancha.includes('2') ? 'Gim 2' : 'Principal'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Selecciona un partido a la izquierda para coordinar sus horarios.
            </div>
          )}

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Los cambios se sincronizan en vivo con la Planilla Oficial
            </span>
            <span className="text-[11px]">SOMISA Básquetbol</span>
          </div>
        </div>
      </div>
    </div>
  );
};
