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
$frozenEntry001ArtworkHashes = [ordered]@{
  "page-01.png" = "1fed8d2f1beeb590d8677a8f6124f91985cd554a45a5f22efcbad01dace73ce2"
  "page-02.png" = "b4e498fe2ab8e651ca32fca8ee796194cbf7a631800beab25a81ea5ff780ba07"
  "page-03.png" = "7288ac2f2c59e5420ac89b11220138999b028ce687c7cf4537826f6e842af18e"
  "page-04.png" = "4d76fca169401486a0033a64fbdad602863d3aaf9c3a73ff26b000d34ef02cdf"
}
$protectedEntry002Hashes = [ordered]@{
  "page-01.png" = "f5275973c3a6ac954fb796742f6e785881b1559aff23305e80062379e55087f5"
}
$frozenEntry002ArtworkHashes = [ordered]@{
  "page-01.png" = "d63f24019cb802730b91caacfc4bea56b70086aa419274881c416a987d74d39a"
  "page-02.png" = "3d640f337f5862e9673b825a851e80c4d6b40b5cd6a95fd34b1faca8fc7e8be2"
  "page-03.png" = "a9266a7fc44a1b116d19c3f134529fbcda7a03f27c986d16ea9b2ea6ee6d7dfd"
  "page-04.png" = "0a02719979650c3ee450ece17f2e80b93d2ec4a082997e0730116a32a31a0686"
}
$frozenEntry002CompanionHashes = [ordered]@{
  "inside-front.png" = "bae2e73acda18257ffff47fedc0a6b6f8a6d527a118514413f504c678651f411"
  "inside-back.png" = "e50385d26344c24d6cfebfcef950848bb2765a9da618e64f44b1a552d1fee5a2"
}
$approvedEntry002BaseHashes = [ordered]@{
  "artwork/page-01.png" = "f39d8591e474ed883169dc1713ce1beafc3cb7c01301186bdf1ab15126fc03ae"
  "artwork/page-02.png" = "e120141c3efa83f24338f0983f111709a8ede5c12d8be45c9a2fd318b45492ab"
  "artwork/page-03.png" = "165ba1633f3d5385521d7f7d90580342f1651ec0acecbd210e810c03c2075ed8"
  "artwork/page-04.png" = "9a201a9c77f4bf05daff70ae0789190c08f528ab012fb0899c82203c7b44b0f9"
  "inside-front.png" = "1f4842ad027a64487a6329d63898b172cf4810a625e600cf5d3ad670886f4496"
  "inside-back.png" = "9de0bdcd0d1107e1bba4380f4cb9c01dbfeaeb3354300b575950a3829636240d"
}
$frozenEntry002MarginaliaHashes = [ordered]@{
  "sprites.png" = "42d3661fd507dda7c4dcdceefadd3905cf8188fbe6ee9e41d73332ad932b6a8d"
  "inside-front-overlay.png" = "e2fdc241bb7e863c87c8dff57ba2b6c834cd9b52dff4825c1a37da83bb7e69cf"
  "page-01-overlay.png" = "7fa9af5fb50d8b09867a44d6a0d8140e8a0960f431f019ffa4093db2bb18f5a9"
  "page-02-overlay.png" = "7a6adf8647091df6bea0d478c36dac63b988c6dc4e720a29e2039964bae9e9b0"
  "page-03-overlay.png" = "9c57c05cefa77df3b097bccca204b7e2c7b2b6d76c85745d0d676466e7572fdf"
  "page-04-overlay.png" = "f631d9b706ce3eff88adf69798ecf69dbff1e595d707621573c1848ead01bb77"
  "inside-back-overlay.png" = "f5f6c17f6b3adb9e8dc59b7e8a1b3dcca349dc45214e5a2717e588eba9741ffe"
}
$frozenEntry003ArtworkHashes = [ordered]@{
  "page-01.png" = "2e4c8f63a3b0c8776a23c67686ad8fb6b44f23022e2740cde10fc69b3371493d"
  "page-02.png" = "6bca45dd7f0a3d06def069a66ab27e7893ceb40defd47a3cbc31f7691d93db7f"
  "page-03.png" = "28f04b84c13039d26c05f41252162a74991855121809e27043517cc2f16bd4a0"
  "page-04.png" = "acd5a444e3634e491a2783a766e3a0885b52fd31f74fb60236b26d8c745d77f6"
}
$frozenEntry003CompanionHashes = [ordered]@{
  "inside-front.png" = "4ca8ec73703f9d8a5b6adbd8980ca977c43a640b97a039f01a99d946f547c7fe"
  "inside-back.png" = "2d4624be2c7f1472f85393e497be63d92d6da51c508f2d2a0ff6dfeed8ca554c"
}
$frozenEntry004ArtworkHashes = [ordered]@{
  "page-01.png" = "577c6f1171503b830cb9ff33b3aaedb79e2776b4da4f12cbed50daa4d50fc213"
  "page-02.png" = "5b0d5bfaacbdab3d380383ac1d62d179e342e621805153d8b32041ed98707c8b"
  "page-03.png" = "fcb99f22ab2762ad992b0b484ae79fd17bb24806289cf46a165355040741ed3a"
  "page-04.png" = "6bfa2179005a5a2b1f977650ef376ba9a1816219a6d066a375040ca436ac0b27"
}
$frozenEntry004CompanionHashes = [ordered]@{
  "inside-front.png" = "0ed4707a2c446939619a4ea0aaf4960272a7473863b4ef6947e569f784aa5bb4"
  "inside-back.png" = "9e74fee26f89a1efa331c948cc289a8fd38b9eba6cfafd74b53692db43b37a46"
}
$frozenEntry004SourceHashes = [ordered]@{
  "page-01-imagegen-rgb.png" = "04116073eba46d20d5d2e3ba938eee3a7d7f4ba138f4db06b4b1dce82a91ca1b"
  "page-02-imagegen-rgb.png" = "be482e803804bc80d0ebb346b1d7982ac76a615a18283acd911ea876969b5c7d"
  "page-03-imagegen-rgb.png" = "e3a342a0309e898fde7d0eed5c5c9d6d2c0c9e3a1c321fe8811a54192e6e899b"
  "page-04-imagegen-rgb.png" = "abd4a3bc49722dd849f713e388e8e938681967ade7c7d15ccb42e707bd470d79"
  "inside-front-imagegen-rgb.png" = "c260794f92373501eaf96daaf9447113a22f2bc8dd9493cfb20c130c5c1fe588"
  "inside-back-imagegen-rgb.png" = "cde349b25bb743aa0d08bdab922066565d3f312b7448ea7289dab48ef871a7ce"
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

foreach ($frozenArtwork in $frozenEntry001ArtworkHashes.GetEnumerator()) {
  $artworkPath = Join-Path $RepositoryRoot "assets\journal\001\artwork\$($frozenArtwork.Key)"
  if (-not (Test-Path -LiteralPath $artworkPath -PathType Leaf)) {
    $failures.Add("Missing frozen Entry 001 artwork: $($frozenArtwork.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artworkPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $frozenArtwork.Value) {
    $failures.Add("Frozen Entry 001 artwork changed: $($frozenArtwork.Key)")
  }
}

foreach ($protectedAsset in $protectedEntry002Hashes.GetEnumerator()) {
  $protectedPath = Join-Path $RepositoryRoot "assets\journal\002\$($protectedAsset.Key)"
  if (-not (Test-Path -LiteralPath $protectedPath -PathType Leaf)) {
    $failures.Add("Missing protected Entry 002 source: $($protectedAsset.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $protectedAsset.Value) {
    $failures.Add("Protected Entry 002 source hash changed: $($protectedAsset.Key)")
  }
}

foreach ($frozenArtwork in $frozenEntry002ArtworkHashes.GetEnumerator()) {
  $artworkPath = Join-Path $RepositoryRoot "assets\journal\002\artwork\$($frozenArtwork.Key)"
  if (-not (Test-Path -LiteralPath $artworkPath -PathType Leaf)) {
    $failures.Add("Missing frozen Entry 002 artwork: $($frozenArtwork.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artworkPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $frozenArtwork.Value) {
    $failures.Add("Frozen Entry 002 artwork changed: $($frozenArtwork.Key)")
  }
}

foreach ($frozenCompanion in $frozenEntry002CompanionHashes.GetEnumerator()) {
  $companionPath = Join-Path $RepositoryRoot "assets\journal\002\$($frozenCompanion.Key)"
  if (-not (Test-Path -LiteralPath $companionPath -PathType Leaf)) {
    $failures.Add("Missing frozen Entry 002 companion artwork: $($frozenCompanion.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $companionPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $frozenCompanion.Value) {
    $failures.Add("Frozen Entry 002 companion artwork changed: $($frozenCompanion.Key)")
  }
}

foreach ($approvedBase in $approvedEntry002BaseHashes.GetEnumerator()) {
  $basePath = Join-Path $RepositoryRoot "assets\journal\002\approved-base\$($approvedBase.Key)"
  if (-not (Test-Path -LiteralPath $basePath -PathType Leaf)) {
    $failures.Add("Missing approved Entry 002 base artwork: $($approvedBase.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $basePath).Hash.ToLowerInvariant()
  if ($actualHash -cne $approvedBase.Value) {
    $failures.Add("Approved Entry 002 base artwork changed: $($approvedBase.Key)")
  }
}

foreach ($marginaliaAsset in $frozenEntry002MarginaliaHashes.GetEnumerator()) {
  $marginaliaPath = Join-Path $RepositoryRoot "assets\journal\002\marginalia\$($marginaliaAsset.Key)"
  if (-not (Test-Path -LiteralPath $marginaliaPath -PathType Leaf)) {
    $failures.Add("Missing frozen Entry 002 marginalia asset: $($marginaliaAsset.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $marginaliaPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $marginaliaAsset.Value) {
    $failures.Add("Frozen Entry 002 marginalia asset changed: $($marginaliaAsset.Key)")
  }
}

foreach ($frozenArtwork in $frozenEntry003ArtworkHashes.GetEnumerator()) {
  $artworkPath = Join-Path $RepositoryRoot "assets\journal\003\artwork\$($frozenArtwork.Key)"
  if (-not (Test-Path -LiteralPath $artworkPath -PathType Leaf)) {
    $failures.Add("Missing frozen Entry 003 artwork: $($frozenArtwork.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artworkPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $frozenArtwork.Value) {
    $failures.Add("Frozen Entry 003 artwork changed: $($frozenArtwork.Key)")
  }

  Add-Type -AssemblyName System.Drawing
  $image = [System.Drawing.Bitmap]::FromFile($artworkPath)
  try {
    if ($image.Width -ne 924 -or $image.Height -ne 1534) {
      $failures.Add("Entry 003 artwork must be exactly 924x1534: $($frozenArtwork.Key)")
    }
    if ($image.PixelFormat -notmatch 'Argb' -or $image.GetPixel(0, 0).A -ne 0) {
      $failures.Add("Entry 003 artwork must be a transparent RGBA layer: $($frozenArtwork.Key)")
    }
  } finally {
    $image.Dispose()
  }
}

foreach ($frozenCompanion in $frozenEntry003CompanionHashes.GetEnumerator()) {
  $companionPath = Join-Path $RepositoryRoot "assets\journal\003\$($frozenCompanion.Key)"
  if (-not (Test-Path -LiteralPath $companionPath -PathType Leaf)) {
    $failures.Add("Missing frozen Entry 003 companion: $($frozenCompanion.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $companionPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $frozenCompanion.Value) {
    $failures.Add("Frozen Entry 003 companion changed: $($frozenCompanion.Key)")
  }

  Add-Type -AssemblyName System.Drawing
  $image = [System.Drawing.Bitmap]::FromFile($companionPath)
  try {
    if ($image.Width -ne 924 -or $image.Height -ne 1534) {
      $failures.Add("Entry 003 companion must be exactly 924x1534: $($frozenCompanion.Key)")
    }
    if ($image.PixelFormat -notmatch 'Argb' -or $image.GetPixel(0, 0).A -ne 0) {
      $failures.Add("Entry 003 companion must be a transparent RGBA layer: $($frozenCompanion.Key)")
    }
  } finally {
    $image.Dispose()
  }
}

foreach ($frozenArtwork in $frozenEntry004ArtworkHashes.GetEnumerator()) {
  $artworkPath = Join-Path $RepositoryRoot "assets\journal\004\artwork\$($frozenArtwork.Key)"
  if (-not (Test-Path -LiteralPath $artworkPath -PathType Leaf)) {
    $failures.Add("Missing frozen Entry 004 artwork: $($frozenArtwork.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artworkPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $frozenArtwork.Value) {
    $failures.Add("Frozen Entry 004 artwork changed: $($frozenArtwork.Key)")
  }

  Add-Type -AssemblyName System.Drawing
  $image = [System.Drawing.Bitmap]::FromFile($artworkPath)
  try {
    if ($image.Width -ne 924 -or $image.Height -ne 1534) {
      $failures.Add("Entry 004 artwork must be exactly 924x1534: $($frozenArtwork.Key)")
    }
    $corners = @(
      $image.GetPixel(0, 0),
      $image.GetPixel($image.Width - 1, 0),
      $image.GetPixel(0, $image.Height - 1),
      $image.GetPixel($image.Width - 1, $image.Height - 1)
    )
    if ($image.PixelFormat -notmatch 'Argb' -or @($corners | Where-Object A -ne 0).Count -ne 0) {
      $failures.Add("Entry 004 artwork must be an RGBA layer with zero-alpha corners: $($frozenArtwork.Key)")
    }
  } finally {
    $image.Dispose()
  }
}

foreach ($frozenCompanion in $frozenEntry004CompanionHashes.GetEnumerator()) {
  $companionPath = Join-Path $RepositoryRoot "assets\journal\004\$($frozenCompanion.Key)"
  if (-not (Test-Path -LiteralPath $companionPath -PathType Leaf)) {
    $failures.Add("Missing frozen Entry 004 companion: $($frozenCompanion.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $companionPath).Hash.ToLowerInvariant()
  if ($actualHash -cne $frozenCompanion.Value) {
    $failures.Add("Frozen Entry 004 companion changed: $($frozenCompanion.Key)")
  }

  Add-Type -AssemblyName System.Drawing
  $image = [System.Drawing.Bitmap]::FromFile($companionPath)
  try {
    if ($image.Width -ne 924 -or $image.Height -ne 1534) {
      $failures.Add("Entry 004 companion must be exactly 924x1534: $($frozenCompanion.Key)")
    }
    $corners = @(
      $image.GetPixel(0, 0),
      $image.GetPixel($image.Width - 1, 0),
      $image.GetPixel(0, $image.Height - 1),
      $image.GetPixel($image.Width - 1, $image.Height - 1)
    )
    if ($image.PixelFormat -notmatch 'Argb' -or @($corners | Where-Object A -ne 0).Count -ne 0) {
      $failures.Add("Entry 004 companion must be an RGBA layer with zero-alpha corners: $($frozenCompanion.Key)")
    }
  } finally {
    $image.Dispose()
  }
}

foreach ($frozenSource in $frozenEntry004SourceHashes.GetEnumerator()) {
  $sourcePath = Join-Path $RepositoryRoot "assets\journal\004\source\$($frozenSource.Key)"
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    $failures.Add("Missing preserved Entry 004 ImageGen RGB source: $($frozenSource.Key)")
    continue
  }
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourcePath).Hash.ToLowerInvariant()
  if ($actualHash -cne $frozenSource.Value) {
    $failures.Add("Preserved Entry 004 ImageGen RGB source changed: $($frozenSource.Key)")
  }
}

foreach ($pageStem in @('page-01', 'page-02', 'page-03', 'page-04', 'inside-front', 'inside-back')) {
  $entry004ProcessingReportPath = Join-Path $RepositoryRoot "assets\journal\004\source\$pageStem-processing.json"
  if (-not (Test-Path -LiteralPath $entry004ProcessingReportPath -PathType Leaf)) {
    $failures.Add("Missing Entry 004 $pageStem processing report")
  } else {
    try {
      $entry004ProcessingReport = [System.IO.File]::ReadAllText($entry004ProcessingReportPath) | ConvertFrom-Json
      if ($entry004ProcessingReport.source_mode -cne "RGB" -or
          $entry004ProcessingReport.output_mode -cne "RGBA" -or
          @($entry004ProcessingReport.output_size) -join "x" -cne "924x1534" -or
          $entry004ProcessingReport.paper_background_baked -ne $false) {
        $failures.Add("Entry 004 $pageStem processing report does not describe the required RGB-to-transparent production workflow")
      }
    } catch {
      $failures.Add("Entry 004 $pageStem processing report is not valid JSON")
    }
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
  if ($page -notmatch '<script src="\.\./journal-manifest\.js(?:\?[^\"]+)?"></script>\s*<script src="\.\./journal-viewer\.js"></script>') {
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
            if ($assetPath -notmatch ('^\.\./\.\./assets/journal/{0}/{1}\.(?:png|webp|jpe?g|avif)(?:\?[^\"]+)?$' -f $number, $expectedStem)) {
              $failures.Add("Manifest entry $number has an invalid optional asset path: $assetPath")
            }
          }
        }
      }

      $seenPagePaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
      foreach ($pageImage in @($manifestEntry.pages)) {
        if ($pageImage -notmatch ('^\.\./\.\./assets/journal/{0}/(?:artwork/)?page-\d+\.(?:png|webp|jpe?g|avif)(?:\?[^\"]+)?$' -f $number)) {
          $failures.Add("Manifest entry $number has an invalid page-image path: $pageImage")
          continue
        }
        if (-not $seenPagePaths.Add($pageImage)) {
          $failures.Add("Manifest entry $number repeats page-image path: $pageImage")
        }
        $pageImagePath = $pageImage -replace '\?.*$', ''
        $resolvedPageImage = [System.IO.Path]::GetFullPath((Join-Path (Join-Path $journalDirectory $number) $pageImagePath.Replace('/', '\')))
        if (-not (Test-Path -LiteralPath $resolvedPageImage -PathType Leaf)) {
          $failures.Add("Manifest entry $number references a missing page image: $pageImage")
        }
      }
    }
  }
}

if ($null -ne $manifest) {
  $expectedEntry001Pages = @(
    "../../assets/journal/001/artwork/page-01.png",
    "../../assets/journal/001/artwork/page-02.png",
    "../../assets/journal/001/artwork/page-03.png",
    "../../assets/journal/001/artwork/page-04.png"
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

  $expectedEntry002Pages = @(
    "../../assets/journal/002/artwork/page-01.png?v=20260828-2",
    "../../assets/journal/002/artwork/page-02.png?v=20260828-2",
    "../../assets/journal/002/artwork/page-03.png?v=20260828-2",
    "../../assets/journal/002/artwork/page-04.png?v=20260828-2"
  )
  $entry002Pages = @($manifest.entries.'002'.pages)
  if ($entry002Pages.Count -ne $expectedEntry002Pages.Count) {
    $failures.Add("Manifest entry 002 must contain its four frozen transparent artwork pages")
  } else {
    for ($index = 0; $index -lt $expectedEntry002Pages.Count; $index++) {
      if ($entry002Pages[$index] -cne $expectedEntry002Pages[$index]) {
        $failures.Add("Manifest entry 002 page order differs at position $($index + 1)")
        break
      }
    }
  }

  $expectedEntry003Pages = @(
    "../../assets/journal/003/artwork/page-01.png",
    "../../assets/journal/003/artwork/page-02.png",
    "../../assets/journal/003/artwork/page-03.png",
    "../../assets/journal/003/artwork/page-04.png"
  )
  $entry003Pages = @($manifest.entries.'003'.pages)
  if ($entry003Pages.Count -ne $expectedEntry003Pages.Count) {
    $failures.Add("Manifest entry 003 must contain Pages 1, 2, 3, and 4 only")
  } else {
    for ($index = 0; $index -lt $expectedEntry003Pages.Count; $index++) {
      if ($entry003Pages[$index] -cne $expectedEntry003Pages[$index]) {
        $failures.Add("Manifest entry 003 page order differs at position $($index + 1)")
        break
      }
    }
  }

  if ($manifest.entries.'003'.assets.insideFront -cne "../../assets/journal/003/inside-front.png") {
    $failures.Add("Manifest entry 003 must use the approved inside-front companion")
  }
  if ($manifest.entries.'003'.assets.insideBack -cne "../../assets/journal/003/inside-back.png") {
    $failures.Add("Manifest entry 003 must use the approved inside-back companion")
  }

  if ($manifest.entries.'004'.assets.insideFront -cne "../../assets/journal/004/inside-front.png") {
    $failures.Add("Manifest entry 004 must use the approved inside-front companion")
  }
  if ($manifest.entries.'004'.assets.insideBack -cne "../../assets/journal/004/inside-back.png") {
    $failures.Add("Manifest entry 004 must use the approved inside-back companion")
  }

  $expectedEntry004Pages = @(
    "../../assets/journal/004/artwork/page-01.png",
    "../../assets/journal/004/artwork/page-02.png",
    "../../assets/journal/004/artwork/page-03.png",
    "../../assets/journal/004/artwork/page-04.png"
  )
  $entry004Pages = @($manifest.entries.'004'.pages)
  if ($entry004Pages.Count -ne $expectedEntry004Pages.Count) {
    $failures.Add("Manifest entry 004 must contain Pages 1, 2, 3, and 4 only")
  } else {
    for ($index = 0; $index -lt $expectedEntry004Pages.Count; $index++) {
      if ($entry004Pages[$index] -cne $expectedEntry004Pages[$index]) {
        $failures.Add("Manifest entry 004 page order differs at position $($index + 1)")
        break
      }
    }
  }

  foreach ($fallbackNumber in @('005')) {
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

Write-Output "Journal checks passed: locked Entries 001-003, Entry 004 Pages 1-4 and two RGB-to-transparent companion artworks, shared resting/curl paper material, layered page edges, matte cover/endleafs, endpoint-matched curl settling, scroll-stable state history, turnaround loops, keyboard and reduced-motion support, sequential mobile paging, 5 exact Markdown fallbacks, 6 routes, and explicit local links."
