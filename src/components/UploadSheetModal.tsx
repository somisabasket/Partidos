import React, { useState } from 'react';
import { 
  X, 
  Upload, 
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
  Layers,
  ArrowRight
} from 'lucide-react';
import { Match } from '../types/fixture';
import { INITIAL_MATCHES } from '../data/initialData';
import { SAMPLE_SHEET_IMG_URL, SOMISA_CREST_URL } from '../utils/assets';
import { parseExcelFixture, downloadSampleExcelTemplate } from '../utils/excelParser';

interface UploadSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchesLoaded: (newMatches: Match[], mode: 'replace' | 'append') => void;
  currentMatchCount: number;
}

export const UploadSheetModal: React.FC<UploadSheetModalProps> = ({
  isOpen,
  onClose,
  onMatchesLoaded,
  currentMatchCount,
}) => {
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

  if (!isOpen) return null;

  // Handle Excel file selection
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPreviewMatches(null);
    setIsProcessing(true);

    try {
      const matches = await parseExcelFixture(file);
      if (matches.length === 0) {
        throw new Error('No se detectaron partidos válidos en el archivo Excel. Asegúrate de incluir columnas como CATEGORIA, LOCAL y VISITANTE.');
      }
      setPreviewMatches(matches);
      setSuccessMessage(`Se detectaron ${matches.length} partidos en el archivo Excel listo para importar.`);
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
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPreviewMatches(null);

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

  // Process PDF or Image with Gemini AI
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

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el fixture con el servidor.');
      }

      if (!data.matches || data.matches.length === 0) {
        throw new Error('La IA no pudo detectar partidos en el documento. Verifique que la imagen o PDF sea legible.');
      }

      setPreviewMatches(data.matches);
      setSuccessMessage(`¡Extracción exitosa con IA! Se identificaron ${data.matches.length} partidos.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error en la conexión o procesamiento con IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and load matches into application
  const handleConfirmImport = () => {
    if (!previewMatches || previewMatches.length === 0) return;
    onMatchesLoaded(previewMatches, importMode);
    onClose();
  };

  // Instant sample load
  const handleLoadSample = (mode: 'replace' | 'append') => {
    onMatchesLoaded(INITIAL_MATCHES, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
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
                Importar Fixture Anual o Semestral
              </h2>
              <p className="text-xs text-slate-500">
                Cargá los partidos oficiales desde un archivo Excel (.xlsx, .csv), documento PDF, foto de planilla o texto.
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

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-slate-100 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab('excel');
                setPreviewMatches(null);
                setErrorMessage(null);
              }}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'excel'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel / CSV (.xlsx)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('pdf');
                setPreviewMatches(null);
                setErrorMessage(null);
              }}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'pdf'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documento PDF</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('image');
                setPreviewMatches(null);
                setErrorMessage(null);
              }}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'image'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Foto / Imagen</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('text');
                setPreviewMatches(null);
                setErrorMessage(null);
              }}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'text'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <AlignLeft className="w-4 h-4" />
              <span>Pegar Texto</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sample');
                setPreviewMatches(null);
                setErrorMessage(null);
              }}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'sample'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muestra Oficial (27 Partidos)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: EXCEL / CSV */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Subir Planilla Excel (.xlsx, .xls, .csv)</h3>
                  <p className="text-xs text-slate-500">
                    Procesamiento instantáneo en tu navegador. Reconoce encabezados oficiales de categorías, clubes, fechas y horas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                  title="Descargar plantilla Excel oficial lista para completar"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Descargar Plantilla Excel</span>
                </button>
              </div>

              <label className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-blue-50/30">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  {selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv'))
                    ? selectedFile.name
                    : 'Arrastrá tu archivo Excel o hacé clic para seleccionar'}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Formatos compatibles: .xlsx, .xls, .csv (Fixture Anual, Semestral o tira de fin de semana)
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
                <h3 className="text-sm font-bold text-slate-900">Subir Documento PDF del Fixture</h3>
                <p className="text-xs text-slate-500">
                  Sube el documento PDF oficial emitido por la Asociación o Federación (admite fixtures anuales o semestrales de varias páginas). La IA extraerá automáticamente todas las fechas y categorías.
                </p>
              </div>

              <label className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-blue-50/30">
                <FileText className="w-10 h-10 text-red-600 mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  {selectedFile && selectedFile.type === 'application/pdf'
                    ? selectedFile.name
                    : 'Arrastrá tu documento PDF de fixture o hacé clic para buscar'}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Documento PDF oficial de la ABSN / CAB (Fixture semestral o anual)
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
                    className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Analizando PDF con IA...' : 'Extraer Fixture Completo con IA'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMAGE / PHOTO */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Subir Foto o Captura de Pantalla</h3>
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
                    className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
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
                <h3 className="text-sm font-bold text-slate-900">Pegar Texto o Tabla de Partidos</h3>
                <p className="text-xs text-slate-500">
                  Pega directamente filas copiadas de WhatsApp, Word, email o planillas de texto.
                </p>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="CATEGORIA   RAMA   LOCAL   VISITANTE   FECHA   HORA   CANCHA&#10;Mini (U11)  Mixto  Somisa A  Social    11/11/2026 19:30  Gim 2&#10;Cadetes (U15) M    Somisa B  Don Bosco 14/11/2026 14:00"
                rows={6}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50"
              />

              {rawText.trim() && !previewMatches && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleProcessWithGemini}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
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
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Planilla Oficial del Torneo ABSN (27 Encuentros)</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Contiene la tira completa de partidos de SOMISA, SOMISA A y SOMISA B para todas las categorías (U9, Mini U11, U13, U15, U17, U21 y Mayores 1°).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOriginalSampleImage(!showOriginalSampleImage)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showOriginalSampleImage ? 'Ocultar Foto' : 'Ver Planilla Original'}</span>
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

              <div className="flex items-center justify-between pt-3 border-t border-blue-200 text-xs">
                <span className="text-slate-600">
                  Partidos en memoria: <strong className="text-slate-900 font-mono">{currentMatchCount}</strong>
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
                    <span>Cargar Muestra Oficial (27)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* PREVIEW STAGED MATCHES SECTION */}
          {previewMatches && previewMatches.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Partidos listos para importar</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-xs">
                      {previewMatches.length} partidos
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verifica la vista previa antes de incorporar al cronograma.
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
                    {previewMatches.slice(0, 15).map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-800">
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
                {previewMatches.length > 15 && (
                  <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">
                    ... y {previewMatches.length - 15} partidos más detectados
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          {previewMatches && previewMatches.length > 0 ? (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {importMode === 'replace'
                  ? `Reemplazar e Importar ${previewMatches.length} Partidos`
                  : `Sumar ${previewMatches.length} Partidos al Fixture`}
              </span>
            </button>
          ) : (
            <div className="text-xs text-slate-400">
              Selecciona un archivo para habilitar la importación
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
