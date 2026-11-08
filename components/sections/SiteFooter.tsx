import WhatsAppIcon from "@/components/WhatsAppIcon";
import { waLink } from "@/lib/storefront";

export default function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <div className="footer-brand-block">
        <a className="footer-brand" href="#inicio">HEILIG<sup>®</sup></a>
        <a
          className="footer-social-link"
          href="https://instagram.com/heilig"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram da HEILIG"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle className="footer-social-dot" cx="17.5" cy="6.5" r="1" />
          </svg>
        </a>
      </div>

      <address className="footer-contact">
        <a href="mailto:contato@heilig.com.br">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          contato@heilig.com.br
        </a>
        <a href="tel:+5524988740135">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-7-7l3-2-2-5Z" />
          </svg>
          +55 (24) 98873-0135
        </a>
      </address>

      <a
        className="button footer-whatsapp"
        href={waLink("Olá! Vim pelo site da Heilig e gostaria de saber mais sobre as camisetas.")}
        target="_blank"
        rel="noopener noreferrer"
      >
        <WhatsAppIcon />
        Falar no WhatsApp
      </a>
    </footer>
  );
}
