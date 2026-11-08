export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em" }}>404</p>
        <h1 style={{ margin: "0.5rem 0 0", fontSize: "clamp(2rem, 6vw, 4rem)" }}>Página não encontrada</h1>
      </div>
    </main>
  );
}
