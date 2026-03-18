# Whitebox Evidence Policy

Allowed whitebox claim levels:
1. control-plane only
2. suppression verified
3. artifact-level mutation verified

Disallowed unless proven:
- model-level deletion claims without artifact diff + regression evidence.

Minimum evidence for artifact-level mutation:
- checkpoint/adapter diff reference
- before/after benchmark report
- non-target regression check
- signed evidence object
