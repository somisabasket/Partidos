import React, { useState, useEffect } from 'react';
import { X, Save, Plus, AlertCircle } from 'lucide-react';
import { Match, Coach } from '../types/fixture';
import { CATEGORIES_LIST, COURTS } from '../data/initialData';
import { SOMISA_CREST_URL } from '../utils/assets';

interface MatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onSave: (match: Match) => void;
  isNew?: boolean;
  coaches: Coach[];
}

export const MatchEditModal: React.FC<MatchEditModalProps> = ({
  isOpen,
  onClose,
  match,
  onSave,
  isNew = false,
  coaches,
}) => {
  const [formData, setFormData] = useState<Match>({
    id: `match-${Date.now()}`,
    categoria: 'Mini (U11)',
    rama: 'Mixto',
    local: 'Somisa A',
    visitante: 'Don Bosco',
    fecha: '',
    hora: '',
    observCancha: '',
    observaciones: '',
    esCondicional: false,
    estado: 'A Coordinar',
    canchaAsignada: 'Gimnasio Principal',
    entrenador: coaches[0]?.nombre || 'Prof. Marcos',
    entrenadorTel: coaches[0]?.telefono || '+54 9 336 411-2233',
    citacionMinutos: 45,
  });

  useEffect(() => {
    if (match) {
      setFormData(match);
    } else {
      setFormData({
        id: `match-${Date.now()}`,
        categoria: 'Mini (U11)',
        rama: 'Mixto',
        local: 'Somisa A',
        visitante: 'Don Bosco',
        fecha: '',
        hora: '',
        observCancha: '',
        observaciones: '',
        esCondicional: false,
        estado: 'A Coordinar',
        canchaAsignada: 'Gimnasio Principal',
        entrenador: coaches[0]?.nombre || 'Prof. Marcos',
        entrenadorTel: coaches[0]?.telefono || '+54 9 336 411-2233',
        citacionMinutos: 45,
      });
    }
  }, [match, isOpen, coaches]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isReady = Boolean(formData.fecha && formData.hora);
    const updated: Match = {
      ...formData,
      estado: isReady
        ? formData.esCondicional
          ? 'Condicional'
          : 'Confirmado'
        : 'A Coordinar',
    };
    onSave(updated);
    onClose();
  };

  const handleCoachSelect = (coachName: string) => {
    const found = coaches.find((c) => c.nombre === coachName);
    setFormData((prev) => ({
      ...prev,
      entrenador: coachName,
      entrenadorTel: found ? found.telefono : prev.entrenadorTel,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header with SOMISA crest */}
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
                {isNew ? 'Añadir Nuevo Partido' : 'Editar Partido'}
              </h2>
              <p className="text-xs text-slate-500">
                Planilla oficial de divisiones formativas y mini básquetbol · Club SOMISA
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Rama</label>
              <select
                value={formData.rama}
                onChange={(e) => setFormData({ ...formData, rama: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Mixto">Mixto</option>
                <option value="F">F (Femenino)</option>
                <option value="M">M (Masculino)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Equipo Local</label>
              <input
                type="text"
                required
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ej: Somisa A"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Equipo Visitante</label>
              <input
                type="text"
                required
                value={formData.visitante}
                onChange={(e) => setFormData({ ...formData, visitante: e.target.value })}
                placeholder="Ej: Don Bosco"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha (DD/MM/YYYY)</label>
              <input
                type="text"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                placeholder="Ej: 14/11/2026"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora (HH:MM)</label>
              <input
                type="text"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                placeholder="Ej: 10:00"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold tabular-nums focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Observ. Cancha (Planilla)</label>
              <input
                type="text"
                value={formData.observCancha}
                onChange={(e) => setFormData({ ...formData, observCancha: e.target.value })}
                placeholder="Ej: Gim 2 o Amistoso"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cancha Asignada</label>
              <select
                value={formData.canchaAsignada || 'Gimnasio Principal'}
                onChange={(e) => setFormData({ ...formData, canchaAsignada: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                {COURTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
            <input
              type="text"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Ej: Promo, Final Copa oro J1, J3 Si es necesario"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Entrenador Responsable (SOMISA)
              </label>
              <select
                value={formData.entrenador || ''}
                onChange={(e) => handleCoachSelect(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold focus:ring-2 focus:ring-blue-500"
              >
                {coaches.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre} ({c.rol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Citación (min antes)</label>
              <input
                type="number"
                value={formData.citacionMinutos || 45}
                onChange={(e) =>
                  setFormData({ ...formData, citacionMinutos: parseInt(e.target.value, 10) || 45 })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer p-2 bg-amber-50 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                checked={formData.esCondicional}
                onChange={(e) => setFormData({ ...formData, esCondicional: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-amber-900">
                Partido condicional ("J3 Si es necesario" - fila amarilla)
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar Partido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
