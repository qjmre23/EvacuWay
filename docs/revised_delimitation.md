# EvacuWay — Revised Delimitation (Task 3)

The study is deliberately bounded as follows. These delimitations are consistent with the Metro
Manila, three-strategy scope in [revised_scope.md](revised_scope.md).

1. **Geographic boundary.** Restricted to the **Metro Manila (NCR) boundary** and its internal road
   network. Provincial roads and inter-regional routes outside the NCR boundary are excluded.

2. **Transportation mode.** A **homogeneous private-vehicle** fleet is assumed, travelling at a
   free-flow speed of **20–60 km/hr** (nominal 40 km/hr), congestion-adjusted by a BPR function.
   Public transport, walking, and water transport are not modelled.

3. **Agent behaviour.** **100 % compliance** is assumed — agents follow the assigned routing policy.
   Panic, route disobedience, and departure-time non-compliance are not modelled.

4. **Hydrological model.** Flooding is represented by a **probabilistic Bernoulli edge-failure**
   process (edge closed with probability fe·λF) plus a slowdown on surviving flooded roads. This is a
   network-degradation abstraction, **not** a hydrodynamic / fluid-dynamics flood simulation.

5. **Prototype vs full network.** The **1,250-node Marikina XLSX is a prototype seed sub-network**
   used to validate the preprocessing and graph-construction pipeline only. Full runs use the
   **OSMnx-extracted Metro Manila graph** (see [network_scale.md](network_scale.md)).

6. **Evacuation centers.** Centers are drawn from **DSWD/DepEd-registered evacuation centers across
   Metro Manila**, seeded by the `evacuation_center` field of `metro_manila_flood_dataset.csv`. The
   set of Marikina schools/covered courts used during prototype testing
   (e.g. Marikina High School, Marikina Sports Center, and similarly registered facilities) is the
   **Marikina sample used for prototype validation only**; full deployment covers Metro-Manila-wide
   registered centers.

7. **Data coverage gap.** The flood CSV covers **12 of the 17 NCR LGUs**. Five LGUs — **Makati,
   Mandaluyong, Pasay, Pateros, San Juan** — have zero records in the current dataset. The mitigation
   (OSMnx network + NDRRMC public records / interpolation from adjacent cities) is documented in
   [revised_dataset_description.md](revised_dataset_description.md) and [assumptions.md](assumptions.md).

8. **Temporal scope.** Historical incidents span **2000–2024**. The simulation evaluates a single
   evacuation event per run; multi-day or recurrent flooding is out of scope.
