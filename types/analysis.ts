import { Compound } from "./compound";
import { Patent } from "./patent";
import { PatentabilityReport } from "./report";

export interface AnalysisResult {
  compound: Compound;
  patents: Patent[];
  report: PatentabilityReport;
  graph?: any;
}