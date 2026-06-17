# EvacuWay — Video Demo Script (~5 minutes)

A shot-by-shot script for recording a demo of the EvacuWay dashboard. Each beat gives you
**[SCREEN]** (what should be visible), **[MOUSE]** (where to point/click), and **[SAY]** (narration).
Total target run time **≈ 5:00**. Narration is written to be read at a calm pace.

---

## Before you hit record (prep checklist)

1. Start the backend: in a terminal, `cd backend` → `uvicorn main:app --port 8000`.
2. Start the dashboard: in a second terminal, `cd frontend` → `npm run dev`.
3. Open **http://localhost:5173** in a clean browser window (hide bookmarks bar; zoom 100%).
4. Maximise the window to ~1440×900 so the left control panel and the map are both fully visible.
5. Wait until the map shows Metro Manila with colored dots, and the top-right badge reads
   **“Live API.”** Do a silent practice run once.
6. Optional: have the GitHub repo tab and the deployed Netlify site ready for the closing shot.

> Tip: move the mouse slowly and pause for ~1 second after each click so viewers can follow.

---

## [0:00 – 0:25] — Title & hook

- **[SCREEN]** Dashboard loaded, full Metro Manila map visible.
- **[MOUSE]** Slowly circle the cursor around the whole map, then rest it on the header title
  **“EvacuWay”** (top-left).
- **[SAY]** “This is *EvacuWay* — a simulation that compares three typhoon-evacuation routing
  strategies across Metro Manila. The Philippines gets around twenty typhoons a year, and when the
  roads themselves start flooding, the *route* you choose decides who reaches safety. Let’s see how
  the three strategies stack up — no login required, this just opens in the browser.”

## [0:25 – 1:05] — Orient the map & layers

- **[MOUSE]** Point to the colored dots, then move to the **Legend box (bottom-right of the map)**.
- **[SAY]** “Every red and orange dot is a historical flood-risk point from a 2,200-record dataset
  covering twelve NCR cities. The green markers are evacuation centers; the orange ones are the
  origin communities that need to evacuate.”
- **[MOUSE]** In the Legend, **tick the “Origin zones” checkbox** on, then **hover one green marker**
  so its popup appears.
- **[SAY]** “I’ll switch on the origin zones… and if I hover a center, I can see its name and
  elevation. These routes follow real Metro Manila streets — they’re snapped onto the actual road
  network, not drawn as straight lines.”

## [1:05 – 1:55] — Run the first scenario (Strategy A, Severe)

- **[MOUSE]** Move to the **left control panel**. **Click the “A · Dijkstra” radio button.**
- **[SAY]** “On the left is the scenario panel. Strategy A is the naive baseline — every household
  just takes its own shortest path.”
- **[MOUSE]** Under *Flood severity*, **click “Severe.”**
- **[SAY]** “I’ll set the flood severity to Severe — that’s a Signal-4 typhoon.”
- **[MOUSE]** **Click the green “▶ Run simulation” button.** Wait for the spinner, then point to the
  **six KPI cards** that appear below the map.
- **[SAY]** “One click runs the simulation live on the backend. These six cards are our scorecard:
  total and average evacuation time, completion rate, network utilisation, an *equity* index, and a
  survival percentage. Notice Strategy A’s total evacuation time — over 400 minutes — and its high
  equity index, which means very *unequal* clearance.”

## [1:55 – 2:55] — Compare the three strategies

- **[MOUSE]** **Click the “B · Frank-Wolfe” radio**, then **click “Run simulation”** again.
- **[SAY]** “Now Strategy B — the capacity-aware strategy that balances traffic across corridors.
  Watch the cards update… total evacuation time drops sharply, and the little percentage deltas turn
  green — that’s the improvement versus the Strategy A baseline. B is the fastest strategy at every
  flood level.”
- **[MOUSE]** **Click the “C · Zone-Sequential” radio**, then **Run simulation** once more. Point to
  the **Equity Index (EI) card** specifically.
- **[SAY]** “Strategy C sends the highest-risk barangays first, in phased waves. It’s a bit slower on
  average — but look at the Equity Index: it’s the *lowest* of the three. C is the most *fair*
  strategy, which matters most when the network is collapsing.”
- **[MOUSE]** Scroll down slightly to the **Run history table** and point to the rows.
- **[SAY]** “Every run is logged here so you can compare them side by side.”

## [2:55 – 3:50] — The Results panel (the evidence)

- **[MOUSE]** Point to the **bar chart** (“Total Evacuation Time by strategy”).
- **[SAY]** “These charts summarise the full experiment — 270 runs: three strategies, three flood
  levels, thirty random seeds each. In the bar chart, the orange Strategy-B bars are lowest at every
  severity — B is consistently the quickest.”
- **[MOUSE]** Move to the **line chart** (“Completion Rate vs flood severity”) and trace the lines
  left to right with the cursor.
- **[SAY]** “And here you can see every strategy degrade as flooding worsens — completion falls from
  about 98% in mild conditions to about 91% under severe flooding. These differences are
  statistically significant — confirmed with ANOVA and Tukey tests in the documentation.”

## [3:50 – 4:30] — Robustness & extra features

- **[MOUSE]** Back in the scenario panel, **expand the “City filter”** and tick one or two cities;
  then point to the **Seed** field.
- **[SAY]** “You can narrow the run to specific cities, or fix the random seed — the same seed always
  reproduces the exact same result.”
- **[MOUSE]** In the Legend, **toggle the flood layer off and on**, then point to the top-right
  **“Live API” badge.**
- **[SAY]** “Layers toggle on and off, the routes are snapped to real roads, and there’s even a live
  PAGASA rainfall feed. If the backend ever goes offline, the dashboard automatically falls back to
  bundled data — so the demo never breaks.”

## [4:30 – 5:00] — Close

- **[MOUSE]** Point back to the **KPI cards / map** one last time, then (optional) switch to the
  **GitHub repo tab**.
- **[SAY]** “So the takeaway is simple: no single strategy wins everything. Use capacity-aware
  routing while the network is healthy, and switch to phased, equity-first routing as flooding turns
  severe. Everything you saw — the simulation engine, the 270-run experiment, and this dashboard —
  is open source and reproducible. Thanks for watching.”

---

## Robustness notes (so the recording never fails)

- If the map tiles are slow, wait for them before narrating the map section.
- If a “Run” seems to hang, the badge may have dropped to **“Bundled data”** — the KPIs still update
  from the bundled snapshot, so keep going; mention the offline fallback as a feature.
- Keep each simulation to the default seed (42) for consistent, repeatable numbers on camera.
- Approximate on-screen numbers to cite: **A/Severe TET ≈ 419 min**, **B/Severe TET ≈ 364 min**,
  **C lowest Equity Index at every level (≈0.41–0.49)**. Don’t read decimals aloud — round.
- If recording vertically/mobile: the layout switches to **Map / Controls / Results** tabs at the top;
  tap between them instead of using the sidebar.
