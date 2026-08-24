param(
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$sourceDirectory = Join-Path $RepositoryRoot "Content\Journal"
$journalDirectory = Join-Path $RepositoryRoot "journal"
$manifestPath = Join-Path $journalDirectory "journal-manifest.js"
$viewerScriptPath = Join-Path $journalDirectory "journal-viewer.js"
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
      if ($manifest.version -ne 1 -or $null -eq $manifest.entries) {
        $failures.Add("Journal manifest must contain version 1 and an entries object")
        $manifest = $null
      }
    } catch {
      $failures.Add("Journal manifest contains invalid JSON: $($_.Exception.Message)")
    }
  }
}

if (-not (Test-Path -LiteralPath $viewerScriptPath)) {
  $failures.Add("Missing shared page viewer: journal/journal-viewer.js")
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

      $seenPagePaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
      foreach ($pageImage in @($manifestEntry.pages)) {
        if ($pageImage -notmatch ('^\.\./\.\./assets/journal/{0}/page-\d+\.(?:png|webp|jpe?g|avif)$' -f $number)) {
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

& (Join-Path $PSScriptRoot "check-site-links.ps1") -RepositoryRoot $RepositoryRoot

Write-Output "Journal checks passed: shared manifest/viewer, 5 exact Markdown fallbacks, page-image paths, 6 routes, chronological index, explicit local links, and no Pages/hosting configuration."
