#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/shared/locales');
const languages = ['en', 'pt', 'es'];

let hasErrors = false;

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

function validateJsonStructure(content, lang) {
  try {
    const parsed = JSON.parse(content);
    
    const requiredSections = ['errors', 'validation', 'success'];
    
    for (const section of requiredSections) {
      if (!parsed[section]) {
        hasErrors = true;
      }
    }
    
    return parsed;
  } catch (error) {
    hasErrors = true;
    return null;
  }
}

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    hasErrors = true;
  }
});

if (hasErrors) {
  process.exit(1);
}

const locales = {};

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = validateJsonStructure(content, lang);
  
  if (parsed) {
    locales[lang] = parsed;
  }
});

if (hasErrors) {
  process.exit(1);
}

const enKeys = getAllKeys(locales.en).sort();

languages.slice(1).forEach(lang => {
  const langKeys = getAllKeys(locales[lang]).sort();
  
  const missingKeys = enKeys.filter(key => !langKeys.includes(key));
  const extraKeys = langKeys.filter(key => !enKeys.includes(key));
  
  if (missingKeys.length > 0) {
    missingKeys.forEach(key => key);
    hasErrors = true;
  }
  
  if (extraKeys.length > 0) {
    extraKeys.forEach(key => key);
  }
});

languages.forEach(lang => {
  const keys = getAllKeys(locales[lang]);
  const emptyKeys = [];
  
  keys.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], locales[lang]);
    if (!value || value.trim() === '') {
      emptyKeys.push(key);
    }
  });
  
  if (emptyKeys.length > 0) {
    emptyKeys.forEach(key => key);
  }
});

languages.forEach(lang => {
  const keys = getAllKeys(locales[lang]);
  const placeholderIssues = [];
  
  keys.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], locales[lang]);
    if (value && typeof value === 'string') {
      const placeholders = value.match(/\{[^}]+\}/g) || [];
      if (placeholders.length > 0) {
        const enValue = key.split('.').reduce((obj, k) => obj && obj[k], locales.en);
        const enPlaceholders = enValue.match(/\{[^}]+\}/g) || [];
        
        if (placeholders.length !== enPlaceholders.length) {
          placeholderIssues.push(`${key}: ${placeholders.join(', ')} vs EN: ${enPlaceholders.join(', ')}`);
        }
      }
    }
  });
  
  if (placeholderIssues.length > 0) {
    placeholderIssues.forEach(issue => issue);
  }
});

if (hasErrors) {
  process.exit(1);
}