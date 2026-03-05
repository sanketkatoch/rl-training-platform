import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── USERS ────────────────────────────────────────────────────
export const getUsers = async () => {
  const response = await api.get('/users/');
  return response.data;
};

export const createUser = async (data: {
  name: string;
  email: string;
  role: string;
}) => {
  const response = await api.post('/users/', data);
  return response.data;
};

// ── TASKS ────────────────────────────────────────────────────
export const getTasks = async () => {
  const response = await api.get('/tasks/');
  return response.data;
};

export const getTasksWithResponses = async () => {
  const tasks = await getTasks();
  const tasksWithResponses = await Promise.all(
    tasks.map(async (task: any) => {
      const responses = await getResponsesForTask(task.id);
      return { ...task, responseCount: responses.length };
    })
  );
  return tasksWithResponses.filter((t: any) => t.responseCount > 0);
};

export const createTask = async (data: {
  created_by: number;
  prompt: string;
}) => {
  const response = await api.post('/tasks/', data);
  return response.data;
};

export const getTask = async (taskId: number) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

// ── RESPONSES ────────────────────────────────────────────────
export const getResponsesForTask = async (taskId: number) => {
  const response = await api.get(`/responses/task/${taskId}`);
  return response.data;
};

export const createResponse = async (data: {
  task_id: number;
  ai_model: string;
  response_text: string;
}) => {
  const response = await api.post('/responses/', data);
  return response.data;
};

// ── RATINGS ─────────────────────────────────────────────────
export const getRatingsForResponse = async (responseId: number) => {
  const response = await api.get(`/ratings/response/${responseId}`);
  return response.data;
};

export const createRating = async (data: {
  response_id: number;
  annotator_id: number;
  score: number;
  feedback: string;
}) => {
  const response = await api.post('/ratings/', data);
  return response.data;
};
