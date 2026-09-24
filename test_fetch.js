async function test() {
  const url = 'https://openlibrary.org/search.json?q=Stephen+King&limit=20';
  const res = await fetch(url);
  const data = await res.json();
  console.log(data.docs.length);
}
test();
