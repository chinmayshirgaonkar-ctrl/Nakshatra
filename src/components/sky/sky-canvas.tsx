"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { StarNode, TopicCentroid, RenderLink, CameraState } from "./sky-types";

interface SkyCanvasProps {
  stars: StarNode[];
  topicCentroids: TopicCentroid[];
  links: RenderLink[];
  selectedSubjectId: string | null;
  onlyFading: boolean;
  selectedStarId: string | null;
  onSelectStar: (star: StarNode | null) => void;
  onHoverStar: (star: StarNode | null, screenPos: { x: number; y: number } | null) => void;
  cameraRef?: React.MutableRefObject<{
    focusOnStar: (starId: string) => void;
    resetView: () => void;
  } | null>;
}

export function SkyCanvas({
  stars,
  topicCentroids,
  links,
  selectedSubjectId,
  onlyFading,
  selectedStarId,
  onSelectStar,
  onHoverStar,
  cameraRef,
}: SkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera state
  const camera = useRef<CameraState>({ x: 0, y: 0, zoom: 0.95 });
  const targetCamera = useRef<CameraState | null>(null);

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cameraStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Hovered state
  const hoveredStarId = useRef<string | null>(null);

  // Touch pinch tracking
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);

  // Initialize camera centered to canvas
  const isInitialized = useRef(false);

  const resetView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    targetCamera.current = {
      x: canvas.clientWidth / 2,
      y: canvas.clientHeight / 2,
      zoom: 0.85,
    };
  }, []);

  const focusOnStar = useCallback(
    (starId: string) => {
      const star = stars.find((s) => s.id === starId);
      const canvas = canvasRef.current;
      if (!star || !canvas) return;

      const targetZoom = 1.6;
      targetCamera.current = {
        x: canvas.clientWidth / 2 - star.x * targetZoom,
        y: canvas.clientHeight / 2 - star.y * targetZoom,
        zoom: targetZoom,
      };
      onSelectStar(star);
    },
    [stars, onSelectStar]
  );

  // Expose methods via cameraRef
  useEffect(() => {
    if (cameraRef) {
      cameraRef.current = {
        focusOnStar,
        resetView,
      };
    }
  }, [cameraRef, focusOnStar, resetView]);

  // Window resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      if (!isInitialized.current) {
        camera.current = {
          x: width / 2,
          y: height / 2,
          zoom: width < 768 ? 0.65 : 0.9,
        };
        isInitialized.current = true;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Main Render Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = (timestamp: number) => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // Smooth camera interpolation towards target
      if (targetCamera.current) {
        const tc = targetCamera.current;
        const lerpFactor = 0.12;
        camera.current.x += (tc.x - camera.current.x) * lerpFactor;
        camera.current.y += (tc.y - camera.current.y) * lerpFactor;
        camera.current.zoom += (tc.zoom - camera.current.zoom) * lerpFactor;

        if (
          Math.abs(tc.x - camera.current.x) < 0.5 &&
          Math.abs(tc.y - camera.current.y) < 0.5 &&
          Math.abs(tc.zoom - camera.current.zoom) < 0.005
        ) {
          camera.current.x = tc.x;
          camera.current.y = tc.y;
          camera.current.zoom = tc.zoom;
          targetCamera.current = null;
        }
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // Deep space backdrop glow
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, "rgba(10, 14, 26, 0.4)");
      bgGrad.addColorStop(1, "rgba(5, 7, 15, 0.9)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Apply camera transform
      ctx.save();
      ctx.translate(camera.current.x, camera.current.y);
      ctx.scale(camera.current.zoom, camera.current.zoom);

      // 1. Draw Topic Constellation Boundaries & Labels
      topicCentroids.forEach((tc) => {
        const isSubjectMatch = !selectedSubjectId || tc.subject.id === selectedSubjectId;
        const alpha = isSubjectMatch ? 0.35 : 0.08;

        // Faint constellation boundary circle
        ctx.beginPath();
        ctx.arc(tc.x, tc.y, tc.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(230, 175, 46, ${alpha * 0.25})`;
        ctx.lineWidth = 1 / camera.current.zoom;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Faint nebula aura inside cluster
        const nebulaGrad = ctx.createRadialGradient(tc.x, tc.y, 0, tc.x, tc.y, tc.radius);
        nebulaGrad.addColorStop(0, `${tc.color}15`);
        nebulaGrad.addColorStop(1, "transparent");
        ctx.fillStyle = nebulaGrad;
        ctx.fill();

        // Constellation Name in small caps
        if (camera.current.zoom > 0.45 && isSubjectMatch) {
          ctx.save();
          ctx.font = `600 ${Math.max(10, Math.min(13, 11 / camera.current.zoom))}px 'Fraunces', serif`;
          ctx.fillStyle = isSubjectMatch ? "rgba(240, 237, 230, 0.65)" : "rgba(240, 237, 230, 0.15)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tc.topic.name.toUpperCase(), tc.x, tc.y - tc.radius - 12);
          ctx.restore();
        }
      });

      // 2. Draw Concept Link Lines
      links.forEach((link) => {
        const isSourceMatch = !selectedSubjectId || link.source.subject.id === selectedSubjectId;
        const isTargetMatch = !selectedSubjectId || link.target.subject.id === selectedSubjectId;
        const isFiltered = selectedSubjectId && (!isSourceMatch || !isTargetMatch);

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);

        if (link.isCrossSubject) {
          // Cross-subject link: slightly brighter ethereal beam
          const lineAlpha = isFiltered ? 0.05 : 0.55;
          ctx.strokeStyle = `rgba(130, 210, 255, ${lineAlpha})`;
          ctx.lineWidth = 1.6 / camera.current.zoom;
          ctx.setLineDash([3, 4]);
        } else {
          // Standard intra-subject link
          const lineAlpha = isFiltered ? 0.03 : 0.22;
          ctx.strokeStyle = `rgba(230, 175, 46, ${lineAlpha})`;
          ctx.lineWidth = 1.0 / camera.current.zoom;
          ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 3. Draw Stars
      stars.forEach((star) => {
        const isSubjectMatch = !selectedSubjectId || star.subject.id === selectedSubjectId;
        const isFadingMatch = !onlyFading || star.isFading;
        const isVisible = isSubjectMatch && isFadingMatch;

        const isHovered = star.id === hoveredStarId.current;
        const isSelected = star.id === selectedStarId;

        // Calculate flicker for dim stars (R < 0.5)
        let flickerMult = 1.0;
        if (star.isFading) {
          flickerMult = 0.65 + 0.35 * Math.sin(timestamp * 0.0035 + star.flickerSeed);
        }

        const effectiveR = Math.max(0.1, star.retrievability * flickerMult);
        const baseOpacity = isVisible ? (star.isFading ? 0.7 * flickerMult : 0.95) : 0.08;

        // Radius in world coordinates
        const r = star.radius;
        const glowRadius = r * (2.8 + effectiveR * 2.2);

        // A. Outer Radial Celestial Glow
        if (isVisible) {
          const glow = ctx.createRadialGradient(star.x, star.y, r * 0.4, star.x, star.y, glowRadius);
          const colorHex = star.color || "#E6AF2E";
          glow.addColorStop(0, `${colorHex}${Math.round(baseOpacity * 180).toString(16).padStart(2, "0")}`);
          glow.addColorStop(0.5, `${colorHex}${Math.round(baseOpacity * 60).toString(16).padStart(2, "0")}`);
          glow.addColorStop(1, "transparent");

          ctx.beginPath();
          ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // B. Solid Star Core
        ctx.beginPath();
        ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isVisible
          ? star.isFading
            ? `rgba(240, 180, 100, ${baseOpacity})`
            : `rgba(255, 255, 255, ${baseOpacity})`
          : "rgba(120, 120, 140, 0.15)";
        ctx.fill();

        // C. Specular Diamond Flare for Major Concepts (Importance >= 4)
        if (isVisible && star.concept.importance >= 4 && camera.current.zoom > 0.6) {
          const flareLen = r * (1.8 + effectiveR * 1.5);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * baseOpacity})`;
          ctx.lineWidth = 1 / camera.current.zoom;

          ctx.beginPath();
          ctx.moveTo(star.x - flareLen, star.y);
          ctx.lineTo(star.x + flareLen, star.y);
          ctx.moveTo(star.x, star.y - flareLen);
          ctx.lineTo(star.x, star.y + flareLen);
          ctx.stroke();
        }

        // D. Hovered Star Ring
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, r + 5 / camera.current.zoom, 0, Math.PI * 2);
          ctx.strokeStyle = "#E6AF2E";
          ctx.lineWidth = 1.8 / camera.current.zoom;
          ctx.stroke();
        }

        // E. Selected Star Reticle
        if (isSelected) {
          const boxSize = r + 8 / camera.current.zoom;
          ctx.strokeStyle = "#E6AF2E";
          ctx.lineWidth = 1.5 / camera.current.zoom;

          // Corner brackets
          const len = 4 / camera.current.zoom;
          // Top-Left
          ctx.beginPath();
          ctx.moveTo(star.x - boxSize, star.y - boxSize + len);
          ctx.lineTo(star.x - boxSize, star.y - boxSize);
          ctx.lineTo(star.x - boxSize + len, star.y - boxSize);
          // Top-Right
          ctx.moveTo(star.x + boxSize - len, star.y - boxSize);
          ctx.lineTo(star.x + boxSize, star.y - boxSize);
          ctx.lineTo(star.x + boxSize, star.y - boxSize + len);
          // Bottom-Left
          ctx.moveTo(star.x - boxSize, star.y + boxSize - len);
          ctx.lineTo(star.x - boxSize, star.y + boxSize);
          ctx.lineTo(star.x - boxSize + len, star.y + boxSize);
          // Bottom-Right
          ctx.moveTo(star.x + boxSize - len, star.y + boxSize);
          ctx.lineTo(star.x + boxSize, star.y + boxSize);
          ctx.lineTo(star.x + boxSize, star.y + boxSize - len);
          ctx.stroke();
        }

        // F. Star Label when zoomed in
        if (isVisible && camera.current.zoom > 1.1) {
          ctx.save();
          ctx.font = `500 ${Math.max(9, Math.min(11, 10 / camera.current.zoom))}px 'Manrope', sans-serif`;
          ctx.fillStyle = isSelected
            ? "#E6AF2E"
            : isHovered
            ? "#FFFFFF"
            : "rgba(240, 237, 230, 0.75)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(star.concept.name, star.x, star.y + r + 4);
          ctx.restore();
        }
      });

      ctx.restore(); // Restore world transform
      ctx.restore(); // Restore dpr transform

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [stars, topicCentroids, links, selectedSubjectId, onlyFading, selectedStarId]);

  // Coordinate conversion helper
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - camera.current.x) / camera.current.zoom,
      y: (screenY - camera.current.y) / camera.current.zoom,
    };
  }, []);

  const findStarAtScreenPos = useCallback(
    (screenX: number, screenY: number): StarNode | null => {
      const world = screenToWorld(screenX, screenY);
      const hitThreshold = 18 / camera.current.zoom;

      let closestStar: StarNode | null = null;
      let closestDist = Infinity;

      for (const star of stars) {
        // Filter out stars hidden by subject/fading filters
        if (selectedSubjectId && star.subject.id !== selectedSubjectId) continue;
        if (onlyFading && !star.isFading) continue;

        const dx = star.x - world.x;
        const dy = star.y - world.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= Math.max(star.radius + 6, hitThreshold) && dist < closestDist) {
          closestDist = dist;
          closestStar = star;
        }
      }

      return closestStar;
    },
    [stars, selectedSubjectId, onlyFading, screenToWorld]
  );

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only primary click
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    cameraStart.current = { x: camera.current.x, y: camera.current.y };
    targetCamera.current = null; // Cancel any animated pan
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isDragging.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
      }
      camera.current.x = cameraStart.current.x + dx;
      camera.current.y = cameraStart.current.y + dy;
    } else {
      // Hover detection
      const hit = findStarAtScreenPos(screenX, screenY);
      hoveredStarId.current = hit ? hit.id : null;
      onHoverStar(hit, hit ? { x: e.clientX, y: e.clientY } : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging.current && !hasMoved.current) {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const hit = findStarAtScreenPos(screenX, screenY);
      onSelectStar(hit);
    }

    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    hoveredStarId.current = null;
    onHoverStar(null, null);
  };

  // Wheel Zoom focused on cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const currentZoom = camera.current.zoom;
    const newZoom = Math.max(0.25, Math.min(4.0, currentZoom * zoomFactor));

    // Keep point under mouse fixed in world coordinates
    camera.current.x = mouseX - (mouseX - camera.current.x) * (newZoom / currentZoom);
    camera.current.y = mouseY - (mouseY - camera.current.y) * (newZoom / currentZoom);
    camera.current.zoom = newZoom;
    targetCamera.current = null;
  };

  // Touch Handlers for Mobile / Tablet Pan & Pinch
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      hasMoved.current = false;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      cameraStart.current = { x: camera.current.x, y: camera.current.y };
      targetCamera.current = null;
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      touchStartZoom.current = camera.current.zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
      camera.current.x = cameraStart.current.x + dx;
      camera.current.y = cameraStart.current.y + dy;
    } else if (e.touches.length === 2 && touchStartDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const ratio = currentDist / touchStartDist.current;
      camera.current.zoom = Math.max(0.25, Math.min(4.0, touchStartZoom.current * ratio));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDragging.current && !hasMoved.current && e.changedTouches.length === 1) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        const hit = findStarAtScreenPos(screenX, screenY);
        onSelectStar(hit);
      }
    }
    isDragging.current = false;
    touchStartDist.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing touch-none select-none"
    />
  );
}
