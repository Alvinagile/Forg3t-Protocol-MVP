# Evidence Completeness Gate

Gate rule for compliance export:
- if any of `zk_proof_hash`, `stellar_tx_id`, `ipfs_cid`, `leak_score` is missing => block export.
- if evidence_status is `simulated`, `invalid`, `blocked`, `incomplete`, or `pending` => block export.
- only `evidence_status=complete` may generate enterprise certificate.

UI behavior:
- show explicit missing fields and do not auto-fill placeholders.
