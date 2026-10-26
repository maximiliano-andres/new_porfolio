/* Error isolation for windows and overlays: a crash inside one section — or a code chunk that
   fails to download — shows a recoverable message there instead of taking the whole portfolio down. */
import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

const isChunkLoadError = (error) =>
  /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(String(error?.message));

export class SectionBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.name || "section"}] render error:`, error, info?.componentStack);
  }

  // a stale or failed download is only recoverable with fresh assets; other errors get a fresh render
  retry = () => {
    if (isChunkLoadError(this.state.error)) window.location.reload();
    else this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.silent) return null; // overlays: failing quietly is better than a broken layer
    const offline = isChunkLoadError(this.state.error);
    return (
      <div role="alert" className="w-full flex flex-col items-center text-center gap-3 py-8 px-4">
        <AlertTriangle size={26} className="text-amber-400" />
        <div>
          <p className="text-[13px] font-medium text-white/90">Esta sección no se pudo mostrar.</p>
          <p className="text-[12px] text-white/55 mt-1">
            {offline ? "Revisa tu conexión a internet e inténtalo otra vez." : "Ocurrió un error inesperado. El resto del portafolio sigue funcionando."}
          </p>
        </div>
        <button
          onClick={this.retry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] text-white/80 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
        >
          <RotateCcw size={13} /> Reintentar
        </button>
      </div>
    );
  }
}

/* placeholder shown while a window's code chunk downloads */
export function WindowSkeleton() {
  return (
    <div className="w-full space-y-3 animate-pulse py-1" aria-busy="true" aria-label="Cargando">
      <div className="h-3 w-2/3 rounded bg-white/10" />
      <div className="h-3 w-full rounded bg-white/[0.07]" />
      <div className="h-3 w-5/6 rounded bg-white/[0.07]" />
      <div className="h-20 w-full rounded-lg bg-white/[0.05] mt-4" />
    </div>
  );
}
