// import Groq from "groq-sdk";
// import { Patent } from "@/types/patent";
// import { Compound } from "@/types/compound";

// function getGroqClient() {
//   const key = (process.env.GROQ_API_KEY || "").trim();
//   if (!key) {
//     throw new Error("GROQ_API_KEY is not set in environment variables");
//   }
//   return new Groq({ apiKey: key });
// }

// export async function analyzePatents(
//   compound: Compound,
//   patents: Patent[],
//   target?: string,
//   disease?: string,
//   description?: string
// ): Promise<Patent[]> {

//   // Take up to 10 patents for deeper analysis; AI will select the best 5
//   const candidatePatents = patents.slice(0, 10);

//   const prompt = `
// You are an expert pharmaceutical patent analyst with deep knowledge of drug chemistry, IP law, and biochemical mechanisms.

// Your task is to:
// 1. Evaluate ALL candidate patents below for relevance to the submitted compound.
// 2. SELECT the 5 most relevant patents based on chemical overlap, therapeutic overlap, and novelty concerns.
// 3. Return ONLY those 5 patents in your JSON response, ranked from most to least relevant.
// 4. For each patent, classify its type and provide a comprehensive analysis.

// IMPORTANT RULES

// 1. Use ONLY the information provided below.
// 2. Do NOT invent chemical mechanisms, therapeutic effects, or patent claims.
// 3. If information is insufficient, explicitly state "Insufficient metadata".
// 4. Analyze EACH patent independently.
// 5. Do NOT repeat the same explanation for different patents.
// 6. Return ONLY valid JSON.
// 7. Do NOT include markdown, notes, or explanatory text outside the JSON.
// 8. SELECT the 5 most relevant from all candidates provided.

// IMPORTANT LANGUAGE RULE

// If the patent title or abstract is written in any language other than English:
// - Translate it into natural English.
// - Do NOT summarize. Preserve the technical meaning.
// - Return the translated abstract in the JSON response.
// If it is already in English, return it unchanged.

// ==================================================
// SCORING GUIDELINES
// ==================================================

// Assign scores conservatively. Use precise integer scores, not rounded multiples of 5 or 10.

// Relevance Score (0-100)
// 90-100 → Extremely similar compound with strong chemical AND therapeutic overlap.
// 70-89  → Strong relevance with meaningful overlap.
// 50-69  → Moderate relevance. Some overlap exists but important differences remain.
// 30-49  → Weak relevance. Limited or indirect relationship.
// 0-29   → Little or no meaningful relevance.

// Confidence Score (0-100)
// 90-100 → Metadata strongly supports the assessment.
// 70-89  → Reasonably confident.
// 40-69  → Some uncertainty due to incomplete metadata.
// 0-39   → Insufficient metadata for reliable assessment.

// Examples: use 63, 71, 78, 84, 87 — NOT 60, 70, 80, 90.

// ==================================================
// PATENT TYPE CLASSIFICATION
// ==================================================

// Classify each patent as EXACTLY ONE of:
// - Composition of Matter
// - Process / Manufacturing
// - Formulation
// - Drug Delivery
// - New Therapeutic Indication
// - Salt / Polymorph / Prodrug
// - Combination Therapy

// Base classification on the patent title and abstract content.

// ==================================================
// COMPOUND
// ==================================================

// Name:
// ${compound.name}

// Molecular Formula:
// ${compound.molecularFormula}

// Canonical SMILES:
// ${compound.canonicalSmiles}

// Synonyms:
// ${(compound.synonyms ?? []).slice(0, 10).join(", ")}

// Target:
// ${target || "Not Provided"}

// Disease:
// ${disease || "Not Provided"}

// Researcher Description / Additional Context:
// ${description || "Not Provided"}

// ==================================================
// CANDIDATE PATENTS (evaluate all, select best 5)
// ==================================================

// ${candidatePatents.map((p, i) => `
// Patent ${i + 1}

// Patent Number: ${p.patentNumber}
// Title: ${p.title}
// Assignee: ${p.assignee}
// Publication Date: ${p.publicationDate}
// Abstract: ${(p.abstract ?? "").substring(0, 600)}
// `).join("\n")}

// ==================================================
// TASK
// ==================================================

// 1. Evaluate all ${candidatePatents.length} patents above.
// 2. Select the 5 MOST RELEVANT to the submitted compound.
// 3. For each selected patent, provide:
//    - A detailed 4–6 sentence explanation explaining WHY it was selected, chemical similarity, therapeutic overlap, and any limitations.
//    - Chemical overlap analysis (1–2 sentences).
//    - Therapeutic overlap analysis (1–2 sentences).
//    - Patent type classification from the list above.
//    - Risk level.

