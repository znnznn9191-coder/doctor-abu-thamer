const {
  SCOPUS_BASE_URL,
  getScopusApiKey,
  isScopusConfigured
} = require('./scopus_config');

async function scopusRequest(path, params = {}) {
  if (!isScopusConfigured()) {
    throw new Error('SCOPUS_NOT_CONFIGURED');
  }

  const url = new URL(path, SCOPUS_BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-ELS-APIKey': getScopusApiKey()
    }
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `SCOPUS_REQUEST_FAILED:${response.status}:${body.slice(0, 500)}`
    );
  }

  return response.json();
}

module.exports = {
  scopusRequest
};
