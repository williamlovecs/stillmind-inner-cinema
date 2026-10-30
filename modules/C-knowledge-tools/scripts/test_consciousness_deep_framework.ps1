param(
    [string]$DeepDir = "artifacts\consciousness-intensity\knowledge-pack\framework-deep"
)

$ErrorActionPreference = "Stop"

$treePath = Join-Path $DeepDir "concept_tree.json"
$relationsPath = Join-Path $DeepDir "RELATIONS.json"
$gapsPath = Join-Path $DeepDir "CONTRADICTIONS_AND_GAPS.md"
$reportPath = Join-Path $DeepDir "FIDELITY_REPORT.md"

foreach ($path in @($treePath, $relationsPath, $gapsPath, $reportPath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $path"
    }
}

$tree = Get-Content -Raw -LiteralPath $treePath | ConvertFrom-Json
$relations = Get-Content -Raw -LiteralPath $relationsPath | ConvertFrom-Json

if ([int]$tree.coverage.input_records -ne 5581) {
    throw "Unexpected input record count: $($tree.coverage.input_records)"
}
if ([int]$tree.coverage.assigned_records -ne 5581) {
    throw "Unexpected assigned record count: $($tree.coverage.assigned_records)"
}
if ([int]$tree.coverage.unassigned_records -ne 0) {
    throw "Unassigned records should be zero"
}

$nodeIds = @{}
foreach ($node in @($tree.nodes)) {
    if ([string]::IsNullOrWhiteSpace($node.id)) {
        throw "Node missing id"
    }
    if ($nodeIds.ContainsKey($node.id)) {
        throw "Duplicate node id: $($node.id)"
    }
    $nodeIds[$node.id] = $true
    if (-not $node.sources -or @($node.sources).Count -eq 0) {
        throw "Node missing sources: $($node.id)"
    }
}

foreach ($edge in @($relations.relations)) {
    if ([string]::IsNullOrWhiteSpace($edge.id)) {
        throw "Relation missing id"
    }
    if (-not $nodeIds.ContainsKey($edge.from)) {
        throw "Relation references missing from node: $($edge.id)"
    }
    if (-not $nodeIds.ContainsKey($edge.to)) {
        throw "Relation references missing to node: $($edge.id)"
    }
    if ($edge.source_frame -notin @("stated", "inferred")) {
        throw "Invalid relation source_frame: $($edge.id)"
    }
    if (-not $edge.sources -or @($edge.sources).Count -eq 0) {
        throw "Relation missing sources: $($edge.id)"
    }
}

$gaps = Get-Content -Raw -LiteralPath $gapsPath
foreach ($required in @("科学/神经语言", "灵修本体论", "百分比", "九区域", "碎片记录", "产品化空白")) {
    if ($gaps -notmatch [regex]::Escape($required)) {
        throw "Gaps report missing required section marker: $required"
    }
}

$stated = @($relations.relations | Where-Object { $_.source_frame -eq "stated" }).Count
$inferred = @($relations.relations | Where-Object { $_.source_frame -eq "inferred" }).Count
if ($stated -ne [int]$relations.stated_relation_count) {
    throw "Stated relation count mismatch"
}
if ($inferred -ne [int]$relations.inferred_relation_count) {
    throw "Inferred relation count mismatch"
}

Write-Output "deep_framework_valid=true"
Write-Output "records=$($tree.coverage.input_records)"
Write-Output "assigned=$($tree.coverage.assigned_records)"
Write-Output "nodes=$(@($tree.nodes).Count)"
Write-Output "relations=$(@($relations.relations).Count)"
Write-Output "stated_relations=$stated"
Write-Output "inferred_relations=$inferred"
