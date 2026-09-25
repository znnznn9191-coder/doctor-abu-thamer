class ProviderInterface {
  constructor(name = 'provider') {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  async generate() {
    throw new Error('Provider must implement generate().');
  }
}

module.exports = ProviderInterface;
