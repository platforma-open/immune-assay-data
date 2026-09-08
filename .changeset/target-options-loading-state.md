---
"@platforma-open/milaboratories.immune-assay-data.model": patch
"@platforma-open/milaboratories.immune-assay-data.ui": patch
"@platforma-open/milaboratories.immune-assay-data": patch
---

Show a loading state in "Sequence column to match" while the options update. After a dataset
change the dropdown showed the old dataset's options until the new list arrived. The model now
returns the options with the dataset ref they belong to. The UI disables the dropdown and shows
a spinner until the options for the selected dataset arrive. A target that is not in the new
list is cleared. Without a dataset the dropdown is disabled with a hint.
