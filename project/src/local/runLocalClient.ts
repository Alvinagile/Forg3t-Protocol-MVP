const LOCAL_SERVER_BASE_URL = 'http://127.0.0.1';
const LOCAL_SERVER_PORTS = [8787, 8788, 8789, 8790];

async function tryFetchWithPorts(endpoint: string, options: RequestInit = {}, customBaseUrl?: string): Promise<Response | null> {
  if (customBaseUrl) {
    try {
      const url = `${customBaseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        cache: 'no-store'
      });
      return response;
    } catch (error) {
      return null;
    }
  }
  
  for (const port of LOCAL_SERVER_PORTS) {
    try {
      const url = `${LOCAL_SERVER_BASE_URL}:${port}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        cache: 'no-store'
      });
      return response;
    } catch (error) {
      continue;
    }
  }
  return null;
}

export interface LocalUnlearningConfig {
  model_path: string;
  output_dir: string;
  target_text: string;
  method: 'EmbeddingScrub' | 'LastLayerSurgery';
  max_steps: number;
  lr: number;
  seed: number;
}

export interface JobStatus {
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

export interface StartResponse {
  job_id: string;
}

export interface ArtifactInfo {
  name: string;
  size: number;
  sha256: string;
}

export interface ArtifactIndexResponse {
  artifacts: ArtifactInfo[];
}

export interface VersionResponse {
  runner_version: string;
  git_short_sha: string;
}

export class LocalUnlearningClient {
  static async isOnline(customBaseUrl?: string): Promise<{ online: boolean; version?: VersionResponse }> {
    try {
      const response = await tryFetchWithPorts(`/status?job_id=ping&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }, customBaseUrl);
      
      if (!response) {
        return { online: false };
      }
      
      if (response.ok) {
        const data: JobStatus = await response.json();
        if (data.state === 'done') {
          try {
            const versionResponse = await tryFetchWithPorts(`/version?_t=${Date.now()}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            }, customBaseUrl);
            
            if (versionResponse && versionResponse.ok) {
              const versionData: VersionResponse = await versionResponse.json();
              return { online: true, version: versionData };
            }
          } catch (versionError) {
            console.warn('Could not get version info:', versionError);
          }
          return { online: true };
        }
      }
      return { online: false };
    } catch (error) {
      console.error('Local server is not reachable:', error);
      return { online: false };
    }
  }

  static async startJob(config: LocalUnlearningConfig, customBaseUrl?: string): Promise<StartResponse> {
    try {
      const response = await tryFetchWithPorts(`/start?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      }, customBaseUrl);

      if (!response) {
        throw new Error('Server is not reachable on any of the expected ports (8787, 8788, 8789, 8790). Please make sure the local unlearning server is running.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data: StartResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to start local unlearning job:', error);
      throw error;
    }
  }

  static async poll(job_id: string, onTick: (status: JobStatus) => void, customBaseUrl?: string): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await tryFetchWithPorts(`/status?job_id=${job_id}&_t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }, customBaseUrl);

          if (!response) {
            throw new Error('Server is not reachable');
          }

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
          }

          const status: JobStatus = await response.json();
          onTick(status);

          if (status.state === 'done') {
            clearInterval(pollInterval);
            resolve(status);
          } else if (status.state === 'error') {
            clearInterval(pollInterval);
            reject(new Error(status.error || 'Unknown error occurred'));
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, 1500);
    });
  }

  static async getArtifactIndex(job_id: string, customBaseUrl?: string): Promise<ArtifactIndexResponse> {
    try {
      const response = await tryFetchWithPorts(`/artifact_index?job_id=${job_id}&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }, customBaseUrl);

      if (!response) {
        throw new Error('Server is not reachable');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data: ArtifactIndexResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get artifact index:', error);
      throw error;
    }
  }

  static async probeModel(modelPath: string, customBaseUrl?: string): Promise<{ status: string; message: string }> {
    try {
      const response = await tryFetchWithPorts(`/probe?model_path=${encodeURIComponent(modelPath)}&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }, customBaseUrl);

      if (!response) {
        throw new Error('Server is not reachable');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to probe model:', error);
      throw error;
    }
  }
}