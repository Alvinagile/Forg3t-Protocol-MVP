export interface LocalUnlearningConfig {
  model_path: string;
  output_dir: string;
  target_text: string;
  method: 'EmbeddingScrub' | 'LastLayerSurgery';
  max_steps: number;
  lr: number;
  seed: number;
}

export interface LocalJobStatus {
  state: 'queued' | 'running' | 'done' | 'error';
  progress?: {
    percent: number;
    message: string;
  };
  result?: {
    before_similarity?: number;
    after_similarity?: number;
    before_logit?: number;
    after_logit?: number;
    artifact_path: string;
    notes: string;
  };
  error?: string;
}

export interface LocalStartResponse {
  job_id: string;
}

export interface LocalArtifactInfo {
  name: string;
  size: number;
  sha256: string;
}

export interface LocalArtifactIndexResponse {
  artifacts: LocalArtifactInfo[];
}

export interface LocalVersionResponse {
  runner_version: string;
  git_short_sha: string;
}

export interface LocalUnlearningResult {
  success: boolean;
  before_similarity?: number;
  after_similarity?: number;
  before_logit?: number;
  after_logit?: number;
  artifact_path?: string;
  notes?: string;
  error?: string;
  weight_diff_summary?: {
    num_tensors_changed: number;
    total_params_changed: number;
    l2_norm_of_delta: number;
    max_abs_delta: number;
    percent_nonzero: number;
    top_10_indices_by_abs_delta: number[];
  };
  artifacts?: LocalArtifactInfo[];
}