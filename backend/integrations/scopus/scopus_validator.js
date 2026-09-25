function isValidDoi(value) {
  if (!value) return true;

  const doi = String(value).trim();

  return /^10\.\d{4,9}\/\S+$/i.test(doi);
}

function validateScopusSource(source = {}) {
  const issues = [];

  if (!String(source.title || '').trim()) {
    issues.push('MISSING_TITLE');
  }

  if (!String(source.source_provider || '').trim()) {
    issues.push('MISSING_PROVIDER');
  }

  if (
    source.source_provider &&
    String(source.source_provider).toLowerCase() !== 'scopus'
  ) {
    issues.push('INVALID_PROVIDER');
  }

  if (!source.scopus_id && !source.eid && !source.doi) {
    issues.push('MISSING_STABLE_IDENTIFIER');
  }

  if (source.doi && !isValidDoi(source.doi)) {
    issues.push('INVALID_DOI_FORMAT');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function validateScopusSources(sources = []) {
  const accepted = [];
  const rejected = [];

  for (const source of sources) {
    const result = validateScopusSource(source);

    if (result.valid) {
      accepted.push({
        ...source,
        verification_status: 'verified'
      });
    } else {
      rejected.push({
        source,
        issues: result.issues
      });
    }
  }

  return {
    accepted,
    rejected
  };
}

module.exports = {
  isValidDoi,
  validateScopusSource,
  validateScopusSources
};
