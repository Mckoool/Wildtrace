const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function getCandidates() {
  const response = await fetch(`${API_URL}/candidates`);
  if (!response.ok) {
    throw new Error("Failed to load candidate roads");
  }
  return response.json();
}

export async function runSimulation(scenario) {
  const response = await fetch(`${API_URL}/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scenario),
  });
  if (!response.ok) {
    throw new Error("Simulation failed");
  }
  return response.json();
}