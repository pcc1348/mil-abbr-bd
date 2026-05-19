# mil-abbr-bd
A static text converter that uses a military abbreviation dictionary to convert normal writing into abbreviations.

## How it works
- `index.html` provides the text conversion UI.
- `styles.css` creates the same card layout and button styling as the reference page.
- `script.js` loads the abbreviation data files and builds a phrase-to-abbreviation map for conversion.
- The app loads all available datasets in `data/`: `abbreviations_full.csv`, `abbreviations.csv`, and `New Abbreviations.csv`.

## Use the converter
1. Open `index.html` in a browser.
2. Paste or type your text in the "Input Text" box.
3. Click `Convert to Abbreviation` to convert full-form text into military abbreviations.
4. Click `Convert to Full-form` to convert abbreviations back into the full wording.
5. The converted result appears in "Converted Output".
6. Use `Copy Result` to copy the output or `Clear` to reset.

## Local preview
Some browsers block `fetch()` for local files when you open `index.html` directly. To run the app correctly locally, use a simple local server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

This ensures the CSV data files load correctly before publishing.

## GitHub Pages publish
1. Commit your final changes:

```bash
git add script.js README.md
git commit -m "Update load status message and publish instructions"
```

2. Push to GitHub:

```bash
git push origin main
```

3. Open your repository on GitHub and go to `Settings` > `Pages`.
4. Set the source to branch `main` and folder `/ (root)`, then save.
5. Wait a few minutes and visit:

```text
https://pcc1348.github.io/mil-abbr-bd/
```

If the site does not display properly immediately, refresh after a minute.

## Deploy
This is a static site, so you can also deploy it with Netlify or any static hosting provider.
