export interface ElementContribution {
  symbol: string;
  count: number;
  atomicWeight: number;
  mass: number;
}

export interface LipinskiResult {
  mw: number;
  logP: number;
  hbd: number;
  hba: number;
  rotBonds: number;
  tpsa: number;
  formula: string;
  elements: ElementContribution[];
  aromaticRings: number;
  violations: number;
  pass: boolean;
  mwPass: boolean;
  logPPass: boolean;
  hbdPass: boolean;
  hbaPass: boolean;
}

export interface ADMEProperty {
  level: "High" | "Moderate" | "Low" | "Good" | "Poor";
  explanation: string;
}

export interface ADMEResult {
  absorption: ADMEProperty;
  distribution: ADMEProperty;
  metabolism: ADMEProperty;
  excretion: ADMEProperty;
  summary: string;
}

const ATOMIC_WEIGHTS: Record<string, number> = {
  C: 12.011,
  H: 1.008,
  O: 15.999,
  N: 14.007,
  S: 32.06,
  P: 30.974,
  F: 18.998,
  Cl: 35.453,
  Br: 79.904,
  I: 126.904,
};

export function calculateLipinski(smiles: string): LipinskiResult {
  const clean = smiles.trim();
  if (!clean) throw new Error("Empty SMILES string");

  // Parse elements
  const elementCounts: Record<string, number> = { C: 0, H: 0, O: 0, N: 0, S: 0, F: 0, Cl: 0, Br: 0, I: 0 };
  
  // Count C, O, N, S, F, Cl, Br, I from SMILES
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === "C" || char === "c") elementCounts.C++;
    else if (char === "O" || char === "o") elementCounts.O++;
    else if (char === "N" || char === "n") elementCounts.N++;
    else if (char === "S" || char === "s") elementCounts.S++;
    else if (char === "F") elementCounts.F++;
    else if (char === "C" && clean[i + 1] === "l") { elementCounts.Cl++; i++; }
    else if (char === "B" && clean[i + 1] === "r") { elementCounts.Br++; i++; }
    else if (char === "I") elementCounts.I++;
  }

  // Estimate hydrogens based on valence
  const estimatedH = Math.max(0, elementCounts.C * 2 + 2 - (clean.match(/=/g) || []).length * 2 - (clean.match(/#/g) || []).length * 4);
  elementCounts.H = estimatedH;

  const elements: ElementContribution[] = Object.entries(elementCounts)
    .filter(([_, count]) => count > 0)
    .map(([symbol, count]) => ({
      symbol,
      count,
      atomicWeight: ATOMIC_WEIGHTS[symbol] || 12.0,
      mass: count * (ATOMIC_WEIGHTS[symbol] || 12.0),
    }));

  const mw = elements.reduce((sum, el) => sum + el.mass, 0);

  // HBD: OH and NH groups
  const hbdMatches = clean.match(/O[Hh]|N[Hh]|\[OH\]|\[NH\]|\[NH2\]/g) || [];
  const hbd = Math.max(hbdMatches.length, (clean.match(/O/g) || []).length > 0 ? 1 : 0);

  // HBA: N + O count
  const hba = elementCounts.N + elementCounts.O;

  // LogP estimation
  const cCount = elementCounts.C;
  const oCount = elementCounts.O;
  const nCount = elementCounts.N;
  const haloCount = elementCounts.F + elementCounts.Cl + elementCounts.Br + elementCounts.I;
  const logP = Math.max(-1.5, Math.min(6.5, cCount * 0.25 + haloCount * 0.5 - oCount * 0.3 - nCount * 0.4));

  // TPSA estimation
  const tpsa = Math.round(oCount * 17.07 + nCount * 12.03 + hbd * 10.5);

  // Rotatable bonds
  const rotBonds = Math.max(0, (clean.match(/-/g) || []).length + Math.floor(cCount / 3));

  // Aromatic rings
  const aromaticRings = (clean.match(/c1|c2|c3|c4/g) || []).length;

  // Formula string
  const formula = Object.entries(elementCounts)
    .filter(([_, count]) => count > 0)
    .map(([sym, cnt]) => `${sym}${cnt > 1 ? cnt : ""}`)
    .join("");

  const mwPass = mw <= 500;
  const logPPass = logP <= 5;
  const hbdPass = hbd <= 5;
  const hbaPass = hba <= 10;

  let violations = 0;
  if (!mwPass) violations++;
  if (!logPPass) violations++;
  if (!hbdPass) violations++;
  if (!hbaPass) violations++;

  return {
    mw,
    logP,
    hbd,
    hba,
    rotBonds,
    tpsa,
    formula,
    elements,
    aromaticRings,
    violations,
    pass: violations <= 1,
    mwPass,
    logPPass,
    hbdPass,
    hbaPass,
  };
}

export function predictADME(lipinski: LipinskiResult): ADMEResult {
  const highAbs = lipinski.tpsa <= 140 && lipinski.logP >= 0 && lipinski.logP <= 3;
  const goodDist = lipinski.mw <= 400 && lipinski.logP <= 4;
  const modMet = lipinski.rotBonds <= 10;
  const goodExc = lipinski.mw <= 350;

  return {
    absorption: {
      level: highAbs ? "High" : "Moderate",
      explanation: highAbs
        ? "Favourable TPSA and lipophilicity suggest good gastrointestinal permeability."
        : "Moderate oral absorption expected based on molecular weight and polar surface area.",
    },
    distribution: {
      level: goodDist ? "Good" : "Moderate",
      explanation: goodDist
        ? "Favourable plasma protein binding and tissue distribution predicted."
        : "Moderate volume of distribution predicted; plasma protein binding may be elevated.",
    },
    metabolism: {
      level: modMet ? "Moderate" : "Low",
      explanation: modMet
        ? "Moderate metabolic stability expected with standard CYP450 substrate affinity."
        : "Higher metabolic clearance expected due to flexible rotatable bonds.",
    },
    excretion: {
      level: goodExc ? "Good" : "Moderate",
      explanation: goodExc
        ? "Renal and hepatic clearance mechanisms expected to clear compound effectively."
        : "Biliary excretion pathway likely dominant due to higher molecular mass.",
    },
    summary: highAbs && goodDist
      ? "Compound exhibits strong drug-like pharmacokinetic characteristics suitable for oral administration."
      : "Compound exhibits acceptable pharmacokinetic profile with minor parameters requiring optimization.",
  };
}
