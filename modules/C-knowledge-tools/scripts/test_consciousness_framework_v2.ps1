param(
    [string]$V2Dir = "artifacts\consciousness-intensity\knowledge-pack\framework-v2",
    [string]$DeepDir = "artifacts\consciousness-intensity\knowledge-pack\framework-deep",
    [string]$CorpusDir = "artifacts\consciousness-intensity\corpus"
)

$ErrorActionPreference = "Stop"

$v2Path = Join-Path $V2Dir "framework_v2.json"
$overviewPath = Join-Path $V2Dir "FRAMEWORK_V2_OVERVIEW.md"
$essencePath = Join-Path $V2Dir "ESSENCE_CONCEPTS.md"
$gapsPath = Join-Path $V2Dir "PAGE_CITED_GAPS.md"
$reportPath = Join-Path $V2Dir "FIDELITY_REPORT.md"
$deepTreePath = Join-Path $DeepDir "concept_tree.json"
$upperPagesPath = Join-Path $CorpusDir "volume-upper\pages.jsonl"
$lowerPagesPath = Join-Path $CorpusDir "volume-lower\pages.jsonl"

foreach ($path in @($v2Path, $overviewPath, $essencePath, $gapsPath, $reportPath, $deepTreePath, $upperPagesPath, $lowerPagesPath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $path"
    }
}

$v2 = Get-Content -Raw -LiteralPath $v2Path | ConvertFrom-Json
$deepTree = Get-Content -Raw -LiteralPath $deepTreePath | ConvertFrom-Json

if (-not $v2.root -or [string]::IsNullOrWhiteSpace($v2.root.id)) {
    throw "Missing v2 root id"
}

$essences = @($v2.chapter_essences)
$relations = @($v2.relations)
$gaps = @($v2.page_cited_gaps)

if ($essences.Count -ne 9) {
    throw "Expected 9 chapter essences, got $($essences.Count)"
}
if ($relations.Count -ne 53) {
    throw "Expected 53 v2 relations, got $($relations.Count)"
}
if ($gaps.Count -lt 5) {
    throw "Expected at least 5 page-cited gaps, got $($gaps.Count)"
}

$seenChapters = @{}
foreach ($essence in $essences) {
    foreach ($field in @("id", "chapter_id", "title", "definition", "source_frame", "synthesis_basis", "evidence_level")) {
        if ([string]::IsNullOrWhiteSpace([string]$essence.$field)) {
            throw "Essence missing $field"
        }
    }
    if ($essence.source_frame -notin @("stated", "inferred")) {
        throw "Invalid essence source_frame: $($essence.id)"
    }
    if ($seenChapters.ContainsKey($essence.chapter_id)) {
        throw "Duplicate chapter essence for chapter $($essence.chapter_id)"
    }
    $seenChapters[$essence.chapter_id] = $true
    if (@($essence.sources).Count -lt 2) {
        throw "Essence needs at least two sources: $($essence.id)"
    }
    foreach ($source in @($essence.sources)) {
        if ([string]::IsNullOrWhiteSpace([string]$source.volume)) {
            throw "Essence source missing volume: $($essence.id)"
        }
        if (-not $source.pdf_page) {
            throw "Essence source missing pdf_page: $($essence.id)"
        }
        if ([string]::IsNullOrWhiteSpace([string]$source.snippet)) {
            throw "Essence source missing snippet: $($essence.id)"
        }
    }
    if (@($essence.usable_as).Count -eq 0) {
        throw "Essence missing usable_as: $($essence.id)"
    }
    if (@($essence.avoid).Count -eq 0) {
        throw "Essence missing avoid: $($essence.id)"
    }
}

$knownIds = New-Object "System.Collections.Generic.HashSet[string]"
[void]$knownIds.Add([string]$v2.root.id)
foreach ($essence in $essences) {
    [void]$knownIds.Add([string]$essence.id)
}
foreach ($node in @($deepTree.nodes)) {
    [void]$knownIds.Add([string]$node.id)
}

