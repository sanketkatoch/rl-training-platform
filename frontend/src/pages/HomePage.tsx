import React, { useEffect, useState } from 'react';
import { getTasks, getUsers } from '../services/api';

const HomePage: React.FC = () => {
  const [taskCount, setTaskCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const tasks = await getTasks();
        const users = await getUsers();
        setTaskCount(tasks.length);
        setUserCount(users.length);
        setCompletedCount(tasks.filter((t: any) => t.status === 'completed').length);
      } catch (err) {
        console.error('Failed to load stats');
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Users', value: userCount, color: '#6366f1', glow: 'rgba(99,102,241,0.3)' },
    { label: 'Total Tasks', value: taskCount, color: '#0ea5e9', glow: 'rgba(14,165,233,0.3)' },
    { label: 'Completed', value: completedCount, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  ];

  const steps = [
    { step: '01', title: 'Researcher creates a task', desc: 'A prompt is submitted that all AI models will answer simultaneously' },
    { step: '02', title: 'AI models respond in parallel', desc: 'LLaMA 3 (Groq), Gemini Flash, and Mistral 7B respond concurrently' },
    { step: '03', title: 'Annotators rate responses', desc: 'Human annotators score each response 1–5 with written feedback' },
    { step: '04', title: 'Dataset exported for training', desc: 'Clean preference data trains and fine-tunes AI models via RLHF' },
  ];

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '860px', margin: '0 auto' }}>

      {/* Hero */}
      <div style={{
        marginBottom: '3rem',
        animation: 'fadeInUp 0.6s ease both'
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '999px',
          padding: '0.3rem 1rem',
          fontSize: '0.8rem',
          color: '#818cf8',
          fontWeight: 600,
          marginBottom: '1.25rem',
          letterSpacing: '0.5px'
        }}>
          REINFORCEMENT LEARNING FROM HUMAN FEEDBACK
        </div>
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          color: 'white',
          lineHeight: 1.15,
          marginBottom: '1rem',
          letterSpacing: '-0.5px'
        }}>
          RL Training<br />
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Data Platform
          </span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', maxWidth: '520px', lineHeight: 1.6 }}>
          Collect human preference data to train AI agents. Compare responses from
          multiple models and build high-quality RLHF datasets.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '1.25rem',
        marginBottom: '3rem',
        animation: 'fadeInUp 0.6s ease 0.1s both'
      }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center',
            boxShadow: `0 0 30px ${stat.glow}`,
            transition: 'transform 0.2s ease',
          }}>
            <div style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              color: stat.color,
              marginBottom: '0.4rem',
              textShadow: `0 0 20px ${stat.glow}`
            }}>
              {stat.value}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ animation: 'fadeInUp 0.6s ease 0.2s both' }}>
        <h2 style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '1.2rem',
          fontWeight: 700,
          marginBottom: '1.25rem'
        }}>
          How It Works
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {steps.map((item, i) => (
            <div key={item.step} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1.1rem 1.25rem',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              animation: `fadeInUp 0.5s ease ${0.3 + i * 0.08}s both`
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                color: 'white',
                borderRadius: '8px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                flexShrink: 0,
                letterSpacing: '0.5px'
              }}>
                {item.step}
              </span>
              <div>
                <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '0.2rem', fontSize: '0.95rem' }}>
                  {item.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
