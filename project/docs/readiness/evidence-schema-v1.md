# Evidence Schema v1

```json
{
  "request_id": "uuid",
  "job_id": "string|null",
  "customer_scope": "string",
  "system_scope": "string",
  "action_type": "suppression|revocation|artifact_mutation",
  "before_state_ref": "hash_or_uri",
  "after_state_ref": "hash_or_uri",
  "evaluator_version": "string",
  "timestamps": {
    "created_at": "iso8601",
    "updated_at": "iso8601"
  },
  "signature": "string",
  "replay_instructions": "string",
  "proof_boundary": "control-plane only|retrieval revocation|suppression verified|artifact-level mutation verified|model-level claim not established",
  "evidence_status": "pending|complete|incomplete|invalid|simulated|blocked"
}
```

Required complete fields: `zk_proof_hash`, `stellar_tx_id`, `ipfs_cid`.
