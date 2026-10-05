export const factoryDetail = {
  id: 1,
  name: "Factory Alpha",
  energy: {
    activeImport: 12000,  // kWh
    activeExport: 3000,   // kWh
    reactive: 8400,       // kWh
    gas: 900,             // Nm³
  },
  costs: {
    importRate: 0.15,     // €/kWh
    exportRate: 0.10,     // €/kWh
    gasRate: 0.08,        // €/Nm³
  },
  co2: {
    electricity: 3000,    // kg
    gas: 1200             // kg
  },
  location: "Tunis, Tunisia"
};
