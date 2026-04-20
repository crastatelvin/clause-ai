// ============================================
// Project: CLAUSE — AI Contract Risk Analyzer
// Author: Telvin Crasta
// License: CC BY-NC 4.0
// ============================================

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,
});

export class AnalyzeError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message);
    this.name = 'AnalyzeError';
    this.status = status;
    this.cause = cause;
  }
}

export const analyzeDocument = async (file, { requestId } = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await client.post('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: requestId ? { request_id: requestId } : undefined,
    });
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    const serverMessage = err.response?.data?.error;
    if (serverMessage) {
      throw new AnalyzeError(serverMessage, { status, cause: err });
    }
    if (err.code === 'ECONNABORTED') {
      throw new AnalyzeError('Analysis timed out. Try a smaller document.', { status, cause: err });
    }
    throw new AnalyzeError(
      'Analysis failed. Ensure the backend is running and the file is a valid PDF or TXT document.',
      { status, cause: err },
    );
  }
};

export const getLatest = async () => {
  const response = await client.get('/latest');
  return response.data;
};

export const getReport = async (requestId) => {
  const response = await client.get(`/report/${requestId}`);
  return response.data;
};
