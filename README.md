# mil-abbr-bd
A static text converter that uses a military abbreviation dictionary to convert normal writing into abbreviations.

## How it works
- `index.html` provides the text conversion UI.
- `styles.css` creates the same card layout and button styling as the reference page.
- `script.js` loads `data/abbreviations.csv`, builds a phrase-to-abbreviation map, and converts input text.
- `data/abbreviations.csv` is the full abbreviation list used by the converter.

## Use the converter
1. Open `index.html` in a browser.
2. Paste or type your text in the "Input Text" box.
3. Click `Convert Text`.
4. The converted result appears in "Converted Output".
5. Use `Copy Result` to copy the output or `Clear` to reset.

## Local preview
Run a local server to ensure the CSV loads correctly:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy
This is a static site, so you can deploy it with GitHub Pages, Netlify, or any static hosting provider.
