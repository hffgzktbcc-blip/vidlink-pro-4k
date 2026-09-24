import sys
with open('src/services/addonEngine.ts', 'r') as f:
    code = f.read()

audible_provider = """
  {
    id: 'audible',
    name: 'Audible (High Quality)',
    version: '1.0.0',
    type: 'metadata',
    search: {
      request: {
        method: 'GET',
        url: 'https://api.audible.com/1.0/catalog/products?response_groups=contributors,product_attrs,product_desc,media,product_extended_attrs,series,category_ladders&num_results=20&products_sort_by=Relevance&image_sizes=500,1024&keywords={QUERY}',
        useCorsProxy: true
      },
      response: {
        type: 'json',
        resultsPath: 'products',
        mapping: {
          id: 'asin',
          title: 'title',
          author: 'authors.0.name',
          description: 'summary',
          cover: 'product_images.500',
          publishedYear: 'release_date'
        }
      }
    }
  },"""

# Insert audible provider
insert_idx = code.find('export const BUILTIN_ADDONS: Addon[] = [\n') + len('export const BUILTIN_ADDONS: Addon[] = [\n')
code = code[:insert_idx] + audible_provider + code[insert_idx:]

# Update cover logic
cover_logic_start = code.find("const coverId = getVal('cover');")
cover_logic_end = code.find("return {", cover_logic_start)

new_cover_logic = """const coverVal = getVal('cover');
      let coverUrl = null;
      if (coverVal) {
        if (typeof coverVal === 'string' && coverVal.startsWith('http')) {
          coverUrl = coverVal;
        } else if (provider.id === 'openlibrary') {
          coverUrl = `https://covers.openlibrary.org/b/id/${coverVal}-L.jpg`;
        }
      }

      """
code = code[:cover_logic_start] + new_cover_logic + code[cover_logic_end:]

# Set default provider
default_prov_start = code.find("const provider = this.getProviders().find(p => p.id === providerId) || this.getProviders()[0];")
code = code[:default_prov_start] + "const provider = this.getProviders().find(p => p.id === (providerId || 'audible')) || this.getProviders()[0];" + code[default_prov_start + len("const provider = this.getProviders().find(p => p.id === providerId) || this.getProviders()[0];"):]

with open('src/services/addonEngine.ts', 'w') as f:
    f.write(code)
print("Patched addonEngine.ts")
