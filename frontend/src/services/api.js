import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

export const compressPrompt = async (rawPrompt, targetModel = 'gpt-4o', engine = 'auto') => {
  const response = await apiClient.post('/compress/', {
    raw_prompt: rawPrompt,
    target_model: targetModel,
    compression_engine: engine,
  });
  return response.data;
};

export const executeSIR = async (sessionId, customSirYaml = null, targetModel = null) => {
  const payload = {
    session_id: sessionId,
  };
  if (customSirYaml) payload.custom_sir_yaml = customSirYaml;
  if (targetModel) payload.target_model = targetModel;

  const response = await apiClient.post('/execute/', payload);
  return response.data;
};

export const executeOpenAIProxy = async (prompt, model = 'gpt-4o', apiKey = '') => {
  const response = await apiClient.post(
    '/v1/chat/completions/',
    {
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
  return {
    data: response.data,
    headers: response.headers
  };
};

export const getHistory = async (limit = 50) => {
  const response = await apiClient.get(`/history/?limit=${limit}`);
  return response.data;
};

export const getPricing = async () => {
  const response = await apiClient.get('/pricing/');
  return response.data;
};

export const getSystemHealth = async () => {
  const response = await apiClient.get('/health/');
  return response.data;
};

export default apiClient;
