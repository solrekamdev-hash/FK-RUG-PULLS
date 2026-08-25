param(
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$sourceDirectory = Join-Path $RepositoryRoot "Content\Journal"
$journalDirectory = Join-Path $RepositoryRoot "journal"
$manifestPath = Join-Path $journalDirectory "journal-manifest.js"
$viewerScriptPath = Join-Path $journalDirectory "journal-viewer.js"
$viewerStylePath = Join-Path $journalDirectory "journal.css"
$viewerLogicTestPath = Join-Path $PSScriptRoot "check-journal-viewer.js"
$materialPaths = @(
  (Join-Path $RepositoryRoot "assets\journal\material-paper.svg"),
  (Join-Path $RepositoryRoot "assets\journal\material-cover.svg"),
  (Join-Path $RepositoryRoot "assets\journal\material-edge-vertical.svg"),
  (Join-Path $RepositoryRoot "assets\journal\material-edge-horizontal.svg")
)
$protectedEntry001Hashes = [ordered]@{
  "page-01.webp" = "1e797d1e94dae072987ae07681b8838942e6570ffce22f9bf09fdad97023b8ff"
  "page-02.webp" = "71f9484cad8dcb1c0abd8b658673c3f81b2dd6308182385f486b83cd25e78ffc"
  "page-03.webp" = "2d5a6774c8aa99658d3f6807f6b8a273af3cb92d30b1b3af4ecff051a8dfa19c"
  "page-04.webp" = "cc3f54cdbb2ca9424b640bc5e05cb7a00e7c6fe0f1f790977cb30ec9fe6f4560"
}
$expectedFiles = 1..5 | ForEach-Object { "FK-RUG-PULLS-JOURNAL-ENTRY-{0:D3}.md" -f $_ }

function Decode-Html([string]$Text) {
  $withoutBreaks = $Text -replace '<br\s*/?>', "`n"
  $withoutTags = $withoutBreaks -replace '<[^>]+>', ''
  return [System.Net.WebUtility]::HtmlDecode($withoutTags)
}

function Get-SourceParagraphs([string]$Path) {
  $lines = [System.IO.File]::ReadAllLines($Path)
  $paragraphs = [System.Collections.Generic.List[string]]::new()
  $buffer = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $lines[4..($lines.Count - 1)]) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      if ($buffer.Count -gt 0) {
        $block = $buffer -join "`n"
        if ($block -notmatch '^-{10,}$') { $paragraphs.Add($block) }
        $buffer.Clear()
      }
    } else {
      $buffer.Add($line)
    }
  }
  if ($buffer.Count -gt 0) {
    $block = $buffer -join "`n"
    if ($block -notmatch '^-{10,}$') { $paragraphs.Add($block) }
  }
  return $paragraphs.ToArray()
}

$failures = [System.Collections.Generic.List[string]]::new()
$manifest = $null

if (-not (Test-Path -LiteralPath $manifestPath)) {
  $failures.Add("Missing journal manifest: journal/journal-manifest.js")
} else {
  $manifestJavaScript = [System.IO.File]::ReadAllText($manifestPath)
  $manifestMatch = [regex]::Match(
    $manifestJavaScript,
    '^\s*window\.FRP_JOURNAL\s*=\s*(?<json>\{.*\});\s*$',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )
  if (-not $manifestMatch.Success) {
    $failures.Add("Journal manifest is not a file-safe window.FRP_JOURNAL assignment")
  } else {
    try {
      $manifest = $manifestMatch.Groups["json"].Value | ConvertFrom-Json
      if ($manifest.version -ne 2 -or $null -eq $manifest.entries) {
        $failures.Add("Journal manifest must contain version 2 and an entries object")
        $manifest = $null
      }
    } catch {
      $failures.Add("Journal manifest contains invalid JSON: $($_.Exception.Message)")
    }
  }
}

