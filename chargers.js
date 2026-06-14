/* ============================================================================
   Charger data for the EV Charger Finder.
   Curated for south-east Melbourne (Glen Eira / Bayside / Kingston / Monash).
   All listed chargers are compatible with the Jaecoo J5 (Type 2 AC + CCS2 DC).

   To update: edit the entries below and re-deploy. Fields:
     n     – display name
     net   – network operator
     a     – street address
     lat   – latitude  (decimal degrees)
     lng   – longitude (decimal degrees)
     t     – tier: "free" | "partial" | "paid"
              free    = no charge to use
              partial = free electricity but pay parking, OR free daily kWh allowance
              paid    = paid per kWh
     kw    – speed / connector summary
     cost  – approximate cost (verify in the network app — prices change)
     cable – cable requirement
     note  – freeform tips / caveats
     v     – (optional) true = details unverified, shown with a dashed border
   ============================================================================ */
window.CHARGER_DATA_VERIFIED = "June 2026";

window.CHARGERS = [
  { n:"Chargefox (council)", net:"Chargefox", a:"Glen Eira Rd, Caulfield", lat:-37.880813, lng:145.022590, t:"free", kw:"AC · up to 7 kW", cost:"Free", cable:"Bring your Type 2 cable", note:"Council-funded, free. 2-hour limit, often busy. Closest to the Caulfield South area." },
  { n:"Chargefox (council)", net:"Chargefox", a:"251A Koornang Rd, Carnegie", lat:-37.895172, lng:145.051499, t:"free", kw:"AC · ~7 kW", cost:"Free", cable:"Bring your Type 2 cable", note:"Glen Eira Council. Free — a few bays are often faulted." },
  { n:"Chargefox (council)", net:"Chargefox", a:"99 Brewer Rd, Bentleigh", lat:-37.921789, lng:145.036419, t:"free", kw:"AC · ~7 kW", cost:"Free", cable:"Bring your Type 2 cable", note:"Council kerbside charger." },
  { n:"Chargefox (council)", net:"Chargefox", a:"28 Gerald St, Murrumbeena", lat:-37.896776, lng:145.070182, t:"free", kw:"AC · ~7 kW", cost:"Free", cable:"Bring your Type 2 cable", note:"Enter from Gerald St (not Bute St). Popular." },
  { n:"Chargefox (council)", net:"Chargefox", a:"1115 Glen Huntly Rd, Glen Huntly", lat:-37.888626, lng:145.041177, t:"free", kw:"AC · ~7 kW", cost:"Free", cable:"Bring your Type 2 cable", note:"By the Glen Huntly shops — handy while shopping." },
  { n:"Chargefox / Exploren DC", net:"Chargefox·Exploren", a:"880 Dandenong Rd, Caulfield East", lat:-37.876527, lng:145.043373, t:"partial", kw:"DC · up to 150 kW (real ~40–80)", cost:"Electricity free · pay car-park only", cable:"Attached (CCS2)", note:"Monash / shops car park: 7 fast + 6 slow bays. Now Exploren-run; speeds & uptime vary." },
  { n:"JOLT", net:"JOLT", a:"809 Dandenong Rd, Malvern East", lat:-37.874517, lng:145.039609, t:"partial", kw:"DC · ~25 kW", cost:"7 kWh/day free, then ~$0.42–0.46/kWh", cable:"Attached (CCS2)", note:"Free 7 kWh per day for all account holders (JOLT app) — great for a quick free top-up." },
  { n:"Chargefox DC (Chadstone)", net:"Chargefox", a:"1341 Dandenong Rd, Chadstone (Carpark A)", lat:-37.887750, lng:145.085447, t:"paid", kw:"DC · 4 × 150 kW", cost:"~$0.45–0.60/kWh", cable:"Attached (CCS2)", note:"Outside Rebel / Chemist Warehouse. One of the better fast options — can queue at lunch." },
  { n:"BP Pulse", net:"BP Pulse", a:"Nepean Hwy & North Rd, Brighton East", lat:-37.900238, lng:145.006929, t:"paid", kw:"DC · up to 150 kW", cost:"~$0.60–0.69/kWh", cable:"Attached (CCS2)", note:"On the pricey side and reviews flag reliability — fine as a backup." },
  { n:"Tesla Supercharger", net:"Tesla", a:"479 Nepean Hwy, Brighton East", lat:-37.907137, lng:145.011162, t:"paid", kw:"DC · up to 250 kW (J5 draws ≤130)", cost:"~$0.55–0.75/kWh (cheaper w/ Tesla membership)", cable:"Attached (CCS2)", note:"Open to non-Tesla — start the session in the Tesla app. Busy at peaks." },
  { n:"Evie", net:"Evie", a:"47 Willansby Ave, Brighton", lat:-37.906279, lng:145.003593, t:"paid", kw:"DC · up to 50 kW", cost:"~$0.55–0.60/kWh", cable:"Attached (CCS2)", note:"Tucked away & usually free. Has CCS2 + CHAdeMO — use the CCS2 plug." },
  { n:"Tesla Supercharger", net:"Tesla", a:"Acland Court, 158 Acland St, St Kilda", lat:-37.868240, lng:144.980881, t:"paid", kw:"DC · up to 250 kW", cost:"~$0.55–0.75/kWh", cable:"Attached (CCS2)", note:"Open to non-Tesla (Tesla app). 1st floor of the shopping car park; ~1 hr free parking." },
  { n:"Tesla Destination", net:"Tesla", a:"2 Acland St, St Kilda", lat:-37.862435, lng:144.974575, t:"partial", kw:"AC · up to 22 kW", cost:"Electricity free · pay underground parking", cable:"Attached (Type 2)", note:"Tight bays in a paid underground car park. Slow AC top-up only." },
  { n:"Evie", net:"Evie", a:"32 Chapel St, Windsor", lat:-37.856248, lng:144.993222, t:"paid", kw:"DC · up to 50 kW", cost:"~$0.55–0.60/kWh", cable:"Attached (CCS2)", note:"Near Chapel St cafes; some recent slow-charge reports." },
  { n:"Tesla Supercharger", net:"Tesla", a:"650 Chapel St, South Yarra (Como)", lat:-37.838201, lng:144.996017, t:"paid", kw:"DC · up to 250 kW", cost:"Among the cheaper Tesla rates; 1st hr parking free", cable:"Attached (CCS2)", note:"Open to non-Tesla (app). Watch the parking clock — overstays get pricey." },

  { n:"JOLT", net:"JOLT", a:"493A Highett Rd, Highett", lat:-37.948560, lng:145.041025, t:"partial", kw:"DC · ~25–50 kW", cost:"7 kWh/day free, then ~$0.42–0.46/kWh", cable:"Attached (CCS2)", note:"Nearest quick + free-allowance option to the Highett / Cheltenham area." },
  { n:"AmpCharge (Ampol)", net:"AmpCharge", a:"299 Charman Rd, Cheltenham", lat:-37.964925, lng:145.055557, t:"paid", kw:"DC · up to 150 kW (real ~70–120)", cost:"~$0.60/kWh", cable:"Attached (CCS2)", note:"Ampol servo — toilets & coffee. Reliable per reviews." },
  { n:"Evie", net:"Evie", a:"206 Warrigal Rd, Oakleigh South (Dan Murphy's)", lat:-37.910308, lng:145.086093, t:"paid", kw:"DC · up to 75 kW (often ~48)", cost:"~$0.55–0.60/kWh", cable:"Attached (CCS2)", note:"Usually empty. Car-park lights cut at 10 pm." },
  { n:"Tesla Supercharger", net:"Tesla", a:"364 Huntingdale Rd, Oakleigh South", lat:-37.915539, lng:145.103113, t:"paid", kw:"DC · up to 250 kW", cost:"~$0.55–0.75/kWh", cable:"Attached (CCS2)", note:"Open to non-Tesla (app). Access off Huntingdale Rd — maps may wrongly say closed." },
  { n:"AmpCharge (Ampol)", net:"AmpCharge", a:"53–77 Balcombe Rd, Mentone", lat:-37.981581, lng:145.066025, t:"paid", kw:"DC · up to 150 kW", cost:"~$0.60/kWh", cable:"Attached (CCS2)", note:"Ampol site, Mentone." },
  { n:"JOLT", net:"JOLT", a:"Park Rd area, Cheltenham", lat:-37.956308, lng:145.041236, t:"partial", kw:"DC · ~25 kW", cost:"7 kWh/day free, then ~$0.42–0.46/kWh", cable:"Attached (CCS2)", note:"Free daily allowance via app." },
  { n:"JOLT", net:"JOLT", a:"152 Weatherall Rd, Cheltenham", lat:-37.972006, lng:145.050192, t:"partial", kw:"DC · ~25 kW", cost:"7 kWh/day free, then ~$0.42–0.46/kWh", cable:"Attached (CCS2)", note:"Free daily allowance via app." },
  { n:"Tesla Supercharger", net:"Tesla", a:"466 Cheltenham Rd, Keysborough", lat:-37.992485, lng:145.144657, t:"paid", kw:"DC · up to 250 kW", cost:"~$0.55–0.75/kWh", cable:"Attached (CCS2)", note:"Open to non-Tesla (app). Well-rated, close to shops." },
  { n:"Evie", net:"Evie", a:"Peter Scullin Reserve, Beach Rd, Mordialloc", lat:-38.008369, lng:145.084866, t:"paid", kw:"DC · 50 kW (often ~25)", cost:"~$0.55–0.60/kWh", cable:"Attached (CCS2)", note:"Beachside next to Woolworths — but frequent out-of-order reports. Check the Evie app first." },

  { n:"Chargefox DC (Holmesglen)", net:"Chargefox", a:"488 South Rd, Moorabbin", lat:-37.936955, lng:145.050275, t:"paid", kw:"DC · up to 50 kW", cost:"Varies — check app", cable:"Attached (CCS2)", note:"Holmesglen TAFE. Often partly offline — verify in the app before relying on it.", v:true },
  { n:"Everty (destination)", net:"Everty", a:"32–64 Linton St, Moorabbin", lat:-37.936499, lng:145.042845, t:"paid", kw:"AC · likely Type 2", cost:"Unverified — check Everty app", cable:"May need your Type 2 cable", note:"Likely a workplace / destination charger — access & price unconfirmed.", v:true },
  { n:"Chargebay (destination)", net:"Chargebay", a:"284 Chesterville Rd, Moorabbin", lat:-37.941204, lng:145.061384, t:"paid", kw:"AC · likely Type 2", cost:"Unverified — check app", cable:"May need your Type 2 cable", note:"Small / destination-style site — confirm public access.", v:true },
  { n:"EVX (kerbside)", net:"EVX", a:"Brixton Rd, Cheltenham", lat:-37.955699, lng:145.031732, t:"free", kw:"AC · Type 2", cost:"Unverified — possibly free", cable:"Bring your Type 2 cable", note:"Council-style kerbside listing — existence/price unconfirmed, treat as a maybe.", v:true }
];
