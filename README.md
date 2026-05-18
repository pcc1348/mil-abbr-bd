# mil-abbr-bd
A simple static military abbreviation converter that loads data from a CSV file and provides search functionality.

## How it works
- `index.html` is the webpage UI.
- `styles.css` contains the visual styling.
- `script.js` loads `data/abbreviations.csv` by default and also lets you upload your own CSV file.
- `data/abbreviations.csv` contains example abbreviation / meaning pairs.

## CSV format
Your CSV should use a header row. The default file uses:

```csv
abbreviation,meaning
```

You can also add extra columns such as `category` or `notes` and the table will display them automatically.

Example:

```csv
abbreviation,meaning,category
CO,Commanding Officer,Rank
Bn,Battalion,Unit
```

## Use your own CSV
1. Open `index.html` in a browser.
2. Click the file chooser and select your own `.csv` file.
3. Search by abbreviation or meaning.

## Run locally
A local file upload works without a server, but if you want the default CSV to load automatically use a local server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Deploy
This is a static site, so you can deploy it with GitHub Pages, Netlify, or any static hosting provider.
