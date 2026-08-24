param(
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$sourceDirectory = Join-Path $RepositoryRoot "Content\Journal"
$journalDirectory = Join-Path $RepositoryRoot "journal"
$journalAssetsDirectory = Join-Path $RepositoryRoot "assets\journal"
$expectedFiles = 1..5 | ForEach-Object { "FK-RUG-PULLS-JOURNAL-ENTRY-{0:D3}.md" -f $_ }

$missingFiles = $expectedFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $sourceDirectory $_)) }
if ($missingFiles.Count -gt 0) {
  throw "Missing finalized journal source file(s): $($missingFiles -join ', ')"
}

function Encode-Html([string]$Text) {
  return [System.Net.WebUtility]::HtmlEncode($Text)
}

function Get-Entry([int]$Number) {
  $entryNumber = "{0:D3}" -f $Number
  $fileName = "FK-RUG-PULLS-JOURNAL-ENTRY-$entryNumber.md"
  $path = Join-Path $sourceDirectory $fileName
  $lines = [System.IO.File]::ReadAllLines($path)

  if ($lines.Count -lt 4 -or $lines[0] -notmatch '^# ' -or $lines[2] -notmatch '^## ') {
    throw "Unexpected journal source structure: $fileName"
  }

  $paragraphs = [System.Collections.Generic.List[string]]::new()
  $buffer = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $lines[4..($lines.Count - 1)]) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      if ($buffer.Count -gt 0) {
        $paragraphs.Add(($buffer -join "`n"))
        $buffer.Clear()
      }
    } else {
      $buffer.Add($line)
    }
  }
  if ($buffer.Count -gt 0) {
    $paragraphs.Add(($buffer -join "`n"))
  }

  return [pscustomobject]@{
    Number = $entryNumber
    FileName = $fileName
    DocumentTitle = $lines[0].Substring(2)
    Title = $lines[2].Substring(3)
    Paragraphs = $paragraphs
  }
}

$entries = 1..5 | ForEach-Object { Get-Entry $_ }

function Get-EntryPagePaths([string]$Number) {
  $entryAssetDirectory = Join-Path $journalAssetsDirectory $Number
  if (-not (Test-Path -LiteralPath $entryAssetDirectory)) { return @() }

  $pageFiles = @(Get-ChildItem -LiteralPath $entryAssetDirectory -File | Where-Object {
    $_.BaseName -match '^page-(\d+)$' -and $_.Extension.ToLowerInvariant() -in @('.png', '.webp', '.jpg', '.jpeg', '.avif')
  } | Sort-Object @{ Expression = { [int][regex]::Match($_.BaseName, '\d+$').Value } }, Name)

  $duplicateNumbers = @($pageFiles | Group-Object { [int][regex]::Match($_.BaseName, '\d+$').Value } | Where-Object Count -gt 1)
  if ($duplicateNumbers.Count -gt 0) {
    throw "Entry $Number has multiple assets for page number(s): $($duplicateNumbers.Name -join ', ')"
  }

  return @($pageFiles | ForEach-Object { "../../assets/journal/$Number/$($_.Name)" })
}

function Get-OptionalEntryAsset([string]$Number, [string]$Stem) {
  $entryAssetDirectory = Join-Path $journalAssetsDirectory $Number
  if (-not (Test-Path -LiteralPath $entryAssetDirectory)) { return $null }

  $matches = @(Get-ChildItem -LiteralPath $entryAssetDirectory -File | Where-Object {
    $_.BaseName -ieq $Stem -and $_.Extension.ToLowerInvariant() -in @('.png', '.webp', '.jpg', '.jpeg', '.avif')
  })
  if ($matches.Count -gt 1) {
    throw "Entry $Number has multiple assets named ${Stem}"
  }
  if ($matches.Count -eq 0) { return $null }
  return "../../assets/journal/$Number/$($matches[0].Name)"
}

