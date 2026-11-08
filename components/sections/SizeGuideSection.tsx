import { useEffect } from "react";

type SizeGuideSectionProps = {
  onClose: () => void;
};

export default function SizeGuideSection({ onClose }: SizeGuideSectionProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="size-guide-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sizeGuideTitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="size-guide-modal sizes" id="medidas">
        <button
          className="icon-btn size-guide-close"
          type="button"
          onClick={onClose}
          aria-label="Fechar guia de medidas"
        >
          ×
        </button>

        <div className="section-head">
          <h2 id="sizeGuideTitle">Medidas</h2>
          <p>
            Modelagem ampla. Compare com uma peça que você já usa para
            encontrar seu tamanho.
          </p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tamanho</th>
                <th>Largura</th>
                <th>Comprimento</th>
                <th>Manga</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>P</td><td>58 cm</td><td>72 cm</td><td>23 cm</td></tr>
              <tr><td>M</td><td>61 cm</td><td>74 cm</td><td>24 cm</td></tr>
              <tr><td>G</td><td>64 cm</td><td>76 cm</td><td>25 cm</td></tr>
              <tr><td>GG</td><td>67 cm</td><td>78 cm</td><td>26 cm</td></tr>
              <tr><td>EXG</td><td>70 cm</td><td>80 cm</td><td>27 cm</td></tr>
            </tbody>
          </table>
        </div>

        <p className="notice">
          As medidas podem variar em até 3% devido ao processo de fabricação.
        </p>
      </section>
    </div>
  );
}
