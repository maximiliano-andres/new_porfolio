from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Portfolio Server")

# Configurar CORS (útil durante el desarrollo si separas el frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta a la carpeta estática del frontend compilado (por ejemplo, con Vite)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

# Rutas de la API pueden ir aquí
@app.get("/api/status")
async def get_status():
    return {"status": "ok", "message": "FastAPI server is running!"}

# Si existe la carpeta dist, servimos el frontend
if os.path.isdir(FRONTEND_DIR):
    # Servir archivos estáticos (JS, CSS, imágenes)
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

@app.get("/{catchall:path}")
async def serve_frontend(catchall: str):
    """
    Sirve el archivo index.html para todas las demás rutas.
    Esto es necesario para que el enrutamiento del lado del cliente (React Router) funcione.
    """
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "El frontend no está compilado. Por favor compila tu código de React (ej. Vite) en la carpeta 'dist'."}

if __name__ == "__main__":
    import uvicorn
    # Iniciar el servidor en el puerto 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
