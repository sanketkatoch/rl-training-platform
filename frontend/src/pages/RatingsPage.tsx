import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../App';
import { getTasksWithResponses, getResponsesForTask, getRatingsForResponse, createRating } from '../services/api';
interface Task {
  id: number;
  prompt: string;
  status: string;
}

interface Response {
  id: number;
  task_id: number;
  ai_model: string;
  response_text: string;
  response_time: number;
}

interface Rating {
  id: number;
  response_id: number;
  annotator_id: number;
  score: number;
  feedback: string;
}

const modelColors: { [key: string]: string } = {
  'llama-3.3-70b (Groq)': '#f97316',
  'llama3-70b (Groq)': '#fb923c',
  'gemma2-9b (Groq)': '#a855f7',
  'deepseek-r1 (Groq)': '#e11d48',
  'gemini (gemini-2.0-flash)': '#0ea5e9',
  'gemini (gemini-2.0-flash-lite)': '#0ea5e9',
  'gemini (gemini-1.5-flash-latest)': '#0ea5e9',
  'gemini': '#0ea5e9',
};

const modelDisplayNames: { [key: string]: string } = {
  'llama-3.3-70b (Groq)': 'LLaMA 3.3',
  'llama3-70b (Groq)': 'LLaMA 3',
  'gemma2-9b (Groq)': 'Gemma 2',
  'deepseek-r1 (Groq)': 'DeepSeek',
  'gemini (gemini-2.0-flash)': 'Gemini',
  'gemini (gemini-2.0-flash-lite)': 'Gemini',
  'gemini (gemini-1.5-flash-latest)': 'Gemini',
  'gemini': 'Gemini',
};
const getSpeedColor = (time: number) => {
  if (time < 2) return '#34d399';
  if (time < 5) return '#fbbf24';
  return '#f87171';
};

const getSpeedLabel = (time: number) => {
  if (time < 2) return '⚡ Fast';
  if (time < 5) return '🔶 Medium';
  return '🐢 Slow';
};

