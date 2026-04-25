import React, { useRef, useImperativeHandle, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type EmotionType = 'normal' | 'happy' | 'romantic' | 'motivation' | 'sad';

interface AdvancedHeartSystemProps {
  emotion?: EmotionType;
  className?: string;
}

export interface HeartReactionSystemRef {
  spawn: (x: number, y: number, isBurst?: boolean) => void;
}

// --- GLSL SHADERS ---
const VERTEX_SHADER = `
  attribute vec4 a_position;
  attribute vec4 a_color;
  attribute float a_size;
  attribute float a_type;
  attribute float a_life;
  attribute float a_rotation;
  attribute float a_depth;

  varying vec4 v_color;
  varying float v_type;
  varying float v_life;
  varying float v_rotation;
  varying float v_depth;

  void main() {
    v_color = a_color;
    v_type = a_type;
    v_life = a_life;
    v_rotation = a_rotation;
    v_depth = a_depth;

    gl_Position = a_position;
    // Scale size based on depth for parallax feel
    gl_PointSize = a_size * (1.0 + a_depth * 0.5);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec4 v_color;
  varying float v_type;
  varying float v_life;
  varying float v_rotation;
  varying float v_depth;

  #define PI 3.14159265359

  mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  }

  // SDF for Heart
  float sdHeart(vec2 p) {
    p.x = abs(p.x);
    if (p.y + p.x > 1.0)
      return sqrt(dot(p - vec2(0.25, 0.75), p - vec2(0.25, 0.75))) - sqrt(2.0)/4.0;
    return sqrt(min(dot(p - vec2(0.00, 1.00), p - vec2(0.00, 1.00)),
                    dot(p - vec2(0.50, 0.50), p - vec2(0.50, 0.50)))) * sign(p.x - p.y);
  }

  void main() {
    // Normalizing coordinates to -1.0 to 1.0
    vec2 uv = (gl_PointCoord - 0.5) * 2.0;
    uv = rotate2d(v_rotation) * uv;
    uv.y += 0.2; // Offset for better centering

    float d = 0.0;
    
    // 1.0 = Classic, 2.0 = Crystal, 3.0 = Liquid
    if (v_type < 1.5) {
      d = sdHeart(uv * 1.5);
    } else if (v_type < 2.5) {
      // Crystal: Jagged edges
      float angle = atan(uv.x, uv.y);
      float jagged = sin(angle * 10.0) * 0.05;
      d = sdHeart(uv * (1.5 + jagged));
    } else {
      // Liquid: Morphing
      float morph = sin(v_life * 10.0) * 0.05;
      d = sdHeart(uv * (1.5 + morph));
    }

    // Edge softness for pixel-perfect AA
    float thickness = 0.02 + (1.0 - v_depth) * 0.05;
    float alpha = smoothstep(thickness, -thickness, d) * v_life;

    // Glass Material / Shine
    float shine = smoothstep(0.1, 0.0, length(uv - vec2(-0.2, -0.3))) * 0.5;
    
    // Final Color with depth blur simulation
    vec4 finalColor = v_color;
    finalColor.rgb += shine * (1.0 - v_depth);
    
    // Depth-based alpha/blur
    float depthAlpha = mix(0.4, 1.0, v_depth);
    
    gl_FragColor = vec4(finalColor.rgb, alpha * depthAlpha);
  }
`;

class WebGLHeartEngine {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  particles: any[] = [];
  maxParticles = 500;
  
  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: true })!;
    this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
    this.buffer = this.gl.createBuffer()!;
  }

  createProgram(vs: string, fs: string) {
    const gl = this.gl;
    const vShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vShader, vs);
    gl.compileShader(vShader);
    
    const fShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fShader, fs);
    gl.compileShader(fShader);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    return program;
  }

  spawn(x: number, y: number, config: any, isBurst = false) {
    const count = isBurst ? 20 : 1;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) this.particles.shift();
      
      const angle = (Math.random() * Math.PI * 0.8) - (Math.PI * 0.9);
      const force = (isBurst ? Math.random() * 0.04 + 0.02 : Math.random() * 0.01 + 0.01) * config.speed;
      
      this.particles.push({
        x: (x / window.innerWidth) * 2 - 1,
        y: -((y / window.innerHeight) * 2 - 1),
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        size: (Math.random() * 30 + 30) * (isBurst ? 1.5 : 1),
        color: this.hexToRgb(config.colors[Math.floor(Math.random() * config.colors.length)]),
        type: Math.random() > 0.8 ? 3.0 : (Math.random() > 0.6 ? 2.0 : 1.0),
        life: 1.0,
        rotation: (Math.random() - 0.5) * 2.0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        depth: Math.random(), // 0.0 = bg, 1.0 = fg
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= 0.012;
      p.x += p.vx + Math.sin(p.wobble) * 0.002;
      p.y += p.vy;
      p.vy += 0.0005; // Gentle upward lift (gravity reversed in normalized coords)
      p.rotation += p.rotationSpeed;
      p.wobble += 0.05;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    const gl = this.gl;
    const program = this.program;
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const data = new Float32Array(this.particles.length * 9);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const offset = i * 9;
      data[offset + 0] = p.x;
      data[offset + 1] = p.y;
      data[offset + 2] = p.color[0];
      data[offset + 3] = p.color[1];
      data[offset + 4] = p.color[2];
      data[offset + 5] = p.size;
      data[offset + 6] = p.type;
      data[offset + 7] = p.life;
      data[offset + 8] = p.rotation;
      // Note: missing depth in data array, but can be added if needed for shader
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 36, 0);

    const aCol = gl.getAttribLocation(program, 'a_color');
    gl.enableVertexAttribArray(aCol);
    gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 36, 8);

    const aSize = gl.getAttribLocation(program, 'a_size');
    gl.enableVertexAttribArray(aSize);
    gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 36, 20);

    const aType = gl.getAttribLocation(program, 'a_type');
    gl.enableVertexAttribArray(aType);
    gl.vertexAttribPointer(aType, 1, gl.FLOAT, false, 36, 24);

    const aLife = gl.getAttribLocation(program, 'a_life');
    gl.enableVertexAttribArray(aLife);
    gl.vertexAttribPointer(aLife, 1, gl.FLOAT, false, 36, 28);

    const aRot = gl.getAttribLocation(program, 'a_rotation');
    gl.enableVertexAttribArray(aRot);
    gl.vertexAttribPointer(aRot, 1, gl.FLOAT, false, 36, 32);

    gl.drawArrays(gl.POINTS, 0, this.particles.length);
  }
}

