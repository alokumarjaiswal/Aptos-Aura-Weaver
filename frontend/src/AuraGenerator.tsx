import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (!p5ContainerRef.current || !moodSeed) return;

    const sketch = (p: any) => {
      let particles: any[] = [];
      
      p.setup = () => {
        const canvas = p.createCanvas(400, 400);
        
        // Use RGB color mode instead of HSB to avoid color issues
        p.colorMode(p.RGB);
        p.background(0); // Black background
        
        // Create particles
        const seedHash = moodSeed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const particleCount = Math.max(transactionCount, 5) + 10;
        
        // Generate particles with bright, visible colors
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: p.width / 2,
            y: p.height / 2,
            angle: (i / particleCount) * p.TWO_PI,
            radius: 50 + (i % 5) * 20,
            size: 8 + (i % 3) * 4,
            r: 100 + (seedHash + i * 23) % 155, // Red component
            g: 100 + (seedHash + i * 47) % 155, // Green component  
            b: 100 + (seedHash + i * 71) % 155, // Blue component
            speed: 0.02 + (i % 3) * 0.01
          });
        }
        
        console.log(`Generated ${particles.length} particles with colors`);
        
        // Draw initial frame immediately
        drawParticles();
        
        // Capture image
        setTimeout(() => {
          const imageData = canvas.canvas.toDataURL('image/png');
          onImageGenerated(imageData);
          console.log('Image captured and sent');
        }, 200);
      };

      const drawParticles = () => {
        // Clear background
        p.background(0);
        
        const time = p.millis() * 0.001;
        
        p.push();
        p.translate(p.width / 2, p.height / 2);
        
        // Draw particles with bright, visible colors
        particles.forEach((particle, i) => {
          const x = Math.cos(particle.angle + time * particle.speed) * particle.radius;
          const y = Math.sin(particle.angle + time * particle.speed) * particle.radius;
          
          // Pulsating size
          const pulse = (Math.sin(time * 2 + i * 0.5) + 1) * 0.5;
          const size = particle.size + pulse * 5;
          
          // Use bright RGB colors that are guaranteed to be visible
          p.fill(particle.r, particle.g, particle.b, 200);
          p.noStroke();
          p.ellipse(x, y, size, size);
          
          // Add a bright outline for extra visibility
          p.stroke(255, 255, 255, 100);
          p.strokeWeight(1);
          p.noFill();
          p.ellipse(x, y, size + 2, size + 2);
        });
        
        p.pop();
      };

      p.draw = () => {
        drawParticles();
      };
    };

    const p5Instance = new p5(sketch, p5ContainerRef.current);

    return () => {
      p5Instance.remove();
    };
  }, [moodSeed, transactionCount, onImageGenerated]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div 
        ref={p5ContainerRef} 
        style={{ 
          width: 400, 
          height: 400, 
          border: '2px solid #333', 
          borderRadius: 8,
          backgroundColor: '#111' // Dark background to contrast with bright particles
        }} 
      />
      <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
        Aura: "{moodSeed}" | Particles: {Math.max(transactionCount, 5) + 10}
      </p>
    </div>
  );
};
