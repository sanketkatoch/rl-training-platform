import React, { useEffect, useState } from 'react';
import { getTasksWithResponses, createTask, getResponsesForTask } from '../services/api';

interface Task {
  id: number;
  created_by: number;
  prompt: string;
  status: string;
  created_at: string;
  responseCount?: number;
}

interface Response {
  id: number;
  ai_model: string;
  response_text: string;
  response_time: number;
  error: boolean;
}

interface StreamedResponse {
  id: number;
  ai_model: string;
  response_text: string;
  response_time: number;
  error: boolean;
}

const modelColors: { [key: string]: string } = {
  'llama-3.3-70b (Groq)': '#f97316',
  'llama-3.1-8b (Groq)': '#fb923c',
  'GPT-OSS 120B (Groq)': '#10b981',
  'GPT-OSS 20B (Groq)': '#06b6d4',
  'gemini (gemini-2.0-flash)': '#0ea5e9',
  'gemini (gemini-2.0-flash-lite)': '#0ea5e9',
  'gemini (gemini-1.5-flash-latest)': '#0ea5e9',
  'gemini': '#0ea5e9',
};

const modelDisplayNames: { [key: string]: string } = {
  'llama-3.3-70b (Groq)': 'LLaMA 3.3',
  'llama-3.1-8b (Groq)': 'LLaMA 3.1',
  'GPT-OSS 120B (Groq)': 'GPT-OSS 120B',
  'GPT-OSS 20B (Groq)': 'GPT-OSS 20B',
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

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamedResponses, setStreamedResponses] = useState<StreamedResponse[]>([]);
  const [streamDone, setStreamDone] = useState(false);
  const [error, setError] = useState('');

  // Two-level accordion
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [taskResponses, setTaskResponses] = useState<{ [taskId: number]: Response[] }>({});
  const [expandedModel, setExpandedModel] = useState<number | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasksWithResponses();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
    }
  };

  const handleToggleTask = async (taskId: number) => {
    // Clicking same task closes it
    if (expandedTask === taskId) {
      setExpandedTask(null);
      setExpandedModel(null);
      return;
    }
    // Opening new task closes previous one automatically
    setExpandedTask(taskId);
    setExpandedModel(null);

    // Already loaded
    if (taskResponses[taskId]) return;

    setLoadingTaskId(taskId);
    try {
      const data = await getResponsesForTask(taskId);
      setTaskResponses(prev => ({ ...prev, [taskId]: data }));
    } catch (err) {
      console.error('Failed to load responses');
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleToggleModel = (responseId: number) => {
    setExpandedModel(prev => prev === responseId ? null : responseId);
  };

  const handleCreateTask = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    setLoading(true);
    setError('');
    setStreamedResponses([]);
    setStreamDone(false);

    try {
      const task = await createTask({ created_by: 1, prompt });
      setPrompt('');

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const eventSource = new EventSource(`${apiUrl}/stream/task/${task.id}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.done) {
          eventSource.close();
          setStreamDone(true);
          setLoading(false);
          fetchTasks();
          return;
        }
        setStreamedResponses(prev => {
          const updated = [...prev, data];
          const successful = updated.filter(r => !r.error).sort((a, b) => a.response_time - b.response_time);
          const failed = updated.filter(r => r.error);
          return [...successful, ...failed];
        });
      };

      eventSource.onerror = () => {
        eventSource.close();
        setLoading(false);
        setStreamDone(true);
        fetchTasks();
      };

    } catch (err) {
      setError('Failed to create task');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>

      <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.5s ease both' }}>
        <h1 style={{ color: 'white', fontWeight: 800, fontSize: '2rem', marginBottom: '0.4rem' }}>Tasks</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>
          Create a prompt and watch AI models respond in real time. Click any task to explore its responses.
        </p>
      </div>

      {/* Create Task Form */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '2rem',
        animation: 'fadeInUp 0.5s ease 0.1s both'
      }}>
        <h2 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 600 }}>
          Create New Task
        </h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt for AI models to answer..."
          disabled={loading}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.85rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: 'white',
            fontSize: '0.95rem',
            marginBottom: '1rem',
            boxSizing: 'border-box',
            resize: 'vertical',
            outline: 'none',
            opacity: loading ? 0.6 : 1,
          }}
        />
        {error && <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{error}</p>}

        {loading && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <p style={{ color: '#fbbf24', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
              Do not navigate away, refresh, or close this tab — AI models are running.
            </p>
          </div>
        )}

        <button
          onClick={handleCreateTask}
          disabled={loading}
          style={{
            background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            color: 'white',
            border: 'none',
            padding: '0.65rem 1.5rem',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            boxShadow: loading ? 'none' : '0 4px 15px rgba(99,102,241,0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Querying models...' : '⚡ Create Task'}
        </button>
      </div>

      {/* Streaming responses */}
      {(streamedResponses.length > 0 || loading) && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', fontWeight: 600 }}>
              {streamDone ? 'All responses received' : `Responses arriving... (${streamedResponses.length}/5)`}
            </h2>
            {!streamDone && (
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#34d399', animation: 'pulse 1s ease-in-out infinite',
                boxShadow: '0 0 8px #34d399'
              }} />
            )}
          </div>

          {loading && streamedResponses.length < 5 && (
            Array.from({ length: 5 - streamedResponses.length }).map((_, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>
                  Waiting for model...
                </span>
              </div>
            ))
          )}

          {streamedResponses.map((response, index) => {
            const modelColor = modelColors[response.ai_model] || '#6366f1';
            const displayName = modelDisplayNames[response.ai_model] || response.ai_model;
            return (
              <div key={response.id} style={{
                background: response.error ? 'rgba(248,113,113,0.04)' : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${response.error ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.08)'}`,
                borderLeft: `3px solid ${response.error ? '#f87171' : modelColor}`,
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '0.75rem',
                animation: 'slideInBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      background: `${modelColor}25`, color: modelColor,
                      borderRadius: '6px', padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem', fontWeight: 800, border: `1px solid ${modelColor}40`
                    }}>#{index + 1}</span>
                    <span style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{displayName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!response.error && (
                      <span style={{ color: getSpeedColor(response.response_time), fontSize: '0.78rem', fontWeight: 600 }}>
                        {getSpeedLabel(response.response_time)}
                      </span>
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                      {response.response_time}s
                    </span>
                  </div>
                </div>
                <p style={{
                  color: response.error ? '#f87171' : 'rgba(255,255,255,0.75)',
                  lineHeight: '1.65', fontSize: '0.9rem',
                  padding: '0.85rem', background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px', margin: 0, whiteSpace: 'pre-line'
                }}>
                  {response.response_text}
                </p>
              </div>
            );
          })}

          {streamDone && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#34d399', fontSize: '0.875rem', fontWeight: 600 }}>
              ✓ All models responded · Go to Rate Responses to submit ratings
            </div>
          )}
        </div>
      )}

      {/* Tasks List with two-level accordion */}
      <h2 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 600 }}>
        All Tasks
      </h2>

      {tasks.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.35)' }}>No tasks yet. Create one above.</p>
      ) : (
        tasks.map((task, i) => {
          const isTaskExpanded = expandedTask === task.id;
          const responses = taskResponses[task.id] || [];
          const isLoadingResponses = loadingTaskId === task.id;

          return (
            <div key={task.id} style={{
              marginBottom: '0.85rem',
              borderRadius: '14px',
              border: isTaskExpanded
                ? '1px solid rgba(99,102,241,0.4)'
                : '1px solid rgba(255,255,255,0.07)',
              background: isTaskExpanded
                ? 'rgba(99,102,241,0.06)'
                : 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
              transition: 'border 0.3s ease, background 0.3s ease',
              animation: `fadeInUp 0.4s ease ${i * 0.05}s both`
            }}>

              {/* Task header */}
              <div
                onClick={() => handleToggleTask(task.id)}
                style={{
                  padding: '1.1rem 1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  userSelect: 'none'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                      TASK #{task.id}
                    </span>
                    <span style={{
                      background: task.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: task.status === 'completed' ? '#34d399' : '#fbbf24',
                      padding: '0.1rem 0.5rem', borderRadius: '999px',
                      fontSize: '0.72rem', fontWeight: 600,
                      border: `1px solid ${task.status === 'completed' ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`
                    }}>
                      {task.status}
                    </span>
                    {task.responseCount !== undefined && (
                      <span style={{
                        background: 'rgba(99,102,241,0.15)',
                        color: '#818cf8',
                        padding: '0.1rem 0.5rem', borderRadius: '999px',
                        fontSize: '0.72rem', fontWeight: 600,
                        border: '1px solid rgba(99,102,241,0.3)'
                      }}>
                        {task.responseCount} models
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4 }}>
                    {task.prompt}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                    {new Date(task.created_at + 'Z').toLocaleString('en-US', {
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                      month: 'numeric', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit', hour12: true
                    })}
                  </p>
                </div>
                <div style={{
                  color: isTaskExpanded ? '#6366f1' : 'rgba(255,255,255,0.25)',
                  fontSize: '1rem',
                  transform: isTaskExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease',
                  flexShrink: 0
                }}>▼</div>
              </div>

              {/* Level 1 expanded — model list */}
              {isTaskExpanded && (
                <div style={{
                  padding: '0 1.25rem 1.25rem',
                  animation: 'expandDown 0.35s cubic-bezier(0.34, 1.2, 0.64, 1) both'
                }}>
                  {isLoadingResponses && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0' }}>
                      <div style={{
                        width: '18px', height: '18px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderTop: '2px solid #6366f1',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>
                        Loading responses...
                      </span>
                    </div>
                  )}

                  {!isLoadingResponses && responses.map((response, idx) => {
                    const modelColor = modelColors[response.ai_model] || '#6366f1';
                    const displayName = modelDisplayNames[response.ai_model] || response.ai_model;
                    const isModelExpanded = expandedModel === response.id;

                    return (
                      <div
                        key={response.id}
                        style={{
                          marginBottom: '0.5rem',
                          borderRadius: '10px',
                          border: isModelExpanded
                            ? `1px solid ${modelColor}50`
                            : '1px solid rgba(255,255,255,0.06)',
                          background: isModelExpanded
                            ? `${modelColor}08`
                            : 'rgba(255,255,255,0.02)',
                          overflow: 'hidden',
                          transition: 'border 0.25s ease, background 0.25s ease',
                          animation: `slideInBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.07}s both`
                        }}
                      >
                        {/* Model row — clickable */}
                        <div
                          onClick={() => handleToggleModel(response.id)}
                          style={{
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Color dot */}
                            <div style={{
                              width: '10px', height: '10px',
                              borderRadius: '50%',
                              background: response.error ? '#f87171' : modelColor,
                              boxShadow: `0 0 ${isModelExpanded ? '10px' : '4px'} ${response.error ? '#f87171' : modelColor}`,
                              transition: 'box-shadow 0.3s ease',
                              flexShrink: 0
                            }} />
                            <span style={{
                              fontWeight: 700,
                              color: response.error ? '#f87171' : 'rgba(255,255,255,0.85)',
                              fontSize: '0.875rem'
                            }}>
                              {displayName}
                            </span>
                            {!response.error && (
                              <span style={{
                                color: getSpeedColor(response.response_time),
                                fontSize: '0.75rem', fontWeight: 600
                              }}>
                                {getSpeedLabel(response.response_time)}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                              {response.response_time}s
                            </span>
                            <div style={{
                              color: isModelExpanded ? modelColor : 'rgba(255,255,255,0.2)',
                              fontSize: '0.75rem',
                              transform: isModelExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease'
                            }}>▼</div>
                          </div>
                        </div>

                        {/* Level 2 expanded — response text */}
                        {isModelExpanded && (
                          <div style={{
                            padding: '0 1rem 1rem',
                            animation: 'expandDown 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) both'
                          }}>
                            <p style={{
                              color: response.error ? '#f87171' : 'rgba(255,255,255,0.75)',
                              lineHeight: '1.7',
                              fontSize: '0.875rem',
                              padding: '0.85rem',
                              background: 'rgba(255,255,255,0.03)',
                              borderRadius: '8px',
                              margin: 0,
                              whiteSpace: 'pre-line',
                              borderLeft: `2px solid ${response.error ? '#f87171' : modelColor}`
                            }}>
                              {response.response_text}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      <style>{`
        @keyframes slideInBounce {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          60% { opacity: 1; transform: translateY(-6px) scale(1.01); }
          80% { transform: translateY(3px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes expandDown {
          0% { opacity: 0; transform: translateY(-10px) scaleY(0.95); }
          60% { opacity: 1; transform: translateY(2px) scaleY(1.01); }
          100% { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TasksPage;
