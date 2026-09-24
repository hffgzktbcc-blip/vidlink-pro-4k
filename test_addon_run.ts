import { addonEngine } from './src/services/addonEngine.ts';

async function test() {
  try {
    const books = await addonEngine.searchMetadata('The Shining');
    console.log("Found", books.length, "books");
    console.log(books[0]);
  } catch(e) {
    console.error(e);
  }
}

test();
