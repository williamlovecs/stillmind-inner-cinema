param(
    [string]$FrameworkPath = "artifacts\consciousness-intensity\knowledge-pack\framework\framework.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $FrameworkPath)) {
    throw "Framework file not found: $FrameworkPath"
}

$framework = Get-Content -Raw -LiteralPath $FrameworkPath | ConvertFrom-Json

if ($framework.status_statement_zh -ne "本框架是基于《意识强度》体系的结构化综合，未验证产品需求；不代表科学结论。") {
    throw "Missing or changed status statement"
}

$nodes = @($framework.nodes)
$edges = @($framework.edges)
$phases = @($framework.structure)

if ($nodes.Count -ne [int]$framework.fidelity_metrics.node_count) {
    throw "Node count mismatch: actual=$($nodes.Count) metrics=$($framework.fidelity_metrics.node_count)"
}

if ($edges.Count -ne [int]$framework.fidelity_metrics.edge_count) {
    throw "Edge count mismatch: actual=$($edges.Count) metrics=$($framework.fidelity_metrics.edge_count)"
}

if ($phases.Count -ne [int]$framework.fidelity_metrics.structure_phase_count) {
    throw "Structure phase count mismatch: actual=$($phases.Count) metrics=$($framework.fidelity_metrics.structure_phase_count)"
}

$nodeIds = @{}
foreach ($node in $nodes) {
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
    foreach ($source in @($node.sources)) {
        if ([string]::IsNullOrWhiteSpace($source.volume) -or -not $source.pdf_page -or [string]::IsNullOrWhiteSpace($source.snippet)) {
            throw "Node source incomplete: $($node.id)"
        }
    }
}

$edgeIds = @{}
foreach ($edge in $edges) {
    if ([string]::IsNullOrWhiteSpace($edge.id)) {
        throw "Edge missing id"
    }
    if ($edgeIds.ContainsKey($edge.id)) {
        throw "Duplicate edge id: $($edge.id)"
    }
    $edgeIds[$edge.id] = $true
    if (-not $nodeIds.ContainsKey($edge.from)) {
        throw "Edge from missing node: $($edge.id) -> $($edge.from)"
    }
    if (-not $nodeIds.ContainsKey($edge.to)) {
        throw "Edge to missing node: $($edge.id) -> $($edge.to)"
    }
    if ($edge.source_frame -notin @("stated", "inferred")) {
        throw "Invalid edge source_frame: $($edge.id)"
    }
    if (-not $edge.sources -or @($edge.sources).Count -eq 0) {
        throw "Edge missing sources: $($edge.id)"
    }
    foreach ($source in @($edge.sources)) {
        if ([string]::IsNullOrWhiteSpace($source.volume) -or -not $source.pdf_page -or [string]::IsNullOrWhiteSpace($source.snippet)) {
            throw "Edge source incomplete: $($edge.id)"
        }
    }
}

$inferredEdges = @($edges | Where-Object { $_.source_frame -eq "inferred" }).Count
$statedEdges = @($edges | Where-Object { $_.source_frame -eq "stated" }).Count
if ($inferredEdges -ne [int]$framework.fidelity_metrics.inferred_edges) {
    throw "Inferred edge count mismatch"
}
if ($statedEdges -ne [int]$framework.fidelity_metrics.stated_edges) {
    throw "Stated edge count mismatch"
}

foreach ($phase in $phases) {
    if ($phase.source_frame -ne "inferred") {
        throw "Structure phase must be inferred: $($phase.phase)"
    }
    if (-not $phase.sources -or @($phase.sources).Count -eq 0) {
        throw "Structure phase missing sources: $($phase.phase)"
    }
}

Write-Output "framework_valid=true"
Write-Output "nodes=$($nodes.Count)"
Write-Output "edges=$($edges.Count)"
Write-Output "structure_phases=$($phases.Count)"
Write-Output "stated_edges=$statedEdges"
Write-Output "inferred_edges=$inferredEdges"
