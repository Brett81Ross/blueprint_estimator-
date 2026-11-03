// Keep provider formatting differences out of product-correctness assertions.
// Gemini commonly wraps numeric quantities in Markdown/LaTeX math delimiters.
export const fourPlumbingFixturesPattern =
  /(?:\$\s*)?(?:4|four)(?:\s*\$)?\s+(?:plumbing\s+)?fixtures?/i

export const eightPlumbingFixturesPattern =
  /(?:\$\s*)?(?:8|eight)(?:\s*\$)?\s+(?:plumbing\s+)?fixtures?/i
