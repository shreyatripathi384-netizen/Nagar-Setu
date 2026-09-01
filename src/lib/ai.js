// Simple rule-based classifier (keyword matching on description text)
const CATEGORY_RULES = [
  { keywords: ["road", "sadak", "gaddha", "pothole", "crack", "footpath", "divider"], category: "Road", code: "PWD2026" },
  { keywords: ["water", "paani", "leak", "pipe", "sewage", "drain", "nali"], category: "Water", code: "WATER2026" },
  { keywords: ["light", "bijli", "electricity", "pole", "wire", "transformer"], category: "Electricity", code: "ELEC2026" },
  { keywords: ["garbage", "kachra", "waste", "safai", "trash", "dustbin"], category: "Garbage", code: "SANI2026" },
];

const HIGH_SEVERITY_WORDS = ["bahut", "bada", "dangerous", "urgent", "severe", "khatarnak", "accident"];
const LOW_SEVERITY_WORDS = ["chota", "minor", "small", "halka"];

export function classifyIssue(description) {
  const text = (description || "").toLowerCase();

  let matched = CATEGORY_RULES.find((rule) =>
    rule.keywords.some((word) => text.includes(word))
  );

  if (!matched) {
    matched = { category: "Other", code: "PWD2026" };
  }

  let severity = "Medium";
  if (HIGH_SEVERITY_WORDS.some((word) => text.includes(word))) {
    severity = "High";
  } else if (LOW_SEVERITY_WORDS.some((word) => text.includes(word))) {
    severity = "Low";
  }

  return {
    category: matched.category,
    severity,
    departmentCode: matched.code,
  };
}