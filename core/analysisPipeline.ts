import { getCompound } from "@/services/pubchem";
import { searchPatents } from "@/services/patentSearch";
import { analyzePatents } from "@/services/groq";
import { generateKeywords } from "./keywordGenerator";
import { generateReport } from "@/services/report";
import { saveAnalysis } from "@/services/history";
import { Patent } from "@/types/patent";

export function buildGraph(
  smiles: string,
  target: string | undefined,
  disease: string | undefined,
  patents: Patent[]
) {
  const queryLabel = [smiles, target, disease]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 60);
  const topPatents = patents.slice(0, 5);

  const patentType = (patent: Patent) =>
    patent.aiExplanation?.match(/Patent Type:\s*(.+)/i)?.[1]?.trim() || "Composition of Matter";

  const riskLevel = (patent: Patent) =>
    patent.aiExplanation?.match(/Risk Level:\s*(.+)/i)?.[1]?.trim() || "Medium";

  const explanationLine = (patent: Patent, label: string) =>
    patent.aiExplanation?.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"))?.[1]?.trim() || "";

  const ideaRelation = (patent: Patent) => {
    return {
      label: patent.relevanceScore >= 80 ? "High Relevance Match" : "AI Semantic Match",
      type: patent.relevanceScore >= 80 ? ("high" as const) : ("semantic" as const),
      color: patent.relevanceScore >= 80 ? "#10b981" : "#06b6d4",
      reason: patent.aiExplanation?.split("\n")[0] || "Selected based on AI multi-vector relevance scoring.",
    };
  };

  const titleTerms = (title: string) =>
    new Set(
      (title.toLowerCase().match(/[a-z0-9]{5,}/g) || []).filter(
        (word) => !["method", "composition", "compound", "patent", "treatment", "inhibitor"].includes(word)
      )
    );

  const edgeStyle = (type: "semantic" | "high" | "assignee" | "type" | "terms") => ({
    high: { stroke: "#10b981", strokeWidth: 3.5 },
    semantic: { stroke: "#06b6d4", strokeWidth: 3 },
    assignee: { stroke: "#8b5cf6", strokeWidth: 2.5, strokeDasharray: "4,4" },
    type: { stroke: "#f59e0b", strokeWidth: 2.5, strokeDasharray: "4,4" },
    terms: { stroke: "#ec4899", strokeWidth: 2, strokeDasharray: "3,3" },
  }[type]);

  const positions = [
    { x: 0, y: -250 },      // Top
    { x: 360, y: -110 },    // Top Right
    { x: 300, y: 220 },     // Bottom Right
    { x: -300, y: 220 },    // Bottom Left
    { x: -360, y: -110 },   // Top Left
  ];

  const patentNodes = topPatents.map((patent, index) => {
    const pos = positions[index % positions.length];
    const chemical = explanationLine(patent, "Chemical Overlap");
    const therapeutic = explanationLine(patent, "Therapeutic Overlap");
    const pType = patentType(patent);
    const rLevel = riskLevel(patent);

    return {
      id: `patent-${index + 1}`,
      type: "graph",
      data: {
        kind: "patent",
        label: patent.patentNumber,
        title: patent.title,
        subtitle: `${patent.relevanceScore}% match • ${pType}`,
        details: patent.title,
        assignee: patent.assignee || "Unknown Assignee",
        confidence: patent.confidence,
        relevanceScore: patent.relevanceScore,
        publicationDate: patent.publicationDate,
        explanation: patent.aiExplanation,
        chemicalOverlap: chemical,
        therapeuticOverlap: therapeutic,
        patentType: pType,
        riskLevel: rLevel,
      },
      position: pos,
    };
  });

  const edges: any[] = topPatents.map((patent, index) => {
    const relation = ideaRelation(patent);
    return {
      id: `idea-patent-${index + 1}`,
      source: "user-idea",
      target: `patent-${index + 1}`,
      animated: true,
      label: relation.label,
      style: edgeStyle(relation.type),
      data: {
        category: relation.label,
        type: relation.type,
        color: relation.color,
        reason: relation.reason,
        chemicalOverlap: explanationLine(patent, "Chemical Overlap"),
        therapeuticOverlap: explanationLine(patent, "Therapeutic Overlap"),
        score: patent.relevanceScore,
        sourceLabel: "Your Innovation",
        targetLabel: patent.patentNumber,
      },
    };
  });

  for (let i = 0; i < topPatents.length; i += 1) {
    for (let j = i + 1; j < topPatents.length; j += 1) {
      const a = topPatents[i];
      const b = topPatents[j];
      const sharedTerms = [...titleTerms(a.title)].filter((term) => titleTerms(b.title).has(term));
      const sameAssignee = a.assignee && a.assignee !== "Unknown" && a.assignee === b.assignee;
      const sameType = patentType(a) !== "Unclassified" && patentType(a) === patentType(b);

      const relation = sameAssignee
        ? {
            label: "Shared Assignee",
            type: "assignee" as const,
            color: "#8b5cf6",
            reason: `Both patents are assigned to ${a.assignee}.`,
          }
        : sameType
        ? {
            label: "Same Patent Type",
            type: "type" as const,
            color: "#f59e0b",
            reason: `Both patents belong to the "${patentType(a)}" classification category.`,
          }
        : sharedTerms.length
        ? {
            label: "Overlapping Terms",
            type: "terms" as const,
            color: "#ec4899",
            reason: `Share common key technical title terms: ${sharedTerms.join(", ")}.`,
          }
        : null;

      if (relation) {
        edges.push({
          id: `patent-${i + 1}-patent-${j + 1}`,
          source: `patent-${i + 1}`,
          target: `patent-${j + 1}`,
          animated: false,
          label: relation.label,
          style: edgeStyle(relation.type),
          data: {
            category: relation.label,
            type: relation.type,
            color: relation.color,
            reason: relation.reason,
            sourceLabel: a.patentNumber,
            targetLabel: b.patentNumber,
          },
        });
      }
    }
  }

  return {
    nodes: [
      {
        id: "user-idea",
        type: "graph",
        data: {
          kind: "idea",
          label: "Your Innovation",
          subtitle: queryLabel || "Candidate Compound",
          details: "Central research compound concept being analyzed for patentability & overlap.",
        },
        position: { x: 0, y: 0 },
      },
      ...patentNodes,
    ],
    edges: edges.map((edge) => ({
      ...edge,
      labelStyle: { fill: "#0f172a", fontWeight: 700, fontSize: 11 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95, rx: 6, ry: 6 },
    })),
  };
}

export async function analyzeMolecule(
  smiles: string,
  target?: string,
  disease?: string,
  description?: string
) {
  const compound = await getCompound(smiles);

  const keywords = generateKeywords(
    compound,
    target,
    disease
  );

  console.log("Search Keywords:", keywords);
  console.log("Search Query:", keywords.join(" "));

  const patents = await searchPatents(
    keywords.join(" ")
  );

  const rankedPatents = await analyzePatents(
    compound,
    patents,
    target,
    disease,
    description
  );

  rankedPatents.sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );

  const report = await generateReport(
    compound,
    rankedPatents
  );

  const graph = buildGraph(
    smiles,
    target,
    disease,
    rankedPatents
  );

  await saveAnalysis(
    smiles,
    target,
    disease,
    compound,
    rankedPatents,
    report,
    graph
  );

  return {
    compound,
    patents: rankedPatents,
    report,
    graph,
  };
}
