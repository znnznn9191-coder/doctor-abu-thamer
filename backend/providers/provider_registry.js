const LocalProvider = require('./local_provider');
const config = require('../config');

const registry = new Map();
const defaultProviderName = config.DEFAULT_PROVIDER || 'local';

function registerProvider(name, provider) {
  if (!name || !provider || typeof provider.generate !== 'function') {
    throw new Error('Provider must have a valid name and generate() method.');
  }

  registry.set(name, provider);
  return provider;
}

function getProvider(name = defaultProviderName) {
  if (!registry.has(name)) {
    return registry.get('local') || new LocalProvider();
  }

  return registry.get(name);
}

function getDefaultProvider() {
  return getProvider(defaultProviderName);
}

registerProvider('local', new LocalProvider());

module.exports = {
  registry,
  registerProvider,
  getProvider,
  getDefaultProvider,
  defaultProviderName
};
