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
Generate a vendor discovery result with 5-6 Indian manufacturers well-suited for these requirements. ALWAYS prefer recommending real, existing companies from the VERIFIED VENDOR LIST below. Only use plausible fictional profiles if no real match exists. Keep each string field concise (under 120 characters). Strategy fields (rfqStrategy, prototypeStrategy, productionStrategy, dualVendorRationale) must each be under 200 characters.

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
- Use real Indian manufacturing cities: Bangalore, Pune, Chennai, Ahmedabad, Coimbatore, Rajkot, Ludhiana, Delhi NCR, Hyderabad, Mumbai, Vadodara, Nashik, Kolkata, Jamshedpur
- Include realistic machine names (e.g., "Fanuc Robodrill D21LiB5", "DMG Mori NLX 2500", "Toshiba Die Cast Machine 350T")
- Use realistic certifications: ISO 9001:2015, IATF 16949:2016, AS9100D, ISO 14001:2015, OHSAS 18001, BIS, NADCAP
- Industries served: Automotive, Aerospace, Defence, Electronics, Industrial Equipment, Consumer Goods, Medical Devices
- Monthly capacity should be realistic (e.g., "15,000-20,000 components/month")
- Lead times: 15-45 days typical for Indian manufacturers (express: 7-10 days with premium)
- MOQ: Should be contextually appropriate (50-500 for precision CNC parts, 200-2000 for castings/forgings)
- Pricing benchmarks (India 2026): CNC machining INR 800-1200/hr (Al turning), INR 1500-2500/hr (SS turning), INR 2500-4500/hr (5-axis/Ti); Die casting INR 180-350/shot; Sheet metal INR 25-80/kg fabricated
- Contact: realistic Indian phone numbers (+91-XX-XXXXXXXX or +91-XXXXXXXXXX)

VERIFIED REAL INDIAN MANUFACTURERS (use actual details below — these are real companies):
CNC MACHINING:
- Craftsman Automation Ltd | Coimbatore, Tamil Nadu | IATF 16949, AS9100D | 500+ VMC/HMC | auto/aerospace/defence | est.1986 | www.craftsmanautomation.com
- Maini Precision Products Ltd | Bangalore, Karnataka | IATF 16949, AS9100D, NADCAP, ISO 14001, ISO 45001 | 696 CNC machines, 11 plants | auto/aerospace | est.1973 | www.mainiprecisionproducts.com
- Spacenex | Devanahalli, Bangalore, Karnataka | AS9100D | 5-axis CNC, NDT, chemical processing | aerospace/defence/space | est.2010 | www.spacenex.com
- Precitech Engineering Pvt Ltd | Pune, Maharashtra | IATF 16949 | CNC turning, milling, grinding | auto/defence/industrial | www.precitechpune.com
- GRS Engineering Pvt Ltd | Rajkot, Gujarat | IATF 16949 | multi-axis CNC, auto/industrial | www.grsengineering.in
- Zetwerk Manufacturing | Bangalore, Karnataka | ISO 9001 | CNC, sheet metal, casting, on-demand | multi-industry | est.2018 | www.zetwerk.com

DIE CASTING:
- Endurance Technologies Ltd | Aurangabad, Maharashtra | IATF 16949 | Al/Mg HPDC, machining | auto OEMs | est.1985 | www.endurancegroup.com
- Rockman Industries Ltd | Ludhiana, Punjab | IATF 16949 | Al HPDC, machining, surface treatment | auto | est.1960 | www.rockmanindustries.com
- Rico Auto Industries Ltd | Gurugram, Haryana | IATF 16949 | Al/Zn die casting, precision machining | auto/2-wheeler | est.1983 | www.ricoauto.com
- Renuka Auto Components | Pune, Maharashtra | IATF 16949:2016, ISO 9001:2015 | Al gravity/pressure die casting | auto | www.renukagroup.in
- Roots Cast Pvt Ltd | Rajkot, Gujarat | ISO 9001 | Al gravity/pressure die casting | auto/industrial | www.rootscast.com
- Sadguru Auto Components | Pune, Maharashtra | ISO 9001 | 1500+ tonnes/year Al die casting | auto/industrial | www.sadgurudiecast.com

SHEET METAL / FABRICATION:
- Sira Industries Pvt Ltd | Pune, Maharashtra | ISO 9001 | laser cutting, CNC press brake, welding, enclosures | auto/electronics | www.siraindustries.com
- Fabrimech Engineers Pvt Ltd | Chennai, Tamil Nadu | EN15085, ISO 9001 | heavy fabrication, structural weldments | rail/industrial | www.fabrimech.com
- Cyclotron Industries | Pune, Maharashtra | ISO 9001 | sheet metal, CNC press brake, laser cutting | auto/electronics | www.cyclotronindustries.com

FORGING:
- Bharat Forge Ltd | Pune, Maharashtra | AS9100D, NADCAP, IATF 16949 | closed-die forging up to 12,500T | auto/aero/defence/oil&gas | est.1961 | www.bharatforge.com
- Happy Forgings Ltd | Ludhiana, Punjab | IATF 16949, AS9100D | 120,000 tonnes/year capacity | auto/farm/oil&gas/wind | est.1979 | www.happyforgingsltd.com
- Ramkrishna Forgings Ltd | Kolkata, West Bengal | IATF 16949 | auto/railways/oil&gas forgings | est.1981 | +91-33-4082-0900 | www.ramkrishnaforgings.com
- MM Forgings Ltd | Chennai, Tamil Nadu | IATF 16949 | closed-die steel/alloy forgings | auto/commercial vehicles | www.mmforgings.com
- Emerson Forge Pvt Ltd | Rajkot, Gujarat | ISO 9001 | open/closed-die forgings, flanges | auto/industrial/oil&gas | www.emersonforge.com

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
