# Journal page images

Store final journal artwork in one directory per entry:

```text
assets/journal/001/page-01.webp
assets/journal/001/page-02.webp
assets/journal/001/page-03.webp
assets/journal/002/page-01.webp
```

Use zero-padded `page-NN` names and one consistent format per entry. The journal build accepts `.png`, `.webp`, `.jpg`, `.jpeg`, and `.avif`, orders files by page number, and writes their repository-relative paths to `journal/journal-manifest.js`.

Each entry may also provide any of these optional notebook-state assets using the same supported formats:

```text
assets/journal/001/cover-front.webp
assets/journal/001/cover-back.webp
assets/journal/001/inside-front.webp
assets/journal/001/inside-back.webp
```

The manifest always exposes slots for these four roles. When an optional asset is absent, the viewer uses the entry-specific HTML/CSS cover or inside-page design instead.

Run `powershell -File tools/build-journal.ps1` after adding or removing journal artwork. Interior `page-NN` images are placed between the designed inside-front and inside-back states. An entry with no interior page images keeps its exact generated Markdown content between those same notebook states.

## Derived render assets

Approved source artwork remains protected in the entry directory. When an entry
contains a `rendered/` directory, the build uses its `page-NN` files in preference
to the protected source files. This keeps paper/background normalisation separate
and reproducible.

Entry 001 is rendered locally with:

```text
python tools/render-journal-pages.py
```

The script verifies the four approved source SHA-256 hashes before and after,
estimates the low-frequency photographed paper field, retains neutral and
chromatic mark density without a hard colour key, and composites the marks onto
a quiet warm-ivory substrate. Its deterministic outputs and method report are
written to `assets/journal/001/rendered/`.
