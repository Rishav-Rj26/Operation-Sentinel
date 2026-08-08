# Product Requirements Document: Operation Sentinel

**Subtitle:** A Scale-Agnostic Police Personnel Scheduling & Dynamic Deployment Platform
**Version:** 1.0
**Status:** Draft for Build
**Owner:** [Product/Eng Lead]
**Doc type:** Hackathon build spec (Hack de Science Ojass 2026 — Problem 3)

---

## 1. Purpose & Problem Statement

Police Control Rooms currently plan personnel deployment for public events (temple megashrines, city-wide elections, festivals, protests) using manual spreadsheets or ad-hoc radio coordination. This breaks down in two distinct ways:

- **Micro events** (a single dense compound): the bottleneck is chokepoint coverage and on-foot troop density, not travel time.
- **Macro events** (a sprawling city): the bottleneck is geographic coverage and travel time between zones, not local density alone.

Existing tools are built for one scale and don't generalize. **Operation Sentinel** must use a single mathematical and architectural model that produces correct, safe, fatigue-aware rosters at either scale, with zero hardcoded assumptions about force size or zone count, and must be able to absorb real-time shocks (crowd spikes, mass absences) without human recalculation.

## 2. Goals

1. Let an admin configure a force of arbitrary size/composition and an arbitrary number of zones, and generate a legally-compliant, fatigue-aware 30-day/3-shift roster in one action.
2. Represent zone risk/size visually (heatmap + graph or map) so command staff can read the deployment at a glance.
3. Detect and resolve deployment deficits automatically during a live shift, escalating to a human only when automated resolution is exhausted.
4. Guarantee data integrity under concurrent admin edits.
5. Track officer fatigue and use it as a scheduling constraint, not just a display metric.

## 3. Non-Goals

- Real-time GPS tracking of officers in the field (out of scope for this build).
- Payroll, leave-request workflows, or HR case management beyond the "on leave" toggle described in Stage 4.
- Mobile native apps — dashboard is responsive web only.
- Predictive crowd-density forecasting (ML-based) — density spikes are admin-triggered/manual for this version.

## 4. Users & Personas

| Persona | Role | Key needs |
|---|---|---|
| **Control Room Admin** | Configures force, zones, generates rosters | Fast setup, clear validation, override power |
| **Duty Officer (Zone Manager viewer)** | DSP/ASP/Inspector level | Views their zone's roster, receives incident alerts |
| **Command Staff (DIG/SP)** | Strategic oversight, not field-deployed | Cluster-level dashboard, escalation approvals |
| **Field Constable** | Ground deployment | (Out of scope for UI in v1 — represented as roster data only) |

## 5. Hierarchy Model (System Constant)

| Level | Ranks | Deployment Role |
|---|---|---|
| Command Level | DGP / ADGP / IG | Not field-deployed; oversight only, excluded from roster pool |
| Strategic Oversight | DIG / SP | Supervises a cluster of zones |
| Zone Managers | DSP / ASP / Inspector | Commands 1–3 adjacent zones |
| Sector Duty | SI / ASI / Head Constable / Constable | Ground deployment within a single zone |

This hierarchy is a fixed enum in the data model — ranks are configurable in *count*, not in *structure*.

## 6. Functional Requirements

**Architecture separation of concerns:** the system is split into two responsibility layers regardless of specific tooling —
- **Compute & UI layer:** admin dashboard, Graph/Map rendering, and all math (`Zscore`, Proportional Distributor, Scheduler, Fatigue Tracking) — computed here *before* committing state to the data layer. UI screens (dashboard, heatmap, roster grid, zone graph) are generated/prototyped using **Google Stitch** (AI UI design tool) and then implemented as React components — see Section 11.
- **Data & Real-time layer:** database, auth, edge-case triggers (Mass Absence), heatmap real-time sync, and Optimistic Concurrency Control (`__version` tokens), served by **MongoDB Atlas + Atlas App Services**.

> **Naming note:** two unrelated products share the name "Stitch" in this stack — **Google Stitch** (AI UI/design generator, used for frontend screens) and **MongoDB Atlas App Services** (formerly branded "MongoDB Stitch," used for the backend/data layer). This doc always spells out which one is meant to avoid confusion.

This keeps all business logic (math, ordering, validation) in one place and all persistence/consistency guarantees in the other — useful both for testing the scheduler in isolation and for the concurrency demo in FR-4.1.

### Stage 1 — Control Room (Setup)

**FR-1.1 Force Configuration**
- Admin inputs Total Force (F) as a derived sum, or inputs per-rank counts directly (DGP → Constable).
- System validates F > 0 and that field-deployable ranks (below Command Level) exist.

