"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export default function MusicKit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Darker, more vibrant colors for hip aesthetic
  const lightColors = [
    "rgba(14, 116, 144, 0.9)", // deep cyan
    "rgba(190, 24, 93, 0.9)", // deep pink
    "rgba(126, 34, 206, 0.9)", // deep purple
    "rgba(194, 65, 12, 0.9)", // deep orange
  ];

  // Bright colors for dark mode
  const darkColors = [
    "rgba(34, 211, 238, 0.85)", // bright cyan
    "rgba(244, 114, 182, 0.85)", // bright pink
    "rgba(192, 132, 252, 0.85)", // bright purple
    "rgba(251, 191, 36, 0.85)", // bright orange
  ];

  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                             window.innerWidth < 768 ||
                             ('ontouchstart' in window);
      setIsMobile(isMobileDevice);
    };
    checkMobile();

    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Watch for resize to detect mobile
    const handleResize = () => {
      checkMobile();
    };
    window.addEventListener("resize", handleResize);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Create particles at mouse position (fewer on mobile)
      const currentIsDark = document.documentElement.classList.contains("dark");
      const currentColors = currentIsDark ? darkColors : lightColors;
      const particleCount = isMobile ? 2 : 5;
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const speed = 2.5 + Math.random() * 3.5;
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: isMobile ? 3 + Math.random() * 4 : 5 + Math.random() * 6,
          color: currentColors[Math.floor(Math.random() * currentColors.length)],
          life: 0,
          maxLife: isMobile ? 50 + Math.random() * 30 : 70 + Math.random() * 50,
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        setMousePos({ x: touch.clientX, y: touch.clientY });
        
        // Create particles on touch (mobile optimized)
        const currentIsDark = document.documentElement.classList.contains("dark");
        const currentColors = currentIsDark ? darkColors : lightColors;
        
        for (let i = 0; i < 2; i++) {
          const angle = (Math.PI * 2 * i) / 2 + Math.random() * 0.5;
          const speed = 2 + Math.random() * 2;
          particlesRef.current.push({
            x: touch.clientX,
            y: touch.clientY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 3,
            color: currentColors[Math.floor(Math.random() * currentColors.length)],
            life: 0,
            maxLife: 40 + Math.random() * 20,
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const animate = () => {
      // Check dark mode
      const currentIsDark = document.documentElement.classList.contains("dark");
      const currentColors = currentIsDark ? darkColors : lightColors;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.life++;
        particle.size *= 0.99;

        const alpha = 1 - particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        
        // Add glow effect for better visibility
        ctx.shadowBlur = 12;
        ctx.shadowColor = particle.color;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return particle.life < particle.maxLife;
      });

      // Draw music note at mouse/touch position (only on desktop for better performance)
      if (!isMobile && mousePos.x > 0 && mousePos.y > 0) {
        ctx.save();
        const noteColor = currentColors[Math.floor((Date.now() / 1000) % currentColors.length)];
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = noteColor;
        ctx.fillStyle = noteColor;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = noteColor;
        ctx.translate(mousePos.x, mousePos.y);
        ctx.rotate(Math.sin(Date.now() / 500) * 0.3);

        // Draw music note with better visibility
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(0, 10);
        ctx.arc(10, 10, 10, Math.PI, 0, false);
        ctx.stroke();

        // Draw note head
        ctx.beginPath();
        ctx.arc(10, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw multiple layers of waveforms for depth
      const time = Date.now() / 1000;
      
      // Layer 1: Background waves (farthest, most transparent) - reduced on mobile
      ctx.save();
      ctx.lineWidth = isMobile ? 1.5 : 2;
      ctx.globalAlpha = isDark ? 0.15 : 0.25;
      const layer1Count = isMobile ? 2 : 3;
      for (let i = 0; i < layer1Count; i++) {
        ctx.beginPath();
        const baseY = canvas.height / 2 + Math.sin(time * 1.5 + i * 0.8) * 80;
        ctx.moveTo(0, baseY);
        for (let x = 0; x < canvas.width; x += 12) {
          const waveY = baseY + Math.sin((x / 80) + time * 2 + i) * 30;
          ctx.lineTo(x, waveY);
        }
        ctx.strokeStyle = currentColors[i % currentColors.length];
        ctx.stroke();
      }
      ctx.restore();

      // Layer 2: Mid waves (medium depth) - reduced on mobile
      ctx.save();
      ctx.lineWidth = isMobile ? 2.5 : 3;
      ctx.globalAlpha = isDark ? 0.25 : 0.4;
      const layer2Count = isMobile ? 3 : 4;
      for (let i = 0; i < layer2Count; i++) {
        ctx.beginPath();
        const baseY = canvas.height / 2 + Math.sin(time * 2 + i * 0.5) * 60;
        ctx.moveTo(0, baseY);
        for (let x = 0; x < canvas.width; x += 8) {
          const waveY = baseY + Math.sin((x / 60) + time * 3 + i) * 25;
          ctx.lineTo(x, waveY);
        }
        const waveColor = currentColors[i % currentColors.length];
        ctx.strokeStyle = waveColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = waveColor;
        ctx.stroke();
      }
      ctx.restore();

      // Layer 3: Foreground waves (closest, most visible) - reduced on mobile
      ctx.save();
      ctx.lineWidth = isMobile ? 3 : 3.5;
      ctx.globalAlpha = isDark ? 0.35 : 0.55;
      const layer3Count = isMobile ? 2 : 3;
      for (let i = 0; i < layer3Count; i++) {
        ctx.beginPath();
        const baseY = canvas.height / 2 + Math.sin(time * 2.5 + i * 0.6) * 50;
        ctx.moveTo(0, baseY);
        for (let x = 0; x < canvas.width; x += 6) {
          const waveY = baseY + Math.sin((x / 50) + time * 4 + i) * 20;
          ctx.lineTo(x, waveY);
        }
        const waveColor = currentColors[(i + 1) % currentColors.length];
        ctx.strokeStyle = waveColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = waveColor;
        ctx.stroke();
      }
      ctx.restore();

      // Draw floating orbs/particles in background layers - reduced on mobile
      const orbLayers = isMobile ? 2 : 3;
      const orbsPerLayer = isMobile ? 5 : 8;
      
      for (let layer = 0; layer < orbLayers; layer++) {
        ctx.save();
        const layerAlpha = isDark ? 0.2 : 0.3;
        const layerScale = 1 - (layer * 0.3);
        ctx.globalAlpha = layerAlpha * layerScale;
        
        for (let i = 0; i < orbsPerLayer; i++) {
          const orbX = (canvas.width / orbsPerLayer) * i + Math.sin(time + i) * (isMobile ? 30 : 50);
          const orbY = canvas.height / 2 + Math.cos(time * 0.7 + i) * (isMobile ? 60 : 100);
          const orbSize = ((isMobile ? 15 : 20) + Math.sin(time * 2 + i) * (isMobile ? 5 : 10)) * layerScale;
          
          const gradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbSize);
          gradient.addColorStop(0, currentColors[i % currentColors.length]);
          gradient.addColorStop(1, "transparent");
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(orbX, orbY, orbSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mousePos, isDark, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        mixBlendMode: isDark ? "screen" : "normal",
        opacity: 1
      }}
    />
  );
}

