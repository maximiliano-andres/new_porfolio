from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone
import json
import os
import re

app = FastAPI(title="Portfolio Server")

# Configurar CORS: sólo el dev server de Vite necesita origen cruzado.
# En producción, FastAPI sirve el frontend compilado desde el mismo origen.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Ruta a la carpeta estática del frontend compilado (por ejemplo, con Vite)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
CONTACT_LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "contact_messages.jsonl")

EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


class ContactMessage(BaseModel):
    name: str
    email: str
    message: str

    @field_validator("name", "message")
    @classmethod
    def not_blank(cls, v):
        if not v.strip():
            raise ValueError("no puede estar vacío")
        return v.strip()

    @field_validator("email")
    @classmethod
    def valid_email(cls, v):
        if not EMAIL_RE.match(v):
            raise ValueError("email inválido")
        return v


# Rutas de la API pueden ir aquí
@app.get("/api/status")
async def get_status():
    return {"status": "ok", "message": "FastAPI server is running!"}


@app.post("/api/contact")
async def submit_contact(payload: ContactMessage):
    entry = {
        "name": payload.name,
        "email": payload.email,
        "message": payload.message,
        "received_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        with open(CONTACT_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError as exc:
        raise HTTPException(status_code=500, detail="No se pudo guardar el mensaje.") from exc
    return {"status": "ok"}

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
