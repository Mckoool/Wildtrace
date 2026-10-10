const API_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_BASE_URL");
}

export async function getCandidateRoads() {
  const response = await fetch(`${API_URL}/candidate-roads`);

  if (!response.ok) {
    throw new Error("Failed to load candidate roads");
  }

  return response.json();
}

export async function getCandidates() {
  const response = await fetch(`${API_URL}/candidates`);

  if (!response.ok) {
    throw new Error("Failed to load candidates");
  }

  return response.json();
}

export async function runSimulation(input: {
  intervention: string;
  road_id: number;
  radius_m: number;
}) {
  const response = await fetch(`${API_URL}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Simulation failed");
  }

  return data;
}