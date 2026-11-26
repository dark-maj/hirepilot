function normalizeWhitespace(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function keepSupportedMatches(analysis, resumeText) {
  const normalizedResume = normalizeWhitespace(resumeText);

  return {
    ...analysis,
    matched: analysis.matched.filter(({ evidence }) =>
      normalizedResume.includes(normalizeWhitespace(evidence)),
    ),
  };
}
