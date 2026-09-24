const mockData = {
  products: [
    {
      asin: 'B008OHV574',
      title: 'The Shining',
      authors: [ { name: 'Stephen King' } ],
      summary: 'Some summary text',
      product_images: { '500': 'https://cover.jpg' },
      release_date: '2012-08-14'
    }
  ]
};

function getValueByPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => {
    if (acc && Array.isArray(acc) && !isNaN(Number(part))) {
      return acc[Number(part)];
    }
    return acc ? acc[part] : undefined;
  }, obj);
}

console.log(getValueByPath(mockData, 'products'));
console.log(getValueByPath(mockData.products[0], 'authors.0.name'));
console.log(getValueByPath(mockData.products[0], 'product_images.500'));
console.log(getValueByPath(mockData.products[0], 'release_date'));
