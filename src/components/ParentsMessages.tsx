import React, { useState } from 'react';
import { Match } from '../types/fixture';
import { MessageSquare, Copy, Check, ExternalLink, Calendar, Clock, MapPin, Shirt, AlertCircle, Share2 } from 'lucide-react';
import { SOMISA_CREST_URL } from '../utils/assets';

interface ParentsMessagesProps {
  matches: Match[];
}

export const ParentsMessages: React.FC<ParentsMessagesProps> = ({ matches }) => {
  const confirmedMatches = matches.filter((m) => m.fecha && m.hora);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    confirmedMatches[0]?.id || matches[0]?.id || ''
  );
  const [jerseyColor, setJerseyColor] = useState<'azul' | 'blanco' | 'ambas'>('azul');
  const [customReminder, setCustomReminder] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || confirmedMatches[0] || matches[0];

  const calculateArrivalTime = (hora: string, minutosAntes = 45): string => {
    if (!hora || !hora.includes(':')) return '45 min antes';
    const [h, min] = hora.split(':').map((n) => parseInt(n, 10));
    const d = new Date();
    d.setHours(h, min, 0, 0);
    const arrival = new Date(d.getTime() - minutosAntes * 60 * 1000);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${pad(arrival.getHours())}:${pad(arrival.getMinutes())} hs`;
  };

  const generateParentMessage = (m: Match) => {
    if (!m) return '';

    const isHome = m.local.toLowerCase().includes('somisa');
    const citacionMin = m.citacionMinutos || 45;
    const arrivalTime = calculateArrivalTime(m.hora, citacionMin);

    let locationText = '';
    if (isHome) {
      locationText = `Club SOMISA (Sede Central - San Nicolás)\n   📍 Cancha: ${m.observCancha || m.canchaAsignada || 'Gimnasio Principal'}`;
    } else {
      locationText = `Cancha de ${m.local} (Visitante)\n   📍 Sede del club rival`;
    }

    let camisetaText = 'Camiseta Azul (Titular)';
    if (jerseyColor === 'blanco') camisetaText = 'Camiseta Blanca (Alternativa)';
    if (jerseyColor === 'ambas') camisetaText = 'Llevar ambas camisetas (Azul y Blanca)';

    let msg = `🏀 *SOMISA BÁSQUETBOL - CONVOCATORIA OFICIAL* 🏀\n`;
    msg += `*Categoría:* ${m.categoria} (${m.rama})\n`;
    msg += `*Equipo:* ${m.local.toLowerCase().includes('somisa') ? m.local : m.visitante}\n\n`;

    msg += `Queridas familias, les compartimos la confirmación de la próxima fecha del torneo:\n\n`;
    msg += `🆚 *Rival:* ${isHome ? m.visitante : m.local}\n`;
    msg += `🗓️ *Día:* ${m.fecha || 'A coordinar'}\n`;
    msg += `⏰ *Hora del Partido:* ${m.hora ? `${m.hora} hs` : 'A coordinar'}\n`;
    msg += `⏱️ *Citación del Equipo:* ${arrivalTime} (${citacionMin} min antes)\n`;
    msg += `🏟️ *Lugar:* ${locationText}\n`;
    msg += `👕 *Indumentaria:* ${camisetaText}\n`;

    if (m.observaciones) {
      msg += `🏆 *Instancia:* ${m.observaciones}\n`;
    }

    msg += `\n⚠️ *Recordatorios importantes para los chicos:*\n`;
    msg += `• DNI físico obligatorio (carnet de jugador).\n`;
    msg += `• Botella de agua individual rotulada con su nombre.\n`;
    msg += `• Máxima puntualidad para la entrada en calor con el entrenador.\n`;

    if (customReminder.trim()) {
      msg += `• ${customReminder.trim()}\n`;
    }

    if (m.entrenador) {
      msg += `\nEntrenador a cargo: ${m.entrenador}${m.entrenadorTel ? ` (${m.entrenadorTel})` : ''}\n`;
    }

    msg += `\n¡Los esperamos a todos para alentar a los chicos con el respeto y la pasión de siempre! 💙🤍\n`;
    msg += `*Subcomisión de Básquetbol - Club SOMISA*`;

    return msg;
  };

  const messageText = generateParentMessage(selectedMatch);

  const handleCopySingle = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSingleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleCopyAllWeekend = () => {
    let allText = `🏀 *CLUB SOMISA - CRONOGRAMA GENERAL DEL FIN DE SEMANA* 🏀\n\n`;
    confirmedMatches.forEach((m) => {
      const isHome = m.local.toLowerCase().includes('somisa');
      const citacion = calculateArrivalTime(m.hora, m.citacionMinutos || 45);
      allText += `🔹 *${m.categoria} (${m.rama})*\n`;
      allText += `   ${m.local} vs ${m.visitante} (${isHome ? 'Local' : 'Visitante'})\n`;
      allText += `   🗓️ ${m.fecha} | ⏰ ${m.hora} hs (Citación: ${citacion})\n`;
      allText += `   📍 ${m.observCancha || m.canchaAsignada || 'Gimnasio Principal'}\n`;
      if (m.observaciones) allText += `   🏆 ${m.observaciones}\n`;
      allText += `\n`;
    });
    allText += `¡Vamos SOMISA! 💙🤍`;

    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={SOMISA_CREST_URL}
              alt="Escudo SOMISA"
              className="w-11 h-11 object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Mensajes para los Grupos de Padres (WhatsApp)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Genera comunicados con fecha, hora, citación previa, cancha e indumentaria con el escudo y membrete de SOMISA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAllWeekend}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-700" />}
              {copiedAll ? 'Copiado Resumen' : 'Copiar Resumen de Todos los Partidos'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Match Category Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Seleccionar Encuentro ({matches.length})
            </h3>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {matches.map((m) => {
                const isSelected = m.id === selectedMatchId;
                const isHome = m.local.toLowerCase().includes('somisa');

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatchId(m.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 text-blue-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{m.categoria} ({m.rama})</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          m.fecha && m.hora ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.fecha && m.hora ? `${m.fecha} · ${m.hora} hs` : 'A Coordinar'}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-800 mt-0.5 truncate">
                      {m.local} vs {m.visitante}
                    </div>

                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>{isHome ? '🏟️ Local SOMISA' : '🚌 Visitante'}</span>
                      {m.observaciones && <span className="text-red-600 font-bold">{m.observaciones}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Message Customizer & Live WhatsApp Preview */}
        <div className="lg:col-span-8 space-y-4">
          {selectedMatch && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              {/* Message Controls */}
              <div className="space-y-3 border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Personalizar Comunicado para Familias
                    </h3>
                    <p className="text-xs text-slate-500">
                      Partido: <strong className="text-slate-800">{selectedMatch.categoria} ({selectedMatch.local} vs {selectedMatch.visitante})</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySingle}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado' : 'Copiar Mensaje'}
                    </button>

                    <button
                      onClick={handleSendSingleWhatsApp}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Enviar por WhatsApp
                    </button>
                  </div>
                </div>

                {/* Jersey and extra reminders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Shirt className="w-3.5 h-3.5 text-blue-700" />
                      Color de Camiseta a Llevar:
                    </label>
                    <div className="flex rounded-md bg-slate-100 p-0.5 font-medium">
                      <button
                        type="button"
                        onClick={() => setJerseyColor('azul')}
                        className={`flex-1 py-1 rounded text-xs transition-colors ${
                          jerseyColor === 'azul' ? 'bg-white text-blue-800 font-bold shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Azul (Titular)
                      </button>
                      <button
                        type="button"
                        onClick={() => setJerseyColor('blanco')}
                        className={`flex-1 py-1 rounded text-xs transition-colors ${
                          jerseyColor === 'blanco' ? 'bg-white text-blue-800 font-bold shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Blanca (Suplente)
                      </button>
                      <button
                        type="button"
                        onClick={() => setJerseyColor('ambas')}
                        className={`flex-1 py-1 rounded text-xs transition-colors ${
                          jerseyColor === 'ambas' ? 'bg-white text-blue-800 font-bold shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Llevar Ambas
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Aclaración extra para las familias (opcional):
                    </label>
                    <input
                      type="text"
                      value={customReminder}
                      onChange={(e) => setCustomReminder(e.target.value)}
                      placeholder="Ej: Salimos todos juntos desde la sede a las 17:00 hs."
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Mock Chat Bubble Preview */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Vista Previa exacta en WhatsApp:
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Se enviará con negritas y emojis formateados
                  </span>
                </div>

                <div className="bg-[#efeae2] p-4 rounded-xl border border-slate-300 shadow-inner max-w-xl space-y-2">
                  {/* WhatsApp top bar */}
                  <div className="bg-[#075e54] text-white px-3 py-2 rounded-lg flex items-center gap-2.5 shadow-xs">
                    <img
                      src={SOMISA_CREST_URL}
                      alt="SOMISA Básquet"
                      className="w-7 h-7 object-contain bg-white rounded-full p-0.5"
                      referrerPolicy="no-referrer"
                    />
                    <div className="leading-tight">
                      <div className="font-bold text-xs">SOMISA Básquetbol - {selectedMatch.categoria}</div>
                      <div className="text-[10px] text-emerald-200">Grupo Oficial de Familias</div>
                    </div>
                  </div>

                  {/* Speech bubble */}
                  <div className="bg-white rounded-lg p-3.5 shadow-xs text-xs text-slate-800 space-y-1 font-sans leading-relaxed relative">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-900 select-all">
                      {messageText}
                    </pre>
                    <div className="text-[10px] text-slate-400 text-right mt-1">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
