'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  emoji: string;
  duration: number;
  delay: number;
  size: number;
}

const EMOJIS = ['⭐', '🌟', '✨', '💛', '🎉', '🎊', '💫', '🌈', '❤️', '💜'];

export default function Celebration({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.8,
      size: 1.2 + Math.random() * 1.5,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}