function Get-Decorations([string]$Number) {
  switch ($Number) {
    "001" { return "<p class=`"margin-note margin-note-one`" aria-hidden=`"true`">JUST LOOKING.</p>" }
    "002" { return "<p class=`"margin-note margin-note-one`" aria-hidden=`"true`">PROFIT<br>IS PROFIT?</p>" }
    "003" { return "<p class=`"margin-note margin-note-one`" aria-hidden=`"true`">TAKE PROFIT<br>DON'T CHASE<br>DON'T GET EMOTIONAL</p>" }
    "004" { return "<p class=`"margin-note margin-note-one`" aria-hidden=`"true`">MONEY<br>I NEVER<br>HAD</p><p class=`"margin-note margin-note-two`" aria-hidden=`"true`">HOLD LONGER &rarr;</p>" }
    "005" { return "<div class=`"evidence-cluster`" aria-hidden=`"true`"><span>WALLET 7</span><span>ONE SALE</span><span>WHO SOLD FIRST?</span><span>FUNDING WALLET &rarr; WALLET 7</span></div>" }
  }
}

function Get-ParagraphClass([string]$Text, [string]$Number) {
  $classes = [System.Collections.Generic.List[string]]::new()
  if ($Text -cmatch '^[A-Z0-9$?.! ''-]+$' -and $Text.Length -le 80) { $classes.Add("shout") }
  if ($Text -match '^\$[0-9,.]+\.?$') { $classes.Add("amount") }
  if ($Text -match 'failed\.?$|^SELL') { $classes.Add("failed-sale") }
  if ($Text -match ' -> ') { $classes.Add("wallet-chain") }
  if ($Text -eq 'WHO SOLD.') { $classes.Add("case-question") }
  if ($Number -eq "005" -and $Text -match 'BLOCKCHAIN|WALLET|TIMESTAMPS|WHO FUNDED|WHO SOLD|WHO MOVED') { $classes.Add("evidence-line") }
  if ($classes.Count -eq 0) { return "" }
  return ' class="' + ($classes -join " ") + '"'
}

function Render-EntryCopy($Entry) {
  $html = [System.Text.StringBuilder]::new()
  [void]$html.AppendLine('          <div class="journal-copy">')
  $evidencePhase = $false

  foreach ($paragraph in $Entry.Paragraphs) {
    if ($paragraph -match '^-{10,}$') {
      [void]$html.AppendLine('            <hr aria-hidden="true">')
      if ($Entry.Number -eq "005" -and -not $evidencePhase) {
        [void]$html.AppendLine('          </div>')
        [void]$html.AppendLine('          <section class="journal-copy evidence-phase" id="investigation-notes" aria-label="Investigation notes">')
        [void]$html.AppendLine('            <p class="evidence-label" aria-hidden="true">INVESTIGATION FILE / WALLET CLUSTER</p>')
        $evidencePhase = $true
      }
      continue
    }

    $classAttribute = Get-ParagraphClass $paragraph $Entry.Number
    $encoded = (Encode-Html $paragraph) -replace "`n", "<br>"
    [void]$html.AppendLine("            <p$classAttribute data-source-paragraph>$encoded</p>")
  }

  if ($evidencePhase) {
    [void]$html.AppendLine('          </section>')
  } else {
    [void]$html.AppendLine('          </div>')
  }
  return $html.ToString().TrimEnd()
}

function Get-EntryNavigation($Entry) {
  $number = [int]$Entry.Number
  $previous = if ($number -gt 1) {
    $previousNumber = "{0:D3}" -f ($number - 1)
    "<a class=`"entry-nav-link entry-nav-previous`" href=`"../$previousNumber/index.html#back-cover`"><span>&larr; Previous entry</span><strong>$previousNumber</strong></a>"
  } else {
    '<span class="entry-nav-space" aria-hidden="true"></span>'
  }
  $next = if ($number -lt 5) {
    $nextNumber = "{0:D3}" -f ($number + 1)
    "<a class=`"entry-nav-link entry-nav-next`" href=`"../$nextNumber/index.html`"><span>Next entry &rarr;</span><strong>$nextNumber</strong></a>"
  } else {
    '<span class="entry-nav-space" aria-hidden="true"></span>'
  }
  return "$previous`n        <a class=`"entry-nav-index`" href=`"../index.html`">All entries</a>`n        $next"
}

function Get-PageFooter {
  return @'
  <footer class="site-footer journal-footer">
    <div class="footer-brand">
      <strong>FK RUG PULLS</strong>
      <span>FRP / PRE-LAUNCH</span>
    </div>
    <p>DON'T TRUST THE DEV. VERIFY THE DEV.</p>
    <p class="footer-meta">&copy; <span id="year">2026</span> FK RUG PULLS. No token exists yet.</p>
  </footer>
'@
}

function Get-PageAnchors([string]$Number) {
  $pagePaths = @(Get-EntryPagePaths $Number)
  $anchors = [System.Collections.Generic.List[string]]::new()
  foreach ($stateAnchor in @('inside-front', 'content', 'inside-back', 'back-cover')) {
    $anchors.Add("        <span class=`"journal-page-anchor`" id=`"$stateAnchor`" aria-hidden=`"true`"></span>")
  }
  if ($pagePaths.Count -gt 0) {
    1..$pagePaths.Count | ForEach-Object {
      $anchors.Add("        <span class=`"journal-page-anchor`" id=`"page-$_`" aria-hidden=`"true`"></span>")
    }
  }
  return $anchors -join "`n"
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $parent = Split-Path -Parent $Path
  [System.IO.Directory]::CreateDirectory($parent) | Out-Null
  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

$manifestEntries = [ordered]@{}
foreach ($entry in $entries) {
  $manifestEntries[$entry.Number] = [ordered]@{
    id = $entry.Number
    title = $entry.Title
    subtitle = $entry.DocumentTitle
    markdown = "../../Content/Journal/$($entry.FileName)"
    pages = @(Get-EntryPagePaths $entry.Number)
    assets = [ordered]@{
      coverFront = Get-OptionalEntryAsset $entry.Number "cover-front"
      coverBack = Get-OptionalEntryAsset $entry.Number "cover-back"
      insideFront = Get-OptionalEntryAsset $entry.Number "inside-front"
      insideBack = Get-OptionalEntryAsset $entry.Number "inside-back"
    }
  }
}
$manifestData = [ordered]@{
  version = 2
  entries = $manifestEntries
}
$manifestJson = $manifestData | ConvertTo-Json -Depth 6
$manifestJavaScript = "window.FRP_JOURNAL = $manifestJson;`n"
Write-Utf8NoBom (Join-Path $journalDirectory "journal-manifest.js") $manifestJavaScript

$ledgerItems = foreach ($entry in $entries) {
  @"
        <li>
          <a href="$($entry.Number)/index.html">
            <span class="ledger-number">$($entry.Number)</span>
            <span class="ledger-copy"><small>Journal entry / chronological file</small><strong>$(Encode-Html $entry.Title)</strong></span>
            <span class="ledger-action">Read entry <b aria-hidden="true">&rarr;</b></span>
          </a>
        </li>
"@
}

$indexHtml = @"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0a0a0a">
  <meta name="description" content="Read the five-part FK RUG PULLS journal: one continuous story from the first trade to the final rug.">
  <title>The Journal &mdash; FK RUG PULLS</title>
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="journal.css">
</head>
<body class="journal-body journal-index-body">
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="site-header journal-header">
    <a class="wordmark" href="../index.html" aria-label="FK RUG PULLS home">FRP<span class="red-dot">.</span></a>
    <nav class="desktop-nav" aria-label="Primary navigation">
      <a href="../index.html#story">Story</a>
      <a href="../index.html#rules">Rules</a>
      <a href="../index.html#wallets">Wallets</a>
      <a href="../index.html#launch">Launch plan</a>
    </nav>
    <a class="journal-nav-cta" href="index.html" aria-current="page">Journal</a>
    <a class="status-stamp" href="../index.html#contract">Pre-launch</a>
  </header>

  <main id="main">
    <section class="journal-hero" aria-labelledby="journal-title">
      <div class="journal-hero-copy">
        <p class="eyebrow"><span aria-hidden="true">&#9679;</span> Recovered pages / case file 001&mdash;005</p>
        <h1 class="journal-title" id="journal-title"><span>THE</span><span>JOURNAL</span></h1>
        <p class="journal-deck">Five entries. One continuous story. Start with a bloke looking for one clean win. End with the wallet cluster he should have seen.</p>
        <a class="start-reading" href="001/index.html">Start at entry 001 <span aria-hidden="true">&darr;</span></a>
      </div>
      <aside class="journal-cover-note" aria-label="Reading order">
        <span>Reading order</span>
        <strong>001 &rarr; 002 &rarr; 003 &rarr; 004 &rarr; 005</strong>
        <p>Read chronologically.<br>Do not skip the evidence.</p>
      </aside>
    </section>

    <section class="journal-archive" aria-labelledby="archive-title">
      <div class="archive-heading">
        <p class="kicker">Complete archive / original order</p>
        <h2 id="archive-title">THE WHOLE<br>FUCKING STORY.</h2>
        <p>The pages become less controlled as the money gets bigger, the exits get harder, and the wallets start connecting.</p>
      </div>
      <ol class="journal-ledger">
$($ledgerItems -join "")
      </ol>
    </section>
  </main>

$(Get-PageFooter)
  <script src="../script.js"></script>
</body>
</html>
"@

Write-Utf8NoBom (Join-Path $journalDirectory "index.html") $indexHtml

foreach ($entry in $entries) {
  $level = [int]$entry.Number
  $entryHtml = @"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0a0a0a">
  <meta name="description" content="$(Encode-Html $entry.DocumentTitle): $(Encode-Html $entry.Title)">
  <title>Entry $($entry.Number): $(Encode-Html $entry.Title) &mdash; FK RUG PULLS</title>
  <link rel="stylesheet" href="../../styles.css">
  <link rel="stylesheet" href="../journal.css">
</head>
<body class="journal-body entry-body entry-$($entry.Number) level-$level">
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="site-header journal-header">
    <a class="wordmark" href="../../index.html" aria-label="FK RUG PULLS home">FRP<span class="red-dot">.</span></a>
    <nav class="desktop-nav" aria-label="Primary navigation">
      <a href="../../index.html#story">Story</a>
      <a href="../../index.html#rules">Rules</a>
      <a href="../../index.html#wallets">Wallets</a>
      <a href="../../index.html#launch">Launch plan</a>
    </nav>
    <a class="journal-nav-cta" href="../index.html" aria-current="page">Journal</a>
    <a class="status-stamp" href="../../index.html#contract">Pre-launch</a>
  </header>

  <main id="main" class="journal-entry-main">
    <nav class="journal-breadcrumb" aria-label="Journal breadcrumb">
      <a href="../../index.html">FK RUG PULLS</a><span aria-hidden="true">/</span><a href="../index.html">JOURNAL</a><span aria-hidden="true">/</span><span>ENTRY $($entry.Number)</span>
    </nav>

    <article class="journal-entry" aria-labelledby="entry-title">
      <header class="entry-heading">
        <div>
          <p class="entry-case-label">Journal entry <strong>$($entry.Number)</strong> / notebook file</p>
          <h1 class="entry-title" id="entry-title" data-source-entry-title>$(Encode-Html $entry.Title)</h1>
        </div>
        <p class="entry-order" aria-label="Entry $level of 5"><span>$($entry.Number)</span> / 005</p>
      </header>

      <section class="journal-image-viewer" data-journal-viewer data-entry-id="$($entry.Number)" aria-label="Entry $($entry.Number) notebook viewer" hidden>
$(Get-PageAnchors $entry.Number)
        <div class="journal-reader">
          <button class="journal-turn journal-turn-previous" type="button" data-journal-previous aria-label="Previous journal page">
            <span class="journal-turn-arrow" aria-hidden="true">&larr;</span>
            <span class="journal-turn-label">Previous</span>
          </button>

          <div class="journal-reader-stage" data-journal-reader-stage>
            <figure class="journal-page-figure" data-journal-book-stage>
              <div class="journal-book" data-journal-book>
                <div class="journal-physical-shadow" data-journal-physical-shadow aria-hidden="true"></div>
                <div class="journal-book-position" data-journal-book-position>
                  <div class="journal-book-rig" data-journal-book-rig>
                    <div class="journal-spine" aria-hidden="true"></div>
                    <div class="journal-mobile-sheet is-blank" data-journal-mobile-page>
                      <img data-journal-mobile-image alt="" decoding="async">
                      <span class="journal-page-loading" aria-hidden="true">Loading page</span>
                    </div>
                    <div class="journal-leaf journal-leaf-left" data-journal-left-leaf>
                      <div class="journal-cover-board" aria-hidden="true"></div>
                      <div class="journal-leaf-face journal-leaf-inside journal-leaf-inside-left">
                        <div class="journal-sheet journal-sheet-left is-blank" data-journal-left-page>
                          <img data-journal-left-image alt="" decoding="async">
                          <span class="journal-page-loading" aria-hidden="true">Loading page</span>
                        </div>
                      </div>
                      <div class="journal-leaf-face journal-closed-cover journal-cover-front" data-journal-closed-cover data-journal-cover-front data-cover-side="front" aria-hidden="true">
                        <img data-journal-cover-image alt="" decoding="async" hidden>
                        <div class="journal-cover-design" data-journal-cover-design aria-hidden="true"></div>
                      </div>
                      <div class="journal-page-edge journal-page-edge-outer" aria-hidden="true"></div>
                      <div class="journal-page-edge journal-page-edge-head" aria-hidden="true"></div>
                      <div class="journal-page-edge journal-page-edge-tail" aria-hidden="true"></div>
                    </div>
                    <div class="journal-leaf journal-leaf-right" data-journal-right-leaf>
                      <div class="journal-cover-board" aria-hidden="true"></div>
                      <div class="journal-leaf-face journal-leaf-inside journal-leaf-inside-right">
                        <div class="journal-sheet journal-sheet-right is-blank" data-journal-right-page>
                          <img data-journal-right-image alt="" decoding="async">
                          <span class="journal-page-loading" aria-hidden="true">Loading page</span>
                        </div>
                      </div>
                      <div class="journal-leaf-face journal-closed-cover journal-cover-back" data-journal-closed-cover data-journal-cover-back data-cover-side="back" aria-hidden="true">
                        <img data-journal-cover-image alt="" decoding="async" hidden>
                        <div class="journal-cover-design" data-journal-cover-design aria-hidden="true"></div>
                      </div>
                      <div class="journal-page-edge journal-page-edge-outer" aria-hidden="true"></div>
                      <div class="journal-page-edge journal-page-edge-head" aria-hidden="true"></div>
                      <div class="journal-page-edge journal-page-edge-tail" aria-hidden="true"></div>
                    </div>
                    <div class="journal-turning-sheet" data-journal-turning-sheet aria-hidden="true"></div>
                    <div class="journal-gutter" aria-hidden="true"></div>
                  </div>
                </div>
              </div>
              <figcaption class="journal-page-caption">
                <strong>Entry $($entry.Number)</strong>
                <span data-journal-page-indicator>Closed notebook</span>
              </figcaption>
            </figure>
            <div class="journal-markdown-stage" data-journal-markdown-stage hidden></div>
          </div>

          <button class="journal-turn journal-turn-next" type="button" data-journal-next aria-label="Next journal page">
            <span class="journal-turn-arrow" aria-hidden="true">&rarr;</span>
            <span class="journal-turn-label">Next</span>
          </button>
        </div>
        <p class="journal-reader-hint">Use the side controls or arrow keys to turn the page.</p>
        <p class="journal-viewer-status" data-journal-status aria-live="polite"></p>
      </section>

      <div data-journal-fallback>
        <div class="journal-page">
          $(Get-Decorations $entry.Number)
$(Render-EntryCopy $entry)
        </div>
      </div>

      <p class="source-link"><a href="../../Content/Journal/$($entry.FileName)">View original Markdown source <span aria-hidden="true">&#8599;</span></a></p>
    </article>

    <nav class="entry-navigation" aria-label="Journal entry navigation">
      $(Get-EntryNavigation $entry)
    </nav>
  </main>

$(Get-PageFooter)
  <script src="../journal-manifest.js"></script>
  <script src="../journal-viewer.js"></script>
  <script src="../../script.js"></script>
</body>
</html>
"@

  Write-Utf8NoBom (Join-Path $journalDirectory "$($entry.Number)\index.html") $entryHtml
}

Write-Output "Built journal manifest, index, and $($entries.Count) entry pages from Markdown sources and discovered page images."
