const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const wordCount = document.getElementById('wordCount');
const abbrCount = document.getElementById('abbrCount');
const convertToAbbrBtn = document.getElementById('convertToAbbrBtn');
const convertToFullBtn = document.getElementById('convertToFullBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const disambiguationPanel = document.getElementById('disambiguationPanel');
const ambiguityOptions = document.getElementById('ambiguityOptions');
const applyChoicesBtn = document.getElementById('applyChoicesBtn');

let fullToAbbrMap = {};
let abbrToFullMap = {};
let fullPhraseKeys = [];
let abbrPhraseKeys = [];
let pendingAmbiguousKeys = [];

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

  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line).map(cell => cell.trim().replace(/^"|"$/g, ''));
    return {
      full: cells[0] || '',
      abbr: cells[1] || '',
    };
  }).filter(row => row.full && row.abbr);
}

function mergeAbbreviations(text) {
  const rows = parseCsv(text);
  rows.forEach(row => {
    const full = row.full.trim();
    const abbr = row.abbr.trim();
    if (!full || !abbr) return;

    fullToAbbrMap[full.toLowerCase()] = abbr;
    const abbrKey = abbr.toLowerCase();
    if (!abbrToFullMap[abbrKey]) {
      abbrToFullMap[abbrKey] = [];
    }
    if (!abbrToFullMap[abbrKey].includes(full)) {
      abbrToFullMap[abbrKey].push(full);
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
  hideDisambiguationPanel();
  applyConversion(fullPhraseKeys, fullToAbbrMap);
}

function findAmbiguousAbbreviations(input) {
  const lowerInput = input.toLowerCase();
  return abbrPhraseKeys.filter(key => {
    if (abbrToFullMap[key].length <= 1) return false;
    return new RegExp(`\b${escapeRegex(key)}\b`, 'gi').test(lowerInput);
  });
}

function convertToFullForm() {
  hideDisambiguationPanel();
  const input = inputText.value;
  if (!input.trim()) {
    outputText.value = '';
    abbrCount.textContent = '0';
    return;
  }

  pendingAmbiguousKeys = findAmbiguousAbbreviations(input);

  if (pendingAmbiguousKeys.length) {
    showDisambiguationPanel(pendingAmbiguousKeys);
    return;
  }

  const singleMap = {};
  abbrPhraseKeys.forEach(key => {
    singleMap[key] = abbrToFullMap[key][0];
  });
  applyConversion(abbrPhraseKeys, singleMap);
}

function getAmbiguitySelectId(key) {
  return `ambiguity-${key.replace(/[^a-z0-9_-]/gi, '_')}`;
}

function showDisambiguationPanel(keys) {
  ambiguityOptions.innerHTML = keys.map(key => {
    const options = abbrToFullMap[key].map(full => `<option value="${full}">${full}</option>`).join('');
    const selectId = getAmbiguitySelectId(key);
    return `
      <div class="ambiguity-row">
        <label for="${selectId}">Choose expansion for "${key.toUpperCase()}":</label>
        <select id="${selectId}" data-key="${key}">
          ${options}
        </select>
      </div>
    `;
  }).join('');
  disambiguationPanel.classList.remove('hidden');
}

function hideDisambiguationPanel() {
  disambiguationPanel.classList.add('hidden');
  ambiguityOptions.innerHTML = '';
  pendingAmbiguousKeys = [];
}

function applyDisambiguationChoicesAndConvert() {
  const singleMap = {};
  abbrPhraseKeys.forEach(key => {
    if (abbrToFullMap[key].length === 1) {
      singleMap[key] = abbrToFullMap[key][0];
      return;
    }
    const select = document.querySelector(`#${getAmbiguitySelectId(key)}`);
    singleMap[key] = select ? select.value : abbrToFullMap[key][0];
  });

  hideDisambiguationPanel();
  applyConversion(abbrPhraseKeys, singleMap);
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
  hideDisambiguationPanel();
}

function updateWordCount() {
  wordCount.textContent = String(countWords(inputText.value));
}

function updateLoadStatus(successCount) {
  const disabled = successCount === 0;
  convertToAbbrBtn.disabled = disabled;
  convertToFullBtn.disabled = disabled;
}

convertToAbbrBtn.addEventListener('click', convertToAbbreviation);
convertToFullBtn.addEventListener('click', convertToFullForm);
applyChoicesBtn.addEventListener('click', applyDisambiguationChoicesAndConvert);
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
