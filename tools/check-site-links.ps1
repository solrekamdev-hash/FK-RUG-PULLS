param(
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$repositoryPath = [System.IO.Path]::GetFullPath($RepositoryRoot).TrimEnd(
  [System.IO.Path]::DirectorySeparatorChar,
  [System.IO.Path]::AltDirectorySeparatorChar
)
$repositoryPrefix = $repositoryPath + [System.IO.Path]::DirectorySeparatorChar
$repositoryUri = [System.Uri]($repositoryPrefix)
$htmlFiles = @(Get-ChildItem -LiteralPath $repositoryPath -Recurse -File -Filter "*.html" | Sort-Object FullName)
$failures = [System.Collections.Generic.List[string]]::new()
$anchorCache = @{}
$checkedUrls = 0

function Add-Failure([string]$PagePath, [int]$LineNumber, [string]$Attribute, [string]$Url, [string]$Reason) {
  $relativePage = [System.Uri]::UnescapeDataString($repositoryUri.MakeRelativeUri([System.Uri]$PagePath).ToString())
  $failures.Add("${relativePage}:${LineNumber} $Attribute=`"$Url`" $Reason")
}

function Get-LineNumber([string]$Content, [int]$Index) {
  if ($Index -eq 0) { return 1 }
  return ([regex]::Matches($Content.Substring(0, $Index), "`n").Count + 1)
}

function Get-PageAnchors([string]$Path) {
  if (-not $anchorCache.ContainsKey($Path)) {
    $content = [System.IO.File]::ReadAllText($Path)
    $anchors = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    $matches = [regex]::Matches(
      $content,
      '\b(?:id|name)\s*=\s*(["''])(?<anchor>.*?)\1',
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    foreach ($match in $matches) {
      [void]$anchors.Add([System.Net.WebUtility]::HtmlDecode($match.Groups["anchor"].Value))
    }
    $anchorCache[$Path] = $anchors
  }
  return $anchorCache[$Path]
}

if ($htmlFiles.Count -eq 0) {
  $failures.Add("No generated HTML files found under the repository root")
}

foreach ($htmlFile in $htmlFiles) {
  $content = [System.IO.File]::ReadAllText($htmlFile.FullName)
  $urlMatches = [regex]::Matches(
    $content,
    '\b(?<attribute>href|src)\s*=\s*(?:"(?<double>[^\"]*)"|''(?<single>[^'']*)''|(?<bare>[^\s>]+))',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )

  foreach ($match in $urlMatches) {
    $attribute = $match.Groups["attribute"].Value.ToLowerInvariant()
    $urlValue = if ($match.Groups["double"].Success) {
      $match.Groups["double"].Value
    } elseif ($match.Groups["single"].Success) {
      $match.Groups["single"].Value
    } else {
      $match.Groups["bare"].Value
    }
    $url = [System.Net.WebUtility]::HtmlDecode($urlValue).Trim()
    $lineNumber = Get-LineNumber $content $match.Index

    if ([string]::IsNullOrWhiteSpace($url)) {
      Add-Failure $htmlFile.FullName $lineNumber $attribute $url "is empty"
      continue
    }

    if ($url -match '^(?:file:|[A-Za-z]:[\\/])') {
      Add-Failure $htmlFile.FullName $lineNumber $attribute $url "must be repository-relative, not a local absolute path"
      continue
    }

    if ($url -match '^[A-Za-z][A-Za-z0-9+.-]*:') {
      continue
    }

    $checkedUrls++

    if ($url.StartsWith('/') -or $url.StartsWith('\')) {
      Add-Failure $htmlFile.FullName $lineNumber $attribute $url "must not start at a filesystem or domain root"
      continue
    }

    $pathPart = ($url -split '[?#]', 2)[0]
    $fragment = $null
    $fragmentMarker = $url.IndexOf('#')
    if ($fragmentMarker -ge 0) {
      $fragment = $url.Substring($fragmentMarker + 1)
      $queryMarker = $fragment.IndexOf('?')
      if ($queryMarker -ge 0) { $fragment = $fragment.Substring(0, $queryMarker) }
    }

    if ($pathPart.Contains('\')) {
      Add-Failure $htmlFile.FullName $lineNumber $attribute $url "uses a Windows path separator instead of a URL slash"
      continue
    }

    try {
      $decodedPath = [System.Uri]::UnescapeDataString($pathPart)
      $targetPath = if ([string]::IsNullOrEmpty($decodedPath)) {
        $htmlFile.FullName
      } else {
        $platformPath = $decodedPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        [System.IO.Path]::GetFullPath((Join-Path $htmlFile.DirectoryName $platformPath))
      }
    } catch {
      Add-Failure $htmlFile.FullName $lineNumber $attribute $url "cannot be resolved as a local path"
      continue
    }

    if ($targetPath -ne $repositoryPath -and -not $targetPath.StartsWith($repositoryPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      Add-Failure $htmlFile.FullName $lineNumber $attribute $url "resolves outside the repository"
      continue
    }

    $directoryOnly = -not [string]::IsNullOrEmpty($pathPart) -and (
      $pathPart.EndsWith('/') -or (Test-Path -LiteralPath $targetPath -PathType Container)
    )
    if ($directoryOnly) {
      Add-Failure $htmlFile.FullName $lineNumber $attribute $url "is directory-only; link an explicit file such as index.html"
      continue
    }

    if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
      Add-Failure $htmlFile.FullName $lineNumber $attribute $url "does not resolve to an existing repository file"
      continue
    }

    if (-not [string]::IsNullOrEmpty($fragment) -and [System.IO.Path]::GetExtension($targetPath) -ieq ".html") {
      try {
        $decodedFragment = [System.Uri]::UnescapeDataString($fragment)
      } catch {
        Add-Failure $htmlFile.FullName $lineNumber $attribute $url "contains an invalid fragment"
        continue
      }
      $anchors = Get-PageAnchors $targetPath
      if (-not $anchors.Contains($decodedFragment)) {
        Add-Failure $htmlFile.FullName $lineNumber $attribute $url "points to a missing HTML anchor"
      }
    }
  }
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ -ErrorAction Continue }
  exit 1
}

Write-Output "Site link checks passed: $($htmlFiles.Count) HTML files and $checkedUrls internal href/src URLs resolve to explicit files inside the repository."
