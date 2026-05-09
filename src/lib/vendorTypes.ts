export type ProcessCapability =
  | "CNC Machining" | "5-Axis CNC" | "VMC" | "HMC"
  | "Die Casting" | "Gravity Casting" | "Pressure Die Casting"
  | "Extrusion" | "Sheet Metal" | "Stamping"
  | "Anodizing" | "Powder Coating" | "Electroplating" | "Surface Finishing"
  | "EDM" | "Wire EDM" | "Grinding" | "Welding";

export interface Vendor {
  id: string;
  name: string;
  processCapabilities: ProcessCapability[];
  machines: string[];
  materialExpertise: string[];
  city: string;
  state: string;
  moq: number;
  certifications: string[];
  leadTimeDays: number;
  contact: string;
  website: string;
  notes: string;
  source: "imported" | "discovered" | "manual";
  industries: string[];
  monthlyCapacity: string;
  establishedYear?: number;
}

export interface VendorMatch {
  vendor: Vendor;
  suitabilityScore: number;
  technicalScore: number;
  qualityScore: number;
  commercialScore: number;
  matchReasons: string[];
  riskFlags: string[];
  recommendation: "top" | "backup" | "not-recommended";
}

export interface VendorDiscoveryResult {
  matches: VendorMatch[];
  sourcingRisks: string[];
  rfqStrategy: string;
  recommendedSuppliersCount: number;
  prototypeStrategy: string;
  productionStrategy: string;
  dualVendorRationale: string;
}

export interface RFQTemplate {
  vendorName: string;
  subject: string;
  emailBody: string;
  technicalSummary: string;
}

export interface DiscoveryRequest {
  manufacturingMethod: string;
  material: string;
  toleranceLevel: string;
  batchQuantity: number;
  surfaceFinish: string;
  complexity: string;
  partDescription: string;
  region: string;
}
