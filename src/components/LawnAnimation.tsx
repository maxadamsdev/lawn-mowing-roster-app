import React, { useEffect, useRef } from 'react';
import './LawnAnimation.css';

interface LawnAnimationProps {
  darkMode: boolean;
}

export const LawnAnimation: React.FC<LawnAnimationProps> = ({ darkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    // Animation state
    let time = 0;
    let animationId: number;
    const clouds: Array<{
      x: number;
      y: number;
      scale: number;
      speed: number;
    }> = [];
    const trees: Array<{
      x: number;
      scale: number;
      speed: number;
    }> = [];
    const grassBits: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      rotation: number;
      rotSpeed: number;
      life: number;
      size: number;
    }> = [];

    // Color themes
    const dayColors = {
      sky: {
        top: '#87CEEB',
        bottom: '#87CEEB',
        ground: '#7CCD7C'
      },
      backHill: '#5a9e3a',
      frontHill: '#7CCD7C',
      treeTrunk: '#654321',
      treeFoliage: ['#2d5016', '#3a6b1f', '#4a8029'],
      grass: { base: 100, variation: 30 }
    };

    const nightColors = {
      sky: {
        top: '#0a0a2e',
        bottom: '#16213e',
        ground: '#1a3a2e'
      },
      backHill: '#2d4a3a',
      frontHill: '#1a3a2e',
      treeTrunk: '#3a2d21',
      treeFoliage: ['#1a2d16', '#2a3d1f', '#3a4d29'],
      grass: { base: 60, variation: 20 },
      stars: true
    };

    const colors = darkMode ? nightColors : dayColors;

    // Initialize clouds
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.6),
        scale: 0.5 + Math.random() * 0.5,
        speed: 0.2 + Math.random() * 0.3
      });
    }

    // Initialize trees
    for (let i = 0; i < 8; i++) {
      trees.push({
        x: Math.random() * canvas.width,
        scale: 0.4 + Math.random() * 0.6,
        speed: 0.5
      });
    }

    // Stars for night mode
    const stars: Array<{ x: number; y: number; size: number; twinkle: number }> = [];
    if (darkMode) {
      for (let i = 0; i < 100; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * (canvas.height * 0.7),
          size: Math.random() * 2,
          twinkle: Math.random() * Math.PI * 2
        });
      }
    }

    // Function to recreate stars
    const recreateStars = () => {
      stars.length = 0;
      if (darkMode) {
        for (let i = 0; i < 100; i++) {
          stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.7),
            size: Math.random() * 2,
            twinkle: Math.random() * Math.PI * 2
          });
        }
      }
    };

    // Draw cloud
    function drawCloud(x: number, y: number, scale: number) {
      if (darkMode) return; // No clouds at night
      
      ctx.fillStyle = darkMode ? 'rgba(200, 200, 200, 0.3)' : 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const offsetX = Math.cos(angle) * 30 * scale;
        const offsetY = Math.sin(angle) * 15 * scale;
        const radius = (20 + Math.sin(i * 1.5) * 10) * scale;
        
        ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
      }
      
      ctx.fill();
    }

    // Draw stars
    function drawStars() {
      if (!darkMode) return;
      
      stars.forEach(star => {
        const brightness = 0.5 + Math.sin(time * 2 + star.twinkle) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw tree
    function drawTree(x: number, y: number, scale: number) {
      // Trunk
      ctx.fillStyle = colors.treeTrunk;
      const trunkWidth = 12 * scale;
      const trunkHeight = 50 * scale;
      
      ctx.beginPath();
      ctx.moveTo(x - trunkWidth/2, y);
      ctx.lineTo(x - trunkWidth/3, y - trunkHeight);
      ctx.lineTo(x + trunkWidth/3, y - trunkHeight);
      ctx.lineTo(x + trunkWidth/2, y);
      ctx.closePath();
      ctx.fill();
      
      // Foliage
      colors.treeFoliage.forEach((color, i) => {
        ctx.fillStyle = color;
        const offset = i * 10 * scale;
        const width = (45 - i * 10) * scale;
        
        ctx.beginPath();
        ctx.moveTo(x, y - trunkHeight - (70 - offset) * scale);
        ctx.lineTo(x - width, y - trunkHeight + (10 - offset * 0.5) * scale);
        ctx.lineTo(x + width, y - trunkHeight + (10 - offset * 0.5) * scale);
        ctx.closePath();
        ctx.fill();
      });
    }

    // Draw rolling hills
    function drawHills(offset: number) {
      const hillHeight = canvas.height * 0.3;
      const baseY = canvas.height * 0.7;
      
      // Back hill
      ctx.fillStyle = colors.backHill;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      for (let x = 0; x <= canvas.width; x += 5) {
        const wave1 = Math.sin((x - offset * 0.5) * 0.005) * 40;
        const wave2 = Math.sin((x - offset * 0.5) * 0.008 + 2) * 30;
        const y = baseY - hillHeight * 0.3 + wave1 + wave2;
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();
      
      // Front hill
      ctx.fillStyle = colors.frontHill;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      for (let x = 0; x <= canvas.width; x += 5) {
        const wave1 = Math.sin((x - offset) * 0.006) * 50;
        const wave2 = Math.sin((x - offset) * 0.01 + 1) * 35;
        const y = baseY + wave1 + wave2;
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();
    }

    // Get Y position on back hill
    function getBackHillY(x: number, offset: number): number {
      const hillHeight = canvas.height * 0.3;
      const baseY = canvas.height * 0.7;
      const wave1 = Math.sin((x - offset * 0.5) * 0.005) * 40;
      const wave2 = Math.sin((x - offset * 0.5) * 0.008 + 2) * 30;
      return baseY - hillHeight * 0.3 + wave1 + wave2;
    }

    // Get Y position on front hill
    function getHillY(x: number, offset: number): number {
      const baseY = canvas.height * 0.7;
      const wave1 = Math.sin((x - offset) * 0.006) * 50;
      const wave2 = Math.sin((x - offset) * 0.01 + 1) * 35;
      return baseY + wave1 + wave2;
    }

    // Improved grass drawing - thicker and nicer
    function drawGrassOnHill(offset: number) {
      const density = 2; // Denser grass (every 2px instead of 3px)
      
      for (let x = 0; x < canvas.width; x += density) {
        const hillY = getHillY(x, offset);
        
        // Vary grass height with wave pattern
        const wavePattern = Math.sin(x * 0.02 + offset * 0.03) * 5;
        const grassHeight = 15 + wavePattern + Math.sin(x * 0.05) * 6; // Taller grass
        
        // Color variation for depth
        const colorVariation = Math.sin(x * 0.3 + offset * 0.1) * colors.grass.variation;
        const greenValue = Math.floor(colors.grass.base + colorVariation);
        const r = darkMode ? Math.floor(greenValue * 0.3) : 40;
        const g = darkMode ? greenValue : greenValue + 40;
        const b = darkMode ? Math.floor(greenValue * 0.4) : 30;
        
        // Draw thicker grass blades with multiple strokes
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth = 2; // Thicker line
        ctx.lineCap = 'round';
        
        // Draw main blade with curve
        const lean = Math.sin(offset * 0.08 + x * 0.1) * 4;
        const midX = x + lean * 0.5;
        const tipX = x + lean;
        
        ctx.beginPath();
        ctx.moveTo(x, hillY);
        ctx.bezierCurveTo(
          midX, hillY - grassHeight * 0.4,
          midX, hillY - grassHeight * 0.7,
          tipX, hillY - grassHeight
        );
        ctx.stroke();
        
        // Draw secondary thinner blade for fullness (50% of blades)
        if (x % (density * 2) === 0) {
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
          const offsetX = (Math.random() > 0.5 ? 1 : -1) * 1;
          ctx.beginPath();
          ctx.moveTo(x + offsetX, hillY);
          ctx.bezierCurveTo(
            midX + offsetX, hillY - grassHeight * 0.35,
            midX + offsetX, hillY - grassHeight * 0.65,
            tipX + offsetX, hillY - grassHeight * 0.9
          );
          ctx.stroke();
        }
      }
    }

    // Draw lawnmower
    function drawLawnmower(x: number, y: number, time: number) {
      const scale = 1.5;
      
      // Body
      ctx.fillStyle = '#DC143C';
      ctx.fillRect(x - 30 * scale, y - 30 * scale, 70 * scale, 30 * scale);
      
      // Handle
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(x + 20 * scale, y - 30 * scale);
      ctx.lineTo(x + 30 * scale, y - 70 * scale);
      ctx.stroke();
      
      // Wheels
      ctx.fillStyle = '#333';
      const wheel1X = x - 15 * scale;
      const wheel2X = x + 25 * scale;
      const wheelY = y;
      const wheelRadius = 12 * scale;
      
      const rotation = time * 5;
      
      [wheel1X, wheel2X].forEach(wx => {
        ctx.beginPath();
        ctx.arc(wx, wheelY, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Spokes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const angle = rotation + (i * Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(wx, wheelY);
          ctx.lineTo(
            wx + Math.cos(angle) * wheelRadius * 0.7,
            wheelY + Math.sin(angle) * wheelRadius * 0.7
          );
          ctx.stroke();
        }
      });
      
      // Blade area
      ctx.fillStyle = '#555';
      ctx.fillRect(x - 25 * scale, y - 5 * scale, 60 * scale, 5 * scale);
      
      // Rotating blade
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const bladeX = x + 5 * scale;
      const bladeY = y - 2 * scale;
      const bladeLength = 25 * scale;
      const bladeAngle = time * 10;
      
      ctx.moveTo(
        bladeX - Math.cos(bladeAngle) * bladeLength,
        bladeY - Math.sin(bladeAngle) * bladeLength
      );
      ctx.lineTo(
        bladeX + Math.cos(bladeAngle) * bladeLength,
        bladeY + Math.sin(bladeAngle) * bladeLength
      );
      ctx.stroke();
    }

    // Create grass bit
    function createGrassBit(x: number, y: number) {
      grassBits.push({
        x: x,
        y: y,
        vx: 3 + Math.random() * 3,
        vy: -4 - Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 1.0,
        size: 3 + Math.random() * 4
      });
    }

    // Draw grass bit
    function drawGrassBit(bit: typeof grassBits[0]) {
      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(bit.rotation);
      ctx.fillStyle = `rgba(34, 139, 34, ${bit.life})`;
      ctx.fillRect(-bit.size/2, -bit.size/2, bit.size, bit.size);
      ctx.restore();
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
      skyGradient.addColorStop(0, colors.sky.top);
      skyGradient.addColorStop(1, colors.sky.bottom);
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
      
      time += 0.016;
      const scrollOffset = time * 60;

      // Draw stars (night mode)
      drawStars();

      // Update and draw clouds
      clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + 100) {
          cloud.x = -100;
          cloud.y = Math.random() * (canvas.height * 0.6);
        }
        drawCloud(cloud.x, cloud.y, cloud.scale);
      });

      // Draw hills
      drawHills(scrollOffset);

      // Draw grass
      drawGrassOnHill(scrollOffset);

      // Update and draw trees
      trees.forEach(tree => {
        tree.x += tree.speed;
        if (tree.x > canvas.width + 100) {
          tree.x = -100;
        }
        const treeY = getBackHillY(tree.x, scrollOffset);
        drawTree(tree.x, treeY, tree.scale);
      });

      // Lawnmower
      const mowerX = canvas.width - 150;
      const hillY = getHillY(mowerX, scrollOffset);
      const mowerY = hillY - 5;

      // Generate grass bits
      if (Math.random() < 0.3) {
        createGrassBit(mowerX + 20, mowerY - 10);
      }

      // Update and draw grass bits
      for (let i = grassBits.length - 1; i >= 0; i--) {
        const bit = grassBits[i];
        bit.x += bit.vx;
        bit.y += bit.vy;
        bit.vy += 0.2;
        bit.rotation += bit.rotSpeed;
        bit.life -= 0.02;

        if (bit.life <= 0 || bit.y > canvas.height) {
          grassBits.splice(i, 1);
        } else {
          drawGrassBit(bit);
        }
      }

      // Draw lawnmower
      drawLawnmower(mowerX, mowerY, time);

      animationId = requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      resizeCanvas();
      recreateStars();
    };

    window.addEventListener('resize', handleResize);

    // Recreate stars when darkMode changes
    recreateStars();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [darkMode]);

  return <canvas ref={canvasRef} className="lawn-animation" />;
};

