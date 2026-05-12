"use client";

import React, {
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MIN_SLIDES = 0;
const MAX_SLIDES = 100;
const INITIAL_SLIDES = 20;
const TIME_PER_SLIDE = 6;
const COST_PER_SLIDE = 4;

type MetricResult = {
  title: string;
  value: number;
  unit: string;
};

type SliderVars = React.CSSProperties & {
  "--thumb-x": string;
  "--fill-w": string;
};

type RollingNumberProps = {
  value: number;
  minDigits?: number;
  className?: string;
  ariaHidden?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function RollingNumber({
  value,
  minDigits = 1,
  className,
  ariaHidden,
}: RollingNumberProps) {
  const digits = useMemo(() => {
    const normalized = Math.max(0, Math.floor(value));
    return String(normalized)
      .padStart(minDigits, "0")
      .split("")
      .map(Number);
  }, [minDigits, value]);

  return (
    <span
      className={cn("inline-flex h-[1em] items-center overflow-hidden", className)}
      aria-hidden={ariaHidden}
    >
      {digits.map((digit, index) => (
        <span
          className="relative inline-block h-[1em] w-[0.62em] overflow-hidden text-center leading-none"
          key={`${digits.length}-${index}`}
        >
          <span
            className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translateY(-${digit}em)` }}
          >
            {Array.from({ length: 10 }, (_, number) => (
              <span
                className="flex h-[1em] items-center justify-center leading-none"
                key={number}
              >
                {number}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

function ResultMetric({ title, value, unit }: MetricResult) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-base font-bold leading-none text-[#219856] sm:text-lg">
        {title}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-9 items-center text-3xl font-bold leading-none tracking-normal text-[#F6F6F6] sm:h-10 sm:text-[34px] lg:h-[46px] lg:text-[40px]">
          <RollingNumber value={value} />
        </div>
        <div className="text-base leading-none text-[#F6F6F6] sm:text-lg">
          {unit}
        </div>
      </div>
    </div>
  );
}

export default function SavingsDashboard() {
  const [slides, setSlides] = useState(INITIAL_SLIDES);
  const [thumbX, setThumbX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const progress = useMemo(
    () => (slides - MIN_SLIDES) / (MAX_SLIDES - MIN_SLIDES),
    [slides],
  );

  const metrics = useMemo<MetricResult[]>(
    () => [
      {
        title: "Time Savings",
        value: slides * TIME_PER_SLIDE,
        unit: "Mins",
      },
      {
        title: "Cost Savings",
        value: slides * COST_PER_SLIDE,
        unit: "USD",
      },
    ],
    [slides],
  );

  const updateThumbPosition = useCallback(() => {
    const slider = sliderRef.current;
    const thumb = thumbRef.current;

    if (!slider || !thumb) {
      return;
    }

    const sliderWidth = slider.getBoundingClientRect().width;
    const thumbWidth = thumb.offsetWidth;
    const thumbRadius = thumbWidth / 2;
    const innerWidth = Math.max(0, sliderWidth - thumbWidth);

    setThumbX(thumbRadius + progress * innerWidth);
  }, [progress]);

  const positionToSlides = useCallback((clientX: number) => {
    const slider = sliderRef.current;
    const thumb = thumbRef.current;

    if (!slider || !thumb) {
      return INITIAL_SLIDES;
    }

    const rect = slider.getBoundingClientRect();
    const thumbRadius = thumb.offsetWidth / 2;
    const innerStart = rect.left + thumbRadius;
    const innerWidth = Math.max(1, rect.width - thumb.offsetWidth);
    const nextProgress = clamp((clientX - innerStart) / innerWidth, 0, 1);

    return Math.round(MIN_SLIDES + nextProgress * (MAX_SLIDES - MIN_SLIDES));
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      setSlides(positionToSlides(event.clientX));
    },
    [positionToSlides],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        return;
      }

      setSlides(positionToSlides(event.clientX));
    },
    [isDragging, positionToSlides],
  );

  const stopDragging = useCallback((event: PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const keyDelta: Record<string, number> = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
      PageUp: 10,
      PageDown: -10,
    };

    if (event.key === "Home") {
      setSlides(MIN_SLIDES);
      event.preventDefault();
      return;
    }

    if (event.key === "End") {
      setSlides(MAX_SLIDES);
      event.preventDefault();
      return;
    }

    const delta = keyDelta[event.key];

    if (delta) {
      setSlides((current) => clamp(current + delta, MIN_SLIDES, MAX_SLIDES));
      event.preventDefault();
    }
  }, []);

  useEffect(() => {
    updateThumbPosition();
  }, [updateThumbPosition]);

  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const observer = new ResizeObserver(updateThumbPosition);
    observer.observe(slider);

    return () => observer.disconnect();
  }, [updateThumbPosition]);

  const sliderVars: SliderVars = {
    "--thumb-x": `${thumbX}px`,
    "--fill-w": `${thumbX}px`,
  };

  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#ECECF0] px-4 py-8 text-[#262626] sm:px-5">
      <Card
        className="w-full max-w-[1200px] rounded-xl border-0 bg-[#F6F6F6] p-5 text-[#262626] shadow-[0_4px_20px_rgba(136,136,136,0.4)] sm:p-8"
        role="region"
        aria-label="Savings calculator"
      >
        <CardContent className="flex flex-col gap-7 p-0 sm:gap-9">
          <h1 className="text-center text-lg font-bold leading-tight tracking-normal sm:text-xl lg:text-2xl">
            See Your Savings in Real Time
          </h1>

          <div className="flex flex-col items-stretch gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="flex min-w-0 flex-1 flex-col gap-3.5">
              <div
                ref={sliderRef}
                className="relative h-[68px] touch-none select-none sm:h-20"
                style={sliderVars}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
              >
                <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-[#D9D9D9]">
                  <div className="h-full w-[var(--fill-w)] rounded-full bg-[#219856]" />
                </div>

                <div
                  ref={thumbRef}
                  className={cn(
                    "absolute left-[var(--thumb-x)] top-1/2 flex h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center justify-center rounded-full bg-[linear-gradient(180deg,#13663C_0%,#219856_100%)] text-[#F6F6F6] shadow-[0_6px_12px_rgba(11,50,28,0.35)] transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#219856]/25 sm:h-20 sm:w-20",
                    isDragging && "cursor-grabbing",
                  )}
                  tabIndex={0}
                  role="slider"
                  aria-label="Number of slides"
                  aria-valuemin={MIN_SLIDES}
                  aria-valuemax={MAX_SLIDES}
                  aria-valuenow={slides}
                  onKeyDown={handleKeyDown}
                >
                  <div className="flex h-6 items-center justify-center text-xl font-bold leading-none tracking-normal sm:h-7 sm:text-2xl">
                    <RollingNumber value={slides} ariaHidden />
                    <span className="sr-only">{slides}</span>
                  </div>
                  <div className="mt-1 text-xs leading-none opacity-95 sm:text-sm">
                    slides
                  </div>
                </div>
              </div>

              <p className="text-left text-[13px] leading-tight text-[#888888] sm:text-sm">
                Move slider to choose number of slides/pages
              </p>
            </div>

            <div
              className="mx-auto grid h-[130px] w-full max-w-[420px] flex-none grid-cols-[1fr_1px_1fr] items-center gap-0 rounded-lg bg-[#262626] px-2 py-4 text-[#F6F6F6] lg:mx-0 lg:h-36 lg:w-[322px] lg:px-3 lg:py-5"
              aria-live="polite"
            >
              <ResultMetric {...metrics[0]} />
              <div className="h-[86px] w-px justify-self-center bg-[#888888] lg:h-[101px]" />
              <ResultMetric {...metrics[1]} />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