foreach ($relation in $relations) {
    foreach ($field in @("id", "from", "to", "relation", "source_frame")) {
        if ([string]::IsNullOrWhiteSpace([string]$relation.$field)) {
            throw "Relation missing $field"
        }
    }
    if (-not $knownIds.Contains([string]$relation.from)) {
        throw "Relation references unknown from id: $($relation.id) -> $($relation.from)"
    }
    if (-not $knownIds.Contains([string]$relation.to)) {
        throw "Relation references unknown to id: $($relation.id) -> $($relation.to)"
    }
    if ($relation.source_frame -notin @("stated", "inferred")) {
        throw "Invalid relation source_frame: $($relation.id)"
    }
    if (@($relation.sources).Count -eq 0) {
        throw "Relation missing sources: $($relation.id)"
    }
}

foreach ($gap in $gaps) {
    foreach ($field in @("id", "title", "why_it_matters", "do_not_fill_with")) {
        if ([string]::IsNullOrWhiteSpace([string]$gap.$field)) {
            throw "Gap missing $field"
        }
    }
    if (@($gap.sources).Count -eq 0) {
        throw "Gap missing sources: $($gap.id)"
    }
}

if ([int]$v2.metrics.source_reference_count -le 0) {
    throw "Missing or invalid metrics.source_reference_count"
}

$report = Get-Content -Raw -LiteralPath $reportPath
foreach ($required in @("不代表科学结论", "不是模型权重学习", "不能证明产品需求")) {
    if ($report -notmatch [regex]::Escape($required)) {
        throw "Fidelity report missing boundary: $required"
    }
}

$pageTextByKey = @{}
foreach ($volume in @("volume-upper", "volume-lower")) {
    $path = Join-Path $CorpusDir "$volume\pages.jsonl"
    foreach ($line in Get-Content -LiteralPath $path) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }
        $page = $line | ConvertFrom-Json
        $pageTextByKey["$volume|$($page.page)"] = [string]$page.text
    }
}

function Normalize-SourceText {
    param([string]$Text)
    if ($null -eq $Text) {
        return ""
    }
    return (($Text -replace "[\s　]+", "") -replace "[，。；：:、（）()《》“”`"'·,.;!?！？\[\]【】/\\-]", "")
}

function Assert-SourceSnippetOnPage {
    param(
        [string]$Owner,
        [object]$Source
    )
    $key = "$($Source.volume)|$($Source.pdf_page)"
    if (-not $pageTextByKey.ContainsKey($key)) {
        throw "Source references missing corpus page: $Owner -> $key"
    }
    $needleParts = @()
    foreach ($part in ([string]$Source.snippet -split "\.\.\.|…")) {
        $normalized = Normalize-SourceText $part
        if ($normalized.Length -gt 0) {
            $needleParts += $normalized
        }
    }
    if ($needleParts.Count -eq 0) {
        throw "Source has empty snippet after normalization: $Owner -> $key"
    }
    $pageText = Normalize-SourceText $pageTextByKey[$key]
    foreach ($part in $needleParts) {
        if (-not $pageText.Contains($part)) {
            throw "Source snippet not found on cited page: $Owner -> $key -> $($Source.snippet)"
        }
    }
}

$sourceCheckCount = 0
foreach ($source in @($v2.root.sources)) {
    Assert-SourceSnippetOnPage "root" $source
    $sourceCheckCount += 1
}
foreach ($essence in $essences) {
    foreach ($source in @($essence.sources)) {
        Assert-SourceSnippetOnPage $essence.id $source
        $sourceCheckCount += 1
    }
}
foreach ($relation in $relations) {
    foreach ($source in @($relation.sources)) {
        Assert-SourceSnippetOnPage $relation.id $source
        $sourceCheckCount += 1
    }
}
foreach ($gap in $gaps) {
    foreach ($source in @($gap.sources)) {
        Assert-SourceSnippetOnPage $gap.id $source
        $sourceCheckCount += 1
    }
}

if ($sourceCheckCount -ne [int]$v2.metrics.source_reference_count) {
    throw "source_reference_count mismatch: metric=$($v2.metrics.source_reference_count), checked=$sourceCheckCount"
}

Write-Output "framework_v2_valid=true"
Write-Output "chapter_essences=$($essences.Count)"
Write-Output "relations=$($relations.Count)"
Write-Output "page_cited_gaps=$($gaps.Count)"
Write-Output "deep_records_referenced=$($v2.inputs.deep_records)"
Write-Output "source_snippets_same_page=$sourceCheckCount"
