"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// hero-8 (the council/battle-plans scene) is reserved for the picker section below,
// so it's excluded from this random landing pool.
const LANDING_PAINTINGS = [
  "/paintings/hero-1.webp",
  "/paintings/hero-2.webp",
  "/paintings/hero-3.webp",
  "/paintings/hero-4.webp",
  "/paintings/hero-5.webp",
  "/paintings/hero-6.webp",
  "/paintings/hero-7.webp",
  "/paintings/hero-9.webp",
];

export function Hero() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSrc(LANDING_PAINTINGS[Math.floor(Math.random() * LANDING_PAINTINGS.length)]);
  }, []);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-neutral-900">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt=""
          className={`h-full w-full object-cover object-center transition-opacity duration-1000 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/80" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <blockquote
          className="max-w-3xl text-balance text-2xl leading-snug text-white drop-shadow-md sm:text-3xl md:text-4xl"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          &ldquo;And when Alexander saw the breadth of his domain, he wept, for
          there were no more worlds to conquer.&rdquo;
        </blockquote>
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
          — Hans Gruber, Die Hard.
        </p>
        <p
          className="mt-6 text-lg tracking-wide text-white/90 sm:text-xl"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          1444 awaits...
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
        <ChevronDown size={28} strokeWidth={1.5} />
      </div>
    </div>
  );
}
