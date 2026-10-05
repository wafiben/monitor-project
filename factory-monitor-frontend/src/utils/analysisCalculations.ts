// src/utils/analysisCalculations.ts

// --- Emission Factors (kg CO₂e) ---
const ELECTRICITY_EMISSION_FACTOR_KG_PER_KWH = 0.66; // Tunisia average
const NATURAL_GAS_EMISSION_FACTOR_KG_PER_NM3 = 2.02;
const WATER_EMISSION_FACTOR_KG_PER_M3 = 0.34; // Cold water

// --- Utility Bill Constants (Tunisian Dinar - TND) ---

// Electricity (STEG)
const ELECTRICITY_FIXED_SUBSCRIPTION_FEE = 0; // Assuming no fixed fee for simplicity, or it's negligible for factories
const ELECTRICITY_VAT_RATE = 0.19; // 19%
const ELECTRICITY_TIERS = [
  { limit: 50, rate: 0.076 },
  { limit: 100, rate: 0.114 },
  { limit: 200, rate: 0.140 },
  { limit: 300, rate: 0.170 },
  { limit: Infinity, rate: 0.190 }, // For consumption > 300 kWh
];

// --- Power Factor Penalty Constants ---
const POWER_FACTOR_THRESHOLD = 0.9; // Penalty applies if Power Factor is below this (e.g., 0.9 lagging)
const POWER_FACTOR_PENALTY_RATE = 0.05; // 5% surcharge on consumption charge if PF is below threshold

// Natural Gas (STEG)
const NATURAL_GAS_FIXED_MONTHLY_FEE = 2.000; // Example fixed fee, adjust as needed
const NATURAL_GAS_VAT_RATE = 0.19; // Assuming 19% for consistency, adjust if different
const NATURAL_GAS_TIERS = [
  { limit: 30, rate: 0.120 },
  { limit: 60, rate: 0.150 },
  { limit: Infinity, rate: 0.180 }, // For consumption > 60 Nm³
];

// Water (SONEDE)
const WATER_FIXED_FEE = 1.000; // Example fixed fee, adjust as needed
const WATER_SEWER_FEE_RATE = 0.30; // 30% of water usage charge
const WATER_VAT_RATE = 0.10; // Example 10%, can be 7-13% based on usage type
const WATER_METER_FEE = 1.000; // Example fixed meter fee
const WATER_TIERS = [
  { limit: 20, rate: 0.200 },
  { limit: 40, rate: 0.300 },
  { limit: Infinity, rate: 0.500 }, // For consumption > 40 m³
];

/**
 * Calculates the carbon footprint for electricity consumption.
 * @param kwh Total electricity consumption in kWh.
 * @returns Carbon footprint in kg CO₂e.
 */
export const calculateElectricityCarbonFootprint = (kwh: number): number => {
  return kwh * ELECTRICITY_EMISSION_FACTOR_KG_PER_KWH;
};

/**
 * Calculates the carbon footprint for natural gas consumption.
 * @param nm3 Total natural gas consumption in Nm³.
 * @returns Carbon footprint in kg CO₂e.
 */
export const calculateGasCarbonFootprint = (nm3: number): number => {
  return nm3 * NATURAL_GAS_EMISSION_FACTOR_KG_PER_NM3;
};

/**
 * Calculates the carbon footprint for water consumption.
 * @param m3 Total water consumption in m³.
 * @returns Carbon footprint in kg CO₂e.
 */
export const calculateWaterCarbonFootprint = (m3: number): number => {
  return m3 * WATER_EMISSION_FACTOR_KG_PER_M3;
};

/**
 * Calculates the power factor based on total active and reactive energy.
 * @param kwh Total active energy in kWh.
 * @param kvarh Total reactive energy in kVARh.
 * @returns Power Factor (0 to 1), or 1 if kwh is 0.
 */
