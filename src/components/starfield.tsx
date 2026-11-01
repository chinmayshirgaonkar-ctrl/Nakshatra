"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  speed: number;
  phase: number;
  color: string;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = !document.hidden;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        drawStatic();
      } else {
        render();
      }
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isLight = resolvedTheme === "light";

    // Palette: Gold, Soft Gold, Aurora cyan, Pale Ivory
    const darkColors = ["#D4AF6A", "#E9D6A8", "#F3EEE3", "#6FD3C6", "#FFFFFF"];
    const lightColors = ["#9C7228", "#B58A38", "#634714", "#8A7968"];

    const activeColors = isLight ? lightColors : darkColors;

    // Calculate star count based on screen area, capped at 120 for low CPU
    const count = Math.min(120, Math.floor((width * height) / 12000));
    const stars: Star[] = [];

    for (let i = 0; i < count; i++) {
      const isHero = i % 15 === 0; // occasional brighter star
      const radius = isHero ? Math.random() * 1.5 + 1.0 : Math.random() * 0.8 + 0.4;
      const baseAlpha = isLight
        ? Math.random() * 0.2 + 0.08
        : Math.random() * 0.5 + 0.2;
      const color = activeColors[Math.floor(Math.random() * activeColors.length)];

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseAlpha,
        alpha: baseAlpha,
        speed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
        color,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (prefersReducedMotion) {
        drawStatic();
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !prefersReducedMotion) {
        lastTime = performance.now();
        render();
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    function drawStatic() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.baseAlpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    let lastTime = performance.now();

    function render() {
      if (!isTabVisible || prefersReducedMotion || !ctx) return;

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.phase += s.speed;
        // Soft sine wave twinkling
        const twinkle = Math.sin(s.phase) * 0.35;
        s.alpha = Math.max(0.05, Math.min(0.9, s.baseAlpha + twinkle));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    }

    if (prefersReducedMotion) {
      drawStatic();
    } else {
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 block h-full w-full opacity-80"
      aria-hidden="true"
    />
  );
}
