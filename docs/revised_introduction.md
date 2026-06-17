# EvacuWay — Revised Introduction (Task 2)

> Study area established from the first sentence: **Whole Metro Manila (NCR).**
> This section contains **no** machine-learning, NLP, or text-classification content of any kind.

## 1. Background

Metro Manila — the National Capital Region (NCR) of the Philippines, home to roughly **14 million**
residents across **17 local government units (LGUs)** — is one of the most typhoon- and flood-exposed
megacities on Earth. The Philippines is struck by an average of **about 20 tropical cyclones per
year**, of which several make landfall over or near Luzon and bring extreme rainfall to the NCR. The
region's dense settlement, low-lying river basins (notably the Marikina and Pasig river systems), and
heavily tidal coastal municipalities make rapid, large-scale evacuation a recurring necessity rather
than an exceptional event.

Three events anchor the public memory of catastrophic NCR flooding and motivate this study:

- **Tropical Storm Ondoy (Ketsana, 2009)** dumped a month of rainfall in a single day, submerging
  large parts of Marikina, Pasig, and Quezon City and stranding tens of thousands of residents on
  rooftops because road-based evacuation collapsed faster than authorities could respond.
- **Typhoon Ulysses (Vamco, 2020)** caused the Marikina River to rise to near-record levels, forcing
  mass overnight evacuations and again exposing how quickly flood water can sever the very roads that
  evacuation depends on.
- **Super Typhoon Rolly (Goni, 2020)**, the strongest landfalling cyclone of its year, underscored
  that the NCR must be able to move large populations along road networks that are themselves
  progressively failing during the emergency.

## 2. The problem

Evacuation in Metro Manila is a **complex sociotechnical problem**, not a simple shortest-path
exercise. It couples (a) a large, irregular road network; (b) hundreds of origin communities with
very different populations and flood exposures; (c) a finite set of evacuation centers with limited
shelter capacity; and (d) a hazard — flood water — that **removes and degrades parts of the road
network while the evacuation is still in progress**. The "best" route at the start of an event is
frequently impassable an hour later. Decisions made centrally (which zones move first, how load is
balanced across corridors) interact with decisions made locally (which way each household drives),
and the aggregate outcome determines who reaches safety and who is trapped.

Because the system is large, hazard-driven, and partly stochastic, it cannot be studied by
controlled real-world experiment: one cannot flood Metro Manila repeatedly to compare evacuation
plans. **Simulation is therefore the appropriate scientific method.** A simulation lets us (1)
represent the road network and flood hazard explicitly, (2) re-run the same scenario under different
routing policies, and (3) measure outcomes — clearance time, completion, equity, survival — under
identical, reproducible conditions.

## 3. Why compare routing strategies

Real LGUs do not all evacuate the same way. Some rely on residents finding their own shortest path
(a **decentralised** policy); some attempt to **balance traffic** across corridors to avoid
gridlock; and some enforce **phased, priority-based** departures in which the highest-risk barangays
move first. These correspond to three distinct families of routing strategy:

- **Strategy A — Dijkstra shortest-path (decentralised).** Each origin independently routes to its
  nearest available evacuation center on the shortest-distance path.
- **Strategy B — Frank-Wolfe capacity-aware (centralised).** An iterative traffic assignment balances
  load across the network using a Bureau-of-Public-Roads (BPR) congestion cost.
- **Strategy C — Zone-Sequential priority (phased).** Barangays depart in waves ordered by flood
  risk; lower-risk zones are held until higher-risk waves clear.

Most prior evacuation studies evaluate a **single** strategy in isolation, often on a static network.
The **research gap** this study addresses is the absence of a like-for-like comparison of these three
strategies **simultaneously, on the same network, under progressive road degradation**, judged not
only on speed but also on **equity**.

## 4. Why model road failure and progressive flood severity

A routing study that assumes a fixed, fully-passable network cannot represent the defining feature of
a typhoon evacuation: the road network fails as the flood worsens. EvacuWay models this with a
**probabilistic Bernoulli edge-failure engine** — each road segment is independently closed with a
probability proportional to its flood susceptibility and the typhoon severity multiplier (λF) — plus
a slowdown on surviving-but-flooded roads. Three severity levels (Mild λF = 0.33, Moderate λF = 0.66,
Severe λF = 1.0) let us observe how each strategy degrades as conditions worsen.

## 5. Why equity matters, not just speed

The fastest plan on average can still be deeply unfair: it may clear well-connected zones quickly
while leaving peripheral, high-risk barangays stranded. EvacuWay therefore reports an **Equity Index
(Gini coefficient of individual clearance times)** alongside speed-based indicators. A policy that is
slightly slower but far more equitable may be preferable for disaster-risk-reduction agencies whose
mandate is to protect the most vulnerable first.

## 6. What this study is (and is not)

EvacuWay is a **routing simulation** of typhoon/flood evacuation in Metro Manila. It compares three
routing strategies across three flood-severity levels over 30 random seeds (270 reproducible runs),
reporting six key performance indicators (TET, AET, ECR, NUI, EI, SCP). It is **not** a fluid-dynamics
flood model, and it is **not** a machine-learning or text-classification study of any kind. Its
contribution is a reproducible, comparative, equity-aware evaluation framework that LGUs and the
NDRRMC can use to choose evacuation-routing policy as a function of forecast typhoon signal.

## 7. Objectives (summary)

1. Build a reproducible Metro Manila evacuation-routing simulation on an OSMnx-extracted NCR road
   network, seeded and validated with the Marikina prototype sub-network.
2. Implement and compare three routing strategies (A, B, C) under three flood-severity levels.
3. Quantify performance with six KPIs and test differences statistically (ANOVA + Tukey HSD).
4. Translate the findings into actionable evacuation-routing guidance for Philippine LGUs as a
   function of PAGASA typhoon signal.

See [revised_objectives.md](revised_objectives.md), [revised_scope.md](revised_scope.md), and
[revised_delimitation.md](revised_delimitation.md) for the full, internally-consistent statements.
