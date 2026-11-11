# 🏀 Club SOMISA Básquet - Coordinador Oficial de Partidos y Cronogramas

Sistema integral desarrollado para la **Subcomisión de Básquetbol del Club SOMISA de San Nicolás de los Arroyos**, diseñado para coordinar, fijar horarios, generar planillas oficiales reglamentarias, despachar notificaciones a los entrenadores, enviar convocatorias a los grupos de familias por WhatsApp, emitir correos a los clubes rivales y exportar tanto a formato PDF como a calendarios sincronizados.

---

## 🌐 Aplicación Web en Vivo

Puedes acceder y utilizar la aplicación de manera inmediata desde cualquier computadora o teléfono móvil en el siguiente enlace:

👉 **[Abrir SOMISA Básquet en la Web](https://ais-pre-hycio7jbwcuw6qce52qfl2-851449046284.us-east1.run.app)**

---

## 🚀 Principales Funcionalidades

1. **📋 Planilla Oficial del Torneo**:
   - Réplica exacta de la grilla reglamentaria de la Asociación (`CATEGORIA`, `RAMA`, `LOCAL`, `VISITANTE`, `FECHA`, `HORA`, `OBSERV. CANCHA`, `OBSERVACIONES`).
   - Resaltado automático en amarillo para cruces condicionales (*"J3 Si es necesario"*).
   - Resaltado en rojo para alertas de cancha (*Gim 2*), instancias decisivas (*Final Copa Oro/Plata*), *Promo* y *Amistosos*.
   - Edición rápida en línea haciendo clic sobre cualquier fecha u hora.

2. **🤖 Subida Inteligente con IA (Gemini 3.8 Flash)**:
   - Sube una foto o captura de pantalla de la planilla enviada por la liga y la IA extrae automáticamente todos los partidos y los carga estructurados en el sistema.

3. **⏰ Coordinador de Días, Horarios y Canchas**:
   - Panel de control para partidos de **SOMISA Local** (Gimnasio Principal o Gimnasio 2) y **SOMISA Visitante**.
   - Selector rápido de tiras habituales de sábado y domingo.
   - **Detector de conflictos en tiempo real**: Advierte si hay solapamiento de partidos en la misma cancha o intervalos menores a 60 minutos.

4. **👨‍🏫 Gestión de Entrenadores y Notificaciones por WhatsApp**:
   - Registro y edición completa de los nombres, teléfonos, emails y categorías de los profesores del cuerpo técnico.
   - Sincronización automática de nombres modificados en todos los partidos.
   - Despacho con un solo clic a WhatsApp con el cronograma y hora de citación de cada DT.

5. **👨‍👩‍👧‍👦 Mensajes para Grupos de Familias (WhatsApp)**:
   - Redacción automática de convocatorias para cada categoría: rival, fecha, hora del partido, horario de citación (45 min antes), cancha, selector de indumentaria (Camiseta Azul Titular o Blanca Suplente) y recordatorios de DNI e hidratación.
   - Vista previa interactiva estilo chat de WhatsApp.

6. **✉️ Envío Formal a Clubes Rivales**:
   - Directorio de clubes de la zona (Don Bosco, Regatas, Belgrano, Conesa, Social, ACSN, Sacachispas, Empalme Central, Defensores).
   - Generación de correos formales con la grilla de partidos y botón directo para abrir en el cliente de correo (`mailto:`).

7. **📄 Exportación a PDF Reglamentario y Calendario Sincronizado**:
   - Descarga de planilla PDF en formato apaisado con el escudo oficial del Club SOMISA, membrete y notas.
   - Archivo `.ics` descargable compatible con Google Calendar, Apple Calendar y Outlook, con recordatorio programado 2 horas antes de cada partido.

---

## 🛠️ Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **Express** (API Backend y servidor proxy para Gemini AI)
- **@google/genai** (SDK oficial de Gemini 3.8 Flash para OCR)
- **jsPDF & jsPDF-AutoTable** (Generación de PDFs vectoriales con escudo y tablas)
- **Lucide Icons**

---

## 📦 Instrucciones para Subir a GitHub

Si deseas publicar este proyecto en tu propia cuenta de **GitHub**, sigue estos sencillos pasos desde la terminal:

```bash
# 1. Crea un nuevo repositorio vacío en tu cuenta de GitHub (ej: "somisa-basquet")
#    (No marques la casilla de inicializar con README si ya tienes este código)

# 2. En tu terminal local dentro de esta carpeta, vincula tu repositorio remoto de GitHub:
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 3. Cambia la rama a main y sube los cambios:
git branch -M main
git push -u origin main
```

---

## 💻 Ejecución Local

Para ejecutar el proyecto en tu computadora:

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   Copia el archivo `.env.example` a `.env` y añade tu clave de Gemini si deseas usar el procesador de imágenes por IA:
   ```bash
   cp .env.example .env
   ```

3. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

---

## 🌐 Opciones para Desplegar en la Web

Además del enlace ya activo en AI Studio, puedes desplegar este repositorio fácilmente en:

- **Vercel**: Conecta tu repositorio de GitHub y selecciona el framework Vite.
- **Render / Railway**: Despliega como aplicación Node.js ejecutando `npm run start`.
- **Google Cloud Run**: Usando el Dockerfile o Cloud Native Buildpacks.

---

**Club SOMISA - San Nicolás de los Arroyos, Buenos Aires, Argentina**  
*Subcomisión de Divisiones Formativas y Mini Básquetbol*
