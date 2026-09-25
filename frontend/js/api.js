async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { success: false, message: text || 'Unexpected response.' };
  }

  if (!response.ok && data.success !== true) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

const api = {
  health: () => apiRequest('/api/health'),
  listResearches: () => apiRequest('/api/researches'),
  createResearch: (payload) => apiRequest('/api/researches', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateResearch: (id, payload) => apiRequest(`/api/researches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  getResearch: (id) => apiRequest(`/api/researches/${id}`),
  getResearchDetails: (id) => apiRequest(`/api/researches/${id}/details`),
  deleteResearch: (id) => apiRequest(`/api/researches/${id}`, { method: 'DELETE' }),
  listSections: (researchId) => apiRequest(`/api/researches/${researchId}/sections`),
  createSection: (researchId, payload) => apiRequest(`/api/researches/${researchId}/sections`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateSection: (id, payload) => apiRequest(`/api/sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteSection: (id) => apiRequest(`/api/sections/${id}`, { method: 'DELETE' }),
  listSources: (researchId) => apiRequest(`/api/researches/${researchId}/sources`),
  createSource: (researchId, payload) => apiRequest(`/api/researches/${researchId}/sources`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateSource: (id, payload) => apiRequest(`/api/sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteSource: (id) => apiRequest(`/api/sources/${id}`, { method: 'DELETE' }),
  runReview: (id) => apiRequest(`/api/researches/${id}/run-review`, { method: 'POST' })
};
