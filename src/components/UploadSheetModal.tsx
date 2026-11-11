import React, { useState } from 'react';
import { X, Upload, Sparkles, FileText, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { Match } from '../types/fixture';

interface UploadSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchesLoaded: (newMatches: Match[]) => void;
  currentMatchCount: number;
}

export const UploadSheetModal: React.FC<UploadSheetModalProps> = ({
  isOpen,
  onClose,
  onMatchesLoaded,
  currentMatchCount,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [activeMode, setActiveMode] = useState<'image' | 'text' | 'sample'>('sample');
  const [showOriginalSampleImage, setShowOriginalSampleImage] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage(null);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessGemini = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let bodyData: any = {};
      if (activeMode === 'image' && imagePreview) {
        bodyData = {
          imageBase64: imagePreview,
          mimeType: selectedFile?.type || 'image/jpeg',
        };
      } else if (activeMode === 'text' && rawText.trim()) {
        bodyData = {
          textData: rawText,
        };
      } else if (activeMode === 'sample') {
        // Fetch sample from API
        const sampleRes = await fetch('/api/sample-fixture');
        const data = await sampleRes.json();
        if (data.success && data.matches) {
          onMatchesLoaded(data.matches);
          setSuccessMessage(`Se cargaron con éxito ${data.matches.length} partidos oficiales de SOMISA.`);
          setTimeout(() => {
            onClose();
          }, 1200);
          return;
        } else {
          throw new Error('No se pudo cargar la muestra.');
        }
      } else {
        setErrorMessage('Por favor seleccione una imagen o ingrese texto para analizar.');
        setIsProcessing(false);
        return;
      }

      const res = await fetch('/api/parse-fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar la planilla con IA.');
      }

      onMatchesLoaded(data.matches);
      setSuccessMessage(`¡Planilla procesada con éxito! Se detectaron ${data.matches.length} partidos.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error en la conexión con el servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleDirectly = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const sampleRes = await fetch('/api/sample-fixture');
      const data = await sampleRes.json();
      if (data.success && data.matches) {
        onMatchesLoaded(data.matches);
        setSuccessMessage(`¡27 partidos de SOMISA cargados correctamente!`);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage('Error al cargar la planilla de ejemplo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/SOMI_SIN_FONDO_9a531ff6.png"
              alt="Escudo SOMISA"
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900">Subir Planilla del Torneo</h2>
              <p className="text-xs text-slate-500">
                Procesamiento inteligente para Club SOMISA: extrae partidos, fechas, horarios y canchas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs */}
        <div className="p-6 space-y-4">
          {/* Mode Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveMode('sample')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                activeMode === 'sample' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Planilla Ejemplo Oficial
            </button>
            <button
              onClick={() => setActiveMode('image')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                activeMode === 'image' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Subir Imagen / Foto
            </button>
            <button
              onClick={() => setActiveMode('text')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                activeMode === 'text' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pegar Texto / Tabla
            </button>
          </div>

          {/* Mode: Sample Image & Sheet */}
          {activeMode === 'sample' && (
            <div className="space-y-3 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Planilla Oficial Suministrada</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Contiene los 27 encuentros del torneo (U9, Mini U11, U13, U15, U17, U21, Mayores 1°) con SOMISA,
                    SOMISA A y SOMISA B.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOriginalSampleImage(!showOriginalSampleImage)}
                  className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showOriginalSampleImage ? 'Ocultar Foto' : 'Ver Foto Original'}
                </button>
              </div>

              {showOriginalSampleImage && (
                <div className="border border-slate-300 rounded overflow-hidden max-h-56 overflow-y-auto bg-slate-900/5">
                  <img
                    src="/assets/aistudio/WhatsApp_Image_2026-11-10_at_17.33.00_b26e2a22.jpeg"
                    alt="Planilla Original Torneo Básquet"
                    className="w-full object-contain"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-blue-100 text-xs text-slate-600">
                <span>Partidos cargados actualmente: <strong className="tabular-nums text-slate-900">{currentMatchCount}</strong></span>
                <button
                  type="button"
                  onClick={handleLoadSampleDirectly}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  Cargar 27 Partidos de Muestra
                </button>
              </div>
            </div>
          )}

          {/* Mode: Image Upload */}
          {activeMode === 'image' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20">
                <Upload className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-slate-800">
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar o arrastra la foto de la planilla'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Formatos soportados: JPG, PNG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-100 max-h-48 overflow-hidden flex items-center justify-center">
                  <img src={imagePreview} alt="Preview" className="max-h-44 object-contain rounded" />
                </div>
              )}
            </div>
          )}

          {/* Mode: Raw Text */}
          {activeMode === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Pega aquí filas copiadas de Excel, Word o mensaje de WhatsApp:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="CATEGORIA  RAMA  LOCAL  VISITANTE  FECHA  HORA  OBSERV. CANCHA  OBSERVACIONES&#10;Mini (U11) Mixto Somisa A Social 11/11/2026 19:30 Gim 2 Promo&#10;Cadetes (U15) M Somisa B Don Bosco 14/11/2026 14:00"
                rows={6}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          )}

          {/* Status feedback */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cerrar
          </button>

          {activeMode !== 'sample' && (
            <button
              type="button"
              onClick={handleProcessGemini}
              disabled={isProcessing || (activeMode === 'image' && !imagePreview) || (activeMode === 'text' && !rawText.trim())}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Extrayendo con IA...' : 'Extraer Partidos con IA'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
