import Link from "next/link";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { waLink } from "@/lib/storefront";

type SiteHeaderProps = {
  onOpenSizeGuide: () => void;
};

export default function SiteHeader({ onOpenSizeGuide }: SiteHeaderProps) {
  return (
    <header className="header site-header">
      <Link className="logo" href="/" aria-label="Heilig, início">
        HEILIG<sup>®</sup>
      </Link>
      <nav className="nav" aria-label="Navegação principal">
        <a
          href="#detalhes"
          onClick={(event) => {
            event.preventDefault();
            const reel = document.querySelector<HTMLElement>(".reel");
            if (!reel) return;

            const reelTop = reel.getBoundingClientRect().top + window.scrollY;
            const scrollDistance = Math.max(0, reel.offsetHeight - window.innerHeight);
            window.scrollTo({ top: reelTop + scrollDistance * 0.52, behavior: "smooth" });
          }}
        >
          Detalhes
        </a>
        <Link href="/produtos" prefetch>Produtos</Link>
        <a
          href="#medidas"
          onClick={(event) => {
            event.preventDefault();
            onOpenSizeGuide();
          }}
        >
          Medidas
        </a>
      </nav>
      <a
        className="button header-whats"
        href={waLink("Olá! Vim pelo site da Heilig e gostaria de saber mais sobre as camisetas.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
      >
        <WhatsAppIcon />
        WhatsApp
      </a>
    </header>
  );
}
