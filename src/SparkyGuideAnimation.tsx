import { useEffect, useRef } from 'react';
import { sparkyFeatureFrames } from './sparkyFeatureFrames';

export type SparkyGuideMode = 'intro' | 'log' | 'breadcrumb' | 'awake' | 'win';
const palette: Record<string, string | null> = {
  '.': null, O: '#18151A', D: '#4A3F37', M: '#78685A', L: '#A69584', W: '#F5F2EB',
  C: '#DCD6CA', G: '#6EC275', E: '#2F6B37', P: '#E88D98', R: '#B85A66', V: '#5B5BD6',
  U: '#8C8CEB', T: '#22C55E', K: '#86EFAC', Y: '#FACC15', A: '#F97316', F: '#EF4444',
  S: '#FFFFFF', B: '#CBD5E1', N: '#64748B', Z: '#334155',
};

export function SparkyGuideAnimation({ mode }: { mode: SparkyGuideMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    let frame = 0;
    const frames = sparkyFeatureFrames[mode];
    const draw = () => {
      const scale = 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      frames[frame].forEach((row, y) => {
        [...row].forEach((pixel, x) => {
          const color = palette[pixel];
          if (color) {
            context.fillStyle = color;
            context.fillRect(x * scale, y * scale, scale, scale);
          }
        });
      });
      frame = (frame + 1) % frames.length;
    };

    draw();
    const interval = window.setInterval(draw, 125);
    return () => window.clearInterval(interval);
  }, [mode]);

  return <canvas className={`guide-animation guide-animation-${mode}`} ref={canvasRef} width={96} height={72} aria-label={`Sparky animation for ${mode}`} role="img" />;
}
