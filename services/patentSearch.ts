import { Patent } from "@/types/patent";
import { Compound } from "@/types/compound";

const BASE_URL = "https://www.surechembl.org/api";

/**
 * Strip characters that Solr treats as query-syntax operators.
 * SureChEMBL's internal Solr engine throws "end-of-string expected"
 * when the query contains unescaped: ( ) [ ] { } / + - ! ^ ~ * ? : " \
 * We simply remove them and collapse extra whitespace.
 */
function sanitizeSolrQuery(query: string): string {
  return query
    .replace(/[()[\]{}/+\-!^~*?:\\"]/g, " ")  // replace Solr special chars with space
    .replace(/\s+/g, " ")                        // collapse multiple spaces
    .trim();
}

async function getPatentAbstract(docId: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/document/${encodeURIComponent(docId)}/contents`
    );

    if (!response.ok) return "";

    const data = await response.json();

    const html =
      data?.data?.contents?.patentDocument?.abstracts?.[0]?.section?.content ?? "";

    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

async function getPatentFamilyKey(docId: string): Promise<string> {
  try {
    const response = await fetch(
      `${BASE_URL}/document/${encodeURIComponent(docId)}/family/members`
    );

    if (!response.ok) {
      return docId;
    }

    const data = await response.json();

    const family = data.data?.[docId];

    if (!family?.members) {
      return docId;
    }

    const members = family.members
      .map((member: any) => Object.keys(member)[0])
      .sort();

    return members.join("|");
  } catch {
    return docId;
  }
}

export async function searchPatents(query: string) {

  // Sanitize query to remove Solr special characters that cause parse errors
  // e.g. parentheses in "COX-1 / COX-2" break SureChEMBL's Solr engine
  const safeQuery = sanitizeSolrQuery(query);

  console.log("SureChEMBL URL:");
  console.log(
    `${BASE_URL}/search/content?query=${encodeURIComponent(
      safeQuery
    )}&page=1&itemsPerPage=20`
  );

  const response = await fetch(
    `${BASE_URL}/search/content?query=${encodeURIComponent(
      safeQuery
    )}&page=1&itemsPerPage=30`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("SureChEMBL Error:", errorText);

    throw new Error(
      `SureChEMBL search failed (${response.status})`
    );
  }

  const json = await response.json();

  const documents = json.data?.results?.documents ?? [];

  const patents: Patent[] = [];

  const seenFamilies = new Set<string>();

  for (const doc of documents) {

    const familyKey = await getPatentFamilyKey(doc.docId);

    if (seenFamilies.has(familyKey)) {
      continue;
    }

    seenFamilies.add(familyKey);

    const abstract = await getPatentAbstract(doc.docId);

    const title =
      doc.metadata?.titles?.find((t: any) => t.lang === "en")
        ?.titles?.[0] ??
      doc.metadata?.titles?.[0]?.titles?.[0] ??
      "Unknown Title";

    if (
      title === "Unknown Title" &&
      !abstract.trim()
    ) {
      continue;
    }

    patents.push({
      patentNumber: doc.docId,

      title,

      assignee: doc.pa ?? "Unknown",

      publicationDate: doc.metadata?.pd ?? "",

      abstract,

      source: "SureChEMBL",

      relevanceScore: 0,

      confidence: 0,

      aiExplanation: "",
    });

    // Collect up to 10 unique patents for AI selection
    if (patents.length === 10) {
      break;
    }
  }

  return patents;
}