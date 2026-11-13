import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Image,
  AlignLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Download,
  Calendar,
  CalendarDays,
  CalendarRange,
  Search,
  Filter,
  Trash2,
  CheckSquare,
  Square,
  ArrowRight,
  Database,
  Upload,
} from 'lucide-react';
import { Match } from '../types/fixture';
import { INITIAL_MATCHES } from '../data/initialData';
import { SAMPLE_SHEET_IMG_URL, SOMISA_CREST_URL } from '../utils/assets';
import { parseExcelFixture, downloadSampleExcelTemplate } from '../utils/excelParser';

export type UploadSection = 'anual' | 'semanal';

interface UploadSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: UploadSection;
  onMatchesLoaded: (newMatches: Match[], mode: 'replace' | 'append') => void;
  currentMatchCount: number;
  currentMatches: Match[];
  annualFixture: Match[];
  onSaveAnnualFixture: (newMatches: Match[], mode: 'replace' | 'append') => void;
  onClearAnnualFixture: () => void;
}

// Helper to convert DD/MM/YYYY to YYYY-MM-DD for date range comparison
const toIsoDate = (ddmmyyyy?: string): string => {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.trim().split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  if (y.length !== 4) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export const UploadSheetModal: React.FC<UploadSheetModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'semanal',
  onMatchesLoaded,
  currentMatchCount,
  currentMatches,
  annualFixture,
  onSaveAnnualFixture,
  onClearAnnualFixture,
}) => {
  // Primary split: 1. Fixture Anual vs 2. Partidos Semanales
  const [section, setSection] = useState<UploadSection>(initialSection);

  // Within 'semanal': pick from annual fixture OR direct weekly upload
  const [weeklyMode, setWeeklyMode] = useState<'from-annual' | 'direct-upload'>(
    annualFixture.length > 0 ? 'from-annual' : 'direct-upload'
  );

  // Upload source tabs (used in 'anual' or in 'semanal' -> 'direct-upload')
  const [activeTab, setActiveTab] = useState<'excel' | 'pdf' | 'image' | 'text' | 'sample'>('excel');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Staged matches for preview before confirming import
  const [previewMatches, setPreviewMatches] = useState<Match[] | null>(null);
  const [showOriginalSampleImage, setShowOriginalSampleImage] = useState(false);

  // Filters & selection for "Partidos Semanales desde Fixture Anual"
  const [selectedJornada, setSelectedJornada] = useState<string>('todas');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchAnnual, setSearchAnnual] = useState<string>('');
  const [onlySomisa, setOnlySomisa] = useState<boolean>(true);
  const [selectedAnnualIds, setSelectedAnnualIds] = useState<Set<string>>(new Set());
  const [weeklyLoadMode, setWeeklyLoadMode] = useState<'replace' | 'append'>('replace');

  // Reset modal transient states on open
  useEffect(() => {
    if (isOpen) {
      setSection(initialSection);
      setWeeklyMode(annualFixture.length > 0 ? 'from-annual' : 'from-annual');
      setErrorMessage(null);
      setSuccessMessage(null);
      setPreviewMatches(null);
      setSelectedFile(null);
      setImagePreview(null);
    }
  }, [isOpen, initialSection]);

  // Unique jornadas and categories from annualFixture
  const uniqueJornadas = useMemo(() => {
    const set = new Set<string>();
    annualFixture.forEach((m) => {
      if (m.jornada && m.jornada.trim()) set.add(m.jornada.trim());
    });
    return Array.from(set);
  }, [annualFixture]);

  const uniqueAnnualCategories = useMemo(() => {
    const set = new Set<string>();
    annualFixture.forEach((m) => {
      if (m.categoria && m.categoria.trim()) set.add(m.categoria.trim());
    });
    return Array.from(set).sort();
  }, [annualFixture]);

  const uniqueAnnualDates = useMemo(() => {
    const set = new Set<string>();
    annualFixture.forEach((m) => {
      if (m.fecha && m.fecha.trim()) set.add(m.fecha.trim());
    });
    return Array.from(set).sort((a, b) => toIsoDate(a).localeCompare(toIsoDate(b)));
  }, [annualFixture]);

  // Filtered annual matches
  const filteredAnnualMatches = useMemo(() => {
    return annualFixture.filter((m) => {
      if (onlySomisa) {
        const isSomisa =
          m.local.toLowerCase().includes('somisa') ||
          m.visitante.toLowerCase().includes('somisa');
        if (!isSomisa) return false;
      }
      if (selectedJornada !== 'todas' && (m.jornada || '').trim() !== selectedJornada) {
        return false;
      }
      if (selectedCategoria !== 'todas' && m.categoria !== selectedCategoria) {
        return false;
      }
      if (dateFrom || dateTo) {
        const iso = toIsoDate(m.fecha);
        if (!iso) return false;
        if (dateFrom && iso < dateFrom) return false;
        if (dateTo && iso > dateTo) return false;
      }
      if (searchAnnual.trim()) {
        const q = searchAnnual.toLowerCase();
        const hay = `${m.categoria} ${m.rama} ${m.local} ${m.visitante} ${m.fecha} ${m.jornada || ''} ${m.observaciones}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [annualFixture, onlySomisa, selectedJornada, selectedCategoria, dateFrom, dateTo, searchAnnual]);

  if (!isOpen) return null;

  const resetUploadState = () => {
    setPreviewMatches(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Handle Excel file selection
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setSelectedFile(file);
    resetUploadState();
    setIsProcessing(true);

    try {
      const parsed = await parseExcelFixture(file);
      if (parsed.length === 0) {
        throw new Error(
          'No se detectaron partidos válidos en el archivo Excel. Asegúrate de incluir columnas como CATEGORIA, LOCAL y VISITANTE.'
        );
      }
      setPreviewMatches(parsed);
      setSuccessMessage(
        `Se detectaron ${parsed.length} partidos en el archivo Excel listos para ${
          section === 'anual' ? 'guardar en el Fixture Anual' : 'cargar como Partidos Semanales'
        }.`
      );
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setErrorMessage(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle PDF or Image file selection
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setSelectedFile(file);
    resetUploadState();

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Process PDF, Image, or Text via backend
  const handleProcessWithGemini = async () => {
    if (!selectedFile && activeTab !== 'text') {
      setErrorMessage('Por favor seleccione un archivo para analizar.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPreviewMatches(null);

    try {
      let bodyData: any = {};

      if (activeTab === 'text') {
        if (!rawText.trim()) {
          throw new Error('Por favor ingrese el texto de la tabla o fixture para procesar.');
        }
        bodyData = { textData: rawText };
      } else if (selectedFile) {
        const base64Data = await fileToBase64(selectedFile);
        bodyData = {
          imageBase64: base64Data,
          mimeType: selectedFile.type || (activeTab === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        };
      }

      const res = await fetch('/api/parse-fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'El servidor de lectura inteligente por IA no está disponible en el modo estático (GitHub Pages). Podés importar el fixture al instante usando un archivo Excel (.xlsx / .csv) o ingresar desde la versión completa en la nube.'
        );
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el fixture con el servidor.');
      }

      if (!data.matches || data.matches.length === 0) {
        throw new Error(
          'La IA no pudo detectar partidos en el documento. Verifique que la imagen o PDF sea legible.'
        );
      }

      setPreviewMatches(data.matches);
      setSuccessMessage(
        `¡Extracción exitosa! Se identificaron ${data.matches.length} partidos listos para ${
          section === 'anual' ? 'el Fixture Anual' : 'los Partidos Semanales'
        }.`
      );
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error en la conexión o procesamiento del archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save staged preview into Annual Fixture (and optionally jump to weekly picker)
  const handleConfirmAnnualImport = (goToWeeklyAfter: boolean) => {
    if (!previewMatches || previewMatches.length === 0) return;
    onSaveAnnualFixture(previewMatches, importMode);

    if (goToWeeklyAfter) {
      setPreviewMatches(null);
      setSelectedFile(null);
      setImagePreview(null);
      setErrorMessage(null);
      setSuccessMessage(
        `Fixture Anual actualizado con ${previewMatches.length} partidos. Ahora seleccioná los partidos de esta semana:`
      );
      setSection('semanal');
      setWeeklyMode('from-annual');
      setSelectedAnnualIds(new Set());
    } else {
      onClose();
    }
  };

  // Save staged preview directly into Weekly Matches
  const handleConfirmDirectWeeklyImport = () => {
    if (!previewMatches || previewMatches.length === 0) return;
    onMatchesLoaded(previewMatches, importMode);
    onClose();
  };

  // Sample loader
  const handleLoadSample = (mode: 'replace' | 'append') => {
    if (section === 'anual') {
      onSaveAnnualFixture(INITIAL_MATCHES, mode);
      setSuccessMessage(
        `Muestra oficial (27 partidos) guardada como Fixture Anual. Ahora podés elegir los partidos semanales.`
      );
      setSection('semanal');
      setWeeklyMode('from-annual');
    } else {
      onMatchesLoaded(INITIAL_MATCHES, mode);
      onClose();
    }
  };

  // Annual selection helpers
  const toggleAnnualMatch = (id: string) => {
    setSelectedAnnualIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFilteredAnnual = () => {
    setSelectedAnnualIds((prev) => {
      const next = new Set(prev);
      filteredAnnualMatches.forEach((m) => next.add(m.id));
      return next;
    });
  };

  const deselectAllAnnual = () => {
    setSelectedAnnualIds(new Set());
  };

  const selectQuickJornada = (jornadaName: string) => {
    setSelectedJornada(jornadaName);
    const matchesInJornada = annualFixture.filter((m) => {
      if (onlySomisa) {
        const isSomisa =
          m.local.toLowerCase().includes('somisa') ||
          m.visitante.toLowerCase().includes('somisa');
        if (!isSomisa) return false;
      }
      return (m.jornada || '').trim() === jornadaName;
    });
    setSelectedAnnualIds(new Set(matchesInJornada.map((m) => m.id)));
  };

  const handleLoadSelectedFromAnnual = () => {
    const picked = annualFixture.filter((m) => selectedAnnualIds.has(m.id));
    if (picked.length === 0) return;

    const now = Date.now();
    const clonedForWeek: Match[] = picked.map((m, idx) => ({
      ...m,
      id: `match-sem-${now}-${idx}`,
    }));

    onMatchesLoaded(clonedForWeek, weeklyLoadMode);
    onClose();
  };

  const showUploaderBody =
    section === 'anual' || (section === 'semanal' && weeklyMode === 'direct-upload');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo SOMISA"
              className="w-9 h-9 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Gestión de Importación: Fixture Anual y Partidos Semanales
              </h2>
              <p className="text-xs text-slate-500">
                Paso 1: Guardá el fixture anual/semestral completo · Paso 2: Elegí los partidos de cada semana.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRIMARY SPLIT SWITCHER: FIXTURE ANUAL vs PARTIDOS SEMANALES */}
        <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSection('anual');
              resetUploadState();
            }}
            className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
              section === 'anual'
                ? 'bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                : 'bg-white/70 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  section === 'anual'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900">
                  1. Fixture Anual / Semestral
                </div>
                <div className="text-[11px] text-slate-500">
                  Importar el calendario completo (PDF o Excel)
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono shrink-0 ${
                annualFixture.length > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {annualFixture.length} base
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSection('semanal');
              resetUploadState();
            }}
            className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
              section === 'semanal'
                ? 'bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                : 'bg-white/70 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  section === 'semanal'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900">
                  2. Partidos Semanales
                </div>
                <div className="text-[11px] text-slate-500">
                  Elegir fechas del Fixture Anual o subir tira semanal
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-blue-100 text-blue-800 shrink-0">
              {currentMatchCount} activos
            </span>
          </button>
        </div>

        {/* SUB-NAVIGATOR FOR PARTIDOS SEMANALES */}
        {section === 'semanal' && (
          <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setWeeklyMode('from-annual');
                  resetUploadState();
                }}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  weeklyMode === 'from-annual'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Elegir del Fixture Anual ({annualFixture.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWeeklyMode('direct-upload');
                  resetUploadState();
                }}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  weeklyMode === 'direct-upload'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Planilla Semanal Directa</span>
              </button>
            </div>
          </div>
        )}

        {/* ANNUAL FIXTURE STATUS BAR WHEN IN SECTION ANUAL */}
        {section === 'anual' && annualFixture.length > 0 && (
          <div className="px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Tenés guardado un <strong>Fixture Anual base</strong> con{' '}
                <strong className="font-mono">{annualFixture.length} partidos</strong>
                {uniqueJornadas.length > 0 && ` (${uniqueJornadas.length} jornadas)`}.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSection('semanal');
                  setWeeklyMode('from-annual');
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg flex items-center gap-1"
              >
                <span>Elegir Partidos Semanales</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Vaciar el Fixture Anual guardado? No borra tu planilla semanal actual.')) {
                    onClearAnnualFixture();
                  }
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Vaciar base</span>
              </button>
            </div>
          </div>
        )}

        {/* SOURCE TABS WHEN SHOWING UPLOADER (Anual OR Direct Weekly) */}
        {showUploaderBody && (
          <div className="px-6 pt-3 border-b border-slate-100 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('excel');
                  resetUploadState();
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'excel'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel / CSV (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('pdf');
                  resetUploadState();
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'pdf'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Documento PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('image');
                  resetUploadState();
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'image'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Foto / Imagen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('text');
                  resetUploadState();
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'text'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
                <span>Pegar Texto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('sample');
                  resetUploadState();
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'sample'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muestra Oficial (27)</span>
              </button>
            </div>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* ========================================================== */}
          {/* VIEW A: PICK WEEKLY MATCHES FROM SAVED ANNUAL FIXTURE       */}
          {/* ========================================================== */}
          {section === 'semanal' && weeklyMode === 'from-annual' && (
            <div className="space-y-4">
              {annualFixture.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Todavía no cargaste un Fixture Anual o Semestral
                    </h3>
                    <p className="text-xs text-slate-500">
                      Importá primero el fixture completo del torneo (en PDF o Excel) en el paso 1 para poder seleccionar acá los partidos de cada semana.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSection('anual')}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>1. Importar Fixture Anual (PDF o Excel)</span>
                    </button>

                    {currentMatches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveAnnualFixture(currentMatches, 'replace');
                          setSuccessMessage(
                            `Se guardaron los ${currentMatches.length} partidos actuales como tu Fixture Anual base.`
                          );
                        }}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl"
                      >
                        Guardar planilla actual ({currentMatches.length}) como Fixture Anual
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setWeeklyMode('direct-upload')}
                      className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl"
                    >
                      Subir tira semanal directa
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Quick Jornada chips if available */}
                  {uniqueJornadas.length > 0 && (
                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-900">
                          Selección rápida por Jornada / Fecha del Torneo:
                        </span>
                        <span className="text-[11px] text-blue-700">
                          Hacé clic en una jornada para filtrarla y tildarla automáticamente
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedJornada('todas')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                            selectedJornada === 'todas'
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          Todas
                        </button>
                        {uniqueJornadas.map((j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => selectQuickJornada(j)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                              selectedJornada === j
                                ? 'bg-blue-700 text-white border-blue-700'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            {j}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Desde Fecha
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Hasta Fecha
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Categoría
                      </label>
                      <select
                        value={selectedCategoria}
                        onChange={(e) => setSelectedCategoria(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="todas">Todas</option>
                        {uniqueAnnualCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Buscar rival / jornada / fecha
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            value={searchAnnual}
                            onChange={(e) => setSearchAnnual(e.target.value)}
                            placeholder="Ej: Regatas, 14/11, U15..."
                            className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer whitespace-nowrap font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={onlySomisa}
                            onChange={(e) => setOnlySomisa(e.target.checked)}
                            className="text-blue-600 rounded"
                          />
                          <span>Solo SOMISA</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Quick dates jump if dates exist */}
                  {uniqueAnnualDates.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                      <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Fechas en fixture:
                      </span>
                      {uniqueAnnualDates.slice(0, 12).map((d) => {
                        const iso = toIsoDate(d);
                        const isActive = dateFrom === iso && dateTo === iso;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              if (isActive) {
                                setDateFrom('');
                                setDateTo('');
                              } else {
                                setDateFrom(iso);
                                setDateTo(iso);
                              }
                            }}
                            className={`px-2 py-0.5 rounded font-mono shrink-0 border transition-colors ${
                              isActive
                                ? 'bg-blue-700 text-white border-blue-700'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                      {(dateFrom || dateTo || selectedJornada !== 'todas' || selectedCategoria !== 'todas' || searchAnnual) && (
                        <button
                          type="button"
                          onClick={() => {
                            setDateFrom('');
                            setDateTo('');
                            setSelectedJornada('todas');
                            setSelectedCategoria('todas');
                            setSearchAnnual('');
                          }}
                          className="px-2 py-0.5 text-red-600 hover:underline shrink-0 font-semibold"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  )}

                  {/* Selection toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllFilteredAnnual}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-200 flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Seleccionar filtrados ({filteredAnnualMatches.length})</span>
                      </button>

                      {selectedAnnualIds.size > 0 && (
                        <button
                          type="button"
                          onClick={deselectAllAnnual}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Limpiar selección ({selectedAnnualIds.size})</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="weeklyLoadMode"
                          checked={weeklyLoadMode === 'replace'}
                          onChange={() => setWeeklyLoadMode('replace')}
                          className="text-blue-600"
                        />
                        <span>Reemplazar semana actual</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="weeklyLoadMode"
                          checked={weeklyLoadMode === 'append'}
                          onChange={() => setWeeklyLoadMode('append')}
                          className="text-blue-600"
                        />
                        <span>Sumar a la semana</span>
                      </label>
                    </div>
                  </div>

                  {/* Interactive Table from Annual Fixture */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-2.5 w-8 text-center">Sel</th>
                          <th className="py-2 px-2">Jornada</th>
                          <th className="py-2 px-2">Categoría</th>
                          <th className="py-2 px-2">Rama</th>
                          <th className="py-2 px-2">Local</th>
                          <th className="py-2 px-2">Visitante</th>
                          <th className="py-2 px-2">Fecha</th>
                          <th className="py-2 px-2">Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAnnualMatches.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500">
                              No hay partidos en el Fixture Anual que coincidan con los filtros actuales.
                            </td>
                          </tr>
                        ) : (
                          filteredAnnualMatches.map((m) => {
                            const isChecked = selectedAnnualIds.has(m.id);
                            return (
                              <tr
                                key={m.id}
                                onClick={() => toggleAnnualMatch(m.id)}
                                className={`cursor-pointer transition-colors ${
                                  isChecked ? 'bg-blue-50/90 hover:bg-blue-100/70' : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="py-2 px-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded text-blue-600 pointer-events-none"
                                  />
                                </td>
                                <td className="py-2 px-2 text-slate-500 font-medium whitespace-nowrap">
                                  {m.jornada || '-'}
                                </td>
                                <td className="py-2 px-2 font-bold text-slate-900 whitespace-nowrap">
                                  {m.categoria}
                                </td>
                                <td className="py-2 px-2 text-slate-600">{m.rama}</td>
                                <td
                                  className={`py-2 px-2 whitespace-nowrap ${
                                    m.local.toLowerCase().includes('somisa')
                                      ? 'font-bold text-blue-800'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {m.local}
                                </td>
                                <td
                                  className={`py-2 px-2 whitespace-nowrap ${
                                    m.visitante.toLowerCase().includes('somisa')
                                      ? 'font-bold text-blue-800'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {m.visitante}
                                </td>
                                <td className="py-2 px-2 font-mono text-[11px] whitespace-nowrap">
                                  {m.fecha || <span className="text-amber-600">A coord.</span>}
                                </td>
                                <td className="py-2 px-2 font-mono text-[11px] whitespace-nowrap">
                                  {m.hora || <span className="text-amber-600">--:--</span>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW B: UPLOADER (ANUAL OR DIRECT WEEKLY)                  */}
          {/* ========================================================== */}
          {showUploaderBody && (
            <>
              {/* TAB 1: EXCEL / CSV */}
              {activeTab === 'excel' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {section === 'anual'
                          ? 'Subir Excel del Fixture Anual / Semestral'
                          : 'Subir Planilla Excel Semanal (.xlsx, .xls, .csv)'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Procesamiento instantáneo en tu navegador. Reconoce columnas JORNADA, CATEGORIA, RAMA, LOCAL, VISITANTE, FECHA y HORA.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={downloadSampleExcelTemplate}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Descargar Plantilla</span>
                    </button>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-blue-50/30">
                    <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
                    <span className="text-sm font-bold text-slate-800">
                      {selectedFile &&
                      (selectedFile.name.endsWith('.xlsx') ||
                        selectedFile.name.endsWith('.xls') ||
                        selectedFile.name.endsWith('.csv'))
                        ? selectedFile.name
                        : 'Arrastrá tu archivo Excel o hacé clic para seleccionar'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Formatos compatibles: .xlsx, .xls, .csv
                    </span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleExcelFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* TAB 2: PDF DOCUMENT */}
              {activeTab === 'pdf' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {section === 'anual'
                        ? 'Subir PDF del Fixture Anual o Semestral'
                        : 'Subir Documento PDF de la Semana'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sube el PDF emitido por la Asociación (admite varias páginas y detecta automáticamente jornadas, categorías y cruces).
                    </p>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-blue-50/30">
                    <FileText className="w-10 h-10 text-red-600 mb-2" />
                    <span className="text-sm font-bold text-slate-800">
                      {selectedFile && selectedFile.type === 'application/pdf'
                        ? selectedFile.name
                        : 'Arrastrá tu documento PDF o hacé clic para buscar'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Documento PDF oficial de la ABSN / CAB
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleDocFileChange}
                      className="hidden"
                    />
                  </label>

                  {selectedFile && selectedFile.type === 'application/pdf' && !previewMatches && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleProcessWithGemini}
                        disabled={isProcessing}
                        className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                      >
                        <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>
                          {isProcessing
                            ? 'Analizando PDF con IA (puede demorar unos segundos)...'
                            : 'Extraer Partidos del PDF'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: IMAGE / PHOTO */}
              {activeTab === 'image' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Subir Foto o Captura de Pantalla
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sube una foto de la planilla impresa o captura de pantalla enviada por WhatsApp.
                    </p>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-blue-50/30">
                    <Image className="w-9 h-9 text-blue-600 mb-2" />
                    <span className="text-sm font-bold text-slate-800">
                      {selectedFile && selectedFile.type.startsWith('image/')
                        ? selectedFile.name
                        : 'Seleccionar foto de la planilla'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">JPG, PNG o WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDocFileChange}
                      className="hidden"
                    />
                  </label>

                  {imagePreview && (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-100 max-h-48 overflow-hidden flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="max-h-44 object-contain rounded-lg" />
                    </div>
                  )}

                  {selectedFile && selectedFile.type.startsWith('image/') && !previewMatches && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleProcessWithGemini}
                        disabled={isProcessing}
                        className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                      >
                        <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>{isProcessing ? 'Extrayendo con IA...' : 'Procesar Imagen con IA'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RAW TEXT */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pegar Texto o Tabla de Partidos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pega directamente filas copiadas de WhatsApp, Word, email o planillas de texto.
                    </p>
                  </div>

                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="JORNADA  CATEGORIA   RAMA   LOCAL   VISITANTE   FECHA   HORA   CANCHA&#10;Fecha 1  Mini (U11)  Mixto  Somisa A  Social    11/11/2026 19:30  Gim 2&#10;Fecha 1  Cadetes (U15) M    Somisa B  Don Bosco 14/11/2026 14:00"
                    rows={6}
                    className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50"
                  />

                  {rawText.trim() && !previewMatches && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleProcessWithGemini}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                      >
                        <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>{isProcessing ? 'Interpretando tabla...' : 'Interpretar Texto con IA'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: OFFICIAL SAMPLE */}
              {activeTab === 'sample' && (
                <div className="space-y-4 bg-blue-50/50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Planilla Oficial del Torneo ABSN (27 Encuentros)
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Contiene la tira de partidos de SOMISA, SOMISA A y SOMISA B para todas las categorías (U9, Mini U11, U13, U15, U17, U21 y Mayores 1°).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOriginalSampleImage(!showOriginalSampleImage)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showOriginalSampleImage ? 'Ocultar Foto' : 'Ver Original'}</span>
                    </button>
                  </div>

                  {showOriginalSampleImage && (
                    <div className="border border-slate-300 rounded-xl overflow-hidden max-h-56 overflow-y-auto bg-slate-900/5">
                      <img
                        src={SAMPLE_SHEET_IMG_URL}
                        alt="Planilla Original Torneo Básquet"
                        className="w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-blue-200 text-xs">
                    <span className="text-slate-600">
                      {section === 'anual' ? 'Fixture Anual guardado:' : 'Partidos semanales activos:'}{' '}
                      <strong className="text-slate-900 font-mono">
                        {section === 'anual' ? annualFixture.length : currentMatchCount}
                      </strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadSample('append')}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                      >
                        Sumar a los actuales
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadSample('replace')}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>
                          {section === 'anual'
                            ? 'Guardar Muestra en Fixture Anual'
                            : 'Cargar Muestra como Semana (27)'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
              {showUploaderBody && (activeTab === 'pdf' || activeTab === 'image' || activeTab === 'text') && (
                <button
                  type="button"
                  onClick={handleProcessWithGemini}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shrink-0 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Reintentar</span>
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* PREVIEW STAGED MATCHES SECTION */}
          {showUploaderBody && previewMatches && previewMatches.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>
                      {section === 'anual'
                        ? 'Vista Previa · Fixture Anual'
                        : 'Vista Previa · Partidos Semanales'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-xs">
                      {previewMatches.length} partidos
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verificá los partidos extraídos antes de confirmar.
                  </p>
                </div>

                {/* Import Mode Radio */}
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-blue-600"
                    />
                    <span>Reemplazar todo</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-600"
                    />
                    <span>Sumar a los actuales</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Jornada</th>
                      <th className="py-2 px-2.5">Cat.</th>
                      <th className="py-2 px-2.5">Rama</th>
                      <th className="py-2 px-2.5">Local</th>
                      <th className="py-2 px-2.5">Visitante</th>
                      <th className="py-2 px-2.5">Fecha</th>
                      <th className="py-2 px-2.5">Hora</th>
                      <th className="py-2 px-2.5">Entrenador DT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewMatches.slice(0, 20).map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-800">
                        <td className="py-1.5 px-2.5 text-slate-500 text-[11px]">{m.jornada || '-'}</td>
                        <td className="py-1.5 px-2.5 font-bold">{m.categoria}</td>
                        <td className="py-1.5 px-2.5">{m.rama}</td>
                        <td className="py-1.5 px-2.5 font-bold text-blue-900">{m.local}</td>
                        <td className="py-1.5 px-2.5">{m.visitante}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px]">{m.fecha || '-'}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px]">{m.hora || '-'}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{m.entrenador}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewMatches.length > 20 && (
                  <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">
                    ... y {previewMatches.length - 20} partidos más detectados
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          {/* Footer CTA for Annual Upload */}
          {section === 'anual' && previewMatches && previewMatches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleConfirmAnnualImport(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Solo Guardar Anual ({previewMatches.length})
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAnnualImport(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Anual y Elegir Partidos Semanales</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer CTA for Weekly From Annual */}
          {section === 'semanal' && weeklyMode === 'from-annual' && annualFixture.length > 0 && (
            <button
              type="button"
              disabled={selectedAnnualIds.size === 0}
              onClick={handleLoadSelectedFromAnnual}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-extrabold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>
                {selectedAnnualIds.size > 0
                  ? `${weeklyLoadMode === 'replace' ? 'Cargar' : 'Sumar'} ${selectedAnnualIds.size} Partidos a la Semana`
                  : 'Seleccioná al menos 1 partido de la lista'}
              </span>
            </button>
          )}

          {/* Footer CTA for Weekly Direct Upload */}
          {section === 'semanal' && weeklyMode === 'direct-upload' && previewMatches && previewMatches.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmDirectWeeklyImport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {importMode === 'replace'
                  ? `Reemplazar Semana con ${previewMatches.length} Partidos`
                  : `Sumar ${previewMatches.length} Partidos a la Semana`}
              </span>
            </button>
          )}

          {/* Neutral helper text when nothing staged */}
          {((showUploaderBody && (!previewMatches || previewMatches.length === 0)) ||
            (section === 'semanal' && weeklyMode === 'from-annual' && annualFixture.length === 0)) && (
            <div className="text-xs text-slate-400">
              {section === 'anual'
                ? 'Subí el archivo anual/semestral para continuar'
                : 'Cargá un Fixture Anual o subí una planilla semanal'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
