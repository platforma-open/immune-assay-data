---
"@platforma-open/milaboratories.immune-assay-data.workflow": patch
---

Fix MMseqs2 run failing on Windows by replacing `easy-search` (which invokes a generated shell script) with the equivalent `createdb`/`search`/`convertalis` subcommand chain.
