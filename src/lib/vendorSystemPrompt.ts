import type { DiscoveryRequest } from "./vendorTypes";

export function buildVendorPrompt(req: DiscoveryRequest): string {
  return `STRICT OUTPUT RULE: Do NOT use bullet characters (•, ‣, ◦, ⁃, ∙) or Unicode dashes (–, —) anywhere in your JSON values. Use plain hyphens (-) or commas instead. All output must be pure ASCII-safe text within JSON strings.

You are a senior sourcing engineer with 20+ years of experience in Indian manufacturing and procurement across metals, plastics, castings, forgings, and precision machining. Your task is to identify and evaluate the most suitable Indian manufacturers for the given part requirements.

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
Generate a vendor discovery result with 5-6 realistic Indian manufacturers well-suited for these requirements. Use your deep knowledge of the Indian manufacturing ecosystem to create highly realistic, plausible vendor profiles. Keep each string field concise (under 120 characters). Strategy fields (rfqStrategy, prototypeStrategy, productionStrategy, dualVendorRationale) must each be under 200 characters.

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
- Lead times: 15-45 days typical for Indian manufacturers (express: 7-10 days with premium)
- MOQ: Should be contextually appropriate (50-500 for precision CNC parts, 200-2000 for castings/forgings)
- Pricing benchmarks (India 2026): CNC machining INR 800-1200/hr (Al turning), INR 1500-2500/hr (SS turning), INR 2500-4500/hr (5-axis/Ti); Die casting INR 180-350/shot; Sheet metal INR 25-80/kg fabricated
- Contact: realistic Indian phone numbers (+91-XX-XXXXXXXX or +91-XXXXXXXXXX)
- Website: plausible Indian business domain (e.g., "www.precisiontechpune.com")

KNOWN REAL INDIAN MANUFACTURERS - prefer recommending these when they match requirements:
CNC MACHINING: Craftsman Automation Ltd (Coimbatore, IATF 16949, AS9100D, www.craftsmanautomation.com), Precitech Engineering Pvt Ltd (Pune, IATF 16949, www.precitechpune.com), GRS Engineering Pvt Ltd (Rajkot, IATF 16949, www.grsengineering.in), Zetwerk Manufacturing (Bangalore, ISO 9001, www.zetwerk.com)
DIE CASTING: Endurance Technologies Ltd (Aurangabad, IATF 16949, www.endurancegroup.com), Rockman Industries Ltd (Ludhiana, IATF 16949, www.rockmanindustries.com), Rico Auto Industries Ltd (Gurugram, IATF 16949, www.ricoauto.com), Roots Cast Pvt Ltd (Rajkot, ISO 9001, www.rootscast.com)
SHEET METAL/FABRICATION: Sira Industries Pvt Ltd (Pune, ISO 9001, www.siraindustries.com), Fabrimech Engineers Pvt Ltd (Chennai, EN15085 ISO 9001, www.fabrimech.com), Cyclotron Industries (Pune, ISO 9001, www.cyclotronindustries.com)
FORGING: Bharat Forge Ltd (Pune, AS9100D NADCAP IATF 16949, www.bharatforge.com), MM Forgings Ltd (Chennai, IATF 16949, www.mmforgings.com), Emerson Forge Pvt Ltd (Rajkot, ISO 9001, www.emersonforge.com)

RESPOND ONLY WITH VALID JSON - NO MARKDOWN FENCES, NO EXTRA TEXT, NO EXPLANATIONS.

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