**FR-1.2 Zone Configuration UI**
- Create/edit/delete zones. Each zone has:
  - Name/ID
  - Size Score `S` (1–10)
  - Density/Threat Score `D` (1–10)
  - Proximity relationships to other zones (adjacency)
- Zone count Z is unbounded (tested at both Z=3 and Z=40+).

**FR-1.3 Heatmap Indicator**
- Zones color-coded on a continuous scale driven by `D`, updated live when `D` changes.
- Thresholds: **Green = D 1–3**, **Yellow = D 4–7**, **Red = D 8–10**.

**FR-1.4 Zone Representation** (pick one for v1, design both into the data model)
- **Option A — Geospatial:** Map integration (Leaflet/Mapbox), admins draw GeoJSON polygons, backend computes real centroid-to-centroid distances for travel-time-aware logic (Macro use case).
- **Option B — Graph-Driven:** No map; zones created via form, proximity defined by an explicit adjacency list; UI renders a force-directed node graph (Micro use case, and Macro fallback when no GIS data exists).
- **Recommendation:** Build Option B first (lower integration risk, works for both scales since "adjacency" is scale-independent), and treat Option A as an enhancement that swaps in real distances where available.

### Stage 2 — Static Roster Generation

**FR-2.1 Global Standby Pool**
- Reserve exactly 15% of the active (field-deployable) force off the top, rounded per rank proportionally, before zone distribution.

**FR-2.2 Proportional Distributor**
- Compute per-zone weighted score:

  ```
  Zscore(zone) = (ws·S + wd·D) / (ws + wd)
  ```

  where `ws`, `wd` are admin-configurable weights, with the **hard constraint `wd > ws`** (density/threat must always outweigh raw size — e.g., default `ws=0.4, wd=0.6`). Enforce this in validation, not just as a UI default.
- Distribute the remaining 85% of force across zones proportional to each zone's `Zscore` relative to the sum of all `Zscore`s.
- Distribution respects rank ratios (a zone shouldn't get 100% constables and 0% supervisors) — enforce a minimum supervisory ratio per zone (e.g., ≥1 Zone Manager per active zone per shift).

**FR-2.3 Scheduler (30-day / 3-shift)**
- Shifts: Morning 06:00–14:00, Evening 14:00–22:00, Night 22:00–06:00.
- Constraints enforced at generation time:
  - Minimum 8-hour rest between shifts for Sector Duty and Zone Manager ranks below Inspector; **12-hour rest for Inspectors**.
  - No officer double-booked across zones/shifts (hard constraint — reject/replan, never overlap).
  - Zone Managers (DSP/ASP/Inspector) command 1–3 *adjacent* zones only (adjacency from Stage 1 data).
  - Strategic Oversight (DIG/SP) assigned per cluster, not per zone.
- Output: a deterministic, reproducible schedule for the full 30-day window, generated as a background job (must scale to Z=40, F=thousands without timing out — see NFRs).

**FR-2.4 Roster View**
- Table/grid: rows = zones, columns = day × shift.
- Clicking a cell opens a drill-down: exact list of personnel (name/ID, rank) deployed to that zone/day/shift.

### Stage 3 — Mid-Shift Dynamic Load Balancing

**FR-3.1 Simulate Incident**
- Admin (or system trigger) raises a zone's `D` score during an active shift.

**FR-3.2 Deficit Calculation**
- On `D` change, recompute `Zscore` → `T_new_required`.
- Compare to `T_current_deployed`.
- `ΔT = T_new_required − T_current_deployed`.
- If `ΔT > 0`, surface an immediate UI warning/flash on that zone.

**FR-3.3 Auto-Resolution Engine** (cascading, executed in order, stop at first sufficient step)
- **Step A — Adjacent Pooling:** Pull officers from adjacent zones currently below a "safe threshold" trigger (e.g., green/low-density zones), without dropping the donor zone below its own minimum safe `Zscore`-derived requirement.
- **Step B — Global Reserve:** If adjacent pooling is insufficient, draw from the 15% standby pool (rank-appropriate).
- **Step C — Escalation:** If standby is exhausted and `ΔT` remains unmet, raise a **Critical Alert** for manual admin override (no silent failure — always visible, actionable state).
- Every resolution action is logged (who/what moved, from where, to where, timestamp) for audit and fatigue tracking.

### Stage 4 — Scale & Edge Cases

**FR-4.1 Concurrency Handling**
- Two admins resolving the same deficit simultaneously must not double-assign an officer or corrupt state.
- Every deployment/zone/officer record carries a `__version` token. Writes are conditional on `__version` matching the last-read value (`findOneAndUpdate({ _id, __version }, { $set: ..., $inc: { __version: 1 } })`).
- If a second concurrent transaction's `__version` no longer matches (because the first admin's write already landed), that transaction **fails explicitly** and the UI is prompted to refresh state and retry — never a silent overwrite, never a merged/corrupted result.

