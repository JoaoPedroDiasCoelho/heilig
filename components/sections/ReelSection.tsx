"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { waLink } from "@/lib/storefront";

gsap.registerPlugin(ScrollTrigger);

const REEL_DURATION = 10;
const CHAPTER_STARTS = [0, 1.9, 3.3, 5.2, 6.9, 9.2];
const CHAPTER_ENDS = [1.2, 3.1, 5, 6.7, 9, null] as const;

type ReelSectionProps = {
  onOpenSizeGuide: () => void;
};

function ChapterTitle({
  lines,
  className = "",
  as: Title = "h2",
}: {
  lines: string[];
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Title className={`chapter-title ${className}`.trim()}>
      {lines.map((line) => (
        <span className="line" key={line}>
          <span className="in">{line}</span>
        </span>
      ))}
    </Title>
  );
}

export default function ReelSection({ onOpenSizeGuide }: ReelSectionProps) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.pause();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const showStaticFrame = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        video.currentTime = Math.min(6.2, Math.max(0, video.duration - 0.05));
      }
    };
    const handleMetadata = () => {
      if (reducedMotion.matches) showStaticFrame();
      ScrollTrigger.refresh();
    };

    video.addEventListener("loadedmetadata", handleMetadata);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) handleMetadata();

    const media = gsap.matchMedia();
    media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        if (context.conditions?.reduce || !context.conditions?.motion) {
          showStaticFrame();
          return;
        }

        const select = gsap.utils.selector(root);
        const videoTime = { value: 0 };
        const fabricWeight = { value: 0 };
        const titleWidth = { value: 100 };
        const timecode = select(".timecode")[0];
        const weightReadout = select(".weight-number")[0];
        const heroTitle = select(".hero-title")[0] as HTMLElement | undefined;
        const chapters = CHAPTER_STARTS.map((_, index) =>
          select(`#chapter-${index}`)[0]
        );
        const dots = select(".rail-dot");
        const callouts = select(".callout");

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        timeline.addLabel("intro", 0);

        timeline.to(
          videoTime,
          {
            value: REEL_DURATION - 0.05,
            duration: REEL_DURATION,
            onUpdate: () => {
              if (
                video.readyState >= HTMLMediaElement.HAVE_METADATA &&
                !video.seeking &&
                Math.abs(video.currentTime - videoTime.value) > 0.03
              ) {
                video.currentTime = videoTime.value;
              }
              if (timecode) {
                timecode.textContent = `REEL 00:${String(
                  Math.floor(videoTime.value)
                ).padStart(2, "0")}`;
              }
            },
          },
          0
        );

        timeline.to(
          titleWidth,
          {
            value: 125,
            duration: 1.4,
            onUpdate: () => {
              if (heroTitle) {
                heroTitle.style.fontVariationSettings = `'wdth' ${titleWidth.value}`;
              }
            },
          },
          0
        );

        timeline.fromTo(
          select(".progress-fill"),
          { scaleX: 0 },
          { scaleX: 1, duration: REEL_DURATION },
          0
        );
        timeline.fromTo(
          select(".rail-fill"),
          { scaleY: 0 },
          { scaleY: 1, duration: REEL_DURATION },
          0
        );
        timeline.fromTo(
          select(".reel-glow"),
          { opacity: 0.15, scale: 0.8 },
          { opacity: 0.6, scale: 1.3, duration: REEL_DURATION },
          0
        );

        CHAPTER_STARTS.forEach((start, index) => {
          const chapter = chapters[index];
          if (!chapter) return;

          timeline.addLabel(`chapter-${index}`, start);

          if (index > 0) {
            const lines = select(`#chapter-${index} .in`);
            const details = select(`#chapter-${index} .fd`);

            timeline.fromTo(
              chapter,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.02 },
              start
            );
            timeline.fromTo(
              lines,
              { yPercent: 110 },
              {
                yPercent: 0,
                duration: 0.45,
                ease: "power3.out",
                stagger: 0.07,
              },
              start
            );
            timeline.fromTo(
              details,
              { autoAlpha: 0, y: 16 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
                stagger: 0.06,
              },
              start + 0.15
            );
            timeline.fromTo(
              dots[index],
              { opacity: 0.3, scale: 1 },
              { opacity: 1, scale: 1.5, duration: 0.2 },
              start
            );
          }

          const end = CHAPTER_ENDS[index];
          if (end !== null) {
            timeline.addLabel(`chapter-${index}-out`, end);
            timeline.to(
              select(`#chapter-${index} .in`),
              {
                yPercent: -110,
                duration: 0.35,
                ease: "power3.in",
                stagger: 0.05,
              },
              end
            );
            timeline.to(
              select(`#chapter-${index} .fd`),
              { autoAlpha: 0, y: -16, duration: 0.3 },
              end
            );
            if (index > 0) {
              timeline.to(chapter, { autoAlpha: 0, duration: 0.02 }, end + 0.5);
            }
          }
        });

        gsap.set(dots[0], { opacity: 1, scale: 1.5 });

        timeline.fromTo(
          fabricWeight,
          { value: 0 },
          {
            value: 260,
            duration: 1.5,
            ease: "power2.out",
            snap: { value: 1 },
            onUpdate: () => {
              if (weightReadout) {
                weightReadout.textContent = String(Math.round(fabricWeight.value));
              }
            },
          },
          3.5
        );

        timeline.to(callouts, { autoAlpha: 1, duration: 0.02 }, 5.32);
        timeline.fromTo(
          select(".callout .dot"),
          { scale: 0 },
          {
            scale: 1,
            duration: 0.3,
            ease: "back.out(2.5)",
            stagger: 0.15,
          },
          5.35
        );
        timeline.fromTo(
          select(".callout .line-r"),
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.35,
            ease: "power2.out",
            stagger: 0.15,
          },
          5.5
        );
        timeline.fromTo(
          select(".callout .tag"),
          { autoAlpha: 0, y: 8 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
            stagger: 0.15,
          },
          5.7
        );
        timeline.to(callouts, { autoAlpha: 0, duration: 0.25 }, 6.55);

        const siteNav = document.querySelector(".site-header");
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        if (siteNav) {
          intro.from(siteNav, { yPercent: -160, autoAlpha: 0, duration: 0.9 }, 0);
        }
        intro
          .from(select("#chapter-0 .in"), {
            yPercent: 110,
            duration: 1.1,
            stagger: 0.1,
          }, 0.1)
          .from(select("#chapter-0 .fd"), {
            autoAlpha: 0,
            y: 20,
            duration: 0.8,
            stagger: 0.1,
          }, 0.7)
          .from(select(".rail, .timecode"), { autoAlpha: 0, duration: 0.8 }, 0.9);

        const syncVideoAfterSeek = () => {
          if (
            !video.seeking &&
            video.readyState >= HTMLMediaElement.HAVE_METADATA &&
            Math.abs(video.currentTime - videoTime.value) > 0.03
          ) {
            video.currentTime = videoTime.value;
          }
        };
        const refreshScroll = () => ScrollTrigger.refresh();
        video.addEventListener("seeked", syncVideoAfterSeek);
        video.addEventListener("loadedmetadata", refreshScroll);

        return () => {
          video.removeEventListener("seeked", syncVideoAfterSeek);
          video.removeEventListener("loadedmetadata", refreshScroll);
          heroTitle?.style.removeProperty("font-variation-settings");
        };
      },
      root
    );

    return () => {
      media.revert();
      video.removeEventListener("loadedmetadata", handleMetadata);
    };
  }, []);

  return (
    <>
      <section className="reel" id="inicio" ref={rootRef} aria-label="Heilig: Volume em forma">
        <div className="reel-stage">
          <video
            ref={videoRef}
            className="reel-video"
            src="/video/heilig-reel.mp4"
            preload="auto"
            muted
            playsInline
            aria-hidden="true"
          />
          <div className="reel-veil" aria-hidden="true" />
          <div className="reel-glow" aria-hidden="true" />

          <article className="chapter" id="chapter-0">
            <div className="chapter-copy">
              <p className="eyebrow fd"><span className="eyebrow-mark" />Algodão pesado · 260 g/m²</p>
              <ChapterTitle lines={["Volume", "em", "forma."]} as="h1" className="hero-title" />
              <p className="chapter-description fd">
                Camisetas de construção ampla, toque firme e proporções pensadas
                para vestir sem esforço.
              </p>
              <div className="chapter-actions fd">
                <a className="button" href="#colecao">Ver coleção</a>
                <button className="button button-ghost" type="button" onClick={onOpenSizeGuide}>
                  Guia de medidas
                </button>
              </div>
            </div>
          </article>

          <article className="chapter" id="chapter-1">
            <div className="chapter-copy">
              <p className="eyebrow fd"><span className="eyebrow-mark" /><span className="eyebrow-number">01</span>A caixa</p>
              <ChapterTitle lines={["Abra a", "caixa."]} />
              <p className="chapter-description fd">Toque firme desde o primeiro contato.</p>
            </div>
          </article>

          <article className="chapter chapter-weight" id="chapter-2">
            <div className="chapter-copy">
              <p className="eyebrow fd"><span className="eyebrow-mark" /><span className="eyebrow-number">02</span>Tecido</p>
              <h2 className="weight-display" aria-label="260 gramas por metro quadrado">
                <span className="weight-number">0</span>
                <span className="weight-unit">g/m²</span>
              </h2>
              <p className="chapter-description fd">Algodão pesado, para dar corpo à peça.</p>
            </div>
          </article>

          <article className="chapter" id="chapter-3">
            <span className="reel-anchor" id="detalhes" aria-hidden="true" />
            <div className="chapter-copy">
              <p className="eyebrow fd"><span className="eyebrow-mark" /><span className="eyebrow-number">03</span>Corte</p>
              <ChapterTitle lines={["Construção", "ampla."]} />
              <p className="chapter-description fd">
                Proporções pensadas para vestir sem esforço.
              </p>
            </div>
          </article>

          <article className="chapter" id="chapter-4">
            <div className="chapter-copy">
              <p className="eyebrow fd"><span className="eyebrow-mark" /><span className="eyebrow-number">04</span>Estampa</p>
              <ChapterTitle lines={["Frente.", "Costas."]} />
              <p className="chapter-description fd">Duas faces, a mesma proporção.</p>
            </div>
          </article>

          <article className="chapter" id="chapter-5">
            <div className="chapter-copy">
              <p className="eyebrow fd"><span className="eyebrow-mark" /><span className="eyebrow-number">05</span>Coleção</p>
              <ChapterTitle lines={["Escolha", "a sua."]} />
              <div className="chapter-actions fd">
                <a className="button" href="#colecao">Ver coleção</a>
                <a
                  className="button button-ghost"
                  href={waLink("Olá! Vim pelo site da Heilig e gostaria de saber mais sobre as camisetas.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon /> Falar no WhatsApp
                </a>
              </div>
            </div>
          </article>

          <div className="callout callout-left" aria-hidden="true">
            <span className="dot" />
            <span className="line-r" />
            <span className="tag">Toque firme</span>
          </div>
          <div className="callout callout-right" aria-hidden="true">
            <span className="dot" />
            <span className="line-r" />
            <span className="tag">Algodão 260 g/m²</span>
          </div>

          <div className="rail" aria-hidden="true">
            <span className="rail-fill" />
            {CHAPTER_STARTS.map((start, index) => (
              <b className="rail-dot" key={start} style={{ top: `${(index / 5) * 100}%` }} />
            ))}
          </div>
          <div className="reel-progress" aria-hidden="true"><i className="progress-fill" /></div>
        </div>
      </section>
    </>
  );
}
