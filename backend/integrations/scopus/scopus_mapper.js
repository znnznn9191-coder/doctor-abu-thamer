function normalizeAuthors(entry = {}) {
  const creator = entry['dc:creator'];
  if (creator) return String(creator).trim();

  const authors = entry.author;
  if (Array.isArray(authors)) {
    return authors
      .map((author) =>
        author.authname ||
        author['ce:indexed-name'] ||
        author['given-name'] ||
        ''
      )
      .filter(Boolean)
      .join('; ');
  }

  return '';
}

function mapScopusEntry(entry = {}) {
  const identifier = entry['dc:identifier'] || '';
  const scopusId = String(identifier).replace(/^SCOPUS_ID:/i, '');

  return {
    title: entry['dc:title'] || '',
    authors: normalizeAuthors(entry),
    year: entry['prism:coverDate']
      ? String(entry['prism:coverDate']).slice(0, 4)
      : '',
    publication_date: entry['prism:coverDate'] || '',
    source_name: entry['prism:publicationName'] || '',
    doi: entry['prism:doi'] || '',
    scopus_id: scopusId,
    eid: entry.eid || '',
    cited_by_count: Number(entry['citedby-count'] || 0),
    document_type: entry.subtypeDescription || entry.subtype || '',
    issn: entry['prism:issn'] || '',
    eissn: entry['prism:eIssn'] || '',
    volume: entry['prism:volume'] || '',
    issue: entry['prism:issueIdentifier'] || '',
    page_range: entry['prism:pageRange'] || '',
    aggregation_type: entry['prism:aggregationType'] || '',
    url: entry['prism:url'] || '',
    scopus_link:
      Array.isArray(entry.link)
        ? (entry.link.find((item) => item['@ref'] === 'scopus') || {})['@href'] || ''
        : '',
    source_provider: 'scopus',
    verification_status: 'verified'
  };
}

function mapScopusSearchResponse(payload = {}) {
  const searchResults = payload['search-results'] || {};
  const entries = Array.isArray(searchResults.entry)
    ? searchResults.entry
    : [];

  return {
    total_results: Number(searchResults['opensearch:totalResults'] || 0),
    start_index: Number(searchResults['opensearch:startIndex'] || 0),
    items_per_page: Number(searchResults['opensearch:itemsPerPage'] || entries.length),
    sources: entries.map(mapScopusEntry)
  };
}

module.exports = {
  mapScopusEntry,
  mapScopusSearchResponse
};
