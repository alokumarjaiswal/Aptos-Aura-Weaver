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

  useEffect(() => {
    if (!p5ContainerRef.current || !moodSeed) return;

    let p5Instance: any = null;

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
      
      p.setup = () => {
        const canvas = p.createCanvas(400, 400);
        p.colorMode(p.RGB);
        
        // Create sophisticated background
        const seedHash = moodSeed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        
        const palette = getMoodPalette(moodSeed);
        const particleCount = Math.min(Math.max(transactionCount, 8) + 15, 50); // Cap for performance
        
        // Generate main particles with enhanced properties
        for (let i = 0; i < particleCount; i++) {
          const colorIndex = i % palette.length;
          const [r, g, b] = palette[colorIndex];
          
          particles.push({
            x: p.width / 2,
            y: p.height / 2,
            angle: (i / particleCount) * p.TWO_PI + (seedHash * 0.1),
            baseRadius: 60 + (i % 4) * 30,
            radiusVariation: 20 + (i % 3) * 15,
            size: 6 + (i % 4) * 3,
            r: Math.min(255, r + (seedHash + i * 31) % 50),
            g: Math.min(255, g + (seedHash + i * 47) % 50),
            b: Math.min(255, b + (seedHash + i * 67) % 50),
            speed: 0.015 + (i % 4) * 0.008,
            phaseOffset: i * 0.3,
            type: i % 3 // 0: orbiting, 1: spiral, 2: wave
          });
        }
        
        // Generate background waveforms
        const waveCount = Math.floor(transactionCount / 10) + 3;
        for (let i = 0; i < Math.min(waveCount, 8); i++) {
          waveforms.push({
            amplitude: 30 + i * 10,
            frequency: 0.02 + i * 0.01,
            phase: i * p.PI * 0.5,
            color: palette[i % palette.length],
            alpha: 30 + i * 10
          });
        }
        
        console.log(`Generated ${particles.length} particles and ${waveforms.length} waveforms`);
        
        // Draw initial frame
        drawAura();
        
        // Capture image after a brief animation
        setTimeout(() => {
          const imageData = canvas.canvas.toDataURL('image/png');
          onImageGenerated(imageData);
          console.log('Enhanced aura captured');
        }, 500);
      };

      const drawAura = () => {
        // Dynamic gradient background
        const time = p.millis() * 0.001;
        
        // Create radial gradient background
        for (let r = 400; r > 0; r -= 2) {
          const inter = p.map(r, 0, 400, 0, 1);
          const alpha = 255 * (1 - inter * 0.8);
          p.fill(10 + Math.sin(time * 0.5) * 20, 15 + Math.cos(time * 0.3) * 25, 25 + Math.sin(time * 0.7) * 30, alpha * 0.3);
          p.noStroke();
          p.ellipse(p.width / 2, p.height / 2, r, r);
        }
        
        // Draw background waveforms
        waveforms.forEach((wave, index) => {
          const [r, g, b] = wave.color;
          p.stroke(r, g, b, wave.alpha);
          p.strokeWeight(2);
          p.noFill();
          
          p.beginShape();
          for (let angle = 0; angle < p.TWO_PI; angle += 0.1) {
            const radius = 100 + wave.amplitude * Math.sin(angle * 3 + time * wave.frequency + wave.phase);
            const x = p.width / 2 + Math.cos(angle) * radius;
            const y = p.height / 2 + Math.sin(angle) * radius;
            p.vertex(x, y);
          }
          p.endShape(p.CLOSE);
        });
        
        // Draw enhanced particles
        particles.forEach((particle, i) => {
          let x, y;
          
          if (particle.type === 0) {
            // Orbiting particles
            const radius = particle.baseRadius + Math.sin(time * particle.speed + particle.phaseOffset) * particle.radiusVariation;
            x = Math.cos(particle.angle + time * particle.speed) * radius;
            y = Math.sin(particle.angle + time * particle.speed) * radius;
          } else if (particle.type === 1) {
            // Spiral particles
            const spiralRadius = particle.baseRadius + time * 10;
            const spiralAngle = particle.angle + time * particle.speed * 2;
            x = Math.cos(spiralAngle) * (spiralRadius % 150);
            y = Math.sin(spiralAngle) * (spiralRadius % 150);
          } else {
            // Wave-like motion
            const waveRadius = particle.baseRadius + Math.sin(time * particle.speed * 3 + particle.phaseOffset) * 40;
            x = Math.cos(particle.angle + time * particle.speed) * waveRadius;
            y = Math.sin(particle.angle + time * particle.speed * 1.5) * waveRadius;
          }
          
          // Pulsating size with more complex pattern
          const pulse1 = (Math.sin(time * 2 + i * 0.5) + 1) * 0.5;
          const pulse2 = (Math.cos(time * 1.5 + i * 0.3) + 1) * 0.3;
          const size = particle.size + pulse1 * 4 + pulse2 * 2;
          
          // Draw particle with glow effect
          p.push();
          p.translate(p.width / 2, p.height / 2);
          
          // Outer glow
          for (let glow = 3; glow > 0; glow--) {
            const alpha = 80 / glow;
            p.fill(particle.r, particle.g, particle.b, alpha);
            p.noStroke();
            p.ellipse(x, y, size + glow * 3, size + glow * 3);
          }
          
          // Main particle
          p.fill(particle.r, particle.g, particle.b, 220);
          p.noStroke();
          p.ellipse(x, y, size, size);
          
          // Inner highlight
          p.fill(255, 255, 255, 100);
          p.ellipse(x - size * 0.2, y - size * 0.2, size * 0.4, size * 0.4);
          
          // Connection lines to center (for some particles)
          if (i % 4 === 0) {
            p.stroke(particle.r, particle.g, particle.b, 50);
          p.strokeWeight(1);
            p.line(0, 0, x, y);
          }
          
          p.pop();
        });
        
        // Central energy core
        const coreSize = 20 + Math.sin(time * 3) * 8;
        const coreColors = getMoodPalette(moodSeed)[0];
        p.push();
        p.translate(p.width / 2, p.height / 2);
        
        // Core glow
        for (let i = 5; i > 0; i--) {
          const alpha = 100 / i;
          p.fill(coreColors[0], coreColors[1], coreColors[2], alpha);
          p.noStroke();
          p.ellipse(0, 0, coreSize + i * 4, coreSize + i * 4);
        }
        
        // Core
        p.fill(255, 255, 255, 200);
        p.ellipse(0, 0, coreSize * 0.6, coreSize * 0.6);
        p.pop();
      };

        p.draw = () => {
          drawAura();
        };
      };

      if (p5ContainerRef.current) {
        p5Instance = new p5(sketch, p5ContainerRef.current);
      }
    };

    // Initialize p5 asynchronously
    initializeP5().catch(console.error);

    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, [moodSeed, transactionCount, onImageGenerated]);

  return (
    <div className="aura-generator-container">
      <div
        ref={p5ContainerRef}
        className="aura-canvas-container"
      />
      <div className="aura-metadata">
        <div className="aura-metadata-item">
          <span className="aura-metadata-label">Mood</span>
          <span className="aura-metadata-value">"{moodSeed}"</span>
        </div>
        <div className="aura-metadata-item">
          <span className="aura-metadata-label">Particles</span>
          <span className="aura-metadata-value">{Math.max(transactionCount, 5) + 10}</span>
        </div>
        <div className="aura-metadata-item">
          <span className="aura-metadata-label">Transactions</span>
          <span className="aura-metadata-value">{transactionCount}</span>
        </div>
      </div>
    </div>
  );
};

export default AuraGenerator;
