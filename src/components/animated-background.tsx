"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo escuro com bastante movimento: brumas/aurora de cinza-claro a deslizar,
 * partículas a fluir num campo vetorial (flow field) e ligações subtis entre
 * pontos próximos. Mede pela window (innerWidth/innerHeight) para evitar o caso
 * em que clientWidth/clientHeight do canvas devolvem 0 e nada é desenhado.
 * 
 * Otimizado para evitar sobrecarga de CPU (Commit bottleneck no browser).
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cv = canvas;
    const ctxNullable = canvas.getContext("2d");
    if (!ctxNullable) return;
    const ctx = ctxNullable;

    let raf = 0;
    let w = 0;
    let h = 0;
    let t = 0;
    
    // Limitado o DPR a 1.2 em vez de 1.5 para aliviar o fill-rate do GPU/CPU em ecrãs Retina
    const DPR = Math.min(window.devicePixelRatio || 1, 1.2);
    const isMobile = () => w < 768;

    // Brumas / aurora a deslizar
    interface Blob {
      xF: number; yF: number; r: number;
      driftX: number; driftY: number; phase: number; hue: string;
    }
    const blobHues = [
      "rgba(120,120,135,",
      "rgba(95,100,120,",
      "rgba(140,135,150,",
      "rgba(80,90,110,",
    ];
    let blobs: Blob[] = [];

    function makeBlobs() {
      const count = isMobile() ? 3 : 5; // Reduzido ligeiramente a contagem
      blobs = Array.from({ length: count }, (_, i) => ({
        xF: Math.random(),
        yF: Math.random(),
        r: (isMobile() ? 220 : 340) + Math.random() * 200,
        driftX: (Math.random() - 0.5) * 0.00015,
        driftY: (Math.random() - 0.5) * 0.00015,
        phase: Math.random() * Math.PI * 2,
        hue: blobHues[i % blobHues.length],
      }));
    }

    // Partículas num flow field
    interface P { x: number; y: number; vx: number; vy: number; r: number; life: number }
    let particles: P[] = [];

    function spawnParticle(): P {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0, vy: 0,
        r: Math.random() * 1.8 + 0.6, // Ligeiramente maiores para compensar a menor densidade
        life: Math.random() * 400 + 200,
      };
    }

    function makeParticles() {
      // Otimização crucial: Aumentado o rácio divisor para limitar o número máximo de partículas
      const count = Math.min(isMobile() ? 35 : 70, Math.floor((w * h) / 25000));
      particles = Array.from({ length: Math.max(count, 20) }, () => spawnParticle());
    }

    function flowAngle(x: number, y: number) {
      const s = 0.0016;
      return (
        Math.sin(x * s + t * 0.0008) * 1.4 +
        Math.cos(y * s - t * 0.0006) * 1.4 +
        Math.sin((x + y) * s * 0.6 + t * 0.001) * 1.2
      );
    }

    function drawBg() {
      const g = ctx.createRadialGradient(w / 2, h * 0.18, 0, w / 2, h * 0.5, Math.max(w, h));
      g.addColorStop(0, "#0c0c11");
      g.addColorStop(0.6, "#070709");
      g.addColorStop(1, "#000000");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    function drawBlobs() {
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        b.xF += b.driftX;
        b.yF += b.driftY;
        if (b.xF < -0.2 || b.xF > 1.2) b.driftX *= -1;
        if (b.yF < -0.2 || b.yF > 1.2) b.driftY *= -1;

        const pulse = 0.5 + Math.sin(t * 0.0015 + b.phase) * 0.18;
        const x = b.xF * w;
        const y = b.yF * h;
        const r = b.r * (0.85 + Math.sin(t * 0.001 + b.phase) * 0.15);

        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `${b.hue}${(0.16 * pulse).toFixed(3)})`);
        grad.addColorStop(0.5, `${b.hue}${(0.06 * pulse).toFixed(3)})`);
        grad.addColorStop(1, `${b.hue}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function drawParticles() {
      // 1. Desenhar e atualizar as partículas individualmente
      ctx.fillStyle = "rgba(200,200,212,0.45)";
      for (const p of particles) {
        const a = flowAngle(p.x, p.y);
        p.vx += Math.cos(a) * 0.06;
        p.vy += Math.sin(a) * 0.06;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          Object.assign(p, spawnParticle());
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Desenhar as linhas de ligação num único "Batch stroke" (Mega Otimização para o Commit)
      const maxDist = isMobile() ? 80 : 110;
      const maxDistSq = maxDist * maxDist; // Usar distância ao quadrado evita Math.hypot pesado
      
      ctx.beginPath(); // Abre um único caminho global para as linhas
      ctx.strokeStyle = "rgba(175,175,190,0.06)"; // Opacidade média fixa para evitar recriar strokeStyle em loop
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy; // Comparação puramente matemática ultra rápida

          if (distSq < maxDistSq) {
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
        }
      }
      ctx.stroke(); // Executa o commit de todas as linhas de uma só vez!
    }

    function frame() {
      drawBg();
      drawBlobs();
      drawParticles();
      t++;
      raf = requestAnimationFrame(frame);
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      cv.width = Math.round(w * DPR);
      cv.height = Math.round(h * DPR);
      ctx.scale(DPR, DPR);
    }

    function start() {
      resize();
      if (w === 0 || h === 0) {
        raf = requestAnimationFrame(start);
        return;
      }
      makeBlobs();
      makeParticles();
      frame();
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(raf);
        resize();
        makeBlobs();
        makeParticles();
        frame();
      }, 150);
    };

    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(start);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ width: "100vw", height: "100vh", background: "#000" }}
    />
  );
}
