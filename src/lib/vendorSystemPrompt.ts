import type { DiscoveryRequest } from "./vendorTypes";

export function buildVendorPrompt(req: DiscoveryRequest): string {
  return `You are a senior sourcing engineer with 20+ years of experience in Indian aluminium manufacturing and procurement. Your task is to identify and evaluate the most suitable Indian manufacturers for the given part requirements.

PART REQUIREMENTS:
- Manufacturing Method: ${req.manufacturingMethod}
- Material: ${req.material}
- Tolerance Level: ${req.toleranceLevel}
- Batch Quantity: ${req.batchQuantity.toLocaleString()} units
- Surface Finish: ${req.surfaceFinish}
- Complexity: ${req.complexity}
- Part Description: ${req.partDescription}
- Target Region: ${req.region}

YOUR TASK:
Generate a comprehensive vendor discovery result with 6-8 realistic Indian manufacturers well-suited for these requirements. Use your deep knowledge of the Indian manufacturing ecosystem to create highly realistic, plausible vendor profiles.

SCORING CRITERIA (must be applied rigorously):
- Technical Match (40%): Process capability alignment, machine capabilities, tolerance achievement, material expertise
- Quality Certifications (25%): ISO 9001, IATF 16949, AS9100, BIS, NADCAP presence and relevance
- Commercial Fit (20%): MOQ alignment with batch quantity, lead time, monthly capacity, pricing competitiveness
- Geographic/Logistics (15%): Proximity to industrial hubs, logistics infrastructure, port access for exports

RECOMMENDATION TIERS:
- Mark 3-4 vendors as "top" recommendation (suitabilityScore >= 78)
- Mark 2-3 vendors as "backup" recommendation (suitabilityScore 55-77)
- You may include 0-1 as "not-recommended" if clearly unsuitable

VENDOR PROFILE REQUIREMENTS:
- Use realistic Indian company names (e.g., "Precision Tech Engineering Pvt Ltd", "Bharat Aluminium Components", "Southern Alucast Industries")
- Use real Indian manufacturing cities: Bangalore, Pune, Chennai, Ahmedabad, Coimbatore, Rajkot, Ludhiana, Delhi NCR, Hyderabad, Mumbai, Vadodara, Nashik, Kolkata, Jamshedpur
- Include realistic machine names (e.g., "Fanuc Robodrill D21LiB5", "DMG Mori NLX 2500", "Toshiba Die Cast Machine 350T")
- Use realistic certifications: ISO 9001:2015, IATF 16949:2016, AS9100D, ISO 14001:2015, OHSAS 18001, BIS, NADCAP
- Industries served: Automotive, Aerospace, Defence, Electronics, Industrial Equipment, Consumer Goods, Medical Devices
- Monthly capacity should be realistic (e.g., "15,000-20,000 components/month")
- Lead times: 15-45 days typical for Indian manufacturers
- MOQ: Should be contextually appropriate (50-500 for precision parts, 200-2000 for castings)
- Contact: realistic Indian phone numbers (+91-XX-XXXXXXXX or +91-XXXXXXXXXX)
- Website: plausible Indian business domain (e.g., "www.precisiontechpune.com")

RESPOND ONLY WITH VALID JSON — NO MARKDOWN FENCES, NO EXTRA TEXT, NO EXPLANATIONS.

The JSON must exactly match this schema:
{
  "matches": [
    {
      "vendor": {
        "id": "string (uuid-like, e.g. v-001)",
        "name": "string",
        "processCapabilities": ["array of process capability strings"],
        "machines": ["array of machine name strings"],
        "materialExpertise": ["array of material strings"],
        "city": "string",
        "state": "string",
        "moq": number,
        "certifications": ["array of certification strings"],
        "leadTimeDays": number,
        "contact": "string",
        "website": "string",
        "notes": "string",
        "source": "discovered",
        "industries": ["array of industry strings"],
        "monthlyCapacity": "string",
        "establishedYear": number
      },
      "suitabilityScore": number (0-100),
      "technicalScore": number (0-100),
      "qualityScore": number (0-100),
      "commercialScore": number (0-100),
      "matchReasons": ["array of specific reasons this vendor is a good match"],
      "riskFlags": ["array of potential risks or concerns, can be empty array"],
      "recommendation": "top" | "backup" | "not-recommended"
    }
  ],
  "sourcingRisks": ["array of overall sourcing risk strings for this requirement"],
  "rfqStrategy": "string describing the recommended RFQ approach",
  "recommendedSuppliersCount": number,
  "prototypeStrategy": "string describing prototype sourcing strategy",
  "productionStrategy": "string describing production sourcing strategy",
  "dualVendorRationale": "string explaining why dual vendor strategy is recommended"
}`;
}
