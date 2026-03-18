# Environment and Credential Inventory

## Required runtime variables
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY (fallback)
- PINATA_API_KEY
- PINATA_API_SECRET_API_KEY
- ALLOW_SIMULATED_UNLEARNING (default false)
- VITE_ALLOW_SIMULATED_CRYPTO (frontend demo-only crypto simulation switch; default false)
- VITE_ALLOW_SIMULATED_ONCHAIN (frontend demo-only on-chain simulation switch; default false)

## Runtime behavior
- Missing Pinata vars => upload endpoint returns `evidence_status=blocked`.
- Missing Supabase vars => proof lookup blocked and process-model status persistence blocked.
- ALLOW_SIMULATED_UNLEARNING=false => process-model path returns blocked.
- VITE_ALLOW_SIMULATED_CRYPTO=false => `ZKProofGenerator` fails closed (no simulated proof generation).
- VITE_ALLOW_SIMULATED_ONCHAIN=false => `StellarService` fails closed for commit/verification simulation.
