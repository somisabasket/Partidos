import React, { useState } from 'react';
import { Match, Coach } from '../types/fixture';
import {
  ShieldCheck,
  MessageCircle,
  Copy,
  Check,
  Clock,
  Calendar,
  MapPin,
  Phone,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import { SOMISA_CREST_URL } from '../utils/assets';

interface CoachNotificationsProps {
  matches: Match[];
  coaches: Coach[];
  onUpdateCoaches: (coaches: Coach[]) => void;
  onUpdateMatchesCoachName?: (oldName: string, newName: string) => void;
}

export const CoachNotifications: React.FC<CoachNotificationsProps> = ({
  matches,
  coaches,
  onUpdateCoaches,
  onUpdateMatchesCoachName,
}) => {
  const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Coach Edit Modal / Drawer state
  const [isEditingCoach, setIsEditingCoach] = useState(false);
  const [isCreatingCoach, setIsCreatingCoach] = useState(false);
  const [coachFormData, setCoachFormData] = useState<Coach>({
    id: '',
    nombre: '',
    telefono: '',
    email: '',
    categorias: [],
    rol: '',
  });
  const [categoriesInput, setCategoriesInput] = useState('');
  const [syncMatchesWithNewName, setSyncMatchesWithNewName] = useState(true);

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId) || coaches[0];

  // Matches assigned to this coach
  const coachMatches = matches.filter((m) => {
    if (!selectedCoach) return false;
    // Match by direct coach name or category match
    if (
      m.entrenador &&
      m.entrenador.toLowerCase().includes(selectedCoach.nombre.toLowerCase().replace('prof. ', ''))
    ) {
      return true;
    }
    return selectedCoach.categorias.some((cat) => m.categoria.toLowerCase().includes(cat.toLowerCase()));
  });

  const handleStartEdit = (coach: Coach) => {
    setCoachFormData(coach);
    setCategoriesInput(coach.categorias.join(', '));
    setIsEditingCoach(true);
  };

  const handleStartCreate = () => {
    setCoachFormData({
      id: `coach-${Date.now()}`,
      nombre: 'Prof. ',
      telefono: '+54 9 336 ',
      email: '',
      categorias: [],
      rol: 'Entrenador de Formativas',
    });
    setCategoriesInput('U15, U17');
    setIsCreatingCoach(true);
  };

  const handleSaveCoach = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCats = categoriesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const updatedCoach: Coach = {
      ...coachFormData,
      categorias: cleanCats,
    };

    if (isCreatingCoach) {
      const nextCoaches = [...coaches, updatedCoach];
      onUpdateCoaches(nextCoaches);
      setSelectedCoachId(updatedCoach.id);
      setIsCreatingCoach(false);
    } else if (isEditingCoach) {
      const oldCoach = coaches.find((c) => c.id === updatedCoach.id);
      const nextCoaches = coaches.map((c) => (c.id === updatedCoach.id ? updatedCoach : c));
      onUpdateCoaches(nextCoaches);

      // If name changed, optionally sync matches
      if (
        syncMatchesWithNewName &&
        oldCoach &&
        oldCoach.nombre !== updatedCoach.nombre &&
        onUpdateMatchesCoachName
      ) {
        onUpdateMatchesCoachName(oldCoach.nombre, updatedCoach.nombre);
      }
      setIsEditingCoach(false);
    }
  };

  const handleDeleteCoach = (coachId: string) => {
    if (coaches.length <= 1) {
      alert('Debe quedar al menos un entrenador registrado.');
      return;
    }
    if (window.confirm('¿Deseas eliminar a este entrenador de la lista?')) {
      const next = coaches.filter((c) => c.id !== coachId);
      onUpdateCoaches(next);
      if (selectedCoachId === coachId) {
        setSelectedCoachId(next[0].id);
      }
    }
  };

  const generateWhatsAppMessage = (coach: Coach, coachMatchesList: Match[]) => {
    let msg = `🏀 *CLUB SOMISA - CRONOGRAMA OFICIAL CUERPO TÉCNICO* 🏀\n`;
    msg += `Estimado/a ${coach.nombre},\nTe compartimos la asignación de partidos confirmados para tus categorías:\n\n`;

    if (coachMatchesList.length === 0) {
      msg += `(Sin partidos programados para esta jornada)\n`;
    } else {
      coachMatchesList.forEach((m, idx) => {
        const isHome = m.local.toLowerCase().includes('somisa');
        const cond = isHome ? 'LOCAL (SOMISA)' : `VISITANTE (en ${m.local})`;
        const citacion = m.citacionMinutos || 45;

        // Calculate arrival time if match has hour
        let arrivalText = `Citación: ${citacion} min antes`;
        if (m.hora && m.hora.includes(':')) {
          const [h, min] = m.hora.split(':').map((n) => parseInt(n, 10));
          const matchDate = new Date();
          matchDate.setHours(h, min, 0, 0);
          const arrivalDate = new Date(matchDate.getTime() - citacion * 60 * 1000);
          const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
          arrivalText = `Citación: ${pad(arrivalDate.getHours())}:${pad(arrivalDate.getMinutes())} hs (${citacion} min antes)`;
        }

        msg += `📌 *PARTIDO ${idx + 1}: ${m.categoria} (${m.rama})*\n`;
        msg += `🆚 *Encuentro:* ${m.local} vs ${m.visitante} [${cond}]\n`;
        msg += `🗓️ *Día:* ${m.fecha || 'A coordinar'} | ⏰ *Hora:* ${m.hora ? `${m.hora} hs` : 'A coordinar'}\n`;
        msg += `⏱️ *${arrivalText}*\n`;
        msg += `🏟️ *Cancha:* ${m.observCancha || m.canchaAsignada || 'Gimnasio Principal'}\n`;
        if (m.observaciones) msg += `⚠️ *Obs:* ${m.observaciones}\n`;
        msg += `\n`;
      });
    }

    msg += `Por favor verificar planillas de juego y estar atentos al grupo de la tira.\n`;
    msg += `¡Muchos éxitos!\nCoordinación de Básquetbol - Club SOMISA`;

    return msg;
  };

  const handleCopy = (coach: Coach, list: Match[]) => {
    const text = generateWhatsAppMessage(coach, list);
    navigator.clipboard.writeText(text);
    setCopiedId(coach.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (coach: Coach, list: Match[]) => {
    const text = generateWhatsAppMessage(coach, list);
    const cleanPhone = coach.telefono.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Official SOMISA Crest */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo SOMISA"
              className="w-12 h-12 object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Cuerpo Técnico y Notificaciones para Entrenadores
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Edita nombres, roles, teléfonos y categorías de los entrenadores de SOMISA, y despacha sus cronogramas por WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCreate}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Entrenador
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Coach Directory */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                Entrenadores SOMISA ({coaches.length})
              </h3>
              <span className="text-[11px] text-slate-400">Clic para ver y editar</span>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {coaches.map((coach) => {
                const count = matches.filter(
                  (m) =>
                    (m.entrenador &&
                      m.entrenador
                        .toLowerCase()
                        .includes(coach.nombre.toLowerCase().replace('prof. ', ''))) ||
                    coach.categorias.some((cat) => m.categoria.toLowerCase().includes(cat.toLowerCase()))
                ).length;
                const isSelected = coach.id === selectedCoachId;

                return (
                  <div
                    key={coach.id}
                    onClick={() => setSelectedCoachId(coach.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors text-xs relative group ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 text-blue-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-slate-900">
                        <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                        {coach.nombre}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                          {count} partido{count !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(coach);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-100/50"
                          title="Editar nombre y datos"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{coach.rol}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{coach.telefono}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Coach Detail, Matches & WhatsApp Dispatch Card */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCoach && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-start gap-3">
                  <img
                    src={SOMISA_CREST_URL}
                    alt="Escudo SOMISA"
                    className="w-10 h-10 object-contain drop-shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {selectedCoach.nombre}
                      </h3>
                      <button
                        onClick={() => handleStartEdit(selectedCoach)}
                        className="px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1 transition-colors"
                        title="Modificar nombre y contacto"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar Nombre / Datos
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-medium text-slate-700">{selectedCoach.rol}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {selectedCoach.telefono}
                      </span>
                      <span>·</span>
                      <span>Categorías: {selectedCoach.categorias.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedCoach, coachMatches)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {copiedId === selectedCoach.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedId === selectedCoach.id ? 'Copiado' : 'Copiar Texto'}
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(selectedCoach, coachMatches)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Enviar por WhatsApp
                  </button>
                </div>
              </div>

              {/* Match list for this coach */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Partidos Asignados a {selectedCoach.nombre}:
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    {coachMatches.length} partido{coachMatches.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {coachMatches.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
                    No hay partidos asignados actualmente a este entrenador.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {coachMatches.map((m) => {
                      const isHome = m.local.toLowerCase().includes('somisa');
                      return (
                        <div
                          key={m.id}
                          className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-blue-50/20 transition-colors text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>
                              {m.categoria} ({m.rama})
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isHome ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isHome ? 'Local' : 'Visitante'}
                            </span>
                          </div>

                          <div className="font-semibold text-slate-800">
                            {m.local} vs {m.visitante}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-blue-700" />
                              {m.fecha || 'A coordinar'}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-slate-900">
                              <Clock className="w-3 h-3 text-blue-700" />
                              {m.hora ? `${m.hora} hs` : '--:--'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {m.observCancha || m.canchaAsignada || 'Gimnasio Principal'}
                          </div>

                          {m.observaciones && (
                            <div className="text-[10px] text-red-600 font-bold">
                              {m.observaciones}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message Preview */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-xs font-bold text-slate-700">
                  Vista Previa del Comunicado Oficial para WhatsApp:
                </span>
                <pre className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-lg font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {generateWhatsAppMessage(selectedCoach, coachMatches)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create Coach Modal */}
      {(isEditingCoach || isCreatingCoach) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <img
                  src={SOMISA_CREST_URL}
                  alt="Escudo SOMISA"
                  className="w-7 h-7 object-contain"
                  referrerPolicy="no-referrer"
                />
                <h3 className="text-sm font-bold text-slate-900">
                  {isCreatingCoach ? 'Registrar Nuevo Entrenador' : 'Editar Datos del Entrenador'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEditingCoach(false);
                  setIsCreatingCoach(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCoach} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Completo del Entrenador:
                </label>
                <input
                  type="text"
                  required
                  value={coachFormData.nombre}
                  onChange={(e) => setCoachFormData({ ...coachFormData, nombre: e.target.value })}
                  placeholder="Ej: Prof. Marcos González"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rol / Cargo en SOMISA:
                </label>
                <input
                  type="text"
                  value={coachFormData.rol}
                  onChange={(e) => setCoachFormData({ ...coachFormData, rol: e.target.value })}
                  placeholder="Ej: Entrenador Mini Básquet y Escuelita"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp (con código de área):
                </label>
                <input
                  type="text"
                  required
                  value={coachFormData.telefono}
                  onChange={(e) => setCoachFormData({ ...coachFormData, telefono: e.target.value })}
                  placeholder="Ej: +54 9 336 411-2233"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email de Contacto (opcional):
                </label>
                <input
                  type="email"
                  value={coachFormData.email}
                  onChange={(e) => setCoachFormData({ ...coachFormData, email: e.target.value })}
                  placeholder="marcos.somisa@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Categorías Asignadas (separadas por coma):
                </label>
                <input
                  type="text"
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                  placeholder="U9, Mini (U11), Cadetes (U15)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Permite asignar automáticamente los partidos de estas categorías al entrenador.
                </span>
              </div>

              {isEditingCoach && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={syncMatchesWithNewName}
                      onChange={(e) => setSyncMatchesWithNewName(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-semibold text-blue-900">
                      Actualizar automáticamente este nuevo nombre en todos los partidos de la planilla
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                {isEditingCoach ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteCoach(coachFormData.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCoach(false);
                      setIsCreatingCoach(false);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
