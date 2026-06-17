# EvacuWay — Mismatch Matrix (Task 1)

Quick-reference table of every defect, where it lived in the original draft, and the fix.
Companion to [audit_report.md](audit_report.md).

| File / Section (original draft) | Defect Type | Offending text (representative) | Fix Required | Fixed In |
|---|---|---|---|---|
| Abstract | Wrong dataset | "Liar Twitter Dataset … 12,761 statements" | Replace with flood + Marikina datasets | revised_dataset_description.md |
| Introduction | ML/NLP language | "training a machine learning model is a simulation exercise" | Delete all ML/NLP; rewrite as routing paper | revised_introduction.md |
| Introduction | Wrong dataset | "12,761 real fact-checked statements", "PolitiFact API" | Delete; cite flood CSV + Marikina XLSX | revised_introduction.md, revised_dataset_description.md |
| Methodology → Dataset | Wrong dataset | "fake-news / claim classification", "political statement" | Replace with 27-col flood schema + 10-col node schema | data_dictionary.md, dataset_mapping_table.md |
| Scope | Scope contradiction | "Marikina City" as sole boundary | Whole Metro Manila (NCR), 17 LGUs | revised_scope.md, revised_study_area.md |
| Scope | Strategy contradiction | "one distinct algorithmic routing Strategy A" | Three strategies (A, B, C) | revised_scope.md, revised_objectives.md |
| Objectives | Scope wording | "Metro Manila-wide" (inconsistent with Scope) | Align all three to Metro Manila | revised_objectives.md |
| Delimitation | Scope wording | "Metro Manila" (inconsistent with Scope) | Align; label Marikina as prototype | revised_delimitation.md |
| Delimitation | Marikina-only centers | eight Marikina schools listed as the centers | DSWD/DepEd NCR centers; Marikina = sample | revised_delimitation.md |
| Preprocessing | Node-count | "1,250 nodes" | Label as Marikina prototype seed | network_scale.md, node_edge_model.md |
| Parameter table | Node-count | "150–500 nodes" | Delete; use stratified 5,000–15,000 sample | revised_parameter_table.md |
| Study area / Figures 4–5 | Bounding box | Marikina bbox (14.52–14.68 N, 120.97–121.13 E) | Metro Manila bbox (14.35–14.78 N, 120.90–121.20 E) | revised_study_area.md, geo_scope_notes.md |
| Results → Table 4 | Empty results | blank table | Fill with 270-run output | revised_results_analysis.md |
| Results → Figure 6 | Empty figure | no data | Define + caption with real data | figure_caption_pack.md |
| Statistics | Missing plan | (absent) | ANOVA + Tukey + effect sizes spec | statistics_plan.md |

## Files requiring rewrite (identified)

- Abstract, Introduction, Methodology/Dataset, Scope, Objectives, Delimitation, Study Area,
  Preprocessing, Parameter Table, Results, Figures 4/5/6.

All have been rewritten under `docs/revised_*.md` and validated by `scripts/consistency_check.py`.