// Return ONLY a JSON array of exactly 5 objects.

// Format:
// [
// {
//   "patentNumber":"US-XXXXXXX-XX",
//   "translatedAbstract":"English abstract here",
//   "score":82,
//   "confidence":76,
//   "summary":"Detailed 4-6 sentence explanation of relevance, selection rationale, chemical similarity, therapeutic overlap, and confidence limitations.",
//   "chemicalOverlap":"One or two sentences on chemical similarity.",
//   "therapeuticOverlap":"One or two sentences on therapeutic overlap.",
//   "patentType":"Composition of Matter",
//   "riskLevel":"Medium"
// }
// ]

// riskLevel MUST be exactly one of: Low | Medium | High
// patentType MUST be exactly one of the 7 categories listed above.

// The response MUST start with '['.
// The response MUST end with ']'.
// Return NOTHING except the JSON array.
// `;

//   const response = await getGroqClient().chat.completions.create({
//     model: "llama-3.3-70b-versatile",
//     temperature: 0.2,
//     messages: [{ role: "user", content: prompt }],
//   });

//   const text = response.choices[0].message.content ?? "[]";

//   const cleaned = text
//     .replace(/```json/g, "")
//     .replace(/```/g, "")
//     .trim();

//   const start = cleaned.indexOf("[");
//   const end = cleaned.lastIndexOf("]");

//   if (start === -1 || end === -1) {
//     throw new Error("No JSON array found in Groq response.");
//   }

//   const jsonOnly = cleaned.substring(start, end + 1);

//   let rankings: any[] = [];

//   try {
//     rankings = JSON.parse(jsonOnly);
//   } catch (error) {
//     console.log("========== GROQ RAW RESPONSE ==========");
//     console.log(text);
//     console.log("========================================");
//     throw new Error("Groq returned an invalid JSON response.");
//   }

//   // Build map of candidate patents by number for fast lookup
//   const patentMap = new Map(candidatePatents.map((p) => [p.patentNumber, p]));

//   // Map AI rankings back to patent objects (preserving AI-selected order)
//   const rankedPatents: Patent[] = rankings
//     .slice(0, 5)
//     .map((ai: any) => {
//       const original = patentMap.get(ai.patentNumber);
//       if (!original) {
//         // AI may have returned a slightly different ID — try fuzzy match
//         const fuzzy = candidatePatents.find((p) =>
//           p.patentNumber.includes(ai.patentNumber) || ai.patentNumber.includes(p.patentNumber)
//         );
//         if (!fuzzy) return null;
//         return buildPatent(fuzzy, ai);
//       }
//       return buildPatent(original, ai);
//     })
//     .filter(Boolean) as Patent[];

//   // If AI returned fewer than 5, pad with remaining high-relevance candidates
//   if (rankedPatents.length < 5) {
//     const usedNumbers = new Set(rankedPatents.map((p) => p.patentNumber));
//     const remaining = candidatePatents.filter((p) => !usedNumbers.has(p.patentNumber));
//     for (const extra of remaining) {
//       if (rankedPatents.length >= 5) break;
//       rankedPatents.push({ ...extra, relevanceScore: 0, confidence: 0 });
//     }
//   }

//   return rankedPatents;
// }

// function buildPatent(original: Patent, ai: any): Patent {
//   return {
//     ...original,
//     abstract:
//       ai.translatedAbstract?.trim() ? ai.translatedAbstract : original.abstract,
//     relevanceScore: ai.score,
//     confidence: ai.confidence,
//     aiExplanation:
//       `${ai.summary}

// Chemical Overlap: ${ai.chemicalOverlap}

// Therapeutic Overlap: ${ai.therapeuticOverlap}

// Patent Type: ${ai.patentType}

// Risk Level: ${ai.riskLevel}`,
//   };
// }


import OpenAI from "openai";
import { Patent } from "@/types/patent";
import { Compound } from "@/types/compound";

function getFeatherlessClient() {
  const key = (process.env.FEATHERLESS_API_KEY || "").trim();

  if (!key) {
    throw new Error("FEATHERLESS_API_KEY is not set in environment variables");
  }

  return new OpenAI({
    apiKey: key,
    baseURL: "https://api.featherless.ai/v1",
  });
}

