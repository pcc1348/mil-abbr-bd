const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const wordCount = document.getElementById('wordCount');
const abbrCount = document.getElementById('abbrCount');
const convertBtn = document.getElementById('convertBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const loadStatus = document.getElementById('loadStatus');

let abbreviationMap = {};
let phraseKeys = [];

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
    const key = row.abbreviation.trim().toLowerCase();
    if (key) {
      abbreviationMap[key] = row.meaning.trim();
    }
  });
  phraseKeys = Object.keys(abbreviationMap).sort((a, b) => b.length - a.length);
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function convertText() {
  const input = inputText.value;
  if (!input.trim()) {
    outputText.value = '';
    abbrCount.textContent = '0';
    return;
  }

  let converted = input;
  let abbreviationsUsed = 0;

  phraseKeys.forEach(phrase => {
    const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'gi');
    const matches = converted.match(regex);
    if (matches) {
      abbreviationsUsed += matches.length;
      converted = converted.replace(regex, abbreviationMap[phrase]);
    }
  });

  outputText.value = converted;
  abbrCount.textContent = String(abbreviationsUsed);
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

function updateLoadStatus(successCount, totalCount, loadedNames) {
  if (successCount === 0) {
    loadStatus.textContent = 'Failed to load abbreviation data. Check CSV files.';
    loadStatus.style.background = '#fee2e2';
    loadStatus.style.borderColor = '#fecaca';
    convertBtn.disabled = true;
    return;
  }

  const fileText = successCount === totalCount ? 'all files' : `${successCount} of ${totalCount} files`;
  loadStatus.textContent = `Loaded ${fileText}: ${loadedNames.join(', ')}.`;
  loadStatus.style.background = '#f8fafc';
  loadStatus.style.borderColor = '#cbd5e1';
  convertBtn.disabled = false;
}

convertBtn.addEventListener('click', convertText);
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
  const loadedNames = [];

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
            loadedNames.push(file.name);
          }
          return text;
        });
      })
      .catch(() => '');
  }))
    .then(() => {
      updateLoadStatus(successCount, files.length, loadedNames);
      updateWordCount();
    });
});
