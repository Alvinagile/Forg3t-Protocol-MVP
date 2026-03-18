# Replay Verification Design

1. Read signed evidence object.
2. Validate signature and schema version.
3. Re-run evaluator with locked config + seed + prompt corpus.
4. Compare replay metrics with stored before/after references.
5. Emit replay verdict: match/mismatch with drift reason.

Fail states:
- missing artifact references
- signature failure
- evaluator version mismatch
- non-deterministic output beyond tolerance
