module.exports = {
  // JavaScript and TypeScript files
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // JSON files
  '*.json': ['prettier --write'],

  // Markdown files
  '*.md': ['prettier --write'],

  // YAML files
  '*.{yml,yaml}': ['prettier --write'],

  // CSS files (if any)
  '*.css': ['prettier --write'],
};