export async function analyzePatents(
  compound: Compound,
  patents: Patent[],
  target?: string,
  disease?: string,
  description?: string
): Promise<Patent[]> {

  // Take up to 10 patents for deeper analysis
  const candidatePatents = patents.slice(0, 10);

  const prompt = `
You are an expert pharmaceutical patent analyst with deep knowledge of drug chemistry, IP law, and biochemical mechanisms.

Evaluate ALL candidate patents and return ONLY the 5 most relevant patents.

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do NOT include markdown.
- Do NOT include explanations outside JSON.
- The response MUST start with '[' and end with ']'.

COMPOUND
Name: ${compound.name}
Molecular Formula: ${compound.molecularFormula}
Canonical SMILES: ${compound.canonicalSmiles}
Synonyms: ${(compound.synonyms ?? []).slice(0, 10).join(", ")}

Target: ${target || "Not Provided"}
Disease: ${disease || "Not Provided"}
Description: ${description || "Not Provided"}

CANDIDATE PATENTS
${candidatePatents.map((p, i) => `
Patent ${i + 1}
Patent Number: ${p.patentNumber}
Title: ${p.title}
Assignee: ${p.assignee}
Publication Date: ${p.publicationDate}
Abstract: ${(p.abstract ?? "").substring(0, 600)}
`).join("\n")}

Return EXACTLY 5 objects in this JSON format:

[
  {
    "patentNumber": "US-XXXXXXX",
    "translatedAbstract": "English abstract",
    "score": 82,
    "confidence": 76,
    "summary": "Detailed explanation",
    "chemicalOverlap": "Chemical overlap explanation",
    "therapeuticOverlap": "Therapeutic overlap explanation",
    "patentType": "Composition of Matter",
    "riskLevel": "Medium"
  }
]
`;

  const response = await getFeatherlessClient().chat.completions.create({
    model: "Qwen/Qwen2.5-7B-Instruct",
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0].message.content ?? "[]";

  console.log("========== FEATHERLESS RAW RESPONSE ==========");
  console.log(text);
  console.log("==============================================");

  // Remove markdown fences if present
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Extract first JSON array anywhere in response
  const match = cleaned.match(/\[[\s\S]*\]/);

  if (!match) {
    throw new Error("No JSON array found in Featherless response.");
  }

  const jsonOnly = match[0];

  let rankings: any[] = [];

  try {
    rankings = JSON.parse(jsonOnly);

    if (!Array.isArray(rankings)) {
      throw new Error("Response is not a JSON array");
    }
  } catch (error) {
    console.log("========== CLEANED JSON ==========");
    console.log(jsonOnly);
    console.log("==================================");
    throw new Error("Featherless returned an invalid JSON response.");
  }

  // Build map of candidate patents by number
  const patentMap = new Map(candidatePatents.map((p) => [p.patentNumber, p]));

  // Map AI rankings back to patent objects
  const rankedPatents: Patent[] = rankings
    .slice(0, 5)
    .map((ai: any) => {
      const original = patentMap.get(ai.patentNumber);

      if (!original) {
        // Fuzzy fallback
        const fuzzy = candidatePatents.find((p) =>
          p.patentNumber.includes(ai.patentNumber) ||
          ai.patentNumber.includes(p.patentNumber)
        );

        if (!fuzzy) return null;

        return buildPatent(fuzzy, ai);
      }

      return buildPatent(original, ai);
    })
    .filter(Boolean) as Patent[];

  // Pad with remaining candidates if AI returned fewer than 5
  if (rankedPatents.length < 5) {
    const usedNumbers = new Set(rankedPatents.map((p) => p.patentNumber));

    const remaining = candidatePatents.filter(
      (p) => !usedNumbers.has(p.patentNumber)
    );

    for (const extra of remaining) {
      if (rankedPatents.length >= 5) break;

      rankedPatents.push({
        ...extra,
        relevanceScore: 0,
        confidence: 0,
      });
    }
  }

  return rankedPatents;
}

function buildPatent(original: Patent, ai: any): Patent {
  return {
    ...original,
    abstract:
      ai.translatedAbstract?.trim()
        ? ai.translatedAbstract
        : original.abstract,

    relevanceScore: ai.score ?? 0,
    confidence: ai.confidence ?? 0,

    aiExplanation: `${ai.summary ?? ""}

Chemical Overlap: ${ai.chemicalOverlap ?? "Not provided"}

Therapeutic Overlap: ${ai.therapeuticOverlap ?? "Not provided"}

Patent Type: ${ai.patentType ?? "Not provided"}

Risk Level: ${ai.riskLevel ?? "Not provided"}`,
  };
}