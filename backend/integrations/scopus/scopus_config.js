const SCOPUS_BASE_URL = 'https://api.elsevier.com';

const SCOPUS_ENDPOINTS = Object.freeze({
  search: '/content/search/scopus',
  authorSearch: '/content/search/author'
});

function getScopusApiKey() {
  return process.env.SCOPUS_API_KEY || '';
}

function isScopusConfigured() {
  return Boolean(getScopusApiKey());
}

module.exports = {
  SCOPUS_BASE_URL,
  SCOPUS_ENDPOINTS,
  getScopusApiKey,
  isScopusConfigured
};
