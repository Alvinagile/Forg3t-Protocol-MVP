# Remediation Backlog (Truth-Normalized)

## P0
| Title | Why it matters | Current evidence | Files | Fix | Validation | Owner | Dependency | Done criteria |
|---|---|---|---|---|---|---|---|---|
| Remove hardcoded Pinata secrets | Exposed credentials are an enterprise blocker | hardcoded key/secret in code | supabase/functions/upload-to-ipfs/index.ts | env-only credentials + fail-closed | missing env returns blocked | SecurityHotfixAgent | key rotation | no hardcoded credentials in repo |
| Remove simulated proof path | Simulated proof can be misread as real compliance evidence | proof endpoint generated random proof fields | supabase/functions/proof/index.ts | datastore-backed lookup + status taxonomy + no random fallbacks | proof returns complete only with real fields | EvidenceIntegrityAgent | Supabase credentials | no random proof fields |
| Block synthetic certificate exports | Customer-visible fake evidence is overclaim risk | dashboard export used random proof/ipfs/tx fallback | src/pages/Dashboard.tsx, src/components/dashboard/modules/ComplianceDashboard.tsx | fail-closed export with missing-field checks | export blocked when evidence missing | ProductHardeningAgent | none | no synthetic evidence in exports |
| Block unsafe whitebox in production mode | Randomized whitebox outputs cannot be treated as proof | process-model uses randomness in proof-relevant outputs | supabase/functions/process-model/index.ts | gate by ALLOW_SIMULATED_UNLEARNING=false default + explicit simulated labels | blocked response unless explicit demo mode | DeterministicExecutionAgent | env setup | production path fail-closed |
| Durable job status writes | Lifecycle truth must be persistent and auditable | updateJobStatus only logged | supabase/functions/process-model/index.ts | upsert to job_status | DB row updates observed | ProductHardeningAgent | Supabase credentials/table | no log-only status updates |

## P1
| Title | Why it matters | Files | Fix |
|---|---|---|---|
| Deterministic evaluator harness | reproducibility for diligence | new docs + evaluator service roadmap | locked seeds/profiled benchmark runs |
| Proof boundary report automation | avoid sales overclaiming | docs + API payload standard | per-request proof boundary artifact |
| Customer connector matrix | enterprise onboarding speed | docs/readiness | adapter-by-system support map |

## P2
| Title | Why it matters | Files | Fix |
|---|---|---|---|
| Sector annex packs | procurement acceleration | docs/readiness | BFSI/health/public-sector annexes |
| GTM language enforcement in CI | claim drift prevention | docs + lint/policy | banned-phrase checks in release checklist |
