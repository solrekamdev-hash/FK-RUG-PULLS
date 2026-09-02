# Journal asset pipeline

These source and provenance files are preserved for controlled future edits. The
committed production artwork is approved output and must not be regenerated or
overwritten casually.

## Dependencies

The processors use Python's standard library plus NumPy and Pillow. Installable
package names are recorded in `tools/requirements-journal.txt`. No versions are
pinned because the preserved scripts, reports, and metadata do not establish the
versions used to create the current artwork.

## Preserved relationships

### Entry 001

`tools/journal-visual-lab/process_artwork.py` reads
`assets/journal/001/page-02.webp` and `page-03.webp`, then writes normalized and
extracted-ink layers under `tools/journal-visual-lab/assets/`. The source and lab
asset hashes match `tools/journal-visual-lab/processing-report.json`. The two
extracted-ink assets are byte-for-byte SHA-256 matches for the committed
`assets/journal/001/artwork/page-02.png` and `page-03.png` production files.
No equivalent visual-lab processor relationship is claimed for Entry 001 pages
1 or 4.

### Entry 002

`tools/apply-entry-002-marginalia.py` reads the six RGBA bases under
`assets/journal/002/approved-base/` and the committed
`assets/journal/002/marginalia/sprites.png`. It writes six overlay layers under
`assets/journal/002/marginalia/` and composites the production family at
`assets/journal/002/artwork/page-01.png` through `page-04.png`, plus
`assets/journal/002/inside-front.png` and `inside-back.png`.

The approved-base, marginalia, and production hashes are frozen in
`tools/check-journal.ps1` and match the preserved files. The script's path and
composition relationship is structurally verified, but the processor was not
rerun on this Mac. `assets/journal/002/page-01.png` is also preserved because the
checker protects it as an Entry 002 source; the marginalia processor does not
read that file directly.

### Entry 003

The six `tools/process-entry-003-*.py` scripts each read the matching RGB file
under `assets/journal/003/source/`. Page processors write the four production
files under `assets/journal/003/artwork/`; inside-front and inside-back processors
write the two companion PNGs directly under `assets/journal/003/`. Each source
directory report records the corresponding source and output SHA-256 values,
and those values match the preserved sources and committed outputs.

This confirms the recorded source/output provenance without rerunning the
processors on this Mac.

### Entry 004

The six `tools/process-entry-004-*.py` scripts each read the matching RGB file
under `assets/journal/004/source/`. Page processors write the four production
files under `assets/journal/004/artwork/`; inside-front and inside-back processors
write the two companion PNGs directly under `assets/journal/004/`. Each source
directory report records the corresponding source and output SHA-256 values,
and those values match the preserved sources and committed outputs. The Entry
004 RGB source and production hashes are also frozen in `tools/check-journal.ps1`.

This confirms the recorded source/output provenance without rerunning the
processors on this Mac.

## Validation note

`tools/check-journal.ps1` is the committed full journal validator, but it is not
Mac-native in the current environment because PowerShell is unavailable and the
script uses PowerShell/.NET image checks. Its frozen SHA-256 expectations can be
checked on macOS with existing shell or Python tools; the full PowerShell
validator should not be represented as having run here.