if (-not (Test-Path -LiteralPath $viewerScriptPath)) {
  $failures.Add("Missing shared page viewer: journal/journal-viewer.js")
} else {
  $viewerScript = [System.IO.File]::ReadAllText($viewerScriptPath)
  if ($viewerScript -notmatch 'event\.key === "ArrowLeft"' -or $viewerScript -notmatch 'event\.key === "ArrowRight"') {
    $failures.Add("Journal viewer is missing Left/Right Arrow keyboard navigation")
  }
  if ($viewerScript -notmatch 'prefers-reduced-motion: reduce' -or $viewerScript -notmatch 'isAnimating') {
    $failures.Add("Journal viewer is missing reduced-motion or navigation-lock handling")
  }
  if ($viewerScript -notmatch 'bookGeometry' -or $viewerScript -notmatch 'animateWholeBook' -or $viewerScript -notmatch 'physicalEase') {
    $failures.Add("Journal viewer is missing continuous physical notebook geometry")
  }
  if ($viewerScript -match 'support\.js|window\.React|createElement\(\s*["'']canvas') {
    $failures.Add("Journal viewer introduced a prototype runtime, React, or Canvas dependency")
  }
  if ($viewerScript -match 'makeTexture|makeCoverTexture|makeEdgeTexture') {
    $failures.Add("Journal viewer must not transplant the reference texture or page-turn runtime")
  }
  if ($viewerScript -match 'POCKET NOTEBOOK / 001|PROPERTY OF:|192 PAGES / BLACK') {
    $failures.Add("Entry 001 closed covers must contain no decorative text")
  }
  if ($viewerScript -notmatch 'entry\.id === "001"' -or $viewerScript -notmatch 'is-endleaf' -or $viewerScript -match 'ENTRY 001 / START|JUST LOOKING\.|ENTRY 001 / END|ONE CLEAN WIN\.') {
    $failures.Add("Entry 001 must use plain matte endleafs without generated opening or ending copy")
  }
  if ($viewerScript -notmatch 'animateClosedBookTurnaround' -or $viewerScript -notmatch 'turnAround' -or $viewerScript -notmatch 'rotateY\(\$\{theta') {
    $failures.Add("Journal viewer is missing its physical closed-book turnaround loop")
  }
  if ($viewerScript -notmatch 'class PageCurlEngine' -or $viewerScript -notmatch 'curlAngles' -or $viewerScript -notmatch 'new PageCurlEngine\(turningSheet, 18\)') {
    $failures.Add("Journal viewer is missing the 18-strip developable page-curl engine")
  }
  if ($viewerScript -notmatch 'waitForSurfaceImage' -or $viewerScript -notmatch 'renderState\(states\.indexOf\(targetState\), true, true\)' -or $viewerScript -notmatch 'history\.pushState') {
    $failures.Add("Journal viewer is missing its decoded destination-spread commit or scroll-stable history update")
  }
}

if (-not (Test-Path -LiteralPath $viewerStylePath)) {
  $failures.Add("Missing shared journal styles: journal/journal.css")
} else {
  $viewerStyles = [System.IO.File]::ReadAllText($viewerStylePath)
  if ($viewerStyles -notmatch '\.journal-curl-strip' -or $viewerStyles -notmatch '\.journal-curl-face-back' -or $viewerStyles -notmatch '\.journal-curl-shadow-gutter') {
    $failures.Add("Journal viewer is missing segmented page-curl faces and moving shadows")
  }
  if ($viewerStyles -notmatch '@media \(max-width: 560px\)' -or $viewerStyles -notmatch '\.journal-mobile-sheet') {
    $failures.Add("Journal viewer is missing the single-page mobile layout")
  }
  if ($viewerStyles -notmatch '@media \(prefers-reduced-motion: reduce\)') {
    $failures.Add("Journal styles do not respect prefers-reduced-motion")
  }
  if ($viewerStyles -notmatch '\.journal-book-position' -or $viewerStyles -notmatch '\.journal-leaf' -or $viewerStyles -notmatch '\.journal-physical-shadow' -or $viewerStyles -notmatch '\.journal-page-edge') {
    $failures.Add("Journal viewer is missing its shared physical notebook structure")
  }
  if ($viewerStyles -notmatch '\.journal-book-rig \{ pointer-events: none; \}') {
    $failures.Add("Journal 3D rig must not intercept the side navigation controls")
  }
  if ($viewerStyles -notmatch '\.journal-inside-design') {
    $failures.Add("Journal viewer is missing the approved code-rendered inside-page treatment")
  }
  if ($viewerStyles -notmatch '\.journal-sheet\.is-endleaf' -or $viewerStyles -notmatch '\.journal-curl-texture\.is-left-page::after') {
    $failures.Add("Journal viewer is missing matte Entry 001 endleafs or endpoint-matched curl page shading")
  }
  if ($viewerStyles -notmatch '--journal-paper-material' -or $viewerStyles -notmatch '--journal-cover-material' -or $viewerStyles -notmatch '--journal-edge-vertical' -or $viewerStyles -notmatch '--journal-edge-horizontal') {
    $failures.Add("Journal viewer is missing its paper, cover, or layered page-edge material assets")
  }
  if ($viewerStyles -notmatch '\.journal-sheet-left::after[\s\S]*var\(--journal-paper-material\)' -or $viewerStyles -notmatch '\.journal-curl-texture\.is-left-page::after[\s\S]*var\(--journal-paper-material\)') {
    $failures.Add("Resting and curling pages must share the same physical paper material")
  }
  if ($viewerStyles -notmatch '\.journal-sheet-left\[data-surface-kind="page"\]::after' -or $viewerStyles -notmatch '\.journal-curl-texture\.has-image\.is-left-page::after') {
    $failures.Add("Rendered resting and curling pages must share the same narrow book-level shading")
  }
}

