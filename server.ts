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
app.use(express.json({ limit: '25mb' }));

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
Sos un asistente experto en básquetbol formativo de la Asociación de Básquetbol.
Tu tarea es analizar la planilla de partidos adjunta y extraer todos los partidos en un formato estructurado.

Reglas de extracción:
1. "CATEGORIA": Ej. U9, Mini (U11), Infantiles (U13), Cadetes (U15), Juveniles (U17), Proximo (U21), Mayores (1°), etc.
2. "RAMA": Debe ser "Mixto", "F" (Femenino) o "M" (Masculino).
3. "LOCAL": Nombre exacto del equipo local (ej: "Somisa A", "Somisa B", "Somisa", "Don Bosco", "Regatas B", "Social", "ACSN", "Defensores", "Conesa", "Sacachispas", "Empalme Central", "Belgrano").
4. "VISITANTE": Nombre exacto del equipo visitante.
5. "FECHA": Formato DD/MM/YYYY (ej: 14/11/2026). Si está en blanco o a confirmar, dejar "".
6. "HORA": Formato HH:MM (ej: 18:30). Si está en blanco, dejar "".
7. "OBSERV_CANCHA": Si indica cancha o detalle (ej: "Gim 2", "Amistoso", "Cancha 1"), de lo contrario "".
8. "OBSERVACIONES": Si tiene comentarios como "Promo", "Final Copa oro J1", "Final Copa Plata J1", "J3 Si es necesario", etc.
9. "ES_CONDICIONAL": true si dice "Si es necesario" o "J3", false de lo contrario.

SOMISA (Somisa, Somisa A o Somisa B) es el equipo principal de nuestro club.
`;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    contents.push({
      text: textData ? `${promptText}\n\nDatos de texto:\n${textData}` : promptText,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: 'Extrae con total fidelidad la tabla de partidos de básquetbol.',
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

      // Assign coach by category
      const cat = (item.categoria || '').toLowerCase();
      let entrenador = 'Prof. Marcos';
      let entrenadorTel = '+54 9 336 411-2233';
      if (cat.includes('15') || cat.includes('cadetes')) {
        entrenador = 'Prof. Juan Martín';
        entrenadorTel = '+54 9 336 422-9900';
      } else if (cat.includes('17') || cat.includes('juveniles') || cat.includes('u21')) {
        entrenador = 'Prof. Lucas';
        entrenadorTel = '+54 9 336 433-1122';
      } else if (cat.includes('mayor') || cat.includes('1°')) {
        entrenador = 'Prof. Nicolás';
        entrenadorTel = '+54 9 336 488-3344';
      } else if (item.rama === 'F') {
        entrenador = 'Prof. Paula';
        entrenadorTel = '+54 9 336 455-6677';
      } else if (item.local?.includes('Somisa B') || item.visitante?.includes('Somisa B')) {
        entrenador = 'Prof. Federico';
        entrenadorTel = '+54 9 336 477-8899';
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
