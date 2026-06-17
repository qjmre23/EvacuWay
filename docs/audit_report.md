# EvacuWay — Full Project Audit Report (Task 1)

**Audit date:** 2026-06-17
**Source audited:** `Copy of project draft.pdf` (original thesis draft) and the two ground-truth datasets.
**Method:** Full read of the draft against the verified datasets, plus keyword scan for the
defect signatures listed below.

This report enumerates every defect found in the original draft. Each defect is paired with the
corrective action taken in the rebuilt project. The companion file
[mismatch_matrix.md](mismatch_matrix.md) gives the same information as a quick-reference table.

---

## Summary of defects

| # | Defect | Severity | Status |
|---|--------|----------|--------|
| 1 | Wrong dataset referenced ("Liar/LIAR Twitter Dataset", 12,761 political statements, PolitiFact, fake-news classification) | Critical | Fixed |
| 2 | Geographic scope contradiction (Marikina City vs Metro Manila vs Metro-Manila-wide) | Critical | Fixed |
| 3 | Node-count contradiction (1,250 nodes vs 150–500 nodes) | High | Fixed |
| 4 | Strategy-count contradiction (one strategy vs three strategies) | High | Fixed |
| 5 | ML / text-classification language inside a routing-simulation paper | Critical | Fixed |
| 6 | Empty Results section (blank Table 4, Figure 6 with no data) | High | Fixed |
| 7 | Marikina-only evacuation centers in the Delimitation | Medium | Fixed |

---

## Defect 1 — Wrong dataset referenced

**Found in:** Introduction, Methodology/Dataset, Abstract.
**Offending content:** references to the "Liar Twitter Dataset", "12,761 fact-checked political
statements", "PolitiFact API", and "fake-news / claim classification".

**Why it is wrong:** EvacuWay is an evacuation-routing simulation. The LIAR dataset is an NLP
fake-news corpus with no relationship to flood evacuation, road networks, or Metro Manila.

**Resolution:** All LIAR/PolitiFact/fake-news/NLP references deleted. The project now documents the
two real datasets:
- `metro_manila_flood_dataset.csv` — 2,200 flood-incident records, 27 columns, 12 NCR cities, 2000–2024.
- `Evacuation_Marikina_Dataset.xlsx` — 1,250-node Marikina prototype sub-network, 10 columns.

See [revised_dataset_description.md](revised_dataset_description.md) and [data_dictionary.md](data_dictionary.md).

## Defect 2 — Geographic scope contradiction

**Found in:** Scope ("Marikina City"), Delimitation ("Metro Manila"), Objectives ("Metro Manila-wide").

**Resolution:** Single official scope established — **Whole Metro Manila (NCR), all 17 LGUs**. The
Marikina XLSX is relabelled everywhere as a *prototype validation sub-network only*. See
[revised_scope.md](revised_scope.md), [revised_study_area.md](revised_study_area.md).

## Defect 3 — Node-count contradiction

**Found in:** Preprocessing ("1,250 nodes") vs Parameter table ("150–500 nodes").

**Resolution:** One coherent story (the "150–500" figure is removed entirely):
- 1,250 nodes = Marikina prototype seed (the XLSX).
- Full Metro Manila run = OSMnx drive graph (~80,000–150,000 nodes / ~200,000–400,000 edges).
- Thesis simulation sample = stratified ~5,000–15,000 nodes.

See [network_scale.md](network_scale.md), [node_edge_model.md](node_edge_model.md), [revised_parameter_table.md](revised_parameter_table.md).

## Defect 4 — Strategy-count contradiction

**Found in:** Scope ("one distinct algorithmic routing Strategy A") vs Objectives (three strategies).

**Resolution:** **Three** routing strategies everywhere: A (Dijkstra shortest-path), B (Frank-Wolfe
capacity-aware), C (Zone-Sequential priority). The Scope is corrected. See
[revised_scope.md](revised_scope.md), [revised_objectives.md](revised_objectives.md).

## Defect 5 — ML / text-classification language

**Found in:** Introduction — phrases such as "training a machine learning model is a simulation
exercise", "simulate how an AI system learns to classify real-world language", "simulating different
class boundaries".

**Resolution:** Entire Introduction rewritten with evacuation-routing content only; zero ML/NLP
language remains. See [revised_introduction.md](revised_introduction.md).

## Defect 6 — Empty Results section

**Found in:** Results — Table 4 blank, Figure 6 undefined.

**Resolution:** Results section fully populated with **real output from the executed 270-run
experiment** (3 strategies × 3 flood levels × 30 seeds), including the filled Table 4, one-way ANOVA,
Tukey HSD, effect sizes, and equity analysis. See [revised_results_analysis.md](revised_results_analysis.md),
[statistics_plan.md](statistics_plan.md), [figure_caption_pack.md](figure_caption_pack.md).

## Defect 7 — Marikina-only evacuation centers in Delimitation

**Found in:** Delimitation — list of eight Marikina schools as the evacuation centers.

**Resolution:** Delimitation now states centers are drawn from DSWD/DepEd Metro-Manila-registered
centers (seeded by the CSV `evacuation_center` field); the Marikina list is relabelled as the
prototype-validation sample. See [revised_delimitation.md](revised_delimitation.md).

---

## Verification

Run the final consistency pass (Task 10):

```bash
python scripts/consistency_check.py
```

It greps the whole repo for the defect signatures (`LIAR`, `PolitiFact`, `12,761`, `text classif`,
`150–500 nodes`, "one distinct strategy", unqualified "Marikina") and asserts zero offending matches
outside the labelled prototype sections. See [validation_checklist.md](validation_checklist.md).