export const calculatePowerFactor = (kwh: number, kvarh: number): number => {
  if (kwh === 0 && kvarh === 0) return 1; // Avoid division by zero, assume perfect PF if no consumption
  if (kwh === 0) return 0; // If only reactive energy, PF is 0

  const apparentEnergy = Math.sqrt(kwh * kwh + kvarh * kvarh);
  return kwh / apparentEnergy;
};

/**
 * Internal helper to calculate the base electricity consumption charge before VAT or penalties.
 * @param kwh Total electricity consumption in kWh.
 * @returns Base consumption charge.
 */
const getBaseElectricityConsumptionCharge = (kwh: number): number => {
  let consumptionCharge = 0;
  let remainingKwh = kwh;

  for (const tier of ELECTRICITY_TIERS) {
    if (remainingKwh <= 0) break;
    const kwhInTier = Math.min(remainingKwh, tier.limit);
    consumptionCharge += kwhInTier * tier.rate;
    remainingKwh -= kwhInTier;
  }
  return consumptionCharge;
};

/**
 * Calculates the electricity bill based on tiered pricing, with an option to include/exclude power factor penalty.
 * @param kwh Total electricity consumption in kWh.
 * @param kvarh Total reactive energy consumption in kVARh (for power factor calculation).
 * @param includePowerFactorPenalty Boolean to determine if penalty should be applied.
 * @returns Total electricity bill in TND.
 */
export const calculateElectricityCost = (
  kwh: number,
  kvarh: number,
  includePowerFactorPenalty: boolean = true // Default to true for standard usage
): number => {
  const consumptionCharge = getBaseElectricityConsumptionCharge(kwh);

  let powerFactorPenalty = 0;
  if (includePowerFactorPenalty) {
    const pf = calculatePowerFactor(kwh, kvarh);
    if (pf < POWER_FACTOR_THRESHOLD && kwh > 0) {
      powerFactorPenalty = consumptionCharge * POWER_FACTOR_PENALTY_RATE;
    }
  }

  const subtotal = ELECTRICITY_FIXED_SUBSCRIPTION_FEE + consumptionCharge + powerFactorPenalty;
  const vat = subtotal * ELECTRICITY_VAT_RATE;
  const totalBill = subtotal + vat;

  return totalBill;
};

/**
 * Calculates the natural gas bill based on tiered pricing.
 * @param nm3 Total natural gas consumption in Nm³.
 * @returns Total natural gas bill in TND.
 */
export const calculateGasCost = (nm3: number): number => {
  let consumptionCharge = 0;
  let remainingNm3 = nm3;

  for (const tier of NATURAL_GAS_TIERS) {
    if (remainingNm3 <= 0) break;
    const nm3InTier = Math.min(remainingNm3, tier.limit);
    consumptionCharge += nm3InTier * tier.rate;
    remainingNm3 -= nm3InTier;
  }

  const subtotal = NATURAL_GAS_FIXED_MONTHLY_FEE + consumptionCharge;
  const vat = subtotal * NATURAL_GAS_VAT_RATE;
  const totalBill = subtotal + vat;
  return totalBill;
};

/**
 * Calculates the water bill based on tiered pricing.
 * @param m3 Total water consumption in m³.
 * @returns Total water bill in TND.
 */
export const calculateWaterCost = (m3: number): number => {
  let consumptionCharge = 0;
  let remainingM3 = m3;

  for (const tier of WATER_TIERS) {
    if (remainingM3 <= 0) break;
    const m3InTier = Math.min(remainingM3, tier.limit);
    consumptionCharge += m3InTier * tier.rate;
    remainingM3 -= m3InTier;
  }

  const sewerFee = consumptionCharge * WATER_SEWER_FEE_RATE;
  const subtotal = WATER_FIXED_FEE + consumptionCharge + sewerFee + WATER_METER_FEE;
  const vat = subtotal * WATER_VAT_RATE;
  const totalBill = subtotal + vat;
  return totalBill;
};

// Helper to convert Liters to cubic meters for water calculations
export const convertLitersToCubicMeters = (liters: number): number => {
  return liters / 1000;
};