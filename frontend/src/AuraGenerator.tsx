import React, { useRef, useEffect } from 'react';

// Dynamically import p5 to reduce initial bundle size
const loadP5 = () => import('p5');

interface AuraGeneratorProps {
  moodSeed: string;
  transactionCount: number;
  onImageGenerated: (imageData: string) => void;
}

const AuraGenerator: React.FC<AuraGeneratorProps> = ({
  moodSeed,
  transactionCount,
  onImageGenerated
}) => {
  const p5ContainerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const hasGeneratedRef = useRef<boolean>(false);
  const onImageGeneratedRef = useRef(onImageGenerated);

  // Update callback ref when it changes
  useEffect(() => {
    onImageGeneratedRef.current = onImageGenerated;
  }, [onImageGenerated]);

  useEffect(() => {
    // Prevent multiple generations
    if (!p5ContainerRef.current || !moodSeed || isGeneratingRef.current) return;
    
    // Clean up existing instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }
    
    // Reset generation state
    hasGeneratedRef.current = false;
    isGeneratingRef.current = true;

    const initializeP5 = async () => {
      const p5Module = await loadP5();
      const p5 = p5Module.default;

      const sketch = (p: any) => {
      let particles: any[] = [];
      let waveforms: any[] = [];
      
      // Advanced mood-based color palettes
      const moodPalettes: { [key: string]: number[][] } = {
        happy: [[255, 223, 0], [255, 165, 0], [255, 69, 0]], // Warm yellows/oranges
        calm: [[64, 224, 208], [0, 191, 255], [138, 43, 226]], // Cool blues/purples
        energetic: [[255, 20, 147], [255, 0, 255], [255, 105, 180]], // Vibrant magentas
        peaceful: [[144, 238, 144], [152, 251, 152], [173, 255, 47]], // Soft greens
        mysterious: [[75, 0, 130], [138, 43, 226], [72, 61, 139]], // Deep purples
        passionate: [[220, 20, 60], [255, 69, 0], [255, 140, 0]], // Reds/oranges
        default: [[100, 149, 237], [65, 105, 225], [30, 144, 255]] // Blue spectrum
      };

      const getMoodPalette = (seed: string): number[][] => {
        const lowerSeed = seed.toLowerCase();
        for (const [mood, colors] of Object.entries(moodPalettes)) {
          if (lowerSeed.includes(mood) || lowerSeed.includes(mood.slice(0, 4))) {
            return colors;
          }
        }
        return moodPalettes.default;
      };
      
      // Calculate seed hash for deterministic generation
      const seedHash = moodSeed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const palette = getMoodPalette(moodSeed);
      
      p.setup = () => {
        const canvas = p.createCanvas(150, 150);
        p.colorMode(p.RGB);
        
        const particleCount = Math.min(Math.max(transactionCount, 5) + 10, 35); // Reduced for static generation
        
        // Generate static particles with deterministic properties
        for (let i = 0; i < particleCount; i++) {
          const colorIndex = i % palette.length;
          const [r, g, b] = palette[colorIndex];
          
          particles.push({
            x: p.width / 2,
            y: p.height / 2,
            angle: (i / particleCount) * p.TWO_PI + (seedHash * 0.01),
            baseRadius: 40 + (i % 4) * 20,
            radiusVariation: 15 + (i % 3) * 10,
            size: 4 + (i % 3) * 2,
            r: Math.min(255, r + (seedHash + i * 23) % 40),
            g: Math.min(255, g + (seedHash + i * 37) % 40),
            b: Math.min(255, b + (seedHash + i * 41) % 40),
            phaseOffset: i * 0.2,
            type: i % 3 // 0: orbiting, 1: spiral, 2: wave
          });
        }
        
        // Generate static background waveforms
        const waveCount = Math.floor(transactionCount / 15) + 2;
        for (let i = 0; i < Math.min(waveCount, 5); i++) {
          waveforms.push({
            amplitude: 20 + i * 8,
            phase: i * p.PI * 0.4 + seedHash * 0.01,
            color: palette[i % palette.length],
            alpha: 25 + i * 8
          });
        }
        
        // Draw static aura once
        drawStaticAura();
        
        // Capture image after brief delay for rendering (only once)
        if (!hasGeneratedRef.current) {
          hasGeneratedRef.current = true;
          setTimeout(() => {
            if (canvas && canvas.canvas) {
              const imageData = canvas.canvas.toDataURL('image/png');
              onImageGeneratedRef.current(imageData);
            }
            isGeneratingRef.current = false;
          }, 150);
        }
      };

      const drawStaticAura = () => {
        // Clear background
        p.background(0);
        
        // Create static radial gradient background
        for (let r = 150; r > 0; r -= 3) {
          const inter = p.map(r, 0, 150, 0, 1);
          const alpha = 255 * (1 - inter * 0.7);
          const baseColor = palette[0];
          p.fill(baseColor[0] * 0.15, baseColor[1] * 0.15, baseColor[2] * 0.15, alpha * 0.3);
          p.noStroke();
          p.ellipse(p.width / 2, p.height / 2, r, r);
        }
        
        // Draw static background waveforms
        waveforms.forEach((wave, index) => {
          const [r, g, b] = wave.color;
          p.stroke(r, g, b, wave.alpha * 0.5);
          p.strokeWeight(1);
          p.noFill();
          
          p.beginShape();
          for (let angle = 0; angle < p.TWO_PI; angle += 0.2) {
            const radius = 50 + wave.amplitude * Math.sin(angle * 2 + wave.phase);
            const x = p.width / 2 + Math.cos(angle) * radius;
            const y = p.height / 2 + Math.sin(angle) * radius;
            p.vertex(x, y);
          }
          p.endShape(p.CLOSE);
        });
        
        // Draw static particles
        particles.forEach((particle, i) => {
          let x, y;
          
          if (particle.type === 0) {
            // Static orbiting position
            const radius = particle.baseRadius + Math.sin(particle.phaseOffset + seedHash * 0.01) * particle.radiusVariation * 0.5;
            x = Math.cos(particle.angle + seedHash * 0.001) * radius;
            y = Math.sin(particle.angle + seedHash * 0.001) * radius;
          } else if (particle.type === 1) {
            // Static spiral position
            const spiralRadius = particle.baseRadius + (i * 5) % 40;
            const spiralAngle = particle.angle + (i * 0.3);
            x = Math.cos(spiralAngle) * spiralRadius;
            y = Math.sin(spiralAngle) * spiralRadius;
          } else {
            // Static wave position
            const waveRadius = particle.baseRadius + Math.sin(particle.phaseOffset + i * 0.5) * 25;
            x = Math.cos(particle.angle) * waveRadius;
            y = Math.sin(particle.angle) * waveRadius;
          }
          
          // Static size based on particle properties
          const staticVariation = Math.sin(seedHash * 0.01 + i * 0.3) * 0.5 + 0.5;
          const size = particle.size + staticVariation * 3;
          
          // Draw static particle with glow effect
          p.push();
          p.translate(p.width / 2, p.height / 2);
          
          // Outer glow
          for (let glow = 2; glow > 0; glow--) {
            const alpha = 60 / glow;
            p.fill(particle.r, particle.g, particle.b, alpha);
            p.noStroke();
            p.ellipse(x, y, size + glow * 2, size + glow * 2);
          }
          
          // Main particle
          p.fill(particle.r, particle.g, particle.b, 200);
          p.noStroke();
          p.ellipse(x, y, size, size);
          
          // Inner highlight
          p.fill(255, 255, 255, 80);
          p.ellipse(x - size * 0.2, y - size * 0.2, size * 0.3, size * 0.3);
          
          // Connection lines to center (for some particles)
          if (i % 5 === 0) {
            p.stroke(particle.r, particle.g, particle.b, 40);
            p.strokeWeight(0.5);
            p.line(0, 0, x, y);
          }
          
          p.pop();
        });
        
        // Static central energy core
        const coreSize = 12 + Math.sin(seedHash * 0.005) * 4;
        const coreColors = palette[0];
        p.push();
        p.translate(p.width / 2, p.height / 2);
        
        // Core glow
        for (let i = 3; i > 0; i--) {
          const alpha = 60 / i;
          p.fill(coreColors[0], coreColors[1], coreColors[2], alpha);
          p.noStroke();
          p.ellipse(0, 0, coreSize + i * 2, coreSize + i * 2);
        }
        
        // Core
        p.fill(255, 255, 255, 150);
        p.ellipse(0, 0, coreSize * 0.5, coreSize * 0.5);
        p.pop();
      };

        // No draw loop needed for static aura
        p.noLoop();
      };

      if (p5ContainerRef.current) {
        p5InstanceRef.current = new p5(sketch, p5ContainerRef.current);
      }
    };

    // Initialize p5 asynchronously
    initializeP5().catch((error) => {
      console.error('P5 initialization error:', error);
      isGeneratingRef.current = false;
    });

    return () => {
      isGeneratingRef.current = false;
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodSeed, transactionCount]); // onImageGenerated handled via ref to prevent re-runs

  return (
    <div className="aura-generator-container">
      <div
        ref={p5ContainerRef}
        className="aura-canvas-container"
      />
    </div>
  );
};

export default AuraGenerator;
