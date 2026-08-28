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
# Con el entorno virtual activo:
python main.py
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

---

## 📁 Estructura del Proyecto

- `main.py` - Punto de entrada del servidor FastAPI y configuración de rutas API/Estáticos.
- `src/` - Código fuente del frontend en React.
- `dist/` - Frontend compilado listo para producción (generado por `npm run build`).
- `requirements.txt` - Dependencias de Python (FastAPI, Uvicorn).
- `package.json` - Configuración y dependencias del frontend (Vite, React, TailwindCSS).
- `tailwind.config.js` y `postcss.config.js` - Configuración de estilos visuales.
