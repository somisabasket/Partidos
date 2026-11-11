import React, { useState } from 'react';
import { Match, ClubContact } from '../types/fixture';
import { Mail, Copy, Check, ExternalLink, Download, Phone, Building2 } from 'lucide-react';
import { exportOfficialSheetPdf } from '../utils/pdfExport';
import { SOMISA_CREST_URL } from '../utils/assets';

interface EmailToClubsProps {
  matches: Match[];
  rivalClubs: ClubContact[];
}

export const EmailToClubs: React.FC<EmailToClubsProps> = ({ matches, rivalClubs }) => {
  const [selectedClubId, setSelectedClubId] = useState<string>(rivalClubs[0]?.id || 'don-bosco');
  const [copied, setCopied] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailCustomNote, setEmailCustomNote] = useState('');

  const currentClub = rivalClubs.find((c) => c.id === selectedClubId) || rivalClubs[0];

  // Matches involving this club
  const clubMatches = matches.filter(
    (m) =>
      m.local.toLowerCase().includes(currentClub.nombre.toLowerCase()) ||
      m.visitante.toLowerCase().includes(currentClub.nombre.toLowerCase())
  );

  // Generate Email Body
  const generateEmailText = () => {
    let text = `Estimados coordinadores y delegados de básquetbol de ${currentClub.nombre}:\n\n`;
    text += `Desde la Subcomisión y Coordinación de Básquetbol del Club SOMISA de San Nicolás, les acercamos la programación de días, horarios y canchas para la tira de categorías formativas y mini básquet:\n\n`;
    text += `----------------------------------------------------------------------------------------\n`;
    text += `CATEGORIA | RAMA | LOCAL | VISITANTE | FECHA | HORA | CANCHA / OBS\n`;
    text += `----------------------------------------------------------------------------------------\n`;

    clubMatches.forEach((m) => {
      const fecha = m.fecha || 'A coordinar';
      const hora = m.hora ? `${m.hora} hs` : 'A coordinar';
      const obs = [m.observCancha, m.observaciones].filter(Boolean).join(' - ') || 'Ninguna';
      text += `${m.categoria} | ${m.rama} | ${m.local} vs ${m.visitante} | ${fecha} | ${hora} | ${obs}\n`;
    });

    text += `----------------------------------------------------------------------------------------\n\n`;

    if (emailCustomNote.trim()) {
      text += `Nota adicional:\n${emailCustomNote.trim()}\n\n`;
    }

    text += `Agradecemos confirmar la recepción y aceptación de estos horarios a la brevedad para su remisión final a la Asociación.\n\n`;
    text += `Quedamos a su entera disposición ante cualquier necesidad de ajuste.\n\n`;
    text += `Atentamente,\nCoordinación de Formativas y Mini Básquet\nClub SOMISA - San Nicolás de los Arroyos\nTel: +54 9 336 411-2233 | basquet@clubsomisa.com.ar`;

    return text;
  };

  const defaultSubject = `Propuesta de Horarios - Formativas y Mini Básquet - Club SOMISA vs ${currentClub.nombre}`;
  const subjectToUse = emailSubject || defaultSubject;
  const emailBody = generateEmailText();

  const handleCopy = () => {
    const fullText = `Asunto: ${subjectToUse}\nPara: ${currentClub.email}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${currentClub.email}?subject=${encodeURIComponent(
      subjectToUse
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
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
                Envío de Planilla y Horarios a Clubes Rivales
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Arma el correo formal con la grilla de partidos y membrete oficial del Club SOMISA para el coordinador rival.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportOfficialSheetPdf(clubMatches, `SOMISA vs ${currentClub.nombre} - Cronograma Oficial`)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              Descargar PDF de esta Tira
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: Club Directory Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              Seleccionar Club Rival ({rivalClubs.length})
            </h3>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {rivalClubs.map((club) => {
                const count = matches.filter(
                  (m) =>
                    m.local.toLowerCase().includes(club.nombre.toLowerCase()) ||
                    m.visitante.toLowerCase().includes(club.nombre.toLowerCase())
                ).length;
                const isSelected = club.id === selectedClubId;

                return (
                  <div
                    key={club.id}
                    onClick={() => {
                      setSelectedClubId(club.id);
                      setEmailSubject(`Propuesta de Horarios - Formativas y Mini Básquet - Club SOMISA vs ${club.nombre}`);
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 text-blue-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{club.nombre}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {count} partido{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">{club.delegado}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{club.email}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Club Contact Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              Datos de Contacto: {currentClub.nombre}
            </h4>
            <div className="space-y-1 text-slate-600">
              <div><strong>Delegado:</strong> {currentClub.delegado}</div>
              <div><strong>Email:</strong> {currentClub.email}</div>
              <div><strong>Tel / WhatsApp:</strong> {currentClub.telefono}</div>
              <div><strong>Cancha / Sede:</strong> {currentClub.canchaDireccion}</div>
              <div><strong>Colores:</strong> {currentClub.colorCamiseta}</div>
            </div>
          </div>
        </div>

        {/* Right column: Generated Email Draft */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Borrador de Comunicación Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Listo para enviar a <span className="font-semibold text-slate-800">{currentClub.email}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado al portapapeles' : 'Copiar Correo'}
                </button>

                <button
                  onClick={handleOpenMailto}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Abrir en Cliente de Correo
                </button>
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Asunto del Mensaje:
              </label>
              <input
                type="text"
                value={subjectToUse}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Additional Note Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nota adicional o aclaración de vestuario / cancha (opcional):
              </label>
              <input
                type="text"
                value={emailCustomNote}
                onChange={(e) => setEmailCustomNote(e.target.value)}
                placeholder="Ej: Contamos con buffet habilitado y vestuarios disponibles para la delegación visitante."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Email Body Preview */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cuerpo del Mensaje (Vista Previa Formateada):
              </label>
              <pre className="w-full h-80 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {emailBody}
              </pre>
            </div>
          </div>

          {/* Quick list of matches summarized */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Incluye <strong className="text-slate-800 tabular-nums">{clubMatches.length}</strong> partidos programados
              con {currentClub.nombre}
            </span>
            <span className="text-[11px]">Subcomisión de Básquet SOMISA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
