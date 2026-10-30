# Knowledge processing tools, without source content

Contains the existing extraction, candidate-building, deduplication, provenance validation, schema and framework tooling. It is not a deployed RAG/search service and is not connected to A/B at runtime. No source-content or third-party-model authorization follows from having the code.

Python 3.11+ is required (`hashlib.file_digest`); extraction also needs PyMuPDF, which is not vendored. Other Python components use the standard library. From this directory, `python scripts/test_build_consciousness_knowledge_pack.py` runs small algorithmic fixtures without the book. Those are not full-corpus quality/rights tests.

For authorized local inputs only, the existing defaults form a pipeline under the working directory's ignored `artifacts/consciousness-intensity`:

1. `python scripts/analyze_consciousness_corpus.py <authorized-PDF-directory>`
2. `python scripts/build_consciousness_knowledge_base.py`
3. `python scripts/build_consciousness_knowledge_pack.py`
4. `python scripts/build_consciousness_knowledge_pack.py --check`

The builder expects local research metadata at the paths documented in its source. It does not download books or call a model. Do not run full extraction/build on a public runner with private sources. Generated outputs contain source text and must stay private.

The deep framework generator and framework tests require additional private/local framework inputs; those inputs and the v2 generator containing embedded book excerpts are withheld. Included framework tests are archived checks, not runnable proof of a supplied full framework. Read `docs/historical` as historical research/strategy, not current market facts or product validation. Evidence labels are source-classification metadata, not certification of scientific truth.
