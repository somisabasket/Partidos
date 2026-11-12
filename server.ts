import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser with large limit for image data
app.use(express.json({ limit: '50mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Pre-transcribed exact sample data from the user's attached sheet image
const SAMPLE_MATCHES = [
  {
    id: "match-1",
    categoria: "U9",
    rama: "Mixto",
    local: "Somisa A",
    visitante: "Social",
    fecha: "11/11/2026",
    hora: "18:30",
    observCancha: "Gim 2",
    observaciones: "",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio 2",
    entrenador: "Prof. Marcos",
    entrenadorTel: "+54 9 336 411-2233",
    padresGrupo: "U9 Pre-Mini Somisa",
  },
  {
    id: "match-2",
    categoria: "Mini (U11)",
    rama: "Mixto",
    local: "Somisa A",
    visitante: "Social",
    fecha: "11/11/2026",
    hora: "19:30",
    observCancha: "Gim 2",
    observaciones: "Promo",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio 2",
    entrenador: "Prof. Marcos",
    entrenadorTel: "+54 9 336 411-2233",
    padresGrupo: "Mini U11 Somisa A",
  },
  {
    id: "match-3",
    categoria: "U9",
    rama: "Mixto",
    local: "Don Bosco",
    visitante: "Somisa",
    fecha: "12/11/2026",
    hora: "18:15",
    observCancha: "",
    observaciones: "",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Don Bosco (Visitante)",
    entrenador: "Prof. Marcos",
    entrenadorTel: "+54 9 336 411-2233",
    padresGrupo: "U9 Pre-Mini Somisa",
  },
  {
    id: "match-4",
    categoria: "Mini (U11)",
    rama: "Mixto",
    local: "Don Bosco",
    visitante: "Somisa A",
    fecha: "12/11/2026",
    hora: "19:15",
    observCancha: "",
    observaciones: "Promo",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Don Bosco (Visitante)",
    entrenador: "Prof. Marcos",
    entrenadorTel: "+54 9 336 411-2233",
    padresGrupo: "Mini U11 Somisa A",
  },
  {
    id: "match-5",
    categoria: "Mini (U11)",
    rama: "F",
    local: "Somisa",
    visitante: "ACSN",
    fecha: "13/11/2026",
    hora: "19:00",
    observCancha: "",
    observaciones: "Final Copa oro J1",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Paula",
    entrenadorTel: "+54 9 336 455-6677",
    padresGrupo: "Mini Femenino Somisa",
  },
  {
    id: "match-6",
    categoria: "Mini (U11)",
    rama: "Mixto",
    local: "Somisa A",
    visitante: "Conesa",
    fecha: "14/11/2026",
    hora: "10:00",
    observCancha: "",
    observaciones: "Promo",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Marcos",
    entrenadorTel: "+54 9 336 411-2233",
    padresGrupo: "Mini U11 Somisa A",
  },
  {
    id: "match-7",
    categoria: "U9 (Pre mini)",
    rama: "Mixto",
    local: "Somisa",
    visitante: "Conesa",
    fecha: "14/11/2026",
    hora: "11:30",
    observCancha: "",
    observaciones: "",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Marcos",
    entrenadorTel: "+54 9 336 411-2233",
    padresGrupo: "U9 Pre-Mini Somisa",
  },
  {
    id: "match-8",
    categoria: "Mini (U11)",
    rama: "Mixto",
    local: "Somisa B",
    visitante: "Don Bosco",
    fecha: "14/11/2026",
    hora: "12:30",
    observCancha: "",
    observaciones: "Promo",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Federico",
    entrenadorTel: "+54 9 336 477-8899",
    padresGrupo: "Mini U11 Somisa B",
  },
  {
    id: "match-9",
    categoria: "Cadetes (U15)",
    rama: "M",
    local: "Somisa B",
    visitante: "Don Bosco",
    fecha: "14/11/2026",
    hora: "14:00",
    observCancha: "",
    observaciones: "",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Juan Martín",
    entrenadorTel: "+54 9 336 422-9900",
    padresGrupo: "U15 Cadetes Somisa B",
  },
  {
    id: "match-10",
    categoria: "Juveniles (U17)",
    rama: "M",
    local: "Somisa B",
    visitante: "Don Bosco",
    fecha: "14/11/2026",
    hora: "15:45",
    observCancha: "",
    observaciones: "",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Lucas",
    entrenadorTel: "+54 9 336 433-1122",
    padresGrupo: "U17 Juveniles Somisa B",
  },
  {
    id: "match-11",
    categoria: "Cadetes (U15)",
    rama: "M",
    local: "Somisa A",
    visitante: "Regatas B",
    fecha: "14/11/2026",
    hora: "17:30",
    observCancha: "",
    observaciones: "",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Juan Martín",
    entrenadorTel: "+54 9 336 422-9900",
    padresGrupo: "U15 Cadetes Somisa A",
  },
  {
    id: "match-12",
    categoria: "Juveniles (U17)",
    rama: "M",
    local: "Somisa A",
    visitante: "Regatas B",
    fecha: "14/11/2026",
    hora: "19:15",
    observCancha: "",
    observaciones: "",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Lucas",
    entrenadorTel: "+54 9 336 433-1122",
    padresGrupo: "U17 Juveniles Somisa A",
  },
  {
    id: "match-13",
    categoria: "Cadetes (U15)",
    rama: "F",
    local: "Somisa",
    visitante: "Sacachispas",
    fecha: "15/11/2026",
    hora: "19:00",
    observCancha: "",
    observaciones: "Final Copa oro J1",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Paula",
    entrenadorTel: "+54 9 336 455-6677",
    padresGrupo: "U15 Femenino Somisa",
  },
  {
    id: "match-14",
    categoria: "Mayores (1°)",
    rama: "F",
    local: "Somisa",
    visitante: "Don Bosco",
    fecha: "15/11/2026",
    hora: "21:00",
    observCancha: "",
    observaciones: "Final Copa Plata J1",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Nicolás",
    entrenadorTel: "+54 9 336 488-3344",
    padresGrupo: "Plantel 1° Femenino Somisa",
  },
  {
    id: "match-15",
    categoria: "Proximo (U21)",
    rama: "M",
    local: "Somisa",
    visitante: "Regatas A",
    fecha: "16/11/2026",
    hora: "21:00",
    observCancha: "",
    observaciones: "Final Copa oro J1",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Lucas",
    entrenadorTel: "+54 9 336 433-1122",
    padresGrupo: "U21 Somisa",
  },
  {
    id: "match-16",
    categoria: "Mini (U11)",
    rama: "Mixto",
    local: "Empalme Central",
    visitante: "Somisa B",
    fecha: "20/11/2026",
    hora: "19:00",
    observCancha: "",
    observaciones: "Promo",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Empalme Central (Visitante)",
    entrenador: "Prof. Federico",
    entrenadorTel: "+54 9 336 477-8899",
    padresGrupo: "Mini U11 Somisa B",
  },
  {
    id: "match-17",
    categoria: "U13",
    rama: "Mixto",
    local: "Empalme Central",
    visitante: "Somisa",
    fecha: "20/11/2026",
    hora: "20:00",
    observCancha: "Amistoso",
    observaciones: "",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Empalme Central (Visitante)",
    entrenador: "Prof. Federico",
    entrenadorTel: "+54 9 336 477-8899",
    padresGrupo: "U13 Mixto Somisa",
  },
  {
    id: "match-18",
    categoria: "Infantiles (U13)",
    rama: "F",
    local: "Somisa",
    visitante: "Belgrano",
    fecha: "20/11/2026",
    hora: "19:00",
    observCancha: "",
    observaciones: "Final copa Plata J1",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Gimnasio 2",
    entrenador: "Prof. Paula",
    entrenadorTel: "+54 9 336 455-6677",
    padresGrupo: "U13 Femenino Somisa",
  },
  {
    id: "match-19",
    categoria: "Mayores (1°)",
    rama: "M",
    local: "Defensores",
    visitante: "Somisa A",
    fecha: "",
    hora: "",
    observCancha: "",
    observaciones: "Final Copa oro J2",
    esCondicional: false,
    estado: "A Coordinar",
    canchaAsignada: "A Coordinar con Defensores",
    entrenador: "Prof. Nicolás",
    entrenadorTel: "+54 9 336 488-3344",
    padresGrupo: "Plantel 1° Masculino Somisa",
  },
  {
    id: "match-20",
    categoria: "Mayores (1°)",
    rama: "M",
    local: "Somisa A",
    visitante: "Defensores",
    fecha: "",
    hora: "21:00",
    observCancha: "",
    observaciones: "J3 Si es necesario",
    esCondicional: true,
    estado: "Condicional",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Nicolás",
    entrenadorTel: "+54 9 336 488-3344",
    padresGrupo: "Plantel 1° Masculino Somisa",
  },
  {
    id: "match-21",
    categoria: "Mini (U11)",
    rama: "F",
    local: "ACSN",
    visitante: "Somisa",
    fecha: "29/11/2026",
    hora: "14:00",
    observCancha: "",
    observaciones: "Final Copa oro J2",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "ACSN (Visitante)",
    entrenador: "Prof. Paula",
    entrenadorTel: "+54 9 336 455-6677",
    padresGrupo: "Mini Femenino Somisa",
  },
  {
    id: "match-22",
    categoria: "Cadetes (U15)",
    rama: "F",
    local: "Sacachispas",
    visitante: "Somisa",
    fecha: "29/11/2026",
    hora: "18:00",
    observCancha: "",
    observaciones: "Final Copa oro J2",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Sacachispas (Visitante)",
    entrenador: "Prof. Paula",
    entrenadorTel: "+54 9 336 455-6677",
    padresGrupo: "U15 Femenino Somisa",
  },
  {
    id: "match-23",
    categoria: "Mayores (1°)",
    rama: "F",
    local: "Don Bosco",
    visitante: "Somisa",
    fecha: "29/11/2026",
    hora: "20:00",
    observCancha: "",
    observaciones: "Final copa plata J2",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Don Bosco (Visitante)",
    entrenador: "Prof. Nicolás",
    entrenadorTel: "+54 9 336 488-3344",
    padresGrupo: "Plantel 1° Femenino Somisa",
  },
  {
    id: "match-24",
    categoria: "Infantiles (U13)",
    rama: "F",
    local: "Belgrano",
    visitante: "Somisa",
    fecha: "06/12/2026",
    hora: "14:00",
    observCancha: "",
    observaciones: "Final copa plata J2",
    esCondicional: false,
    estado: "Confirmado",
    canchaAsignada: "Belgrano (Visitante)",
    entrenador: "Prof. Paula",
    entrenadorTel: "+54 9 336 455-6677",
    padresGrupo: "U13 Femenino Somisa",
  },
  {
    id: "match-25",
    categoria: "Mini (U11)",
    rama: "F",
    local: "Somisa",
    visitante: "ACSN",
    fecha: "13/12/2026",
    hora: "14:00",
    observCancha: "",
    observaciones: "J3 Si es necesario",
    esCondicional: true,
    estado: "Condicional",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Paula",
    entrenadorTel: "+54 9 336 455-6677",
    padresGrupo: "Mini Femenino Somisa",
  },
  {
    id: "match-26",
    categoria: "Cadetes (U15)",
    rama: "F",
    local: "Somisa",
    visitante: "Sacachispas",
    fecha: "13/12/2026",
    hora: "18:00",
    observCancha: "",
    observaciones: "J3 Si es necesario",
    esCondicional: true,
    estado: "Condicional",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Paula",
    entrenadorTel: "+54 9 336 455-6677",
    padresGrupo: "U15 Femenino Somisa",
  },
  {
    id: "match-27",
    categoria: "Mayores (1°)",
    rama: "F",
    local: "Somisa",
    visitante: "Don Bosco",
    fecha: "13/12/2026",
    hora: "20:00",
    observCancha: "",
    observaciones: "J3 Si es necesario",
    esCondicional: true,
    estado: "Condicional",
    canchaAsignada: "Gimnasio Principal",
    entrenador: "Prof. Nicolás",
    entrenadorTel: "+54 9 336 488-3344",
    padresGrupo: "Plantel 1° Femenino Somisa",
  },
];

// Endpoint to fetch default sample matches
app.get('/api/sample-fixture', (_req: Request, res: Response) => {
  res.json({
    success: true,
    matches: SAMPLE_MATCHES,
    sampleImage: '/assets/aistudio/WhatsApp_Image_2026-11-10_at_17.33.00_b26e2a22.jpeg',
  });
});

// Endpoint to parse uploaded image or raw text fixture using Gemini AI
app.post('/api/parse-fixture', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, textData } = req.body;

    if (!imageBase64 && !textData) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar una imagen o texto de la planilla.',
      });
    }

    const contents: any[] = [];

    const promptText = `
Sos un asistente experto en básquetbol formativo de la Asociación de Básquetbol (ABSN / CAB).
Tu tarea es analizar el documento adjunto (puede ser un documento PDF con fixture anual o semestral, planilla oficial, captura de pantalla o tabla de Excel) y extraer TODOS los partidos de básquetbol en formato estructurado.

Reglas de extracción:
1. "CATEGORIA": Ej. U9, Mini (U11), Infantiles (U13), Cadetes (U15), Juveniles (U17), Proximo (U21), Mayores (1°), U19, U12, etc. Normalizalo si dice "U-15", "Cat. 15", "Infantiles", etc.
2. "RAMA": Debe ser "Mixto", "F" (Femenino) o "M" (Masculino). Si no lo aclara y es categoría infantil o cadetes sin F, verificar el contexto o colocar "M" o "Mixto".
3. "LOCAL": Nombre exacto del equipo local (ej: "Somisa A", "Somisa B", "Somisa", "Don Bosco", "Regatas B", "Social", "ACSN", "Defensores", "Conesa", "Sacachispas", "Empalme Central", "Belgrano").
4. "VISITANTE": Nombre exacto del equipo visitante.
5. "FECHA": Formato DD/MM/YYYY (ej: 14/11/2026). Si está en blanco, a coordinar o solo dice "Fecha 1", dejar "" o la fecha estimada si aparece.
6. "HORA": Formato HH:MM (ej: 18:30). Si está en blanco, dejar "".
7. "OBSERV_CANCHA": Cancha o detalle (ej: "Gim 2", "Amistoso", "Cancha 1", "Estadio", etc.), de lo contrario "".
8. "OBSERVACIONES": Comentarios como "Promo", "Final Copa oro J1", "J3 Si es necesario", ronda, jornada o fecha de torneo.
9. "ES_CONDICIONAL": true si dice "Si es necesario", "J3", "Desempate" o es condicional, false de lo contrario.

IMPORTANTE: Extrae TODOS los partidos encontrados en todas las páginas o tablas del archivo sin omitir ninguno. SOMISA (Somisa, Somisa A o Somisa B) es el equipo principal de nuestro club.
`;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+.-]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: cleanBase64,
        },
      });
    }

    contents.push({
      text: textData ? `${promptText}\n\nDatos de texto / tabla:\n${textData}` : promptText,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: 'Extrae con total fidelidad y de manera completa todos los partidos del fixture de básquetbol anual o semestral.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              categoria: { type: Type.STRING, description: 'Categoría de básquet (ej: U9, Mini, U15, U17)' },
              rama: { type: Type.STRING, description: 'Rama: Mixto, F o M' },
              local: { type: Type.STRING, description: 'Club local' },
              visitante: { type: Type.STRING, description: 'Club visitante' },
              fecha: { type: Type.STRING, description: 'Fecha en DD/MM/YYYY o vacío' },
              hora: { type: Type.STRING, description: 'Hora en HH:MM o vacío' },
              observCancha: { type: Type.STRING, description: 'Observación de cancha (ej: Gim 2)' },
              observaciones: { type: Type.STRING, description: 'Observaciones (ej: Promo, Final Copa oro)' },
              esCondicional: { type: Type.BOOLEAN, description: 'True si es condicional o si es necesario' },
            },
            required: ['categoria', 'rama', 'local', 'visitante', 'fecha', 'hora'],
          },
        },
      },
    });

    const rawJson = response.text || '[]';
    const parsedMatches = JSON.parse(rawJson);

    // Enrich items with IDs and helper defaults
    const enriched = parsedMatches.map((item: any, idx: number) => {
      const isSomisaLocal = item.local?.toLowerCase().includes('somisa');
      const isSomisaVisit = item.visitante?.toLowerCase().includes('somisa');
      const isHome = isSomisaLocal;
      const isAway = isSomisaVisit;

      let estado = 'Confirmado';
      if (!item.fecha || !item.hora) {
        estado = 'A Coordinar';
      } else if (item.esCondicional || item.observaciones?.toLowerCase().includes('necesario')) {
        estado = 'Condicional';
      }

      // Default court
      let canchaAsignada = '';
      if (item.observCancha?.toLowerCase().includes('gim 2')) {
        canchaAsignada = 'Gimnasio 2';
      } else if (isHome) {
        canchaAsignada = 'Gimnasio Principal';
      } else {
        canchaAsignada = `${item.local} (Visitante)`;
      }

      // Assign coach by category and division according to official staff:
      // Diego: Proximo (U21) (M), Mayores (1°) (M) Somisa A
      // Lucas: Cadetes (U15) (M) Somisa A, Juveniles (U17) (M) Somisa A
      // Naza: U7 (Mixto), U9 (Mixto), Mini (U11) (Mixto) Somisa A
      // Franco: Mini (U11) (Mixto) Somisa B, Cadetes (U15) (M) Somisa B
      // Juan: Infantiles (U13) (F), Cadetes (U15) (F), Juveniles (U17) (F), Juveniles (U17) (M) Somisa B, Mayores (F)
      // Ruso: U9 (Mixto), Mini (U11) (Mixto) Somisa A, Mini (U11) (F), Mayores (1°) (M) Somisa B
      const cat = (item.categoria || '').toLowerCase();
      const isTeamB = (item.local || '').includes('Somisa B') || (item.visitante || '').includes('Somisa B');
      const isTeamA = (item.local || '').includes('Somisa A') || (item.visitante || '').includes('Somisa A');
      const isFem = item.rama === 'F';

      let entrenador = 'Prof. Naza';
      let entrenadorTel = '+54 9 336 411-2233';

      if (isFem) {
        if (cat.includes('mini') || cat.includes('u11')) {
          entrenador = 'Prof. Ruso';
          entrenadorTel = '+54 9 336 422-9900';
        } else {
          entrenador = 'Prof. Juan';
          entrenadorTel = '+54 9 336 455-6677';
        }
      } else if (cat.includes('21') || cat.includes('proximo')) {
        entrenador = 'Prof. Diego';
        entrenadorTel = '+54 9 336 488-3344';
      } else if (cat.includes('mayor') || cat.includes('1°')) {
        if (isTeamB) {
          entrenador = 'Prof. Ruso';
          entrenadorTel = '+54 9 336 422-9900';
        } else {
          entrenador = 'Prof. Diego';
          entrenadorTel = '+54 9 336 488-3344';
        }
      } else if (cat.includes('17') || cat.includes('juvenil')) {
        if (isTeamB) {
          entrenador = 'Prof. Juan';
          entrenadorTel = '+54 9 336 455-6677';
        } else {
          entrenador = 'Prof. Lucas';
          entrenadorTel = '+54 9 336 433-1122';
        }
      } else if (cat.includes('15') || cat.includes('cadete')) {
        if (isTeamB) {
          entrenador = 'Prof. Franco';
          entrenadorTel = '+54 9 336 477-8899';
        } else {
          entrenador = 'Prof. Lucas';
          entrenadorTel = '+54 9 336 433-1122';
        }
      } else if (cat.includes('mini') || cat.includes('u11')) {
        if (isTeamB) {
          entrenador = 'Prof. Franco';
          entrenadorTel = '+54 9 336 477-8899';
        } else {
          entrenador = 'Prof. Naza';
          entrenadorTel = '+54 9 336 411-2233';
        }
      } else if (cat.includes('u9') || cat.includes('pre mini') || cat.includes('u7')) {
        entrenador = 'Prof. Naza';
        entrenadorTel = '+54 9 336 411-2233';
      }

      return {
        id: `match-parsed-${Date.now()}-${idx}`,
        categoria: item.categoria || 'Mini',
        rama: item.rama || 'Mixto',
        local: item.local || 'Somisa',
        visitante: item.visitante || 'Rival',
        fecha: item.fecha || '',
        hora: item.hora || '',
        observCancha: item.observCancha || '',
        observaciones: item.observaciones || '',
        esCondicional: Boolean(item.esCondicional),
        estado,
        canchaAsignada,
        entrenador,
        entrenadorTel,
        padresGrupo: `${item.categoria} ${item.rama} Somisa`,
      };
    });

    res.json({
      success: true,
      matches: enriched,
      count: enriched.length,
    });
  } catch (error: any) {
    console.error('Error parsing fixture with Gemini:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Error al procesar la planilla con IA.',
    });
  }
});

// Configure Vite or Static Serve
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SOMISA Básquet Fixture App listening on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
