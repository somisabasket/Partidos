import React, { useState } from 'react';
import { X, FileText, Calendar, Printer, Download, Check, Sparkles, Filter } from 'lucide-react';
import { Match, ClubContact } from '../types/fixture';
import { exportOfficialSheetPdf } from '../utils/pdfExport';
import { downloadIcsCalendar } from '../utils/calendarExport';
import { SOMISA_CREST_URL } from '../utils/assets';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  rivalClubs: ClubContact[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  matches,
  rivalClubs,
}) => {
  const [filterScope, setFilterScope] = useState<'todos' | 'somisa' | 'confirmados' | 'rival'>('todos');
  const [selectedRival, setSelectedRival] = useState<string>(rivalClubs[0]?.nombre || '');
  const [customTitle, setCustomTitle] = useState('CLUB SOMISA - PLANILLA OFICIAL DE PARTIDOS');

  if (!isOpen) return null;

  // Filter based on scope
  const getExportMatches = (): Match[] => {
    if (filterScope === 'somisa') {
      return matches.filter(
        (m) => m.local.toLowerCase().includes('somisa') || m.visitante.toLowerCase().includes('somisa')
      );
    }
    if (filterScope === 'confirmados') {
      return matches.filter((m) => m.fecha && m.hora);
    }
    if (filterScope === 'rival' && selectedRival) {
      return matches.filter(
        (m) =>
          m.local.toLowerCase().includes(selectedRival.toLowerCase()) ||
          m.visitante.toLowerCase().includes(selectedRival.toLowerCase())
      );
    }
    return matches;
  };

  const matchesToExport = getExportMatches();

  const handleDownloadPdf = () => {
    let titleToUse = customTitle;
    if (filterScope === 'rival') {
      titleToUse = `CLUB SOMISA vs ${selectedRival.toUpperCase()} - PROGRAMACIÓN`;
    }
    exportOfficialSheetPdf(matchesToExport, titleToUse);
  };

  const handleDownloadIcs = () => {
    const filename = filterScope === 'rival'
      ? `SOMISA_vs_${selectedRival.replace(/\s+/g, '_')}_Calendario.ics`
      : 'SOMISA_Basquet_Calendario.ics';
    downloadIcsCalendar(matchesToExport, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo SOMISA"
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Exportar Cronograma Oficial y Calendario
              </h2>
              <p className="text-xs text-slate-500">
                Documento oficial del Club SOMISA con escudo, grilla reglamentaria y archivo ICS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Scope Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              1. Seleccionar partidos a incluir:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilterScope('todos')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  filterScope === 'todos'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>Planilla Completa</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Todos los {matches.length} partidos
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterScope('confirmados')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  filterScope === 'confirmados'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>Solo Confirmados</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Con fecha y hora fijada
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterScope('somisa')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  filterScope === 'somisa'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>Solo Partidos SOMISA</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Somisa A, B y Formativas
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterScope('rival')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  filterScope === 'rival'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>Por Club Rival</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Tira contra club específico
                </div>
              </button>
            </div>
          </div>

          {filterScope === 'rival' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Seleccionar Club Rival:
              </label>
              <select
                value={selectedRival}
                onChange={(e) => setSelectedRival(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
              >
                {rivalClubs.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre} ({c.delegado})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title Header Customizer */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Título en el encabezado del documento:
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-slate-600">
              Partidos seleccionados para exportar:
            </span>
            <span className="font-extrabold text-blue-800 text-sm font-mono tabular-nums">
              {matchesToExport.length} partidos
            </span>
          </div>

          {/* Action options */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleDownloadPdf}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              Descargar Planilla Oficial en PDF (.pdf)
            </button>

            <button
              onClick={handleDownloadIcs}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              Descargar Calendario Sincronizado (.ics)
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Abrir Vista de Impresión del Navegador
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
