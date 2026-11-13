import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OfficialSheetTable } from './components/OfficialSheetTable';
import { ScheduleCoordinator } from './components/ScheduleCoordinator';
import { CoachNotifications } from './components/CoachNotifications';
import { ParentsMessages } from './components/ParentsMessages';
import { EmailToClubs } from './components/EmailToClubs';
import { MesaDeControl } from './components/MesaDeControl';
import { UploadSheetModal, UploadSection } from './components/UploadSheetModal';
import { ExportModal } from './components/ExportModal';
import { MatchEditModal } from './components/MatchEditModal';
import { INITIAL_MATCHES, RIVAL_CLUBS, COACHES } from './data/initialData';
import { Match, ClubContact, Coach } from './types/fixture';
import { detectFixtureConflicts } from './utils/conflictDetector';
import { SOMISA_CREST_URL } from './utils/assets';
import { AlertTriangle, Sparkles, Calendar, Users, Send, CheckCircle2 } from 'lucide-react';

const STAFF_CACHE_VERSION = 'v2_diego_lucas_naza_franco_juan_ruso';

export default function App() {
  // State with localStorage persistence & cache versioning
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const version = localStorage.getItem('somisa_cache_version');
      if (version === STAFF_CACHE_VERSION) {
        const saved = localStorage.getItem('somisa_basquet_matches');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading matches from storage:', e);
    }
    return INITIAL_MATCHES;
  });

  const [rivalClubs, setRivalClubs] = useState<ClubContact[]>(() => {
    try {
      const saved = localStorage.getItem('somisa_basquet_clubs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return RIVAL_CLUBS;
  });

  const [coaches, setCoaches] = useState<Coach[]>(() => {
    try {
      const version = localStorage.getItem('somisa_cache_version');
      if (version === STAFF_CACHE_VERSION) {
        const saved = localStorage.getItem('somisa_basquet_coaches');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    // Initialize with current updated staff
    try {
      localStorage.setItem('somisa_cache_version', STAFF_CACHE_VERSION);
      localStorage.setItem('somisa_basquet_coaches', JSON.stringify(COACHES));
      localStorage.setItem('somisa_basquet_matches', JSON.stringify(INITIAL_MATCHES));
    } catch (e) {}
    return COACHES;
  });

  const [annualFixture, setAnnualFixture] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem('somisa_annual_fixture');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading annual fixture from storage:', e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'planilla' | 'coordinador' | 'entrenadores' | 'padres' | 'clubes' | 'mesa'>('planilla');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialSection, setUploadInitialSection] = useState<UploadSection>('semanal');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isNewMatch, setIsNewMatch] = useState(false);

  const handleOpenUpload = (section: UploadSection = 'semanal') => {
    setUploadInitialSection(section);
    setIsUploadOpen(true);
  };

  // Save matches to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('somisa_basquet_matches', JSON.stringify(matches));
    } catch (e) {
      console.error('Error saving matches:', e);
    }
  }, [matches]);

  // Save coaches to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('somisa_basquet_coaches', JSON.stringify(coaches));
    } catch (e) {}
  }, [coaches]);

  // Save annual fixture to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('somisa_annual_fixture', JSON.stringify(annualFixture));
    } catch (e) {
      console.error('Error saving annual fixture:', e);
    }
  }, [annualFixture]);

  // Real-time conflict analysis
  const conflicts = detectFixtureConflicts(matches);

  // Match mutations
  const handleUpdateMatch = (updated: Match) => {
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleDeleteMatch = (id: string) => {
    if (window.confirm('¿Deseas eliminar este partido de la planilla?')) {
      setMatches((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleAddMatch = () => {
    setEditingMatch(null);
    setIsNewMatch(true);
    setIsEditModalOpen(true);
  };

  const handleSelectForEdit = (match: Match) => {
    setEditingMatch(match);
    setIsNewMatch(false);
    setIsEditModalOpen(true);
  };

  const handleSaveModalMatch = (match: Match) => {
    if (isNewMatch) {
      setMatches((prev) => [match, ...prev]);
    } else {
      setMatches((prev) => prev.map((m) => (m.id === match.id ? match : m)));
    }
  };

  const handleMatchesLoaded = (newMatches: Match[], mode: 'replace' | 'append' = 'replace') => {
    if (mode === 'append') {
      setMatches((prev) => [...prev, ...newMatches]);
    } else {
      setMatches(newMatches);
    }
  };

  const handleSaveAnnualFixture = (newMatches: Match[], mode: 'replace' | 'append' = 'replace') => {
    const now = Date.now();
    const withIds = newMatches.map((m, idx) => ({
      ...m,
      id: m.id && mode === 'replace' ? `${m.id}-anual-${idx}` : `anual-${now}-${idx}`,
    }));
    if (mode === 'append') {
      setAnnualFixture((prev) => [...prev, ...withIds]);
    } else {
      setAnnualFixture(withIds);
    }
  };

  const handleClearAnnualFixture = () => {
    setAnnualFixture([]);
  };

  // KPI calculations
  const totalCount = matches.length;
  const somisaHomeCount = matches.filter((m) => m.local.toLowerCase().includes('somisa')).length;
  const somisaAwayCount = matches.filter((m) => m.visitante.toLowerCase().includes('somisa')).length;
  const confirmedCount = matches.filter((m) => m.fecha && m.hora).length;
  const pendingCount = matches.filter((m) => !m.fecha || !m.hora).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => handleOpenUpload(annualFixture.length === 0 ? 'anual' : 'semanal')}
        onOpenPdf={() => setIsExportOpen(true)}
        conflictCount={conflicts.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 no-print">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 text-[11px] font-semibold block">Total Encuentros</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">{totalCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Torneo oficial ABSN</span>
          </div>

          <button 
            onClick={() => setActiveTab('mesa')}
            className={`text-left p-3 rounded-xl border transition-all shadow-2xs group cursor-pointer ${
              activeTab === 'mesa' ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-600/20' : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-semibold block">SOMISA Local</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded group-hover:bg-blue-700 group-hover:text-white transition-colors">
                Mesa WA ➔
              </span>
            </div>
            <span className="text-xl font-extrabold text-blue-700 font-mono tabular-nums">{somisaHomeCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Gim. Principal y Gim 2</span>
          </button>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 text-[11px] font-semibold block">SOMISA Visitante</span>
            <span className="text-xl font-extrabold text-slate-700 font-mono tabular-nums">{somisaAwayCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Canchas rivales</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-500 text-[11px] font-semibold block">Confirmados</span>
            <span className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">{confirmedCount}</span>
            <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">Con día y hora fija</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-slate-500 text-[11px] font-semibold block">Pendientes de Horario</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono tabular-nums">{pendingCount}</span>
            <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
              {pendingCount > 0 ? 'A coordinar fecha/hora' : 'Todo al día'}
            </span>
          </div>
        </section>

        {/* View Switcher Tabs */}
        {activeTab === 'planilla' && (
          <OfficialSheetTable
            matches={matches}
            onUpdateMatch={handleUpdateMatch}
            onDeleteMatch={handleDeleteMatch}
            onAddMatch={handleAddMatch}
            onSelectForEdit={handleSelectForEdit}
            onNavigateToMesa={() => setActiveTab('mesa')}
            onOpenAnnualUpload={() => handleOpenUpload('anual')}
            onOpenWeeklyUpload={() => handleOpenUpload('semanal')}
            annualCount={annualFixture.length}
          />
        )}

        {activeTab === 'mesa' && (
          <MesaDeControl matches={matches} />
        )}

        {activeTab === 'coordinador' && (
          <ScheduleCoordinator
            matches={matches}
            onUpdateMatch={handleUpdateMatch}
            conflicts={conflicts}
          />
        )}

        {activeTab === 'entrenadores' && (
          <CoachNotifications
            matches={matches}
            coaches={coaches}
            onUpdateCoaches={(newCoaches) => {
              setCoaches(newCoaches);
              try {
                localStorage.setItem('somisa_basquet_coaches', JSON.stringify(newCoaches));
              } catch (e) {}
            }}
            onUpdateMatchesCoachName={(oldName, newName) => {
              setMatches((prev) =>
                prev.map((m) =>
                  m.entrenador === oldName ? { ...m, entrenador: newName } : m
                )
              );
            }}
          />
        )}

        {activeTab === 'padres' && (
          <ParentsMessages
            matches={matches}
          />
        )}

        {activeTab === 'clubes' && (
          <EmailToClubs
            matches={matches}
            rivalClubs={rivalClubs}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo SOMISA"
              className="w-7 h-7 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-extrabold text-slate-800">CLUB SOMISA</span>
            <span>·</span>
            <span>Subcomisión de Básquetbol Formativas y Mini</span>
            <span>·</span>
            <span>San Nicolás de los Arroyos</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            SOMISA (A y B) es siempre nuestro equipo · Sincronización oficial
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadSheetModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        initialSection={uploadInitialSection}
        onMatchesLoaded={handleMatchesLoaded}
        currentMatchCount={matches.length}
        currentMatches={matches}
        annualFixture={annualFixture}
        onSaveAnnualFixture={handleSaveAnnualFixture}
        onClearAnnualFixture={handleClearAnnualFixture}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        matches={matches}
        rivalClubs={rivalClubs}
      />

      <MatchEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        match={editingMatch}
        onSave={handleSaveModalMatch}
        isNew={isNewMatch}
        coaches={coaches}
      />
    </div>
  );
}
