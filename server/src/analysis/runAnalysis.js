import { GoogleGenAI } from "@google/genai";
import { keepSupportedMatches } from "./evidence.js";
import { buildAnalysisPrompt } from "./prompt.js";
import { analysisResultSchema } from "./schema.js";

function describeRequestError(error) {
  const details = [];
  if (Number.isInteger(error?.status)) details.push(`HTTP ${error.status}`);
  if (typeof error?.code === "string" && /^[a-z0-9_-]{1,40}$/i.test(error.code)) {
    details.push(error.code);
  }
  if (details.length === 0 && typeof error?.name === "string") {
    details.push(error.name.replace(/[^a-z0-9_-]/gi, "").slice(0, 40));
  }
  return `Gemini request failed${details.length ? ` (${details.join(", ")})` : ""}.`;
}

export async function runAnalysis(resumeText, jobText) {
  const prompt = buildAnalysisPrompt(resumeText, jobText);
  let lastFailure = "Gemini returned an invalid response.";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0,
        },
      });
      let parsedJson;
      try {
        parsedJson = JSON.parse(response.text);
      } catch {
        lastFailure = "Gemini returned invalid JSON.";
        continue;
      }

      const validated = analysisResultSchema.safeParse(parsedJson);

      if (validated.success) {
        return keepSupportedMatches(validated.data, resumeText);
      }
      const invalidPaths = validated.error.issues
        .map(({ path }) => path.join("."))
        .filter(Boolean);
      lastFailure = invalidPaths.length
        ? `Gemini response failed schema validation (${invalidPaths.join(", ")}).`
        : "Gemini response failed schema validation.";
    } catch (error) {
      lastFailure = describeRequestError(error);
    }
  }

  throw new Error(lastFailure);
}