**FR-4.2 Fatigue Tracking**
- Each officer accrues a **Fatigue Score (`F_score`)**, weighted by shift/event type:
  - Night shift: **+1.5x** multiplier
  - Emergency / mid-shift redeployment (Stage 3 pulls): **+2.0x** multiplier
  - Morning/Evening shifts: baseline (+1.0x)
- Stage 2 scheduler consumes `F_score` as a hard input: officers whose `F_score` falls in the **90th percentile or above** (relative to the current active force) are **excluded from Red-zone (D 8–10) assignment** the following day. They may still be assigned to Green/Yellow zones.
- Percentile is recalculated daily as fatigue accrues, not fixed at roster-generation time.

**FR-4.3 Mass Absence**
- Admin can simulate/trigger "10% of a zone's force marks On Leave" before a shift.
- System recalculates that zone's effective `T_current_deployed`, generates a `ΔT`, and routes through the **same Stage 3 resolution cascade** (A → B → C) — no separate code path.

## 7. Data Model (Core Entities)

*Maps to MongoDB collections. Embed where data is always read together (e.g., a `Shift`'s `assigned_officers` list); reference by `_id` where data is large, independently updated, or shared across many parents (e.g., `Officer` documents referenced from `Shift`, not embedded, since one officer appears across many shifts and needs its own version/lock).*

- **Officer**: id, name, rank, current_zone_id (nullable), fatigue_score, status (active/on_leave/standby), last_shift_end
- **Zone**: id, name, size_score(S), density_score(D), zscore (derived), adjacency[] (zone_ids), safe_threshold
- **Shift**: id, zone_id, date, shift_type (morning/evening/night), assigned_officers[], required_headcount
- **StandbyPool**: officers currently unassigned/reserved (15% pool), rank breakdown
- **IncidentLog**: id, zone_id, timestamp, delta_D, delta_T, resolution_steps_taken[], resolved_by (auto/manual), status
- **AuditLog**: every assignment/reassignment with actor, timestamp, before/after state

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Scalability | No hardcoded limits on F or Z; roster generation must complete in reasonable time (target <10s) at Z=40, F=5,000+ in demo environment |
| Consistency | No officer ever appears in two simultaneous shift assignments (DB constraint, not just app logic) |
| Concurrency | Optimistic Concurrency Control via `__version` tokens on all mutable records; conflicting writes fail explicitly, never silently overwrite |
| Auditability | All Stage 3/4 auto-resolutions and manual overrides are logged and retrievable |
| Usability | Heatmap and roster drill-down must be understandable without training (hackathon demo constraint) |
| Availability of override | Critical Alert state must always be resolvable by a human action — no dead-end UI state |

## 9. Success Metrics (for scoring/demo)

Mapped directly to the stated evaluation weights:

| Area | Weight | Demo proof point |
|---|---|---|
| Algorithmic Logic | 4/20 | Live Zscore recompute + correct A→B→C resolution routing on a triggered incident |
| System Architecture | 5/20 | Concurrent-write demo (two admins resolving same deficit) doesn't corrupt data |
| UI/UX | 4/20 | Heatmap + adjacency graph + drill-down roster table all functional |
| Scalability | 4/20 | Same instance runs a 3-zone demo and a 40-zone demo without code changes |
| Edge Cases | 3/20 | Fatigue-aware next-day scheduling + 10% mass-absence auto-patch both demonstrated live |

## 10. Suggested Build Sequence (for hackathon time constraints)

0. Generate initial screen designs (dashboard, heatmap, zone graph, roster table) in **Google Stitch**; use as the visual reference/spec while building React components in parallel.
1. Data model + rank/hierarchy enums + zone CRUD (Stage 1, Option B graph first).
2. Zscore math + 15% standby reservation + proportional distributor (Stage 2, part 1).
3. Shift scheduler with rest-period and no-double-booking constraints (Stage 2, part 2).
4. Roster table UI + drill-down (Stage 2, part 3).
5. Incident simulation → deficit calc → Step A/B/C resolution engine (Stage 3).
6. Fatigue score field + scheduler integration + mass-absence trigger reusing Stage 3 cascade (Stage 4).
7. Concurrency locking pass + audit log (Stage 4, harden last).
8. Heatmap polish + optional Option A map swap-in if time allows.

## 11. Proposed Tech Stack

Chosen for fast hackathon iteration, strong concurrency/locking support, and enough headroom to demo both a 3-zone and a 40-zone dataset without re-architecting.

| Layer | Choice | Why |
|---|---|---|
| UI/Design generation | **Google Stitch** (AI UI design tool) | Rapidly generate the dashboard, heatmap, roster grid, and zone-graph screen designs from prompts — used to prototype layout/visual direction before/while building the React components. Speeds up UI/UX scoring criterion under hackathon time pressure. Export as HTML/CSS or reference mockups, then hand-translate into React components below (Stitch does not generate production React directly). |
| Frontend | **React (Vite)** + Tailwind CSS | Fast setup, component reuse across heatmap/roster/graph views; implements the screens designed in Google Stitch |
| Graph/Node view (Option B) | **React Flow** | Purpose-built for node-and-adjacency graphs; drag zones, show adjacency edges, color nodes by `D` for the heatmap |
| Map view (Option A, stretch) | **Leaflet + react-leaflet** | Free, no API key friction (vs. Mapbox/Google), good enough for polygon drawing + centroid distance calc |
| Charts/roster grid | **TanStack Table** (+ recharts if summary charts are needed) | Handles large Z×30×3 grids without custom pagination code |
| Backend/API | **Node.js + Express** (or FastAPI/Python if the team is stronger there) | Simple REST endpoints for zone CRUD, roster generation, incident triggers |
| Scheduler/roster generation | Plain backend logic (constraint checks in code), not a full CP-SAT solver, given time budget — see note below | Keeps Zscore + rest-period + no-double-booking logic auditable and fast to debug live |
| Database | **MongoDB** | Flexible schema for nested docs (a `Shift` naturally embeds its assigned officer list; a `Zone` naturally embeds adjacency + score history) — fast to iterate on under hackathon time pressure; Mongoose gives quick validation/enums for the rank hierarchy |
| Concurrency control | **Optimistic locking** via a `version` field on `Zone`/`Officer`/`Shift` documents, enforced with atomic `findOneAndUpdate({ _id, version }, { $set: ..., $inc: { version: 1 } })` calls — a write only succeeds if the version still matches | Matches FR-4.1: two admins racing to resolve the same deficit will have one write succeed and one fail-and-retry, with no silent overwrite. For multi-document moves (pulling an officer out of Zone A into Zone B atomically), wrap in a **MongoDB multi-document transaction** (requires a replica set — MongoDB Atlas gives you this by default, even on the free tier) |
| Real-time UI updates | **WebSockets (Socket.IO)** or simple polling if time-constrained | Needed so the flashing `ΔT` warning and heatmap update live across connected admin sessions |
| Background jobs | **BullMQ (Redis-backed)** if roster generation needs to run async for large F/Z; otherwise synchronous is fine for demo scale | Keeps large-Z roster generation from blocking the request thread |
| Auth (minimal) | Simple session/JWT-based admin login | Not a core scoring criterion, but needed to demo the concurrency scenario as "two distinct admins" |
| Hosting/demo | **Vercel/Netlify** (frontend) + **Render/Railway** (backend) + **MongoDB Atlas** (database, free tier) | Zero-DevOps deploy for judging day; Atlas free tier already runs as a replica set, so transactions work out of the box |

**Notes on scope-appropriate choices:**
- A full constraint-solver library (e.g., Google OR-Tools/CP-SAT) would give a mathematically optimal roster, but is likely overkill and risky to integrate under hackathon time pressure. Hand-rolled greedy/priority-based assignment (sort by `Zscore` and fatigue, assign respecting rest windows) is enough to satisfy the stated constraints and is far easier to demo/debug live.
- Redis + BullMQ is optional — only pull it in if F/Z scale in the demo genuinely causes the synchronous roster generation to feel slow (>a few seconds). Don't add the complexity if it's not needed.
- Socket.IO can be swapped for simple client-side polling (every 3–5s) if WebSocket setup eats too much time; the scoring rubric cares about the resolution logic being visible, not the transport mechanism.

## 12. Open Questions

- Exact numeric "safe threshold" formula for a donor zone in Step A (needs a concrete floor, e.g., zone can't be pooled below its own `Zscore`-implied minimum).
- Whether Strategic Oversight (DIG/SP) assignment is auto-generated or manually assigned per cluster.
- Whether Option A (real geospatial distance) is required for MVP or a stretch goal — recommend stretch given time budget.
- Definition of "cluster" for DIG/SP supervision — is it admin-defined, or auto-grouped from zone adjacency?