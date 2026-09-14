function createProducts() {
  return Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    name: `Product ${index + 1}`,
    price: (index + 1) * 100
  }));
}

module.exports = { createProducts };

