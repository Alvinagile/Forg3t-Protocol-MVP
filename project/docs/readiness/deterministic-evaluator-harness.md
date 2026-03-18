# Deterministic Evaluator Harness

- Fixed seed policy per run.
- Version-locked evaluator config.
- Immutable test corpus IDs.
- Store before/after hashes and exact prompt list.
- Disable random generation in production evidence mode.
- Simulated/demo mode must be explicitly labeled `evidence_status=simulated`.