const RatingsPage: React.FC = () => {
  const { currentUser } = useContext(UserContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [responses, setResponses] = useState<{ [taskId: number]: Response[] }>({});
  const [loadingTask, setLoadingTask] = useState<number | null>(null);
  const [ratings, setRatings] = useState<{ [responseId: number]: Rating[] }>({});
  const [scores, setScores] = useState<{ [responseId: number]: number }>({});
  const [feedbacks, setFeedbacks] = useState<{ [responseId: number]: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasksWithResponses();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
    }
  };

  const handleToggleTask = async (taskId: number) => {
    // Collapse if already open
    if (expandedTask === taskId) {
      setExpandedTask(null);
      return;
    }

    setExpandedTask(taskId);
    setError('');
    setSuccess('');

    // Already loaded
    if (responses[taskId]) return;

    setLoadingTask(taskId);
    try {
      const data = await getResponsesForTask(taskId);
      setResponses(prev => ({ ...prev, [taskId]: data }));
      for (const response of data) {
        const ratingData = await getRatingsForResponse(response.id);
        setRatings(prev => ({ ...prev, [response.id]: ratingData }));
      }
    } catch (err) {
      setError('Failed to load responses');
    } finally {
      setLoadingTask(null);
    }
  };

  const handleSubmitRating = async (responseId: number, taskId: number) => {
    const score = scores[responseId];
    const feedback = feedbacks[responseId] || '';
    if (!score) { setError('Please select a score'); return; }
    try {
      await createRating({ response_id: responseId, annotator_id: currentUser?.id || 2, score, feedback });
      setSuccess('Rating submitted successfully');
      setError('');
      const ratingData = await getRatingsForResponse(responseId);
      setRatings(prev => ({ ...prev, [responseId]: ratingData }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit rating');
    }
  };

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>

      <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.5s ease both' }}>
        <h1 style={{ color: 'white', fontWeight: 800, fontSize: '2rem', marginBottom: '0.4rem' }}>
          Rate Responses
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>
          Click a task to expand and rate AI responses. Sorted newest first.
        </p>
      </div>

      {tasks.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.35)' }}>No tasks yet. Create one in the Tasks tab.</p>
      )}

      {tasks.map((task, i) => {
        const isExpanded = expandedTask === task.id;
        const isLoading = loadingTask === task.id;
        const taskResponses = responses[task.id] || [];

        return (
          <div
            key={task.id}
            style={{
              marginBottom: '0.75rem',
              borderRadius: '14px',
              border: isExpanded
                ? '1px solid rgba(99,102,241,0.4)'
                : '1px solid rgba(255,255,255,0.07)',
              background: isExpanded
                ? 'rgba(99,102,241,0.06)'
                : 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              overflow: 'hidden',
              transition: 'border 0.2s ease, background 0.2s ease',
              animation: `fadeInUp 0.4s ease ${i * 0.05}s both`
            }}
          >
            {/* Task header — clickable */}
            <div
              onClick={() => handleToggleTask(task.id)}
              style={{
                padding: '1.1rem 1.25rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <span style={{
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}>
                    TASK #{task.id}
                  </span>
                  <span style={{
                    background: task.status === 'completed'
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(245,158,11,0.15)',
                    color: task.status === 'completed' ? '#34d399' : '#fbbf24',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    border: `1px solid ${task.status === 'completed'
                      ? 'rgba(52,211,153,0.3)'
                      : 'rgba(251,191,36,0.3)'}`
                  }}>
                    {task.status}
                  </span>
                </div>
                <p style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  lineHeight: 1.4
                }}>
                  {task.prompt}
                </p>
              </div>

              {/* Expand/collapse arrow */}
              <div style={{
                color: isExpanded ? '#6366f1' : 'rgba(255,255,255,0.25)',
                fontSize: '1.1rem',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease, color 0.2s ease',
                flexShrink: 0
              }}>
                ▼
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ padding: '0 1.25rem 1.25rem' }}>

                {/* Loading state */}
                {isLoading && (
                  <div style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTop: '3px solid #6366f1',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 0.75rem'
                    }} />
                    Loading responses...
                  </div>
                )}

                {/* No responses */}
                {!isLoading && taskResponses.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                    No responses for this task yet.
                  </p>
                )}

                {/* Response cards */}
                {taskResponses.map((response, index) => {
                  const modelColor = modelColors[response.ai_model] || '#6366f1';
                  return (
                    <div key={response.id} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid rgba(255,255,255,0.07)`,
                      borderLeft: `3px solid ${modelColor}`,
                      borderRadius: '12px',
                      padding: '1.25rem',
                      marginBottom: '1rem',
                      animation: `fadeInUp 0.35s ease ${index * 0.08}s both`
                    }}>
                      {/* Model header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            background: `${modelColor}25`,
                            color: modelColor,
                            borderRadius: '6px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            border: `1px solid ${modelColor}40`
                          }}> 
                            #{index + 1}
                          </span>
                          <span style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
                            {modelDisplayNames[response.ai_model] || response.ai_model}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: getSpeedColor(response.response_time), fontSize: '0.78rem', fontWeight: 600 }}>
                            {getSpeedLabel(response.response_time)}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                            {response.response_time}s
                          </span>
                        </div>
                      </div>

                      {/* Response text */}
                      <p style={{
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: '1.65',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        padding: '0.85rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {response.response_text}
                      </p>

                      {/* Existing ratings */}
                      {ratings[response.id]?.length > 0 && (
                        <div style={{
                          marginBottom: '0.85rem',
                          padding: '0.75rem',
                          background: 'rgba(16,185,129,0.06)',
                          borderRadius: '8px',
                          border: '1px solid rgba(52,211,153,0.15)'
                        }}>
                          <p style={{ fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.75rem', color: '#34d399', letterSpacing: '0.5px' }}>
                            SUBMITTED RATINGS
                          </p>
                          {ratings[response.id].map(rating => (
                            <div key={rating.id} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>
                              ⭐ {rating.score}/5 — {rating.feedback}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rating form */}
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>
                          YOUR RATING
                        </p>
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.7rem' }}>
                          {[1, 2, 3, 4, 5].map(num => (
                            <button
                              key={num}
                              onClick={() => setScores(prev => ({ ...prev, [response.id]: num }))}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '9px',
                                border: scores[response.id] === num
                                  ? `2px solid ${modelColor}`
                                  : '1px solid rgba(255,255,255,0.1)',
                                background: scores[response.id] === num
                                  ? `${modelColor}30`
                                  : 'rgba(255,255,255,0.03)',
                                color: scores[response.id] === num ? modelColor : 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Optional feedback..."
                          value={feedbacks[response.id] || ''}
                          onChange={(e) => setFeedbacks(prev => ({ ...prev, [response.id]: e.target.value }))}
                          style={{
                            width: '100%',
                            minHeight: '65px',
                            padding: '0.65rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.04)',
                            color: 'white',
                            fontSize: '0.875rem',
                            marginBottom: '0.7rem',
                            boxSizing: 'border-box',
                            resize: 'vertical',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => handleSubmitRating(response.id, task.id)}
                          style={{
                            background: `linear-gradient(135deg, ${modelColor}cc, ${modelColor}88)`,
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1.2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            boxShadow: `0 3px 12px ${modelColor}35`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Submit Rating
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {error && (
        <div style={{
          color: '#f87171', padding: '0.85rem 1rem',
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: '10px', marginTop: '1rem', fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          color: '#34d399', padding: '0.85rem 1rem',
          background: 'rgba(52,211,153,0.1)',
          border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: '10px', marginTop: '1rem', fontSize: '0.9rem'
        }}>
          {success}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RatingsPage;
