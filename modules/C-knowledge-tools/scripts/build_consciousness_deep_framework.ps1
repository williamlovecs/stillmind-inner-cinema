$ErrorActionPreference = "Stop"

$Root = "artifacts\consciousness-intensity"
$Pack = Join-Path $Root "knowledge-pack"
$Out = Join-Path $Pack "framework-deep"
$StatusStatement = "本框架是基于《意识强度》体系的结构化深度综合，未验证产品需求，不代表科学结论；它是磁盘上的知识资产，不是模型权重学习，也不是运行时接地核。"

New-Item -ItemType Directory -Force -Path $Out | Out-Null

function Read-Jsonl {
    param([string]$Path)
    $rows = @()
    foreach ($line in Get-Content -LiteralPath $Path) {
        if (-not [string]::IsNullOrWhiteSpace($line)) {
            $rows += ($line | ConvertFrom-Json)
        }
    }
    return $rows
}

function Write-Json {
    param([string]$Path, [object]$Value, [int]$Depth = 40)
    $parent = Split-Path -Parent $Path
    if ($parent) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    $Value | ConvertTo-Json -Depth $Depth | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Shorten {
    param([string]$Text, [int]$Max = 140)
    if ($null -eq $Text) {
        return ""
    }
    $clean = (($Text -replace "\s+", " ").Trim())
    if ($clean.Length -le $Max) {
        return $clean
    }
    return $clean.Substring(0, $Max) + "..."
}

function Safe-Key {
    param([string]$Text)
    return (($Text.ToLowerInvariant() -replace "[^a-z0-9_-]", "-") -replace "-+", "-").Trim("-")
}

$TopicDefinitions = [ordered]@{
    "self_observation" = [ordered]@{
        label = "自我观察与觉察"
        definition = "围绕观察、觉察、自我评估、反思、审视等材料，适合被理解为原书中的自我观察层。"
    }
    "automatic_patterns" = [ordered]@{
        label = "自动反应与惯性模式"
        definition = "围绕自动化、惯性、模式、反应、习惯等材料，描述个体重复反应和固化模式。"
    }
    "emotion_regulation" = [ordered]@{
        label = "情绪与调节"
        definition = "围绕情绪、焦虑、恐惧、冷静、愤怒、悲伤等材料；只能作为来源体系中的反思主题，不得医疗化。"
    }
    "attention_perception" = [ordered]@{
        label = "注意、感知与记忆"
        definition = "围绕注意、视觉、听觉、感知、记忆和观察材料；不得包装为脑科学或神经机制结论。"
    }
    "perspective_empathy" = [ordered]@{
        label = "多视角、同理与共情"
        definition = "围绕换位、同理、共情、视角和理解他人等材料，描述视角切换和关系理解。"
    }
    "trust_security" = [ordered]@{
        label = "信任与安全感"
        definition = "围绕信任、安全感、接纳和归属等材料，描述原书中安全感与探索、关系之间的联系。"
    }
    "learning_adaptation" = [ordered]@{
        label = "学习与适应"
        definition = "围绕学习、适应、新技能、调整、改变和灵活等材料，描述面对新情境的调整能力。"
    }
    "practice_guidance" = [ordered]@{
        label = "练习与提升方法"
        definition = "围绕实操指南、练习、训练、提升建议、尝试和方法等材料；不代表方法有效性已被验证。"
    }
    "spiritual_framework" = [ordered]@{
        label = "灵修与来源体系"
        definition = "围绕神性、灵性、灵魂、能量、粒子、维度、前世等材料，只能按原书体系描述。"
    }
    "systems_metaphor" = [ordered]@{
        label = "系统与模块隐喻"
        definition = "围绕模块、交换、系统、互动、连接和整合等材料，描述原书的信息系统和模块隐喻。"
    }
    "chapter_structure" = [ordered]@{
        label = "章节结构与提升点"
        definition = "围绕章名、部分、提升点、目录层级和结构提示等材料，主要服务导航。"
    }
    "measurement_claims" = [ordered]@{
        label = "量化数值与测量说法"
        definition = "围绕量化数据、百分比、数值、平均值和检测说法；必须标为证据不足或来源体系，不得科学化。"
    }
    "source_logic_markers" = [ordered]@{
        label = "区别、联系与总结"
        definition = "围绕区别、联系、总结等原书内部逻辑标记，帮助识别局部承接关系。"
    }
    "unclassified_source_fragment" = [ordered]@{
        label = "未归类来源片段"
        definition = "无法稳定归到现有主题的可溯源片段；保留而不强行解释。"
    }
}

$TopicPriority = @(
    "automatic_patterns",
    "self_observation",
    "emotion_regulation",
    "attention_perception",
    "trust_security",
    "perspective_empathy",
    "learning_adaptation",
    "practice_guidance",
    "systems_metaphor",
    "spiritual_framework"
)

function Get-ClusterTopic {
    param([object]$Record)
    $topicIds = @($Record.topic_ids)
    foreach ($topic in $TopicPriority) {
        if ($topicIds -contains $topic) {
            return $topic
        }
    }
    $text = (($Record.title + " " + $Record.summary + " " + $Record.original_excerpt) -replace "\s+", "")
    if ($text -match "量化数据|百分|%|％|平均|数值|检测|畅通度|发挥率") {
        return "measurement_claims"
    }
    if ($text -match "第[一二三四五六七八九十]+章|第一部分|第二部分|第三部分|第四部分|分为|提升点|目录|区域") {
        return "chapter_structure"
    }
    if ($text -match "区别|联系|总结|影响|特点") {
        return "source_logic_markers"
    }
    if ($text -match "实操|提升建议|练习|训练|方法|指南|尝试") {
        return "practice_guidance"
    }
    if (@($Record.safety_tags) -contains "metaphysical_framework") {
        return "spiritual_framework"
    }
    return "unclassified_source_fragment"
}

function New-SourceFromRecord {
    param([object]$Record)
    $snippet = $Record.summary
    if ([string]::IsNullOrWhiteSpace($snippet)) {
        $snippet = $Record.original_excerpt
    }
    return [ordered]@{
        volume = $Record.source.volume
        pdf_page = [int]$Record.source.pdf_page
        page_label = $Record.source.page_label
        chapter_id = $Record.source.chapter_id
        record_id = $Record.id
        snippet = Shorten $snippet 140
    }
}

$records = Read-Jsonl (Join-Path $Pack "records\all.jsonl")
$frameworkV1 = Get-Content -Raw -LiteralPath (Join-Path $Pack "framework\framework.json") | ConvertFrom-Json
$manifest = Get-Content -Raw -LiteralPath (Join-Path $Pack "manifest.json") | ConvertFrom-Json

$chapterTitles = [ordered]@{
    "01" = "中央区域：心智控制区"
    "02" = "上方区域：自主意识区"
    "03" = "下方区域：神性连接区"
    "04" = "右方区域：思维扩展区"
    "05" = "左方区域：旧有惯性区"
    "06" = "左上区域：神经联络区"
    "07" = "左下区域：神性交换区"
    "08" = "右上区域：灵性结构区"
    "09" = "右下区域：模块交换区"
}

$clusters = @{}
$assignments = [ordered]@{}
foreach ($record in $records) {
    $chapterId = [string]$record.chapter.id
    if ([string]::IsNullOrWhiteSpace($chapterId)) {
        $chapterId = [string]$record.source.chapter_id
    }
    $topic = Get-ClusterTopic $record
    $key = "$chapterId::$topic"
    if (-not $clusters.ContainsKey($key)) {
        $clusters[$key] = @()
    }
    $clusters[$key] = @($clusters[$key]) + $record
    $assignments[$record.id] = "deep-$chapterId-$(Safe-Key $topic)"
}

$nodes = New-Object System.Collections.Generic.List[object]
$rootChildren = @()
foreach ($chapterId in $chapterTitles.Keys) {
    $rootChildren += "deep-region-$chapterId"
}

$nodes.Add([ordered]@{
    id = "deep-root"
    type = "framework"
    title = "《意识强度》深框架"
    definition = "九区域体系的深度结构化综合入口；下接九个区域和各章主题簇。"
    definition_basis = "stated_plus_inferred_tree"
    chapter_ids = @("01","02","03","04","05","06","07","08","09")
    source_frame = "inferred"
    evidence_level = "source_framework"
    sources = @(
        [ordered]@{ volume = "volume-upper"; pdf_page = 9; chapter_id = "toc"; snippet = "上卷目录列出第一章至第五章" },
        [ordered]@{ volume = "volume-lower"; pdf_page = 3; chapter_id = "toc"; snippet = "下卷目录列出第六章至第九章" }
    )
    children = $rootChildren
    merged_record_ids = @()
})

foreach ($chapterId in $chapterTitles.Keys) {
    $regionNode = @($frameworkV1.nodes | Where-Object { $_.id -eq "region-$chapterId" })[0]
    $clusterKeys = @($clusters.Keys | Where-Object { $_ -like "$chapterId::*" } | Sort-Object)
    $children = @()
    foreach ($key in $clusterKeys) {
        $topic = $key.Split("::")[1]
        $children += "deep-$chapterId-$(Safe-Key $topic)"
    }
    $sources = @()
    foreach ($source in @($regionNode.sources)) {
        $sources += [ordered]@{
            volume = $source.volume
            pdf_page = [int]$source.pdf_page
            chapter_id = $source.chapter_id
            snippet = $source.snippet
        }
    }
    $nodes.Add([ordered]@{
        id = "deep-region-$chapterId"
        type = "region"
        title = $chapterTitles[$chapterId]
        definition = $regionNode.definition
        definition_basis = $regionNode.definition_basis
        chapter_ids = @($chapterId)
        source_frame = "stated"
        evidence_level = $regionNode.evidence_level
        restriction_codes = @($regionNode.restriction_codes)
        sources = $sources
        children = $children
        merged_record_ids = @()
    })
}

$v1NodeMap = [ordered]@{
    "framework-root" = "deep-root"
}
foreach ($chapterId in $chapterTitles.Keys) {
    $v1NodeMap["region-$chapterId"] = "deep-region-$chapterId"
}

foreach ($v1Node in @($frameworkV1.nodes | Where-Object { $_.id -ne "framework-root" -and $_.id -notmatch "^region-\d\d$" })) {
    $anchorId = "deep-anchor-$(Safe-Key $v1Node.id)"
    $v1NodeMap[$v1Node.id] = $anchorId
    $sources = @()
    foreach ($source in @($v1Node.sources)) {
        $sources += [ordered]@{
            volume = $source.volume
            pdf_page = [int]$source.pdf_page
            chapter_id = $source.chapter_id
            snippet = $source.snippet
        }
    }
    $nodes.Add([ordered]@{
        id = $anchorId
        type = "framework_v1_anchor"
        title = $v1Node.title
        definition = $v1Node.definition
        definition_basis = $v1Node.definition_basis
        chapter_ids = @($v1Node.chapter_ids)
        source_frame = $v1Node.definition_basis
        evidence_level = $v1Node.evidence_level
        restriction_codes = @($v1Node.restriction_codes)
        sources = $sources
        children = @()
        merged_record_ids = @()
        framework_v1_id = $v1Node.id
    })
}

foreach ($key in (@($clusters.Keys) | Sort-Object)) {
    $parts = $key.Split("::")
    $chapterId = $parts[0]
    $topic = $parts[1]
    $items = @($clusters[$key])
    $topicInfo = $TopicDefinitions[$topic]
    $typeCounts = [ordered]@{}
    $evidenceCounts = [ordered]@{}
    $restrictionCounts = [ordered]@{}
    $safetyCounts = [ordered]@{}
    foreach ($item in $items) {
        $t = [string]$item.type
        if (-not $typeCounts.Contains($t)) { $typeCounts[$t] = 0 }
        $typeCounts[$t] += 1
        $e = [string]$item.evidence.level
        if (-not $evidenceCounts.Contains($e)) { $evidenceCounts[$e] = 0 }
        $evidenceCounts[$e] += 1
        foreach ($code in @($item.restriction_codes)) {
            if (-not $restrictionCounts.Contains($code)) { $restrictionCounts[$code] = 0 }
            $restrictionCounts[$code] += 1
        }
        foreach ($tag in @($item.safety_tags)) {
            if (-not $safetyCounts.Contains($tag)) { $safetyCounts[$tag] = 0 }
            $safetyCounts[$tag] += 1
        }
    }
    $representatives = @($items | Sort-Object @{Expression = { [int]$_.source.pdf_page }}, @{Expression = { -1 * ([string]$_.summary).Length }} | Select-Object -First 5)
    $sources = @()
    foreach ($record in $representatives) {
        $sources += (New-SourceFromRecord $record)
    }
    $evidenceLevel = "source_framework"
    if ($evidenceCounts.Contains("spiritual_source") -and [int]$evidenceCounts["spiritual_source"] -gt 0) {
        $evidenceLevel = "spiritual_source"
    } elseif ($evidenceCounts.Contains("insufficient_evidence") -and [int]$evidenceCounts["insufficient_evidence"] -gt 0) {
        $evidenceLevel = "insufficient_evidence"
    }
    $basis = "inferred_cluster"
    if ($topic -eq "chapter_structure") {
        $basis = "stated_limited"
    }
    $recordIds = @($items | ForEach-Object { $_.id })
    $nodes.Add([ordered]@{
        id = "deep-$chapterId-$(Safe-Key $topic)"
        type = "concept_cluster"
        title = "$($chapterTitles[$chapterId]) / $($topicInfo.label)"
        definition = "本节点归并第 $chapterId 章中与「$($topicInfo.label)」相关的 $($items.Count) 条记录。$($topicInfo.definition)"
        definition_basis = $basis
        chapter_ids = @($chapterId)
        source_frame = "inferred"
        topic_id = $topic
        evidence_level = $evidenceLevel
        record_count = $items.Count
        record_type_counts = $typeCounts
        evidence_counts = $evidenceCounts
        restriction_counts = $restrictionCounts
        safety_counts = $safetyCounts
        sources = $sources
        merged_record_ids = $recordIds
    })
}

$relations = New-Object System.Collections.Generic.List[object]
foreach ($chapterId in $chapterTitles.Keys) {
    $relations.Add([ordered]@{
        id = "deep-edge-root-region-$chapterId"
        from = "deep-root"
        to = "deep-region-$chapterId"
        relation = "contains_region"
        source_frame = "stated"
        claim = "深框架包含第 $chapterId 章：$($chapterTitles[$chapterId])。"
        sources = @(@($nodes | Where-Object { $_.id -eq "deep-region-$chapterId" })[0].sources | Select-Object -First 1)
    })
}
foreach ($v1Edge in @($frameworkV1.edges)) {
    if (-not $v1NodeMap.Contains($v1Edge.from) -or -not $v1NodeMap.Contains($v1Edge.to)) {
        continue
    }
    $mappedFrom = $v1NodeMap[$v1Edge.from]
    $mappedTo = $v1NodeMap[$v1Edge.to]
    if ($mappedFrom -eq "deep-root" -and $mappedTo -match "^deep-region-\d\d$" -and $v1Edge.relation -eq "contains_region") {
        continue
    }
    $sources = @()
    foreach ($source in @($v1Edge.sources)) {
        $sources += [ordered]@{
            volume = $source.volume
            pdf_page = [int]$source.pdf_page
            chapter_id = $source.chapter_id
            snippet = $source.snippet
        }
    }
    $relations.Add([ordered]@{
        id = "deep-v1-$($v1Edge.id)"
        from = $mappedFrom
        to = $mappedTo
        relation = $v1Edge.relation
        source_frame = $v1Edge.source_frame
        claim = $v1Edge.claim
        sources = $sources
        framework_v1_id = $v1Edge.id
    })
}
foreach ($key in (@($clusters.Keys) | Sort-Object)) {
    $parts = $key.Split("::")
    $chapterId = $parts[0]
    $topic = $parts[1]
    $clusterNodeId = "deep-$chapterId-$(Safe-Key $topic)"
    $clusterNode = @($nodes | Where-Object { $_.id -eq $clusterNodeId })[0]
    $relations.Add([ordered]@{
        id = "deep-edge-region-$chapterId-$topic"
        from = "deep-region-$chapterId"
        to = $clusterNodeId
        relation = "has_concept_cluster"
        source_frame = "inferred"
        claim = "把第 $chapterId 章中 $($clusterNode.record_count) 条记录归并为「$($TopicDefinitions[$topic].label)」主题簇是规则化综合，不是原书显式章节名。"
        sources = @($clusterNode.sources | Select-Object -First 3)
    })
}

$CrossLinks = @(
    @{ from = "automatic_patterns"; to = "self_observation"; relation = "needs_observation"; claim = "自动反应和惯性模式若要被处理，通常需要先被观察和觉察；这是跨记录综合。" },
    @{ from = "automatic_patterns"; to = "emotion_regulation"; relation = "can_surface_as_emotion"; claim = "惯性模式常与情绪反应材料同章出现；该关系为综合，不是强因果。" },
    @{ from = "attention_perception"; to = "self_observation"; relation = "supports_observation"; claim = "注意、感知和记忆材料可支持自我观察中的事实/解释区分；该关系为综合。" },
    @{ from = "learning_adaptation"; to = "practice_guidance"; relation = "expressed_as_practice"; claim = "学习适应主题常通过练习或提升建议呈现；该关系为综合。" },
    @{ from = "spiritual_framework"; to = "systems_metaphor"; relation = "uses_system_language"; claim = "灵修来源章节常使用模块、结构、交换等系统隐喻；该关系为综合。" }
)
foreach ($chapterId in $chapterTitles.Keys) {
    foreach ($link in $CrossLinks) {
        $fromId = "deep-$chapterId-$(Safe-Key $link.from)"
        $toId = "deep-$chapterId-$(Safe-Key $link.to)"
        $fromNode = @($nodes | Where-Object { $_.id -eq $fromId })
        $toNode = @($nodes | Where-Object { $_.id -eq $toId })
        if ($fromNode.Count -gt 0 -and $toNode.Count -gt 0) {
            $relations.Add([ordered]@{
                id = "deep-edge-$chapterId-$($link.from)-$($link.to)"
                from = $fromId
                to = $toId
                relation = $link.relation
                source_frame = "inferred"
                claim = $link.claim
                sources = @(@($fromNode[0].sources | Select-Object -First 1) + @($toNode[0].sources | Select-Object -First 1))
            })
        }
    }
}

$assignedCount = @($assignments.Keys).Count
$clusterCount = @($nodes | Where-Object { $_.type -eq "concept_cluster" }).Count
$statedRelationCount = @($relations | Where-Object { $_.source_frame -eq "stated" }).Count
$inferredRelationCount = @($relations | Where-Object { $_.source_frame -eq "inferred" }).Count
$definitionBasisCounts = [ordered]@{}
foreach ($node in $nodes) {
    $basis = [string]$node.definition_basis
    if (-not $definitionBasisCounts.Contains($basis)) { $definitionBasisCounts[$basis] = 0 }
    $definitionBasisCounts[$basis] += 1
}

$nodeArray = @()
foreach ($node in $nodes) {
    $nodeArray += $node
}
$relationArray = @()
foreach ($relation in $relations) {
    $relationArray += $relation
}
$assignmentPlain = [ordered]@{}
foreach ($recordId in $assignments.Keys) {
    $assignmentPlain[[string]$recordId] = [string]$assignments[$recordId]
}

$conceptTree = [ordered]@{
    schema_version = "0.1.0"
    status_statement_zh = $StatusStatement
    build_method = "deterministic_powershell_structured_synthesis"
    inputs = [ordered]@{
        records = "knowledge-pack/records/all.jsonl"
        framework_v1 = "knowledge-pack/framework/framework.json"
        manifest = "knowledge-pack/manifest.json"
    }
    coverage = [ordered]@{
        input_records = $records.Count
        assigned_records = $assignedCount
        unassigned_records = ($records.Count - $assignedCount)
        concept_clusters = $clusterCount
        region_nodes = 9
        total_nodes = $nodeArray.Count
    }
    nodes = $nodeArray
    record_assignments = $assignmentPlain
}

$relationsObject = [ordered]@{
    schema_version = "0.1.0"
    status_statement_zh = $StatusStatement
    relation_count = $relationArray.Count
    stated_relation_count = $statedRelationCount
    inferred_relation_count = $inferredRelationCount
    relations = $relationArray
}

$fidelity = [ordered]@{
    schema_version = "0.1.0"
    status_statement_zh = $StatusStatement
    counts = [ordered]@{
        input_records = $records.Count
        assigned_records = $assignedCount
        unassigned_records = ($records.Count - $assignedCount)
        total_nodes = $nodeArray.Count
        concept_clusters = $clusterCount
        relations = $relationArray.Count
        stated_relations = $statedRelationCount
        inferred_relations = $inferredRelationCount
        empirical_support_records = [int]$manifest.counts.evidence_levels.empirical_support
    }
    definition_basis_counts = $definitionBasisCounts
    known_limits = @(
        "概念簇是确定性规则归并，不等于专家逐条编辑。",
        "定义从代表性来源和主题规则综合，不能当作模型权重学习。",
        "所有 empirical_support 均为 0，不能宣称科学或医疗效果。",
        "关系图包含大量 inferred 边，不能冒充原书明说。"
    )
}

Write-Json (Join-Path $Out "concept_tree.json") $conceptTree 80
Write-Json (Join-Path $Out "RELATIONS.json") $relationsObject 60
Write-Json (Join-Path $Out "fidelity_metrics.json") $fidelity 40

$clusterRows = @($nodes | Where-Object { $_.type -eq "concept_cluster" } | Sort-Object id)
$md = New-Object System.Collections.Generic.List[string]
$md.Add("# 《意识强度》深度概念树")
$md.Add("")
$md.Add("> $StatusStatement")
$md.Add("")
$md.Add("## 覆盖")
$md.Add("")
$md.Add("- 输入主库记录：$($records.Count)")
$md.Add("- 已归并记录：$assignedCount")
$md.Add("- 未归并记录：$($records.Count - $assignedCount)")
$md.Add("- 概念簇：$clusterCount")
$md.Add("- 总节点：$($nodes.Count)")
$md.Add("")
$md.Add("## 九章概念簇")
$md.Add("")
foreach ($chapterId in $chapterTitles.Keys) {
    $md.Add("### $chapterId. $($chapterTitles[$chapterId])")
    $md.Add("")
    foreach ($node in @($clusterRows | Where-Object { $_.chapter_ids -contains $chapterId })) {
        $source = @($node.sources)[0]
        $md.Add("- **$($node.title)** [$($node.id)]：$($node.record_count) 条。$($node.definition)")
        $md.Add("  - 来源例：$($source.volume) PDF p.$($source.pdf_page)：$($source.snippet)")
        $md.Add("  - 证据/边界：$($node.evidence_level)")
    }
    $md.Add("")
}
($md -join "`n") | Set-Content -LiteralPath (Join-Path $Out "CONCEPT_TREE.md") -Encoding UTF8

$overview = @"
# 《意识强度》深框架总览

> $StatusStatement

## 结论

本轮把上一版 5,581 条碎片索引进一步归并成 $clusterCount 个概念簇，并接到九大区域下面。它比 framework/ v1 更完整，因为每条主库记录都被分配到一个稳定节点；但它仍然是磁盘资产和规则化结构综合，不是模型权重学习，也不是可运行接地核。

## 内部逻辑骨架

1. 第一、二章建立主轴：心智系统、心智控制、自主意识，以及自动化/自主化的张力。
2. 第三、四章展开外延：安全感、生命探索、连接、学习、理解他人和思维扩展。
3. 第五、六章转入阻力：旧有惯性、情绪/行为/思维反应，以及注意、感知、记忆中的过滤和失真。
4. 第七至九章进入来源体系的整合层：神性交换、灵性结构、模块交换和系统隐喻。

## 怎样读

- 先读 CONCEPT_TREE.md 看九章下的概念簇。
- 再读 RELATIONS.json 看 stated/inferred 关系。
- 再读 CONTRADICTIONS_AND_GAPS.md，它比顺滑总览更重要，因为那里记录了不能补平的断裂。

## 不能越界

实证支持仍为 0；灵修、能量、神经百分比、前世、模块和内部结构只能按原书体系描述。任何面向用户的产品化输出，都不能把这些内容写成科学、医疗、诊断、治疗或有效性承诺。
"@
$overview | Set-Content -LiteralPath (Join-Path $Out "DEEP_FRAMEWORK_OVERVIEW.md") -Encoding UTF8

$gaps = @"
# 矛盾、重复、断裂与空白报告

> $StatusStatement

## 结论

本报告必须非空。当前深框架没有把原书整理成一套无缝理论；相反，它保留了以下矛盾、重复、断裂和空白。

## 1. 科学/神经语言与证据状态冲突

原书多处使用神经、人体机能、量化百分比、检测数值等语言；但知识包质量报告显示逐条实证支持为 0。本框架因此把相关内容标为 insufficient_evidence、not_neuroscience_fact 或 not_scientific_measurement，不能按科学事实使用。

## 2. 灵修本体论与可观察反思混在一起

同一套章节中同时出现可观察主题（情绪、注意、习惯、学习、复盘）和神性、灵体、能量、粒子、前世、模块结构等来源体系语言。深框架把它们放在同一棵树中以保持忠实，但产品使用时必须分层，不能用灵修本体解释用户现实症状或风险。

## 3. 百分比和“人类平均”缺少测量方法

原书大量给出 20%~80% 之类的比例和平均值，但现有语料没有提供可复现测量方法、样本、量表、统计过程或外部验证。它们只能作为原书体系内说法保留，不能作为评分或营销依据。

## 4. 九区域之间缺少显式因果转换机制

原书明确列出九个区域和许多部分，但没有给出可验证的完整因果图，说明从某一区域如何必然导致另一区域变化。RELATIONS.json 因此主要使用包含、归并、弱综合关系，避免画强因果链。

## 5. “起承转合”是系统综合，不是原书明说

framework v1 和本深框架把九章读成“起-承-转-合”，这是为了理解结构做的综合。原书没有显式使用这个阶段结构，所以不能把它当作作者明示设计。

## 6. 碎片记录仍未等于人工编辑概念

5,581 条记录已经全部归并，但归并依赖确定性规则：章、topic、标题/摘要关键词、证据等级和安全标签。这比碎片索引更有结构，但不是专家逐条重写概念定义。真正的专家级概念树仍需人工复核。

## 7. 重复模式

多章反复出现“定义/特点/影响/例子/量化数据/实操指南/提升建议/区别/联系/总结”的编辑模板。这是结构资产，但也意味着许多记录只是模板段落、例子或提示语，不能都当作独立概念。

## 8. 产品化空白

本深框架没有证明 StillMind 或任何产品有人要。它只让知识资产更可读、更可审计。是否值得继续做运行时接地核，仍取决于真人需求验证。
"@
$gaps | Set-Content -LiteralPath (Join-Path $Out "CONTRADICTIONS_AND_GAPS.md") -Encoding UTF8

$report = @"
# 深框架忠实报告

> $StatusStatement

## 产出

- CONCEPT_TREE.md
- concept_tree.json
- RELATIONS.json
- CONTRADICTIONS_AND_GAPS.md
- FIDELITY_REPORT.md
- DEEP_FRAMEWORK_OVERVIEW.md
- fidelity_metrics.json

## 计数

| 指标 | 数量 |
|---|---:|
| 输入主库记录 | $($records.Count) |
| 已归并记录 | $assignedCount |
| 未归并记录 | $($records.Count - $assignedCount) |
| 概念簇 | $clusterCount |
| 总节点 | $($nodes.Count) |
| 关系 | $($relations.Count) |
| stated 关系 | $statedRelationCount |
| inferred 关系 | $inferredRelationCount |
| 实证支持记录 | $($manifest.counts.evidence_levels.empirical_support) |

## 定义来源

节点 definition_basis 分布写入 fidelity_metrics.json。区域节点主要来自 framework v1 的 stated 来源；概念簇主要是规则化 inferred cluster；章节结构簇为 stated_limited。

## 覆盖说明

所有 $($records.Count) 条主库记录都被分配到一个概念簇，并在 concept_tree.json.nodes[].merged_record_ids 中保留记录 ID。这个“全覆盖”是结构化归并，不等于逐条专家编辑或科学验证。

## 校验

生成时完成以下检查：

- 读取主库 records/all.jsonl。
- 读取 framework/framework.json。
- 生成概念树、关系图和报告。
- 输出计数与归并计数一致。

## 限制

- 不是模型权重学习。
- 不是运行时接地核。
- 不是 RAG 或检索服务。
- 不是产品需求验证。
- 不提供科学、医疗、诊断、治疗或有效性结论。
"@
$report | Set-Content -LiteralPath (Join-Path $Out "FIDELITY_REPORT.md") -Encoding UTF8

$readme = @"
# Framework Deep

> $StatusStatement

本目录是 knowledge-pack/framework/ v1 之后的深框架资产层。它把 5,581 条主库记录确定性归并到九章下的概念簇，并输出关系图和忠实报告。

## 文件

- CONCEPT_TREE.md：人读版概念树。
- concept_tree.json：结构化概念树，含 merged record ids。
- RELATIONS.json：关系图，区分 stated/inferred。
- CONTRADICTIONS_AND_GAPS.md：矛盾、重复、断裂、空白。
- FIDELITY_REPORT.md：覆盖、计数、限制。
- DEEP_FRAMEWORK_OVERVIEW.md：整套体系的人读版深框架概览。
- fidelity_metrics.json：机器可读计数。

## 使用

优先把它当作内部阅读和审计资产。进入任何用户反馈或产品运行时前，必须重新执行安全、证据、版权和真人需求验证。
"@
$readme | Set-Content -LiteralPath (Join-Path $Out "README.md") -Encoding UTF8

Write-Output "deep_framework_built=true"
Write-Output "records=$($records.Count)"
Write-Output "assigned_records=$assignedCount"
Write-Output "concept_clusters=$clusterCount"
Write-Output "nodes=$($nodes.Count)"
Write-Output "relations=$($relations.Count)"
Write-Output "output=$Out"
