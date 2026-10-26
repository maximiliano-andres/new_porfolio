# Portfolio - FastAPI & React (Vite)

Este proyecto consiste en un portafolio web que integra un backend desarrollado con **FastAPI** y un frontend moderno con **React** construido sobre **Vite** y **TailwindCSS**.

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [Python 3.9+](https://www.python.org/)

---

## 🛠️ Configuración Inicial

### 1. Clonar e ingresar al repositorio
Abre una terminal en la carpeta del proyecto.

### 2. Configurar el Backend (FastAPI)
Crea y activa un entorno virtual de Python, luego instala las dependencias necesarias:

```bash
# Crear entorno virtual (.venv)
python3 -m venv .venv

# Activar entorno virtual
# En macOS/Linux:
source .venv/bin/activate
# En Windows (Command Prompt):
# .venv\Scripts\activate.bat
# En Windows (PowerShell):
# .venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar el Frontend (React)
Instala las dependencias de Node.js:

```bash
npm install
```

---

## 💻 Ejecución en Modo Desarrollo

Para trabajar en el proyecto con recarga automática (*Hot Reload*) tanto en frontend como en backend, puedes correr ambos servicios en paralelo en terminales distintas:

### Terminal 1: Servidor Backend (FastAPI)
Asegúrate de tener el entorno virtual activo:
```bash
# Con el entorno virtual activo (modo desarrollo: recarga automática y /docs habilitado):
APP_ENV=development python main.py
```
*El backend de desarrollo correrá en: `http://localhost:8000`*

### Terminal 2: Servidor Frontend (React + Vite)
```bash
npm run dev
```
*El frontend de desarrollo correrá en: `http://localhost:5173` (o el puerto que indique la terminal)*

---

## 📦 Despliegue / Producción

En producción, FastAPI se encarga de servir tanto la API como el frontend compilado desde una sola dirección.

1. **Compilar el frontend de React:**
   ```bash
   npm run build
   ```
   Esto generará los archivos optimizados dentro de la carpeta `dist/`.

2. **Iniciar el servidor FastAPI:**
   ```bash
   python main.py
   ```
   FastAPI detectará automáticamente la carpeta `dist/` y servirá el portafolio completo en `http://localhost:8000`.

### Configuración (variables de entorno, todas opcionales)

| Variable | Por defecto | Uso |
|---|---|---|
| `APP_ENV` | `production` | `development` habilita recarga automática y la documentación `/docs` |
| `HOST` / `PORT` | `127.0.0.1` / `8000` | Usa `0.0.0.0` solo detrás de un proxy o firewall |
| `CORS_ORIGINS` | — | Orígenes extra separados por coma (el dev server de Vite ya está permitido) |
| `TRUST_PROXY` | — | `1` para tomar la IP del cliente desde `X-Forwarded-For` (solo detrás de un proxy confiable) |
| `ENABLE_HSTS` | — | `1` cuando el sitio se sirve exclusivamente por HTTPS |

### Seguridad incluida

- Cabeceras: Content-Security-Policy, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP (y HSTS opcional).
- `/api/contact`: validación con límites (nombre 100, email 254, mensaje 5000 caracteres), cuerpo máximo de 16 KB,
  5 envíos cada 10 minutos por IP (responde `429` con `Retry-After`) y un campo trampa contra bots.
- Los mensajes se guardan en `contact_messages.jsonl` (ignorado por git) con permisos `0600`; el log del servidor no registra su contenido.
- Errores con respuestas JSON genéricas; los detalles quedan solo en el log del servidor.
- Solo se publican desde `dist/` tipos de archivo estáticos conocidos y sin posibilidad de salir de la carpeta.

---

## 📁 Estructura del Proyecto

- `main.py` - Punto de entrada del servidor FastAPI y configuración de rutas API/Estáticos.
- `src/` - Código fuente del frontend en React (`PolyglotPortfolio.jsx` es la app; `components/`, `windows/`, `overlays/`, `data/` y `lib/` contienen los módulos).
- `dist/` - Frontend compilado listo para producción (generado por `npm run build`).
- `requirements.txt` - Dependencias de Python (FastAPI, Uvicorn).
- `package.json` - Configuración y dependencias del frontend (Vite, React, TailwindCSS).
- `tailwind.config.js` y `postcss.config.js` - Configuración de estilos visuales.

---

## ✅ Calidad

```bash
npm run lint    # ESLint (configuración en .eslintrc.cjs)
npm run build   # compila y separa el código en chunks (react, motion, app y una por ventana)
```
