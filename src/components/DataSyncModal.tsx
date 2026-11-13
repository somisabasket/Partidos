import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  FolderSync,
} from 'lucide-react';
import { SOMISA_CREST_URL } from '../utils/assets';
import {
  ClubDataSnapshot,
  downloadClubDataSnapshot,
  fetchPublishedClubData,
  isStaticHostingEnv,
} from '../utils/clubDataSync';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSnapshot: ClubDataSnapshot;
  onImportSnapshot: (snapshot: ClubDataSnapshot) => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  currentSnapshot,
  onImportSnapshot,
}) => {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isStatic = isStaticHostingEnv();

  const handleDownloadJson = () => {
    setErrorMsg(null);
    downloadClubDataSnapshot({
      ...currentSnapshot,
      updatedAt: new Date().toISOString(),
    });
    setStatusMsg(
      'Se descargó "club-data.json". Si editaste datos desde GitHub Pages, subí ese archivo a la carpeta "public/data/" (y "docs/data/") de tu repositorio en GitHub.'
    );
  };

  const handleUploadJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.matches)) {
        throw new Error('El archivo no tiene un formato válido de respaldo club-data.json.');
      }
      onImportSnapshot({
        version: 1,
        updatedAt: new Date().toISOString(),
        matches: parsed.matches || [],
        annualFixture: Array.isArray(parsed.annualFixture) ? parsed.annualFixture : [],
        coaches: Array.isArray(parsed.coaches) ? parsed.coaches : currentSnapshot.coaches,
        rivalClubs: Array.isArray(parsed.rivalClubs)
          ? parsed.rivalClubs
          : currentSnapshot.rivalClubs,
        mesaAssignments:
          parsed.mesaAssignments && typeof parsed.mesaAssignments === 'object'
            ? parsed.mesaAssignments
            : {},
      });
      setStatusMsg(
        `¡Respaldo restaurado! Se cargaron ${parsed.matches.length} partidos semanales y ${
          Array.isArray(parsed.annualFixture) ? parsed.annualFixture.length : 0
        } del fixture anual.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo leer el archivo JSON.');
    }
  };

  const handlePullPublished = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const published = await fetchPublishedClubData();
      if (!published) {
        throw new Error('No se encontró ningún archivo club-data.json publicado en el sitio.');
      }
      onImportSnapshot({
        ...published,
        updatedAt: published.updatedAt || new Date().toISOString(),
      });
      setStatusMsg(
        `Datos sincronizados desde el repositorio (${published.matches?.length || 0} partidos semanales y ${
          published.annualFixture?.length || 0
        } del fixture anual).`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al recargar datos del repositorio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo SOMISA"
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Datos del Club y Publicación en GitHub
              </h2>
              <p className="text-xs text-slate-500">
                Mantené tu Fixture Anual, Partidos Semanales y Entrenadores sincronizados con GitHub Pages.
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

        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Summary counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Fixture Anual</div>
              <div className="text-lg font-extrabold text-slate-900 font-mono">
                {currentSnapshot.annualFixture.length}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Semanales</div>
              <div className="text-lg font-extrabold text-blue-700 font-mono">
                {currentSnapshot.matches.length}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Entrenadores</div>
              <div className="text-lg font-extrabold text-slate-900 font-mono">
                {currentSnapshot.coaches.length}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Mesa Control</div>
              <div className="text-lg font-extrabold text-emerald-700 font-mono">
                {Object.keys(currentSnapshot.mesaAssignments || {}).length}
              </div>
            </div>
          </div>

          {/* Info box explaining automatic sync when copying to GitHub */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5 text-blue-950">
            <div className="font-bold flex items-center gap-1.5 text-xs">
              <FolderSync className="w-4 h-4 text-blue-700" />
              <span>
                {isStatic
                  ? 'Estás en GitHub Pages (somisabasket.github.io/partidos)'
                  : 'Guardado automático en archivos del proyecto activado'}
              </span>
            </div>
            <p className="text-[11px] text-blue-900 leading-relaxed">
              {isStatic
                ? 'Tus cambios locales quedan guardados en este navegador. Si querés que otros entrenadores y familias vean estos mismos partidos al abrir el enlace de GitHub, descargá "club-data.json" abajo y subilo a la carpeta public/data/ (y docs/data/) en GitHub.'
                : 'Cada partido, fixture anual, entrenador o asignación de mesa que cargues acá se guarda automáticamente en "public/data/club-data.json" y "docs/data/club-data.json", así que al copiar o subir el proyecto a GitHub ya viajan todos tus datos cargados.'}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="w-full px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-between transition-colors shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Descargar archivo de datos (club-data.json)</span>
              </span>
              <span className="text-[11px] font-normal text-blue-100">Para subir a GitHub</span>
            </button>

            <label className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-between transition-colors cursor-pointer border border-slate-200">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Cargar / Restaurar desde club-data.json</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">Importar respaldo</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleUploadJson}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handlePullPublished}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Recargar datos publicados en el repositorio</span>
            </button>
          </div>

          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Archivo: <code className="font-mono text-slate-700">public/data/club-data.json</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
