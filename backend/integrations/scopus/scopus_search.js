const { SCOPUS_ENDPOINTS } = require('./scopus_config');
const { scopusRequest } = require('./scopus_client');

async function searchScopus(query, options = {}) {
  const cleanQuery = String(query || '').trim();

  if (!cleanQuery) {
    throw new Error('SCOPUS_QUERY_REQUIRED');
  }

  const params = {
    query: cleanQuery,
    count: options.count || 25,
    start: options.start || 0,
    sort: options.sort || '-citedby-count',
    view: options.view || 'STANDARD'
  };

  return scopusRequest(SCOPUS_ENDPOINTS.search, params);
}

module.exports = {
  searchScopus
};
