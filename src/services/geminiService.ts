export interface HeartData {
  age: number;
  sex: number;
  cp: number;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: number;
  thalach: number;
  exang: number;
  oldpeak: number;
  slope: number;
  ca: number;
  thal: number;
}

export interface AnalysisResult {
  riskLevel: "Low" | "Medium" | "High";
  probability: number;
  insights: string;
  recommendations: string[];
}

export async function analyzeHeartHealth(data: HeartData): Promise<AnalysisResult> {
  const prompt = `Analyze the following heart clinical data for potential heart disease risk. 
  Data: ${JSON.stringify(data)}
  
  Please provide a structured analysis including:
  1. Risk Level (Low, Medium, High).
  2. Estimated risk probability (0.0 to 1.0).
  3. Brief clinical insights based on benchmarks.
  4. 3-4 actionable medical recommendations.
  
  Format the response as a valid JSON object matching the AnalysisResult interface.`;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze heart health data.");
    }

    return await response.json() as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during health analysis.");
  }
}
