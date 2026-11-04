import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Portfolio render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "#05070b",
            color: "#c9d1d9",
            fontFamily: "'Inter', 'Inter Fallback', sans-serif",
            textAlign: "center",
            padding: "1.5rem",
          }}
        >
          <p style={{ fontSize: "14px" }}>Algo salió mal cargando el portafolio.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#c9d1d9",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
