import { useEffect, useState } from 'react';

const BackgroundShapes = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Full Dotted Background Grid */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(400)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/80 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Secondary White Dots */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(300)].map((_, i) => (
          <div
            key={`secondary-${i}`}
            className="absolute w-1 h-1 bg-white/60 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Orange Accent Dots */}
      <div className="absolute inset-0 opacity-25">
        {[...Array(200)].map((_, i) => (
          <div
            key={`accent-${i}`}
            className="absolute w-1.5 h-1.5 bg-orange-400/70 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2.5 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Large Floating Circles */}
      <div
        className="absolute w-96 h-96 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-full blur-3xl"
        style={{
          left: `${20 + (mousePosition.x / window.innerWidth) * 10}%`,
          top: `${30 + (mousePosition.y / window.innerHeight) * 10}%`,
          transition: 'all 0.3s ease-out'
        }}
      />
      <div
        className="absolute w-80 h-80 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
        style={{
          right: `${20 + (mousePosition.x / window.innerWidth) * 10}%`,
          bottom: `${20 + (mousePosition.y / window.innerHeight) * 10}%`,
          transition: 'all 0.3s ease-out'
        }}
      />

      {/* Geometric Shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-orange-400/20 rotate-45 animate-spin-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-orange-400/10 to-yellow-400/10 rounded-full animate-bounce-slow" />

      {/* Floating Lines */}
      <div className="absolute top-1/3 right-1/3 w-64 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent animate-pulse" />
      <div className="absolute bottom-1/3 left-1/3 w-48 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Corner Accents */}
      <div className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-orange-400/30" />
      <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-orange-400/30" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-orange-400/30" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-orange-400/30" />

      {/* Small Floating Elements */}
      <div className="absolute top-1/2 left-1/6 w-4 h-4 bg-orange-400/40 rounded-full animate-float" />
      <div className="absolute top-1/3 right-1/6 w-3 h-3 bg-yellow-400/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/3 left-1/5 w-2 h-2 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/2 right-1/5 w-5 h-5 bg-blue-400/40 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Hexagon Pattern */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 clip-path-hexagon animate-spin-slow" />
      </div>

      {/* Wave Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-400/5 to-transparent" />
    </div>
  );
};

export default BackgroundShapes; 