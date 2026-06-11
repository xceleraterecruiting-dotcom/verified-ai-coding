# Domain model

## Entities

**Existing (interfaces to confirm — no codebase access during compilation; see spec-intake A8):**

- **Cohort** — the grouping unit; authoritative membership lists (athletes, parents, coaches).
- **Athlete** — has (assumed) date of birth and a parent/guardian linkage (verification status
  unknown — OQ-01); has a public recruiting profile.
- **Parent/Guardian** — linked to one or more athletes; has contact phone (consent status
  unknown — OQ-02).
- **Coach** — assigned to one or more cohorts.
- **Session** — a scheduled practice/event for a cohort, with date/time.
- **AttendanceRecord** — per athlete per session, recorded by the existing system (read-only
  here).
- **RecruitingProfile** — public page per athlete (read/extend in Slice 11 only).
- **GearStock** — existing stocked shirts/shorts with (assumed) quantity tracking (OQ-06).

**New (introduced by this plan):**

- **BoardPost** — coach-authored post, scoped to one cohort.
- **Comment** — parent-authored reply to a BoardPost; carries filter status and report state.
- **CommentReport** — moderation record created by the report button.
- **HubFile** — file metadata (uploader, cohort, size, type) plus stored object; ≤100MB.
- **Rsvp** — one logical record per athlete per session (latest response wins).
- **ReminderDispatch** — log of reminder texts sent (recipient, session, timestamp) enforcing
  at-most-once.
- **Product** — sellable view over existing GearStock items (shirts/shorts, sizes).
- **Order / OrderItem** — a parent's purchase; references the charge.
- **PaymentCharge** — record of the card charge attempt and outcome (provider TBD — OQ-04).
- **BadgeDefinition** — an attendance-streak rule (e.g., N consecutive sessions attended).
- **BadgeAward** — an athlete's earned badge, derived solely from AttendanceRecords.
- **ConsentRecord** — guardian consent for public badge display (shape gated on OQ-03).

## States and transitions

Comment lifecycle (filter before visibility; report flags, does not auto-delete — OQ-07):

```
submitted -> rejected_by_filter        (never visible)
submitted -> visible
visible   -> reported  -> removed | restored   (coach/moderator decision)
```

Order lifecycle (charge on order — synchronous capture; no order exists as fulfillable without a
successful charge):

```
cart -> placed(charge attempted)
placed -> paid          (charge succeeded; stock decremented atomically)
placed -> charge_failed (terminal; nothing owed, nothing reserved)
paid  -> fulfilled      (handed over at practice, staff-marked)
paid  -> refunded       (staff-only escape hatch; policy gated on OQ-04)
```

Rsvp: `unanswered -> yes | no` (re-answerable; latest wins; headcount = count of `yes`).

HubFile: `uploading -> available | rejected_too_large` (rejection happens before storage commit).

BadgeAward: `none -> earned` (append-only, recomputed from attendance; never manually granted).
Public display of an earned badge additionally requires `ConsentRecord = granted` (INV-16).

ReminderDispatch: one row per (recipient, session) — existence of the row blocks re-send.
