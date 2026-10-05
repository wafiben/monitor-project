import { Sensor, Machine, Factory } from '../types';

// Constants for data generation
const SIMULATION_INTERVAL_SECONDS = 10; // Default interval for smaller graphs/sensors
const MAX_SMALL_SENSOR_READINGS = 60; // Max readings for small sensors if not specified (e.g., 10 minutes at 10s interval)

// Constants for long-period sensors (4 month, every 5 minutes)
const LONG_INTERVAL_SECONDS = 5 * 60; // 5 minutes in seconds
const LONG_READING_COUNT = Math.ceil(4 * 30 * 24 * 60 * 60 / LONG_INTERVAL_SECONDS); // Readings for 4 month at 5-min intervals

// Helper to generate a sensor with initial mock readings
const createMockSensor = (
  id: string,
  name: string,
  unit: string,
  initialValue: number,
  readingCount: number,
  simulationIntervalSeconds: number
): Sensor => {
  const readings = [];
  let currentValue = initialValue;
  const now = new Date();

  for (let i = 0; i < readingCount; i++) {
    const time = new Date(now.getTime() - (readingCount - 1 - i) * simulationIntervalSeconds * 1000);
    const delta = (Math.random() - 0.5) * 2; // -1 to +1
    currentValue = +(currentValue + delta).toFixed(2);

    // Ensure value is never negative (except for temperature which can be negative)
    if (currentValue < 0 && !name.includes("Temperature") && !name.includes("Energy")) { // Added Energy check
        currentValue = 0;
    }
    // Add specific bounds for certain sensors for more realistic data
    if (name.includes("Temperature")) {
        if (currentValue < -10) currentValue = -10;
        if (currentValue > 40) currentValue = 40;
    } else if (name.includes("Flow")) {
        if (currentValue < 0) currentValue = 0;
        if (currentValue > 100) currentValue = 100;
    } else if (name.includes("Pressure")) {
        if (currentValue < 0) currentValue = 0;
        if (currentValue > 10) currentValue = 10;
    } else if (name.includes("Humidity")) {
        if (currentValue < 0) currentValue = 0;
        if (currentValue > 100) currentValue = 100;
    } else if (name.includes("Voltage")) {
        if (currentValue < 200) currentValue = 200;
        if (currentValue > 240) currentValue = 240;
    } else if (currentValue < 0) { // General catch-all for other sensors
        currentValue = 0;
    }


    readings.push({ time, value: currentValue });
  }

  return {
    id,
    name,
    unit,
    value: currentValue,
    readings,
    simulationIntervalSeconds, // Now correctly included in the Sensor object
  };
};

// --- Define Sensors ---
const allSensors: Sensor[] = []; // This array will hold ALL sensors, including green energy.
let sensorIdCounter = 1;

// Define sensor types and their initial properties
const sensorTypes = [
  { name: "Active Energy Sensor", unit: "kWh", initialValue: 100, type: "energy" },
  { name: "Reactive Energy Sensor", unit: "kVARh", initialValue: 50, type: "energy" },
  { name: "Water Flow Sensor", unit: "L/min", initialValue: 10, type: "water" },
  { name: "Gas Pressure Sensor", unit: "bar", initialValue: 2, type: "gas" },
  { name: "Temperature Sensor", unit: "°C", initialValue: 25, type: "temperature" },
  { name: "Humidity Sensor", unit: "%", initialValue: 60, type: "humidity" },
  { name: "Voltage Sensor", unit: "V", initialValue: 230, type: "voltage" },
  { name: "Current Sensor", unit: "A", initialValue: 5, type: "current" },
];

// --- Define Machines ---
const machines: Machine[] = [];
let machineIdCounter = 1;

for (let i = 0; i < 2; i++) { // Two factories
  for (let j = 0; j < 3; j++) { // Three machines per factory
    const machineId = `M${machineIdCounter++}`;
    const machineSensors: string[] = []; // List of sensor IDs for this machine

    sensorTypes.forEach((type, index) => {
      const sensorId = `S${sensorIdCounter++}`;
      let currentReadingCount = MAX_SMALL_SENSOR_READINGS;
      let currentIntervalSeconds = SIMULATION_INTERVAL_SECONDS;

      // Apply long-period settings for the first 4 sensor types (energy, water, gas)
      // This is crucial for historical data for the accumulation graphs
      if (index < 4) { // Active Energy, Reactive Energy, Water Flow, Gas Pressure
        currentReadingCount = LONG_READING_COUNT;
        currentIntervalSeconds = LONG_INTERVAL_SECONDS;
      }

      const newSensor = createMockSensor(
        sensorId,
        type.name,
        type.unit,
        type.initialValue + (Math.random() * 10 - 5), // Slight variation
        currentReadingCount,
        currentIntervalSeconds
      );
      allSensors.push(newSensor); // Add machine sensors to the allSensors array
      machineSensors.push(sensorId);
    });

    machines.push({
      machineID: machineId,
      machineName: `Machine ${machineId} (Factory ${i + 1})`,
      sensors: machineSensors,
    });
  }
}

// --- Define Factories ---
const factories: Factory[] = []; // Initialize empty and push to it

// Factory 1
const greenEnergySensorF1 = createMockSensor(
  "GE1",
  "Green Energy Production (F1)",
  "kWh",
  500 + (Math.random() * 50 - 25), // Higher initial value
  LONG_READING_COUNT,
  LONG_INTERVAL_SECONDS
);
allSensors.push(greenEnergySensorF1); // <--- ADDED: Push green energy sensor to allSensors
factories.push({
  factoryID: "F1",
  factoryName: "Alpha Industrial Co.",
  machines: machines.slice(0, 3).map(m => m.machineID), // First 3 machines for Factory 1
  greenEnergySensor: greenEnergySensorF1,
});

// Factory 2
const greenEnergySensorF2 = createMockSensor(
  "GE2",
  "Green Energy Production (F2)",
  "kWh",
  400 + (Math.random() * 50 - 25), // Higher initial value
  LONG_READING_COUNT,
  LONG_INTERVAL_SECONDS
);
allSensors.push(greenEnergySensorF2); // <--- ADDED: Push green energy sensor to allSensors
factories.push({
  factoryID: "F2",
  factoryName: "Beta Manufacturing Ltd.",
  machines: machines.slice(3, 6).map(m => m.machineID), // Next 3 machines for Factory 2
  greenEnergySensor: greenEnergySensorF2,
});


// Exporting all data structures
export { factories, machines, allSensors };