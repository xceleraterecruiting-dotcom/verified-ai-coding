# Fixture domains (v0.6)

The spec-compiler is validated against fixtures drawn from three REAL systems the harness is
actively used on, plus three synthetic sanity fixtures. Each real fixture is a paraphrase of
product intent with its answer-key material excluded and ground-truth classes pre-registered in
`proofs/proof-10-spec-compiler-fixture-evals.md` before any compile runs.

| Fixture | Domain | What it proves the planner can extract |
|---|---|---|
| `cpa-payments.md` | **Money / status transitions** (Charleston Passing Academy — real payments app with a 3-round reviewed money path) | session-lifecycle safety, amount/currency verification, reversal-closes-payment-window, capacity serialization, verified-email account-claim, duplicate-registration harm paths |
| `xr-marketing-governance.md` | **AI-output governance** (XR Marketing Content Engine — real recruiting-media system) | source-backed content, no fabrication, private-data/minors/likeness protection, human-approval-before-publish (incl. the deliberate autonomy trap), dry-run-first publishing, model/prompt/run traceability, deterministic gate, golden cases, deferred learning loop |
| `xr-orchestration-offers.md` | **Orchestration / data integrity** (XR slice 1.10b — real reviewed slice) | offer-distinguishing dedupe identity, strict timestamp validation, no-persist-on-invalid, FAILED-not-500 run finalization, leak-safe stored errors, per-draft provenance |
| `groundtruth-enterprise-agent.md` | **Enterprise-agent trust boundaries** (GroundTruth — real permission-aware assistant) | pre-context ACL filtering, permission-safe retrieval, leak validation, abstention, grounded citations, metric-semantics honesty, ACL-metadata ambiguity, orphan-doc default-deny, negative controls, PASS-vs-insufficient-evidence launch gates |
| `auth-coach-portal.md` | Permission/tenancy sanity (synthetic) | invite-only access, tenant scoping, revocation, multi-tenant membership |
| `multi-slice-team-hub.md` | Decomposition sanity (synthetic) | a deliberately tangled spec that must not become one slice |
| `cosmetic-landing-refresh.md` | Level-0 proportionality (synthetic) | no invented ceremony; small plan for small work |

Deployment-context classes (behind-main drift, additive-schema checks, prod-guard verification —
surfaced by XR's real pre-deploy gate run) are registered but **deferred to the v0.7 pre-deploy
layer**; they are deploy-time evidence, not planning-time extraction.

Eval status per fixture lives in proof-10 and is updated only when an eval actually runs — a
committed fixture is not an evaluated fixture.
