import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function extractPdf(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/api/extract", formData);
  return response.data;
}

export async function analyze(resumeText, jobText) {
  const response = await api.post("/api/analyze", { resumeText, jobText });
  return response.data;
}
