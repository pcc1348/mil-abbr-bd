const fileInput = document.getElementById('fileInput');
const searchInput = document.getElementById('searchInput');
const statusText = document.getElementById('statusText');
const summaryText = document.getElementById('summaryText');
const resultsHeader = document.getElementById('resultsHeader');
const resultsBody = document.getElementById('resultsBody');

let abbreviations = [];
let headers = [];

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
  if (!lines.length) return { headers: [], rows: [] };

  const rawHeaders = parseCsvLine(lines[0]);
  const parsedHeaders = rawHeaders.map(header => header.trim().replace(/^"|"$/g, ''));

  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line).map(value => value.trim().replace(/^"|"$/g, ''));
    const row = {};
    parsedHeaders.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  }).filter(row => Object.values(row).some(value => value.length > 0));

  return { headers: parsedHeaders, rows };
}

function renderTableHeader() {
  if (!headers.length) {
    resultsHeader.innerHTML = '<th>Abbreviation</th><th>Meaning</th>';
    return;
  }

  resultsHeader.innerHTML = headers.map(header => `<th>${header}</th>`).join('');
}

function renderResults(rows) {
  if (!headers.length) {
    renderTableHeader();
  }

  if (!rows.length) {
    resultsBody.innerHTML = `<tr><td colspan="${headers.length || 2}">No matching abbreviations found.</td></tr>`;
    return;
  }

  resultsBody.innerHTML = rows.map(row => {
    return `
      <tr>
        ${headers.map(header => `<td data-label="${header}">${row[header] || ''}</td>`).join('')}
      </tr>
    `;
  }).join('');
}

function updateSummary(count, query = '') {
  if (!query) {
    summaryText.textContent = `${count} rows loaded.`;
    return;
  }
  summaryText.textContent = `${count} result${count === 1 ? '' : 's'} for "${query}".`;
}

function updateSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    renderResults(abbreviations);
    updateSummary(abbreviations.length);
    statusText.textContent = `${abbreviations.length} abbreviations loaded.`;
    return;
  }

  const filtered = abbreviations.filter(item => {
    return headers.some(header => (item[header] || '').toLowerCase().includes(query));
  });

  renderResults(filtered);
  updateSummary(filtered.length, searchInput.value.trim());
  statusText.textContent = `Showing ${filtered.length} filtered results.`;
}

function applyCsv(text, sourceLabel) {
  const parsed = parseCsv(text);
  if (!parsed.headers.length) {
    statusText.textContent = 'The CSV file has no headers or is empty.';
    resultsBody.innerHTML = '<tr><td colspan="2">Please use a valid CSV file.</td></tr>';
    summaryText.textContent = 'No data loaded.';
    return;
  }

  headers = parsed.headers;
  abbreviations = parsed.rows;
  renderTableHeader();
  renderResults(abbreviations);
  updateSummary(abbreviations.length);
  statusText.textContent = `${abbreviations.length} rows loaded from ${sourceLabel}.`;
}

function loadCsvFromUrl(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(text => applyCsv(text, 'default CSV'))
    .catch(error => {
      statusText.textContent = 'Failed to load default CSV: ' + error.message;
      resultsBody.innerHTML = '<tr><td colspan="2">Unable to load the default CSV file.</td></tr>';
      summaryText.textContent = 'Load a CSV file to begin.';
    });
}

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    applyCsv(reader.result, `file: ${file.name}`);
  };
  reader.onerror = () => {
    statusText.textContent = 'Unable to read the selected CSV file.';
  };
  reader.readAsText(file, 'UTF-8');
}

fileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  loadFile(file);
});

searchInput.addEventListener('input', updateSearch);
window.addEventListener('load', () => loadCsvFromUrl('data/abbreviations.csv'));
