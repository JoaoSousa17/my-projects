"use client";

import { useEffect, useRef } from "react";

// Código do Vertex Shader (Apenas posiciona o plano que cobre o ecrã inteiro)
const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Código do Fragment Shader (Onde a magia acontece por pixel na GPU)
const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;

  // Função de ruído pseudo-aleatório para gerar o efeito orgânico de brumas
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  // FBM (Fractal Brownian Motion) para dar textura e densidade à aurora/bruma
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Matriz de rotação para misturar as camadas de ruído
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Corrigir o rácio de aspeto para o ruído não ficar esticado
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    float t = u_time * 0.15;

    // --- CAMADA 1: BRUMAS / AURORA ---
    // Criamos um movimento fluido distorcendo as coordenadas com o próprio ruído (Domain Warping)
    vec2 q = vec2(fbm(p + vec2(0.0)), fbm(p + vec2(5.2, 1.3)));
    vec2 r = vec2(fbm(p + 4.0 * q + vec2(t * 0.1, t * 0.05)), fbm(p + 4.0 * q + vec2(t * 0.05, t * 0.1)));
    float f = fbm(p + 4.0 * r);

    // Palete de cores escuras e modernas (Cinzas, azuis escuros e toque de roxo subtil)
    vec3 colorBase = vec3(0.02, 0.02, 0.04); // Fundo quase preto
    vec3 colorGlow1 = vec3(0.35, 0.35, 0.42); // Cinza-azulado (Brumas)
    vec3 colorGlow2 = vec3(0.25, 0.22, 0.30); // Roxo acinzentado subtil

    // Mistura as brumas com base no ruído calculado
    vec3 finalColor = mix(colorBase, colorGlow1, f * 0.4);
    finalColor = mix(finalColor, colorGlow2, dot(q, r) * 0.25);

    // --- CAMADA 2: PARTÍCULAS ULTRA-LEVES ---
    // Em vez de loops, geramos pseudo-partículas com uma grelha matemática direta na GPU
    vec2 gridUV = uv * 15.0; // Define a densidade da grelha
    vec2 gridId = floor(gridUV);
    vec2 gridFract = fract(gridUV) - 0.5;

    // Movimento oscilatório para cada partícula baseado no ID da sua célula
    float particleNoise = hash(gridId);
    if (particleNoise > 0.85) { // Só desenha em 15% das células da grelha
      vec2 offset = vec2(
        sin(t + particleNoise * 20.0),
        cos(t * 0.8 + particleNoise * 20.0)
      ) * 0.3;

      float dist = length(gridFract - offset);
      // Cria o ponto brilhante da partícula com um suave falloff
      float pGlow = smoothstep(0.04, 0.0, dist) * 0.35;
      finalColor += vec3(0.8, 0.8, 0.85) * pGlow;
    }

    // Vinheta subtil nos cantos do ecrã
    float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
    finalColor *= vignette;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Inicializa o contexto WebGL
    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL não suportado neste browser.");
      return;
    }

    // Função auxiliar para compilar os shaders
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Erro ao compilar o shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    // Linkar os shaders no programa WebGL
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Erro no link do programa WebGL:", gl.getProgramInfoLog(program));
      return;
    }

    // Definição da geometria (Um retângulo feito por dois triângulos que cobrem o ecrã)
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Mapear variáveis do shader
    const positionLocation = gl.getAttribLocation(program, "position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);

    let animationFrameId: number;
    let startTime = performance.now();

    function resize() {
      if (!canvas || !gl) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Fixamos o rácio a 1.0 para WebGL. Como os cálculos correm por pixel,
      // isto reduz imenso a carga de fragmentos sem perder definição devido ao blur natural do efeito.
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    function render() {
      if (!gl) return;

      const currentTime = (performance.now() - startTime) * 0.001; // Tempo em segundos

      // Passar dados atualizados para o Shader
      gl.uniform2f(resolutionLocation, canvas!.width, canvas!.height);
      gl.uniform1f(timeLocation, currentTime);

      // Desenhar o plano completo
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    }

    resize();
    render();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
      }, 150);
    };

    window.addEventListener("resize", onResize);

    // Limpeza de recursos ao desmontar o componente
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen bg-[#050508]"
    />
  );
}
