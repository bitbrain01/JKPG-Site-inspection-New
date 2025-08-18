import { SectionData } from './types';

export const ACCENT_COLOR = "#009639"; // BP-style Green

export const LOCATIONS: string[] = [
  "BP Main Street #123",
  "Amoco Highway 101",
  "Downtown Express Fuel",
  "Route 66 Gas & Go",
  "City Center Petroleum",
  "Centreville BP"
];

export const INSPECTION_DATA: SectionData[] = [
  {
    id: 'pump_compliance',
    title: "Pump Compliance Status",
    questions: [], // This section will render the custom PumpCompliance component
  },
  {
    id: 'exterior_signage_canopy',
    title: "Exterior Signage & Canopy",
    questions: [
      {
        id: "Q1", text: "Are all MID and price signs clearly visible and free from obstructions and missing numbers or letters?",
        type: 'standard', options: [{ text: 'Yes', points: 5, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 5,
      },
      {
        id: "Q2", text: "Are all MID elements, price signs, and accompanying high-rise signs well-maintained, free of damage?",
        type: 'standard', options: [{ text: 'Yes', points: 3, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 3,
      },
      {
        id: "Q3", text: "Is the branded canopy fascia well maintained and free of dirt, peeling, dents, rust, other damage, and free of unapproved signage or objects?",
        type: 'standard', options: [{ text: 'Yes', points: 1, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 1,
      },
      {
        id: "Q4", text: "Is the branded canopy deck well maintained and free of dirt, peeling paint, dents, rust, and other damage?",
        type: 'standard', options: [{ text: 'Yes', points: 1, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 1,
      },
      {
        id: "Q5", text: "Are the canopy columns and canopy flags under the branded canopy well maintained and free of dirt, peeling paint, dents, rust, graffiti, other damage, and free of unapproved signage or objects present?",
        type: 'standard', options: [{ text: 'Yes', points: 1, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 1,
      },
    ]
  },
  {
    id: 'pumps_dispensers',
    title: "Pumps & Dispensers",
    questions: [
      {
        id: "Q6", text: "Are all bp branded dispenser elements clean?",
        type: 'standard', options: [{ text: 'Yes', points: 6, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 6,
      },
      {
        id: "Q7", text: "Are all pumps (under the bp/Amoco branded canopy) fully operational?",
        type: 'standard', options: [{ text: 'Yes', points: 8, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 8,
      },
      {
        id: "Q8", text: "Are all bp/Amoco branded dispensers free of dents, damage, rust, and graffiti?",
        type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2,
      },
      {
        id: "Q9", text: "Are all dispenser price screens and keypads on bp/Amoco branded dispensers free of damage?",
        type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2,
      },
      {
        id: "Q10", text: "Are all bp/Amoco branded dispensers free of torn or peeling decals and excessive adhesive residue?",
        type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2,
      },
      {
        id: "Q11", text: "Are all nozzle covers on bp/Amoco branded dispensers clean and free of damage?",
        type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2,
      },
      {
        id: "Q12", text: "For a card transaction, was your receipt received at your pump?",
        type: 'standard', options: [{ text: 'Yes', points: 5, isPositive: true }, { text: 'No', points: 0 }, { text: 'N/A', points: 'N/A' }], maxPoints: 5,
      },
      {
        id: "Q13", text: "Are the pump islands under the branded canopy well maintained?",
        type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2,
      },
    ]
  },
  {
    id: 'forecourt_lot',
    title: "Forecourt & Lot",
    questions: [
        { id: "Q14", text: "Are the site's bollards well maintained?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q15", text: "Are amenity bins available at each pump island and free of damage?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q16", text: "Are amenity bins clean and not overflowing?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q17", text: "Are paper towels available next to each pump island?", type: 'standard', options: [{ text: 'Yes', points: 1, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 1 },
        { id: "Q18", text: "Is there at least one squeegee with washer fluid available for each pump island?", type: 'standard', options: [{ text: 'Yes', points: 1, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 1 },
        { id: "Q19", text: "Are the lot, grass and landscaping areas well maintained and free of fresh oil puddles, unauthorized vehicles, trash, debris, weeds, and poorly stored materials?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q20", text: "Are the paved areas well maintained and free of excessive potholes?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q21", text: "Are the curbs, bumper stops, storefront sidewalks, and perimeter light poles well maintained?", type: 'standard', options: [{ text: 'Yes', points: 3, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 3 },
    ]
  },
  {
    id: 'decals_promotions',
    title: "Decals & Promotions",
    questions: [
        { id: "Q22", text: "For this dispenser, is the current bp POP campaign posted in accordance with program requirements?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }, { text: 'N/A', points: 'N/A' }], maxPoints: 2 },
        { id: "Q23", text: "Are ALL decals, canisters, and brochures posted in accordance with program requirements?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q24", text: "Are ALL decals and brochures in the c-store posted in accordance with program requirements?", type: 'standard', options: [{ text: 'Yes', points: 1, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 1 },
        { id: "Q25", text: "Are third party signage and POP hardware posted in accordance with program requirements?", type: 'standard', options: [{ text: 'Yes', points: 1, isPositive: true }, { text: 'No', points: 0 }, { text: 'N/A', points: 'N/A' }], maxPoints: 1 },
    ]
  },
  {
    id: 'cstore_interior',
    title: "C-Store Interior & Appearance",
    questions: [
        { id: "Q26", text: "Is the building clean and free of dents, damage, dirt, missing fixtures/materials, and unapproved signage or objects?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q27", text: "Are the building windows 50% clear of obstructions and signage and allow for an unobstructed view to and from the pumps?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q28", text: "When you walk in the store, is the overall store appearance clean and free of damage and unapproved materials?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
        { id: "Q29", text: "Is the inside of the store well-lit?", type: 'standard', options: [{ text: 'Yes', points: 3, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 3 },
        { id: "Q30", text: "Are the food service and product areas clean and well maintained?", type: 'standard', options: [{ text: 'Yes', points: 3, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 3 },
        { id: "Q31", text: "Are the food service and product areas well stocked?", type: 'standard', options: [{ text: 'Yes', points: 3, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 3 },
        { id: "Q32", text: "Are the products clearly labelled with accurate prices?", type: 'standard', options: [{ text: 'Yes', points: 2, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 2 },
    ]
  },
  {
    id: 'restrooms_personnel',
    title: "Restrooms & Personnel",
    questions: [
        { id: "Q33", text: "Is the restroom available, clean and stocked with supplies?", type: 'standard', options: [{ text: 'Yes', points: 6, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 6 },
        { id: "Q34", text: "Is the restroom functioning and in acceptable condition?", type: 'standard', options: [{ text: 'Yes', points: 4, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 4 },
        { id: "Q35", text: "Are site personnel wearing an appropriate and clean uniform?", type: 'standard', options: [{ text: 'Yes', points: 3, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 3 },
        { id: "Q36", text: "Are site personnel wearing a name or brand tag?", type: 'standard', options: [{ text: 'Yes', points: 3, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 3 },
        { id: "Q37", text: "Was the CSR polite, professional, and attentive?", type: 'standard', options: [{ text: 'Yes', points: 6, isPositive: true }, { text: 'No', points: 0 }], maxPoints: 6 },
    ]
  }
];