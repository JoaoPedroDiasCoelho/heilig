import type { RefObject } from "react";

type DetailsSectionProps = {
  sectionRef: RefObject<HTMLElement | null>;
  visualRef: RefObject<HTMLDivElement | null>;
};

export default function DetailsSection({ sectionRef, visualRef }: DetailsSectionProps) {
  return (
    <section className="details" id="detalhes" ref={sectionRef}>
      <p className="details-head">01 — Os detalhes da peça</p>
      <p className="back-detail" aria-hidden="true">Back print</p>
      <div className="detail-visual" ref={visualRef} aria-hidden="true" />

      <div className="captions">
        <article className="caption">
          <small className="caption-number">01 —</small>
          <strong>Algodão pesado</strong>
          <span>Malha encorpada de 260 g/m², toque firme e estrutura durável.</span>
        </article>
        <article className="caption">
          <small className="caption-number">02 —</small>
          <strong>Caimento oversized</strong>
          <span>Ombro caído e volume amplo, pensados para vestir sem esforço.</span>
        </article>
        <article className="caption">
          <small className="caption-number">03 —</small>
          <strong>Construção</strong>
          <span>Gola em ribana que mantém o formato após o uso.</span>
        </article>
        <article className="caption">
          <small className="caption-number">04 —</small>
          <strong>Acabamento</strong>
          <span>Barra longa para proporção equilibrada e sobreposições naturais.</span>
        </article>
      </div>
    </section>
  );
}