foreach ($protectedAsset in $protectedEntry001Hashes.GetEnumerator()) {
  $protectedPath = Join-Path $RepositoryRoot "assets\journal\001\$($protectedAsset.Key)"
  if (-not (Test-Path -LiteralPath $protectedPath -PathType Leaf)) {
    $failures.Add("Missing protected Entry 001 source: $($protectedAsset.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $protectedAsset.Value) {
    $failures.Add("Protected Entry 001 source hash changed: $($protectedAsset.Key)")
  }
}

foreach ($materialPath in $materialPaths) {
  if (-not (Test-Path -LiteralPath $materialPath -PathType Leaf)) {
    $failures.Add("Missing journal material asset: $([System.IO.Path]::GetFileName($materialPath))")
    continue
  }
  try {
    [xml][System.IO.File]::ReadAllText($materialPath) | Out-Null
  } catch {
    $failures.Add("Invalid journal material SVG: $([System.IO.Path]::GetFileName($materialPath))")
  }
}

foreach ($fileName in $expectedFiles) {
  $sourcePath = Join-Path $sourceDirectory $fileName
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    $failures.Add("Missing source: $fileName")
    continue
  }

  $number = [regex]::Match($fileName, '(\d{3})').Value
  $pagePath = Join-Path $journalDirectory "$number\index.html"
  if (-not (Test-Path -LiteralPath $pagePath)) {
    $failures.Add("Missing generated route: journal/$number/index.html")
    continue
  }

  $sourceParagraphs = @(Get-SourceParagraphs $sourcePath)
  $sourceLines = [System.IO.File]::ReadAllLines($sourcePath)
  $sourceTitle = $sourceLines[2].Substring(3)
  $page = [System.IO.File]::ReadAllText($pagePath)
  if ($page -notmatch ('data-journal-viewer\s+data-entry-id="{0}"' -f $number)) {
    $failures.Add("Entry $number is missing its image-page viewer")
  }
  if ($page -notmatch 'data-journal-previous' -or $page -notmatch 'data-journal-next' -or $page -notmatch 'data-journal-page-indicator') {
    $failures.Add("Entry $number is missing side navigation or page state")
  }
  if ($page -notmatch 'data-journal-left-page' -or $page -notmatch 'data-journal-right-page' -or $page -notmatch 'data-journal-mobile-page' -or $page -notmatch 'data-journal-turning-sheet') {
    $failures.Add("Entry $number is missing physical spread, mobile page, or turning-sheet markup")
  }
  if ($page -notmatch 'data-journal-closed-cover' -or $page -notmatch 'data-journal-cover-image' -or $page -notmatch 'data-journal-markdown-stage') {
    $failures.Add("Entry $number is missing its closed-cover or integrated Markdown stage")
  }
  if ($page -notmatch 'data-journal-left-leaf' -or $page -notmatch 'data-journal-right-leaf' -or $page -notmatch 'data-journal-physical-shadow') {
    $failures.Add("Entry $number is missing the shared spine-hinged notebook leaves or physical shadow")
  }
  if ($page -notmatch 'data-journal-fallback') {
    $failures.Add("Entry $number is missing its Markdown fallback container")
  }
  if ($page -notmatch '<script src="\.\./journal-manifest\.js"></script>\s*<script src="\.\./journal-viewer\.js"></script>') {
    $failures.Add("Entry $number does not load the shared manifest and viewer with explicit relative paths")
  }

  $renderedTitleMatch = [regex]::Match($page, '<h1[^>]*data-source-entry-title[^>]*>(.*?)</h1>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if (-not $renderedTitleMatch.Success -or (Decode-Html $renderedTitleMatch.Groups[1].Value) -cne $sourceTitle) {
    $failures.Add("Entry $number title differs from source")
  }
  $renderedMatches = [regex]::Matches($page, '<p(?:\s+class="[^"]*")?\s+data-source-paragraph>(.*?)</p>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $renderedParagraphs = @($renderedMatches | ForEach-Object { Decode-Html $_.Groups[1].Value })

  if ($sourceParagraphs.Count -ne $renderedParagraphs.Count) {
    $failures.Add("Entry $number paragraph count differs: source $($sourceParagraphs.Count), page $($renderedParagraphs.Count)")
    continue
  }

  for ($index = 0; $index -lt $sourceParagraphs.Count; $index++) {
    if ($sourceParagraphs[$index] -cne $renderedParagraphs[$index]) {
      $failures.Add("Entry $number prose differs at paragraph $($index + 1)")
      break
    }
  }

  if ($null -ne $manifest) {
    $manifestProperty = $manifest.entries.PSObject.Properties[$number]
    if ($null -eq $manifestProperty) {
      $failures.Add("Manifest is missing entry $number")
    } else {
      $manifestEntry = $manifestProperty.Value
      if ($manifestEntry.id -cne $number) { $failures.Add("Manifest entry $number has an incorrect id") }
      if ($manifestEntry.title -cne $sourceTitle) { $failures.Add("Manifest entry $number title differs from source") }
      if ($manifestEntry.markdown -cne "../../Content/Journal/$fileName") {
        $failures.Add("Manifest entry $number has an incorrect Markdown fallback path")
      }
      if ($null -eq $manifestEntry.assets) {
        $failures.Add("Manifest entry $number is missing optional cover/inside asset slots")
      } else {
        foreach ($assetProperty in @('coverFront', 'coverBack', 'insideFront', 'insideBack')) {
          if ($null -eq $manifestEntry.assets.PSObject.Properties[$assetProperty]) {
            $failures.Add("Manifest entry $number is missing optional asset property: $assetProperty")
            continue
          }
          $assetPath = $manifestEntry.assets.$assetProperty
          if ($null -ne $assetPath) {
            $expectedStem = switch ($assetProperty) {
              'coverFront' { 'cover-front' }
              'coverBack' { 'cover-back' }
              'insideFront' { 'inside-front' }
              'insideBack' { 'inside-back' }
            }
            if ($assetPath -notmatch ('^\.\./\.\./assets/journal/{0}/{1}\.(?:png|webp|jpe?g|avif)$' -f $number, $expectedStem)) {
              $failures.Add("Manifest entry $number has an invalid optional asset path: $assetPath")
            }
          }
        }
      }

      $seenPagePaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
      foreach ($pageImage in @($manifestEntry.pages)) {
        if ($pageImage -notmatch ('^\.\./\.\./assets/journal/{0}/(?:rendered/)?page-\d+\.(?:png|webp|jpe?g|avif)$' -f $number)) {
          $failures.Add("Manifest entry $number has an invalid page-image path: $pageImage")
          continue
        }
        if (-not $seenPagePaths.Add($pageImage)) {
          $failures.Add("Manifest entry $number repeats page-image path: $pageImage")
        }
        $resolvedPageImage = [System.IO.Path]::GetFullPath((Join-Path (Join-Path $journalDirectory $number) $pageImage.Replace('/', '\')))
        if (-not (Test-Path -LiteralPath $resolvedPageImage -PathType Leaf)) {
          $failures.Add("Manifest entry $number references a missing page image: $pageImage")
        }
      }
    }
  }
}

if ($null -ne $manifest) {
  $expectedEntry001Pages = @(
    "../../assets/journal/001/rendered/page-01.webp",
    "../../assets/journal/001/rendered/page-02.webp",
    "../../assets/journal/001/rendered/page-03.webp",
    "../../assets/journal/001/rendered/page-04.webp"
  )
  $entry001Pages = @($manifest.entries.'001'.pages)
  if ($entry001Pages.Count -ne $expectedEntry001Pages.Count) {
    $failures.Add("Manifest entry 001 must contain its four final artwork pages")
  } else {
    for ($index = 0; $index -lt $expectedEntry001Pages.Count; $index++) {
      if ($entry001Pages[$index] -cne $expectedEntry001Pages[$index]) {
        $failures.Add("Manifest entry 001 page order differs at position $($index + 1)")
        break
      }
    }
  }

  foreach ($fallbackNumber in @('002', '003', '004', '005')) {
    if (@($manifest.entries.$fallbackNumber.pages).Count -ne 0) {
      $failures.Add("Entry $fallbackNumber should still use its Markdown fallback until artwork is supplied")
    }
  }
}

$entry002Path = Join-Path $journalDirectory "002\index.html"
if (Test-Path -LiteralPath $entry002Path) {
  $entry002Page = [System.IO.File]::ReadAllText($entry002Path)
  if ($entry002Page -notmatch 'href="\.\./001/index\.html#back-cover"') {
    $failures.Add("Entry 002 reverse navigation must land on Entry 001's closed back cover")
  }
}

$indexPath = Join-Path $journalDirectory "index.html"
if (-not (Test-Path -LiteralPath $indexPath)) {
  $failures.Add("Missing Journal index route")
} else {
  $journalIndex = [System.IO.File]::ReadAllText($indexPath)
  $positions = 1..5 | ForEach-Object { $journalIndex.IndexOf(('href="{0:D3}/index.html"' -f $_), [System.StringComparison]::Ordinal) }
  if ($positions -contains -1) { $failures.Add("Journal index does not link every entry") }
  for ($index = 1; $index -lt $positions.Count; $index++) {
    if ($positions[$index] -le $positions[$index - 1]) {
      $failures.Add("Journal index entries are not in chronological order")
      break
    }
  }
}

$rootIndex = [System.IO.File]::ReadAllText((Join-Path $RepositoryRoot "index.html"))
if ($rootIndex -notmatch 'class="journal-nav-cta"\s+href="journal/index\.html"') {
  $failures.Add("Root navigation is missing the Journal item")
}

if (Test-Path -LiteralPath (Join-Path $RepositoryRoot ".github\workflows")) {
  $pagesWorkflows = Get-ChildItem -LiteralPath (Join-Path $RepositoryRoot ".github\workflows") -File | Where-Object {
    (Get-Content -Raw -LiteralPath $_.FullName) -match 'pages|deploy-pages'
  }
  if ($pagesWorkflows) { $failures.Add("GitHub Pages workflow detected") }
}
if (Test-Path -LiteralPath (Join-Path $RepositoryRoot ".openai\hosting.json")) {
  $failures.Add("Hosting configuration detected")
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ }
  exit 1
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCommand) {
  throw "Node.js is required for the journal viewer logic regression check"
}
& $nodeCommand.Source $viewerLogicTestPath
if ($LASTEXITCODE -ne 0) {
  throw "Journal viewer logic regression check failed"
}

& (Join-Path $PSScriptRoot "check-site-links.ps1") -RepositoryRoot $RepositoryRoot
if (-not $?) {
  throw "Site link compatibility checks failed"
}

Write-Output "Journal checks passed: four Entry 001 images, shared resting/curl paper material, layered page edges, matte cover/endleafs, endpoint-matched curl settling, scroll-stable state history, turnaround loops, keyboard and reduced-motion support, sequential mobile paging, 5 exact Markdown fallbacks, 6 routes, and explicit local links."
