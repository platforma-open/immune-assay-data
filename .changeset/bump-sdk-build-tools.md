---
'@platforma-open/milaboratories.immune-assay-data.workflow': patch
---

Bump build tooling to satisfy the CI require-latest gate

`@platforma-sdk/block-tools` 2.12.4 → 2.12.13 and `@platforma-sdk/tengo-builder`
4.0.16 → 4.0.22. Both are patch-level within their current major. The CI
preflight enforces latest versions of these two packages in the merge queue, so
a stale catalog blocks the merge even though the PR check is non-blocking.
