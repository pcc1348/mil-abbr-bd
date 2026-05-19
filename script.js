const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const wordCount = document.getElementById('wordCount');
const abbrCount = document.getElementById('abbrCount');
const convertToAbbrBtn = document.getElementById('convertToAbbrBtn');
const convertToFullBtn = document.getElementById('convertToFullBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

let fullToAbbrMap = {};
let abbrToFullMap = {};
let fullPhraseKeys = [];
let abbrPhraseKeys = [];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim().length > 0);
  if (!lines.length) return [];

  const headerCells = parseCsvLine(lines[0]).map(cell => cell.trim().replace(/^"|"$/g, ''));
  const abbreviationColumn = headerCells.findIndex(h => h.toLowerCase() === 'abbreviation');
  const meaningColumn = headerCells.findIndex(h => h.toLowerCase() === 'meaning');

  if (abbreviationColumn === -1 || meaningColumn === -1) {
    return [];
  }

  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line).map(cell => cell.trim().replace(/^"|"$/g, ''));
    const abbreviation = cells[abbreviationColumn] || '';
    const meaning = cells[meaningColumn] || '';
    return { abbreviation, meaning };
  }).filter(row => row.abbreviation && row.meaning);
}

function mergeAbbreviations(text) {
  const rows = parseCsv(text);
  rows.forEach(row => {
    const abbreviation = row.abbreviation.trim();
    const meaning = row.meaning.trim();
    if (!abbreviation || !meaning) return;

    const abbrKey = abbreviation.toLowerCase();
    const fullKey = meaning.toLowerCase();

    abbrToFullMap[abbrKey] = meaning;
    if (!(fullKey in fullToAbbrMap)) {
      fullToAbbrMap[fullKey] = abbreviation;
    }
  });
  fullPhraseKeys = Object.keys(fullToAbbrMap).sort((a, b) => b.length - a.length);
  abbrPhraseKeys = Object.keys(abbrToFullMap).sort((a, b) => b.length - a.length);
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function applyConversion(keys, map) {
  const input = inputText.value;
  if (!input.trim()) {
    outputText.value = '';
    abbrCount.textContent = '0';
    return;
  }

  let converted = input;
  let replacements = 0;

  keys.forEach(phrase => {
    const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'gi');
    const matches = converted.match(regex);
    if (matches) {
      replacements += matches.length;
      converted = converted.replace(regex, map[phrase]);
    }
  });

  outputText.value = converted;
  abbrCount.textContent = String(replacements);
}

function convertToAbbreviation() {
  applyConversion(fullPhraseKeys, fullToAbbrMap);
}

function convertToFullForm() {
  applyConversion(abbrPhraseKeys, abbrToFullMap);
}

function copyText() {
  const text = outputText.value;
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      outputText.select();
      document.execCommand('copy');
    });
  } else {
    outputText.select();
    document.execCommand('copy');
  }
}

function clearAll() {
  inputText.value = '';
  outputText.value = '';
  wordCount.textContent = '0';
  abbrCount.textContent = '0';
}

function updateWordCount() {
  wordCount.textContent = String(countWords(inputText.value));
}

function updateLoadStatus(successCount) {
  const disabled = successCount === 0;
  convertToAbbrBtn.disabled = disabled;
  convertToFullBtn.disabled = disabled;
}

convertToAbbrBtn.addEventListener('click', convertToFullForm);
convertToFullBtn.addEventListener('click', convertToAbbreviation);
copyBtn.addEventListener('click', copyText);
clearBtn.addEventListener('click', clearAll);
inputText.addEventListener('input', updateWordCount);

window.addEventListener('load', () => {
  const files = [
    { path: 'data/abbreviations_full.csv', name: 'full list' },
    { path: 'data/abbreviations.csv', name: 'default list' },
    { path: 'data/New Abbreviations.csv', name: 'new list' },
  ];

  let successCount = 0;

  Promise.all(files.map(file => {
    return fetch(file.path)
      .then(response => {
        if (!response.ok) {
          return '';
        }
        return response.text().then(text => {
          if (text.trim()) {
            mergeAbbreviations(text);
            successCount += 1;
          }
          return text;
        });
      })
      .catch(() => '');
  }))
    .then(() => {
      updateLoadStatus(successCount);
      updateWordCount();
    });
});
