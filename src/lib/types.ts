export type Region = "India" | "China" | "USA" | "Europe" | "Southeast Asia";
export type ManufacturingMethod = "Auto" | "CNC Machining" | "Die Casting" | "Extrusion" | "Sheet Metal";
export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface CostItem {
  item: string;
  estimatedCost: string;
  notes?: string;
}

export interface ProcessAnalysis {
  recommendedProcess: string;
  alternativeProcess: string;
  keyMachiningChallenges: string[];
  estimatedCycleTime: string;
  suggestedToleranceCapability: string;
  fixtureComplexity: string;
  recommendedMachineType: string;
}

export interface DesignRiskAnalysis {
  thinWallRisks: string;
  toolAccessibility: string;
  warpageRisks: string;
  tightToleranceRisks: string;
  surfaceFinishRisks: string;
  threadingRisks: string;
  deepPocketRisks: string;
  dieCastingPorosityRisks: string;
}

export interface PartSummary {
  partName: string;
  manufacturingMethod: string;
  material: string;
  estimatedWeight: string;
  complexityLevel: string;
  suggestedBatchSize: string;
  estimatedAnnualVolume: string;
  machiningTimeHours?: string;
  helicoilCost?: string;
  manpowerCostPerUnit?: string;
  rawMaterialMarketPrice?: string;
}

export interface CostingResult {
  partSummary: PartSummary;
  costBreakdown: CostItem[];
  processAnalysis: ProcessAnalysis;
  designRiskAnalysis: DesignRiskAnalysis;
  costReductionIdeas: string[];
  confidenceLevel: ConfidenceLevel;
  confidenceExplanation: string;
  rawMarkdown: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface ProjectEntry {
  id: string;
  createdAt: string;
  region: Region;
  batchQuantity: number;
  preferredMethod: ManufacturingMethod;
  files: { name: string; type: string; size: number }[];
  result: CostingResult;
  notes?: string;
}

export interface AnalyzeRequest {
  files: UploadedFile[];
  region: Region;
  batchQuantity: number;
  preferredMethod: ManufacturingMethod;
  material?: string;
  additionalNotes?: string;
}
