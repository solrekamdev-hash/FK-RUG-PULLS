# Journal page images

Store final journal artwork in one directory per entry:

```text
assets/journal/001/page-01.webp
assets/journal/001/page-02.webp
assets/journal/001/page-03.webp
assets/journal/002/page-01.webp
```

Use zero-padded `page-NN` names and one consistent format per entry. The journal build accepts `.png`, `.webp`, `.jpg`, `.jpeg`, and `.avif`, orders files by page number, and writes their repository-relative paths to `journal/journal-manifest.js`.

Run `powershell -File tools/build-journal.ps1` after adding or removing page artwork. An entry with one or more discovered page images uses the image viewer; an entry with no page images keeps its generated Markdown fallback.
