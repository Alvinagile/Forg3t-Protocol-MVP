// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type EvidenceStatus =
  | "pending"
  | "complete"
  | "incomplete"
  | "invalid"
  | "simulated"
  | "blocked";

interface LookupResult {
  found: boolean;
  evidence_status: EvidenceStatus;
  proof_boundary: string;
  source?: "job_status" | "unlearning_requests";
  proof?: Record<string, unknown>;
  missing_fields?: string[];
  error?: string;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function getSupabaseClient() {
  // @ts-ignore
  const url = (typeof Deno !== "undefined" && Deno.env.get("SUPABASE_URL")) || "";
  // @ts-ignore
  const key =
    (typeof Deno !== "undefined" && Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ||
    // @ts-ignore
    (typeof Deno !== "undefined" && Deno.env.get("SUPABASE_ANON_KEY")) ||
    "";

  if (!url || !key) return null;

  // @ts-ignore
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function classifyProofFields(
  zk_proof_hash: unknown,
  stellar_tx_id: unknown,
  ipfs_cid: unknown,
): { complete: boolean; missing_fields: string[] } {
  const missing_fields: string[] = [];
  if (!zk_proof_hash || typeof zk_proof_hash !== "string") missing_fields.push("zk_proof_hash");
  if (!stellar_tx_id || typeof stellar_tx_id !== "string") missing_fields.push("stellar_tx_id");
  if (!ipfs_cid || typeof ipfs_cid !== "string") missing_fields.push("ipfs_cid");
  return { complete: missing_fields.length === 0, missing_fields };
}

async function lookupFromJobStatus(supabase: any, jobId: string): Promise<LookupResult> {
  try {
    const { data, error } = await supabase
      .from("job_status")
      .select("job_id,status,result,created_at,updated_at")
      .eq("job_id", jobId)
      .maybeSingle();

    if (error || !data) {
      return {
        found: false,
        evidence_status: "blocked",
        proof_boundary: "unknown",
      };
    }

    const result = (data.result && typeof data.result === "object") ? data.result : {};
    // @ts-ignore
    const simulated = result.simulated === true || result.evidence_status === "simulated";

    if (simulated) {
      return {
        found: true,
        evidence_status: "simulated",
        proof_boundary: "model-level claim not established",
        source: "job_status",
        error: "Simulated evidence cannot be exported as proof.",
      };
    }

    if (data.status === "failed") {
      return {
        found: true,
        evidence_status: "invalid",
        proof_boundary: "model-level claim not established",
        source: "job_status",
        error: "Job failed; proof is invalid.",
      };
    }

    if (data.status === "processing" || data.status === "pending") {
      return {
        found: true,
        evidence_status: "pending",
        proof_boundary: "model-level claim not established",
        source: "job_status",
        error: "Evidence generation is still pending.",
      };
    }

    // @ts-ignore
    const proofObj = (result.proof && typeof result.proof === "object") ? result.proof : result;
    // @ts-ignore
    const zk = proofObj.zk_proof_hash || proofObj.zk_proof;
    // @ts-ignore
    const tx = proofObj.stellar_tx_id || proofObj.blockchain_tx_hash;
    // @ts-ignore
    const ipfs = proofObj.ipfs_cid || proofObj.ipfs_hash;

    const check = classifyProofFields(zk, tx, ipfs);
    if (!check.complete) {
      return {
        found: true,
        evidence_status: "incomplete",
        proof_boundary: "model-level claim not established",
        source: "job_status",
        missing_fields: check.missing_fields,
        error: "Evidence exists but is incomplete.",
      };
    }

    return {
      found: true,
      evidence_status: "complete",
      proof_boundary: "suppression verified",
      source: "job_status",
      proof: {
        job_id: data.job_id,
        zk_proof_hash: zk,
        stellar_tx_id: tx,
        ipfs_cid: ipfs,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  } catch (error) {
    return {
      found: false,
      evidence_status: "blocked",
      proof_boundary: "unknown",
      error: error instanceof Error ? error.message : "Unknown lookup error",
    };
  }
}

async function lookupFromRequests(supabase: any, requestId: string): Promise<LookupResult> {
  try {
    const { data, error } = await supabase
      .from("unlearning_requests")
      .select("id,created_at,updated_at,blockchain_tx_hash,audit_trail")
      .eq("id", requestId)
      .maybeSingle();

    if (error || !data) {
      return {
        found: false,
        evidence_status: "blocked",
        proof_boundary: "unknown",
      };
    }

    const audit = (data.audit_trail && typeof data.audit_trail === "object") ? data.audit_trail : {};
    // @ts-ignore
    const simulated = audit.simulated === true || audit.evidence_status === "simulated";
    if (simulated) {
      return {
        found: true,
        evidence_status: "simulated",
        proof_boundary: "model-level claim not established",
        source: "unlearning_requests",
        error: "Simulated evidence cannot be exported as proof.",
      };
    }

    // @ts-ignore
    const zk = audit.zk_proof;
    const tx = data.blockchain_tx_hash;
    // @ts-ignore
    const ipfs = audit.ipfs_hash;
    const check = classifyProofFields(zk, tx, ipfs);
    if (!check.complete) {
      return {
        found: true,
        evidence_status: "incomplete",
        proof_boundary: "control-plane only",
        source: "unlearning_requests",
        missing_fields: check.missing_fields,
        error: "Evidence exists but is incomplete.",
      };
    }

    return {
      found: true,
      evidence_status: "complete",
      proof_boundary: "suppression verified",
      source: "unlearning_requests",
      proof: {
        request_id: data.id,
        zk_proof_hash: zk,
        stellar_tx_id: tx,
        ipfs_cid: ipfs,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  } catch (error) {
    return {
      found: false,
      evidence_status: "blocked",
      proof_boundary: "unknown",
      error: error instanceof Error ? error.message : "Unknown lookup error",
    };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("request_id");
    const jobId = url.searchParams.get("job_id");
    const lookupId = requestId || jobId;

    if (!lookupId) {
      return jsonResponse(
        {
          success: false,
          evidence_status: "blocked",
          proof_boundary: "unknown",
          error: "Missing request_id or job_id parameter.",
        },
        400,
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return jsonResponse(
        {
          success: false,
          evidence_status: "blocked",
          proof_boundary: "unknown",
          error: "Proof lookup is blocked: missing Supabase credentials.",
        },
        503,
      );
    }

    const jobLookup = await lookupFromJobStatus(supabase, lookupId);
    const requestLookup = await lookupFromRequests(supabase, lookupId);
    const candidates = [requestLookup, jobLookup].filter((c) => c.found);

    if (candidates.length === 0) {
      return jsonResponse(
        {
          success: false,
          evidence_status: "blocked",
          proof_boundary: "unknown",
          error: "No evidence record found for the provided identifier.",
        },
        404,
      );
    }

    const complete = candidates.find((c) => c.evidence_status === "complete");
    if (complete) {
      return jsonResponse({
        success: true,
        evidence_status: "complete",
        proof_boundary: complete.proof_boundary,
        source: complete.source,
        proof: complete.proof,
      });
    }

    const simulated = candidates.find((c) => c.evidence_status === "simulated");
    if (simulated) {
      return jsonResponse(
        {
          success: false,
          evidence_status: "simulated",
          proof_boundary: simulated.proof_boundary,
          source: simulated.source,
          error: simulated.error,
        },
        409,
      );
    }

    const invalid = candidates.find((c) => c.evidence_status === "invalid");
    if (invalid) {
      return jsonResponse(
        {
          success: false,
          evidence_status: "invalid",
          proof_boundary: invalid.proof_boundary,
          source: invalid.source,
          error: invalid.error,
        },
        422,
      );
    }

    const pending = candidates.find((c) => c.evidence_status === "pending");
    if (pending) {
      return jsonResponse(
        {
          success: false,
          evidence_status: "pending",
          proof_boundary: pending.proof_boundary,
          source: pending.source,
          error: pending.error,
        },
        202,
      );
    }

    const incomplete = candidates.find((c) => c.evidence_status === "incomplete")!;
    return jsonResponse(
      {
        success: false,
        evidence_status: "incomplete",
        proof_boundary: incomplete.proof_boundary,
        source: incomplete.source,
        missing_fields: incomplete.missing_fields ?? [],
        error: incomplete.error ?? "Evidence is incomplete.",
      },
      409,
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        evidence_status: "blocked",
        proof_boundary: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
