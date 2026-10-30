# WakeupHelper public source snapshot

Original project/author: Freedom, https://gitee.com/xmr-stak/wake-up-helper . The original Apache-2.0 LICENSE and assembly attribution are preserved. The existing project contains attributed local modifications; this snapshot does not grant rights to third-party books, case documents or datasets.

This independent WinForms tool converts local Word transcripts and groups case document versions. It is B-related infrastructure, not a complete reflection-analysis, upload or learning-guide service, and is not integrated into A.

## Build and operate

Requires Windows, .NET SDK capable of targeting .NET Framework 4.8, NuGet access and Microsoft Word desktop/COM for document operations. From this directory run `dotnet build WakeupHelper.csproj -c Release`. Review files before processing and use copies, not irreplaceable originals.

This public snapshot omits the private ASR lexicon and reference data. The bundled empty correction profile performs no dictionary corrections. Stored speaker lists are cleared; choose/configure the actual speakers locally. Two personal alias tables and a personal default directory were removed from source. Therefore this is not byte-identical to the local operational package, and its historical full regression results do not apply automatically.

Original `FunctionalSmokeTests` mix real case identifiers and reference-dependent fixtures and are withheld, not silently claimed to pass. Packaging/maintenance scripts are archival utilities with original local defaults; inspect parameters and paths before executing. No packaging or Word automation was executed during upload. `docs/historical` is historical documentation, not current acceptance evidence.

Do not commit documents, private config/lexicons, logs or book-reference data. This tool does not provide diagnosis, treatment or guaranteed learning outcomes.
