import React, { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface AuraGeneratorProps {
  moodSeed: string;
  transactionCount: number;
  onImageGenerated: (imageData: string) => void;
}

export const AuraGenerator: React.FC<AuraGeneratorProps> = ({ 
  moodSeed, 
  transactionCount, 
  onImageGenerated 
}) => {
  const p5ContainerRef = useRef<HTMLDivElement>(null);
  const [p5Instance, setP5Instance] = useState<p5 | null>(null);

  useEffect(() => {
    if (p5ContainerRef.current && moodSeed && transactionCount > 0) {
      if (p5Instance) {
        p5Instance.remove();
      }

      const sketch = (p: any) => {
        p.setup = () => {
          p.createCanvas(400, 400);
          p.colorMode(p.HSB);
          p.background(0);

          generateStaticAura(p, moodSeed, transactionCount);

          setTimeout(() => {
            const canvas = p._renderer.canvas as HTMLCanvasElement;
            onImageGenerated(canvas.toDataURL('image/png'));
          }, 100);
        };

        p.draw = () => {
          animateAura(p, moodSeed, transactionCount);
        };
      };

      const newP5Instance = new p5(sketch, p5ContainerRef.current);
      setP5Instance(newP5Instance);

      return () => {
        newP5Instance.remove();
      };
    }
  }, [moodSeed, transactionCount, onImageGenerated]);

  return (
    <div 
      ref={p5ContainerRef} 
      style={{ 
        width: 400, 
        height: 400, 
        border: '2px solid #333', 
        borderRadius: 8, 
        margin: '10px 0' 
      }} 
    />
  );
};

function generateStaticAura(p: any, seed: string, txCount: number) {
  const seedHash = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  p.push();
  p.translate(p.width / 2, p.height / 2);

  const hue = (seedHash * 137.5) % 360;
  const particleCount = Math.min(Math.max(txCount, 10), 100);

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * p.TWO_PI;
    const radius = 50 + (i % 10) * 15;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    p.fill(hue, 70, 90, 0.8);
    p.noStroke();
    p.ellipse(x, y, 8, 8);
  }

  p.pop();
}

function animateAura(p: any, seed: string, txCount: number) {
  p.background(0, 0.05);

  const time = p.millis() * 0.001;
  const seedHash = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  p.push();
  p.translate(p.width / 2, p.height / 2);

  const hue = (seedHash * 137.5) % 360;
  const particleCount = Math.min(Math.max(txCount, 10), 50);

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * p.TWO_PI + time * 0.5;
    const radius = 50 + Math.sin(time * 2 + i * 0.1) * 20;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const pulse = (Math.sin(time * 3 + i * 0.2) + 1) * 0.5;
    const size = 4 + pulse * 4;

    p.fill(hue, 70, 90, 0.8);
    p.noStroke();
    p.ellipse(x, y, size, size);
  }

  p.pop();
}
