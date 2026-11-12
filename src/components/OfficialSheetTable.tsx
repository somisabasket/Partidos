import React, { useState } from 'react';
import { Match } from '../types/fixture';
import { Download, Calendar, Printer, Plus, Trash2, Edit3, Check, Search, Filter, ClipboardList, Upload } from 'lucide-react';
import { exportOfficialSheetPdf } from '../utils/pdfExport';
import { downloadIcsCalendar, getGoogleCalendarUrl } from '../utils/calendarExport';
import { SOMISA_CREST_URL } from '../utils/assets';

interface OfficialSheetTableProps {
  matches: Match[];
  onUpdateMatch: (updated: Match) => void;
  onDeleteMatch: (id: string) => void;
  onAddMatch: () => void;
  onSelectForEdit: (match: Match) => void;
  onNavigateToMesa?: () => void;
  onOpenUpload?: () => void;
}

export const OfficialSheetTable: React.FC<OfficialSheetTableProps> = ({
  matches,
  onUpdateMatch,
  onDeleteMatch,
  onAddMatch,
  onSelectForEdit,
  onNavigateToMesa,
  onOpenUpload,
}) => {
  const [filterType, setFilterType] = useState<'todos' | 'somisa-local' | 'somisa-visitante' | 'pendientes' | 'condicionales'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRival, setSelectedRival] = useState('todos');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Extract unique rivals and categories
  const rivals = Array.from(
    new Set(
      matches
        .flatMap((m) => [m.local, m.visitante])
        .filter((club) => !club.toLowerCase().includes('somisa'))
    )
  ).sort();

  const categories = Array.from(new Set(matches.map((m) => m.categoria))).sort();

  // Filtered matches
  const filteredMatches = matches.filter((m) => {
    const isSomisaLocal = m.local.toLowerCase().includes('somisa');
    const isSomisaVisit = m.visitante.toLowerCase().includes('somisa');

    if (filterType === 'somisa-local' && !isSomisaLocal) return false;
    if (filterType === 'somisa-visitante' && !isSomisaVisit) return false;
    if (filterType === 'pendientes' && (m.fecha && m.hora)) return false;
    if (filterType === 'condicionales' && !m.esCondicional && !m.observaciones.toLowerCase().includes('necesario')) return false;

    if (selectedRival !== 'todos') {
      const matchRival = isSomisaLocal ? m.visitante : m.local;
      if (!matchRival.toLowerCase().includes(selectedRival.toLowerCase())) return false;
    }

    if (selectedCategoria !== 'todas' && m.categoria !== selectedCategoria) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchText = `${m.categoria} ${m.rama} ${m.local} ${m.visitante} ${m.fecha} ${m.hora} ${m.observCancha} ${m.observaciones}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  const handleStartEdit = (match: Match, field: string, currentValue: string) => {
    setEditingCell({ id: match.id, field });
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = (match: Match) => {
    if (!editingCell) return;
    const updated = { ...match, [editingCell.field]: editValue };
    if (editingCell.field === 'fecha' || editingCell.field === 'hora') {
      if (updated.fecha && updated.hora) {
        updated.estado = updated.esCondicional ? 'Condicional' : 'Confirmado';
      } else {
        updated.estado = 'A Coordinar';
      }
    }
    onUpdateMatch(updated);
    setEditingCell(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Print-only official letterhead */}
      <div className="hidden print:flex items-center justify-between pb-4 border-b-2 border-blue-900 mb-4">
        <div className="flex items-center gap-3">
          <img
            src={SOMISA_CREST_URL}
            alt="Escudo Club SOMISA"
            className="w-16 h-16 object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-xl font-black text-blue-900 tracking-tight">
              CLUB SOMISA - BÁSQUETBOL
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Subcomisión de Divisiones Formativas y Mini Básquetbol · Asociación de Básquetbol
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 font-mono">
          <div>San Nicolás de los Arroyos</div>
          <div>Emitido: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo Club SOMISA"
              className="w-11 h-11 object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Planilla Oficial de Partidos
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Club SOMISA · Formato reglamentario de la Asociación. Haz clic en fecha u hora para editar en el momento.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportOfficialSheetPdf(filteredMatches)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar PDF
            </button>

            <button
              onClick={() => downloadIcsCalendar(filteredMatches)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Sincronizar Calendario (.ics)
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Imprimir
            </button>

            {onNavigateToMesa && (
              <button
                onClick={onNavigateToMesa}
                className="px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Generar resumen de partidos de local para WhatsApp y armar la mesa de control"
              >
                <ClipboardList className="w-3.5 h-3.5 text-blue-700" />
                <span>Mesa de Control (Local WA)</span>
              </button>
            )}

            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Importar fixture anual o semestral desde Excel (.xlsx) o documento PDF"
              >
                <Upload className="w-3.5 h-3.5 text-blue-700" />
                <span>Importar Fixture (Excel / PDF)</span>
              </button>
            )}

            <button
              onClick={onAddMatch}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Partido
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Segmented status filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterType('todos')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === 'todos' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({matches.length})
            </button>
            <button
              onClick={() => setFilterType('somisa-local')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === 'somisa-local' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SOMISA Local
            </button>
            <button
              onClick={() => setFilterType('somisa-visitante')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === 'somisa-visitante' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SOMISA Visitante
            </button>
            <button
              onClick={() => setFilterType('pendientes')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === 'pendientes' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A Coordinar
            </button>
            <button
              onClick={() => setFilterType('condicionales')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === 'condicionales' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Condicionales (J3)
            </button>
          </div>

          {/* Quick Selectors: Rival, Category & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={selectedRival}
                onChange={(e) => setSelectedRival(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="todos">Todos los Rivales</option>
                {rivals.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="todas">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Buscar partido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Official Table Replica (Identical layout to screenshot) */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white font-extrabold uppercase tracking-wider text-[11px] text-center border-b-2 border-blue-900">
                <th className="py-2.5 px-3 border-r border-blue-700/60 text-left min-w-[120px]">
                  CATEGORIA
                </th>
                <th className="py-2.5 px-2 border-r border-blue-700/60 min-w-[80px]">
                  RAMA (F/M)
                </th>
                <th className="py-2.5 px-3 border-r border-blue-700/60 text-left min-w-[120px]">
                  LOCAL
                </th>
                <th className="py-2.5 px-3 border-r border-blue-700/60 text-left min-w-[120px]">
                  VISITANTE
                </th>
                <th className="py-2.5 px-3 border-r border-blue-700/60 min-w-[95px]">
                  FECHA
                </th>
                <th className="py-2.5 px-3 border-r border-blue-700/60 min-w-[75px]">
                  HORA
                </th>
                <th className="py-2.5 px-3 border-r border-blue-700/60 min-w-[120px]">
                  OBSERV. CANCHA
                </th>
                <th className="py-2.5 px-3 border-r border-blue-700/60 text-left min-w-[160px]">
                  OBSERVACIONES
                </th>
                <th className="py-2.5 px-2 text-center min-w-[70px] no-print">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                    No se encontraron partidos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => {
                  const isConditional =
                    m.esCondicional || m.observaciones.toLowerCase().includes('necesario');
                  const rowBg = isConditional ? 'bg-[#fff59d]/80 hover:bg-[#fff176]/90' : 'hover:bg-slate-50';
                  const isSomisaLocal = m.local.toLowerCase().includes('somisa');

                  return (
                    <tr key={m.id} className={`${rowBg} transition-colors border-b border-slate-200`}>
                      {/* Categoría */}
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                        {m.categoria}
                      </td>

                      {/* Rama */}
                      <td className="py-2 px-2 border-r border-slate-200 text-center font-medium text-slate-700 whitespace-nowrap">
                        {m.rama}
                      </td>

                      {/* Local */}
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold whitespace-nowrap text-slate-800">
                        {isSomisaLocal ? (
                          <span className="text-blue-800 font-bold underline decoration-blue-300 decoration-1 underline-offset-2">
                            {m.local}
                          </span>
                        ) : (
                          m.local
                        )}
                      </td>

                      {/* Visitante */}
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold whitespace-nowrap text-slate-800">
                        {!isSomisaLocal ? (
                          <span className="text-blue-800 font-bold underline decoration-blue-300 decoration-1 underline-offset-2">
                            {m.visitante}
                          </span>
                        ) : (
                          m.visitante
                        )}
                      </td>

                      {/* Fecha (Inline editable) */}
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono tabular-nums whitespace-nowrap">
                        {editingCell?.id === m.id && editingCell?.field === 'fecha' ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="DD/MM/YYYY"
                              className="w-24 text-center px-1.5 py-0.5 border border-blue-500 rounded bg-white text-xs font-mono"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(m);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(m)}
                              className="p-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleStartEdit(m, 'fecha', m.fecha)}
                            className="cursor-pointer hover:bg-blue-100/60 px-1.5 py-0.5 rounded transition-colors text-slate-900"
                            title="Haz clic para editar fecha"
                          >
                            {m.fecha || (
                              <span className="text-amber-700 font-semibold italic">A coordinar</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Hora (Inline editable) */}
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono tabular-nums font-bold whitespace-nowrap">
                        {editingCell?.id === m.id && editingCell?.field === 'hora' ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="HH:MM"
                              className="w-16 text-center px-1.5 py-0.5 border border-blue-500 rounded bg-white text-xs font-mono"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(m);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(m)}
                              className="p-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleStartEdit(m, 'hora', m.hora)}
                            className="cursor-pointer hover:bg-blue-100/60 px-1.5 py-0.5 rounded transition-colors text-slate-900"
                            title="Haz clic para editar horario"
                          >
                            {m.hora || (
                              <span className="text-amber-700 font-normal italic">--:--</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Observación Cancha (Red text if set, as in sample) */}
                      <td className="py-2 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                        {editingCell?.id === m.id && editingCell?.field === 'observCancha' ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Ej: Gim 2"
                              className="w-24 text-center px-1.5 py-0.5 border border-blue-500 rounded bg-white text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(m);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(m)}
                              className="p-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleStartEdit(m, 'observCancha', m.observCancha)}
                            className={`cursor-pointer hover:bg-blue-100/60 px-1.5 py-0.5 rounded transition-colors font-bold ${
                              m.observCancha ? 'text-red-600' : 'text-slate-400 font-normal'
                            }`}
                            title="Haz clic para editar observación de cancha"
                          >
                            {m.observCancha || '-'}
                          </span>
                        )}
                      </td>

                      {/* Observaciones (Red text if alert/promo, as in sample) */}
                      <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">
                        {editingCell?.id === m.id && editingCell?.field === 'observaciones' ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Observación"
                              className="w-36 px-1.5 py-0.5 border border-blue-500 rounded bg-white text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(m);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(m)}
                              className="p-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleStartEdit(m, 'observaciones', m.observaciones)}
                            className={`cursor-pointer hover:bg-blue-100/60 px-1.5 py-0.5 rounded transition-colors font-bold ${
                              m.observaciones ? 'text-red-600' : 'text-slate-400 font-normal'
                            }`}
                            title="Haz clic para editar observaciones"
                          >
                            {m.observaciones || '-'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center gap-1">
                          {m.fecha && m.hora && (
                            <a
                              href={getGoogleCalendarUrl(m)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Añadir a Google Calendar"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => onSelectForEdit(m)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Editar completo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteMatch(m.id)}
                            className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar partido"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footnote */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#fff59d] border border-amber-300 inline-block rounded-xs"></span>
              Fila Amarilla: J3 Play-off / Si es necesario
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-red-600 font-bold">Rojo:</span>
              Gim 2, Promo, Finales y Amistosos
            </span>
          </div>
          <div>
            Mostrando <strong className="text-slate-800 tabular-nums">{filteredMatches.length}</strong> de{' '}
            <strong className="text-slate-800 tabular-nums">{matches.length}</strong> partidos
          </div>
        </div>
      </div>
    </div>
  );
};
