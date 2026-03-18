# Job Lifecycle Truth Table

| State | Meaning | Allowed next states | Export allowed |
|---|---|---|---|
| pending | accepted, not executed | processing, blocked, failed | No |
| processing | execution in progress | completed, failed, blocked | No |
| completed | execution done; evidence may still be incomplete | complete evidence, incomplete evidence | Only if evidence_status=complete |
| failed | execution failed | retry/pending | No |
| blocked | policy/security gate prevented execution | pending (after fix) | No |
