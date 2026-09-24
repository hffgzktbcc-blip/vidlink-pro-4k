const fs = require('fs');
// Mock fetch and test the logic
function getValueByPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((acc, part) => {
    if (acc && Array.isArray(acc) && !isNaN(Number(part))) {
      return acc[Number(part)];
    }
    return acc ? acc[part] : undefined;
  }, obj);
}

const mockData = {
  docs: [
    {
      key: 'test',
      title: 'test title',
      author_name: ['author 1'],
      first_sentence: ['sentence 1'],
      cover_i: 123
    }
  ]
};

const results = getValueByPath(mockData, 'docs');
console.log(results);

const title = getValueByPath(results[0], 'title');
const author = getValueByPath(results[0], 'author_name.0');
console.log(title, author);
