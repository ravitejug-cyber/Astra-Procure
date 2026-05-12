export type PCBLayer = 1 | 2 | 4 | 6 | 8 | 10 | 12;
export type PCBMaterial = "FR4 Standard" | "FR4 High-Tg 170" | "FR4 High-Tg 180" | "Rogers 4003C" | "Rogers 4350B" | "Polyimide / Flex" | "Aluminum";
export type PCBThickness = "0.4" | "0.6" | "0.8" | "1.0" | "1.2" | "1.6" | "2.0" | "2.4";
export type CopperWeight = "0.5oz" | "1oz" | "2oz" | "3oz";
export type TraceSpace = "3/3 mil" | "4/4 mil" | "5/5 mil" | "6/6 mil" | "8/8 mil";
export type ViaType = "Through-hole only" | "Blind Vias" | "Buried Vias" | "HDI / Microvias";
export type MinDrill = "0.10mm" | "0.15mm" | "0.20mm" | "0.25mm" | "0.30mm";
export type HoleCount = "<500" | "500-1000" | "1000-2000" | "2000-5000" | ">5000";
export type SurfaceFinish = "HASL (Leaded)" | "HASL Lead-Free" | "ENIG" | "ENEPIG" | "Immersion Silver" | "Immersion Tin" | "OSP" | "Hard Gold";
export type SolderMaskColor = "Green" | "Red" | "Blue" | "Black" | "White" | "Yellow" | "Purple" | "Matte Black" | "Matte Green";
export type SolderMaskCoverage = "Both Sides" | "Top Only" | "Bottom Only" | "None";
export type SilkscreenColor = "White" | "Black" | "Yellow";
export type SilkscreenCoverage = "Both Sides" | "Top Only" | "None";
export type IPCClass = "Class 1" | "Class 2" | "Class 3";
export type PCBTesting = "No Testing" | "Flying Probe (E-Test)" | "Flying Probe + AOI" | "ICT";
export type PCBRegion = "India" | "China" | "USA" | "Europe" | "Southeast Asia";

export interface PCBSpecialFeatures {
  controlledImpedance: boolean;
  goldFingers: boolean;
  viaInPad: boolean;
  castellatedHoles: boolean;
  backDrilling: boolean;
  pressFitHoles: boolean;
  countersinkHoles: boolean;
  carbonInk: boolean;
  peelableSolderMask: boolean;
}

export interface PCBAnalysisInput {
  layers: PCBLayer;
  boardWidth: number;
  boardHeight: number;
  thickness: PCBThickness;
  material: PCBMaterial;
  quantity: number;
  outerCopperWeight: CopperWeight;
  innerCopperWeight: CopperWeight;
  minTraceSpace: TraceSpace;
  viaType: ViaType;
  minDrill: MinDrill;
  holeCount: HoleCount;
  surfaceFinish: SurfaceFinish;
  solderMaskColor: SolderMaskColor;
  solderMaskCoverage: SolderMaskCoverage;
  silkscreenColor: SilkscreenColor;
  silkscreenCoverage: SilkscreenCoverage;
  ipcClass: IPCClass;
  testing: PCBTesting;
  specialFeatures: PCBSpecialFeatures;
  region: PCBRegion;
  additionalNotes?: string;
  referenceFiles?: { name: string; type: string; dataUrl: string; extractedText?: string }[];
}

export interface PCBCostItem {
  item: string;
  estimatedCost: string;
  notes: string;
}

export interface DFMCheck {
  check: string;
  status: "pass" | "warning" | "fail";
  detail: string;
}

export interface PCBManufacturingRisks {
  impedanceRisks: string;
  drillRisks: string;
  laminationRisks: string;
  finishRisks: string;
  yieldRisks: string;
  warpageRisks: string;
  solderMaskRisks: string;
  viaRisks: string;
}

export interface PCBSummary {
  boardType: string;
  layers: string;
  dimensions: string;
  boardArea: string;
  material: string;
  surfaceFinish: string;
  ipcClass: string;
  complexityLevel: "Low" | "Medium" | "High" | "Very High";
  complexityScore: string;
  fabricationScore: string;
  assemblyScore: string;
  estimatedWeight: string;
  drillComplexity: string;
  panelizationSuggestion: string;
  estimatedYield: string;
  manufacturingCategory: string;
}

export interface PCBProcessRecommendations {
  smtProcessType: string;
  reflowProfile: string;
  waveSolderCompatibility: string;
  aoiRequired: string;
  xrayRequired: string;
  selectiveSolderRequired: string;
  testingMethod: string;
  leadTimeStandard: string;
  leadTimeExpress: string;
}

export interface PCBCostingResult {
  pcbSummary: PCBSummary;
  fabricationCost: PCBCostItem[];
  assemblyCost: PCBCostItem[];
  dfmChecks: DFMCheck[];
  manufacturingRisks: PCBManufacturingRisks;
  processRecommendations: PCBProcessRecommendations;
  dfmRecommendations: string[];
  costReductionIdeas: string[];
  recommendedIndianVendors: string[];
  panelizationAnalysis: string;
  confidenceLevel: "High" | "Medium" | "Low";
  confidenceExplanation: string;
  rawMarkdown: string;
}

export interface PCBProjectEntry {
  id: string;
  createdAt: string;
  input: Omit<PCBAnalysisInput, "referenceFiles">;
  result: PCBCostingResult;
}
