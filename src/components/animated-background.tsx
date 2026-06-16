"use client";

import { useEffect, useRef } from "react";

/**
 * AnimatedBackground - Versão Híbrida de Alta Performance.
 * - Brumas/Aurora: Renderizadas via GPU usando CSS/Tailwind (Consumo CPU: 0%)
 * - Partículas/Ligações: Canvas ultra-leve limitado a poucas unidades.
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = window.innerWidth;
    let h = window.innerHeight;
    let t = 0;

    // Forçamos DPR a 1 para o canvas das partículas. Como são apenas pontos e linhas finas,
    // a diferença visual é impercetível, mas poupa milhões de píxeis ao renderizador.
    const DPR = 1;

    interface P { x: number; y: number; vx: number; vy: number; r: number; life: number }
    let particles: P[] = [];

    function spawnParticle(): P {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        r: Math.random() * 1.5 + 0.8,
        life: Math.random() * 300 + 200,
      };
    }

    function init() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * DPR;
      canvas!.height = h * DPR;
      ctx!.scale(DPR, DPR);

      // Apenas 25 partículas no PC, 12 no Mobile. O impacto no CPU passa a ser irrelevante.
      const count = w < 768 ? 12 : 25;
      particles = Array.from({ length: count }, () => spawnParticle());
    }

    function flowAngle(x: number, y: number) {
      return Math.sin(x * 0.002 + t * 0.001) * 1.2 + Math.cos(y * 0.002 - t * 0.001) * 1.2;
    }

    function frame() {
      // Limpa o canvas mantendo a transparência para ver o fundo CSS
      ctx!.clearRect(0, 0, w, h);

      ctx!.beginPath();
      ctx!.strokeStyle = "rgba(175,175,190,0.04)";
      ctx!.lineWidth = 0.6;

      // 1. Atualizar e desenhar partículas
      for (const p of particles) {
        const angle = flowAngle(p.x, p.y);
        p.vx = p.vx * 0.95 + Math.cos(angle) * 0.03;
        p.vy = p.vy * 0.95 + Math.sin(angle) * 0.03;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
          Object.assign(p, spawnParticle());
          continue;
        }

        // Desenha o ponto da partícula diretamente
        ctx!.fillStyle = "rgba(200,200,212,0.3)";
        ctx!.fillRect(p.x, p.y, p.r, p.r); // Mais rápido que desenhar círculos com ctx.arc
      }

      // 2. Traçar linhas (Com 25 partículas, o loop duplo corre a voar)
      const maxDistSq = 100 * 100;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
          }
        }
      }
      ctx!.stroke();

      t++;
      raf = requestAnimationFrame(frame);
    }

    init();
    frame();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(raf);
        init();
        frame();
      }, 200);
    };

    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050508]">
      {/* CAMADA DE BRUMAS/AURORA EM CSS (Processado a 100% no GPU) */}
      <div className="absolute inset-0 opacity-30 mix-blend-screen svelte-glow-layer">
        <div 
          className="absolute top-[-10%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-slate-700 blur-[120px] animate-pulse"
          style={{ animationDuration: '12s' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-zinc-800 blur-[100px] animate-pulse"
          style={{ animationDuration: '18s', animationDelay: '2s' }}
        />
        <div 
          className="absolute top-[30%] left-[40%] h-[40vw] w-[40vw] rounded-full bg-neutral-700 blur-[140px] animate-pulse"
          style={{ animationDuration: '15s', animationDelay: '4s' }}
        />
      </div>

      {/* CAMADA DE PARTICULAS (Canvas ultra leve) */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
