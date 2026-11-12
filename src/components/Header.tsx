import React from 'react';
import { Calendar, FileSpreadsheet, Send, Users, ShieldAlert, Sparkles, Printer, ClipboardList } from 'lucide-react';
import { SOMISA_CREST_URL } from '../utils/assets';

interface HeaderProps {
  activeTab: 'planilla' | 'coordinador' | 'entrenadores' | 'padres' | 'clubes' | 'mesa';
  setActiveTab: (tab: 'planilla' | 'coordinador' | 'entrenadores' | 'padres' | 'clubes' | 'mesa') => void;
  onOpenUpload: () => void;
  onOpenPdf: () => void;
  conflictCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenPdf,
  conflictCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 md:gap-8 h-16">
          {/* Zone 1: Single Brand wordmark with official crest */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo Club SOMISA"
              className="w-10 h-10 object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('planilla');
              }}
              className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap"
            >
              SOMISA BÁSQUET
            </a>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('planilla')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'planilla'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
              Planilla Oficial
            </button>

            <button
              onClick={() => setActiveTab('mesa')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'mesa'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-blue-700" />
              <span>Mesa de Control</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                Local
              </span>
            </button>

            <button
              onClick={() => setActiveTab('coordinador')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'coordinador'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Coordinar Horarios
              {conflictCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 tabular-nums">
                  {conflictCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('entrenadores')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'entrenadores'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
              Notif. Entrenadores
            </button>

            <button
              onClick={() => setActiveTab('padres')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'padres'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-700" />
              Mensajes Familias
            </button>

            <button
              onClick={() => setActiveTab('clubes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'clubes'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-blue-700" />
              Enviar a Clubes
            </button>
          </nav>

          {/* Zone 3: Primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenUpload}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              title="Subir foto o archivo de planilla"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden sm:inline">Subir Planilla / IA</span>
              <span className="sm:hidden">Subir</span>
            </button>

            <button
              onClick={onOpenPdf}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exportar PDF / ICS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden border-t border-slate-100 flex overflow-x-auto px-2 py-1.5 gap-1 bg-slate-50 text-xs">
        <button
          onClick={() => setActiveTab('planilla')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'planilla' ? 'bg-blue-700 text-white' : 'text-slate-700'
          }`}
        >
          Planilla
        </button>
        <button
          onClick={() => setActiveTab('mesa')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'mesa' ? 'bg-blue-700 text-white' : 'text-slate-700'
          }`}
        >
          Mesa Control (Local)
        </button>
        <button
          onClick={() => setActiveTab('coordinador')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'coordinador' ? 'bg-blue-700 text-white' : 'text-slate-700'
          }`}
        >
          Horarios {conflictCount > 0 ? `(${conflictCount})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('entrenadores')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'entrenadores' ? 'bg-blue-700 text-white' : 'text-slate-700'
          }`}
        >
          Entrenadores
        </button>
        <button
          onClick={() => setActiveTab('padres')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'padres' ? 'bg-blue-700 text-white' : 'text-slate-700'
          }`}
        >
          Padres
        </button>
        <button
          onClick={() => setActiveTab('clubes')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'clubes' ? 'bg-blue-700 text-white' : 'text-slate-700'
          }`}
        >
          Clubes
        </button>
      </div>
    </header>
  );
};
