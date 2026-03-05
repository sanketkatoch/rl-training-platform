import React, { useEffect, useState } from 'react';

const models = [
  { name: 'LLaMA 3.3', color: '#f97316' },
  { name: 'LLaMA 3.1', color: '#fb923c' },
  { name: 'GPT-OSS 120B', color: '#10b981' },
  { name: 'GPT-OSS 20B', color: '#06b6d4' },
  { name: 'Gemini', color: '#0ea5e9' },
];

const AILoadingState: React.FC = () => {
  const [dots, setDots] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    const timeInterval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(dotsInterval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div style={{
      marginTop: '1.5rem',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px',
      padding: '1.5rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem'
      }}>
        <p style={{ fontWeight: 700, color: 'white', margin: 0, fontSize: '0.95rem' }}>
          Querying AI models{dots}
        </p>
        <span style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.82rem',
          fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.05)',
          padding: '0.2rem 0.6rem',
          borderRadius: '6px'
        }}>
          {elapsed}s
        </span>
      </div>

      {models.map((model) => (
        <div key={model.name} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)',
          marginBottom: '0.6rem',
          border: `1px solid ${model.color}20`
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: model.color,
            animation: 'pulse 1.2s ease-in-out infinite',
            flexShrink: 0,
            boxShadow: `0 0 8px ${model.color}`
          }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', flex: 1 }}>
            {model.name}
          </span>
          <div style={{
            height: '6px',
            width: '100px',
            borderRadius: '999px',
            background: `linear-gradient(90deg, ${model.color}40 25%, ${model.color}80 50%, ${model.color}40 75%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }} />
          <span style={{ fontSize: '0.78rem', color: model.color, fontWeight: 600, minWidth: '65px', textAlign: 'right' }}>
            thinking...
          </span>
        </div>
      ))}

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem', marginTop: '1rem', marginBottom: 0, textAlign: 'center' }}>
        5 cloud models running in parallel · errors shown last
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default AILoadingState;