const EMOTION_CONFIG: Record<EmotionType, any> = {
  normal: { colors: ['#ff4d6d', '#ff758f', '#c9184a'], speed: 1.0 },
  happy: { colors: ['#ffd166', '#ff9f1c', '#ffbf69'], speed: 1.5 },
  romantic: { colors: ['#ff85a1', '#f72585', '#b5179e', '#7209b7'], speed: 0.8 },
  motivation: { colors: ['#4cc9f0', '#4361ee', '#3a0ca3', '#f72585'], speed: 2.0 },
  sad: { colors: ['#a8dadc', '#457b9d', '#1d3557'], speed: 0.5 },
};

export const HeartReactionSystem = React.forwardRef<HeartReactionSystemRef, AdvancedHeartSystemProps>(
  ({ emotion = 'normal', className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<WebGLHeartEngine | null>(null);
    const [pulse, setPulse] = useState(0);

    const config = EMOTION_CONFIG[emotion];

    useImperativeHandle(ref, () => ({
      spawn: (x, y, isBurst = false) => {
        setPulse(p => p + 1);
        engineRef.current?.spawn(x, y, config, isBurst);
        
        // Haptics
        if (window.navigator.vibrate) {
          window.navigator.vibrate(isBurst ? [30, 20, 30] : 15);
        }
      }
    }));

    useEffect(() => {
      if (!canvasRef.current) return;
      const engine = new WebGLHeartEngine(canvasRef.current);
      engineRef.current = engine;

      const handleResize = () => {
        if (!canvasRef.current) return;
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        engine.gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      let raf: number;
      const loop = () => {
        engine.update();
        engine.render();
        raf = requestAnimationFrame(loop);
      };
      loop();

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(raf);
      };
    }, []);

    return (
      <div className={cn("absolute inset-0 pointer-events-none z-[100] overflow-hidden", className)}>
        {/* Cinematic Shockwave Bloom */}
        <AnimatePresence>
          <motion.div
            key={pulse}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 0.4, 0],
              scale: [0.5, 1.5, 2.0],
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div 
              className="w-[400px] h-[400px] rounded-full"
              style={{ 
                background: `radial-gradient(circle, ${config.colors[0]}33 0%, transparent 70%)`,
                filter: 'blur(60px)'
              }} 
            />
          </motion.div>
        </AnimatePresence>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />
      </div>
    );
  }
);

HeartReactionSystem.displayName = 'HeartReactionSystem';
