import type { RefObject } from "react";

type HeroSectionProps = {
  sectionRef: RefObject<HTMLElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export default function HeroSection({ sectionRef, canvasRef }: HeroSectionProps) {
  return (
    <section className="hero" id="inicio" ref={sectionRef}>
      <div className="hero-text">
        <p className="eyebrow">Algodão pesado · 260 g/m²</p>
        <h1>Volume<br />em forma.</h1>
        <p className="hero-copy">
          Camisetas de construção ampla, toque firme e proporções pensadas
          para vestir sem esforço.
        </p>
        <a className="button" href="#colecao">Ver coleção</a>
      </div>

      <div className="shirt-stage">
        <canvas
          ref={canvasRef}
          aria-label="Camiseta oversized branca girando no cabide"
        />
        <p className="stage-note">Role para ver a construção</p>
      </div>
    </section>
  );
}