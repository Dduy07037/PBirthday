'use client';

import { useEffect, useRef } from 'react';

export default function CanvasBirthday() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    // Simple birthday text and cake drawing
    function drawBirthdayScene() {
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1a001a');
      gradient.addColorStop(1, '#4d004d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw "Happy Birthday" text
      ctx.font = '60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 10;
      ctx.fillText('Happy Birthday!', width / 2, height / 3);

      // Draw cake base
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(width / 2 - 100, height / 2, 200, 100);
      
      // Draw cake icing
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(width / 2 - 110, height / 2, 220, 20);
      
      // Draw candle
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(width / 2 - 5, height / 2 - 40, 10, 40);
      
      // Draw flame (animated)
      const time = Date.now() / 200;
      const flameHeight = 20 + Math.sin(time) * 5;
      const flameWidth = 14 + Math.sin(time * 1.5) * 2;
      
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2 - 40);
      ctx.bezierCurveTo(
        width / 2 - flameWidth / 2, height / 2 - 40 - flameHeight / 3,
        width / 2 - flameWidth / 2, height / 2 - 40 - flameHeight * 2/3,
        width / 2, height / 2 - 40 - flameHeight
      );
      ctx.bezierCurveTo(
        width / 2 + flameWidth / 2, height / 2 - 40 - flameHeight * 2/3,
        width / 2 + flameWidth / 2, height / 2 - 40 - flameHeight / 3,
        width / 2, height / 2 - 40
      );
      
      const flameGradient = ctx.createLinearGradient(
        width / 2, height / 2 - 40,
        width / 2, height / 2 - 40 - flameHeight
      );
      flameGradient.addColorStop(0, '#ff9900');
      flameGradient.addColorStop(1, '#ff0000');
      
      ctx.fillStyle = flameGradient;
      ctx.fill();
      
      // Create glow effect
      ctx.shadowColor = '#ff9900';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 40 - flameHeight / 2, flameHeight / 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Animation particles
    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 5 + 1,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 3 - 1.5
      });
    }

    function updateParticles() {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Reset particles that go off screen
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        
        // Draw particles
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, width, height);
      drawBirthdayScene();
      updateParticles();
      requestAnimationFrame(animate);
    }

    animate();

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    />
  );
} 