function generateFixedReadings(
  // We'll generate data backward from an end date
  endDate: Date,
  count: number,
  intervalSeconds: number, // Interval between readings in seconds
  startValue: number,
  variation: number
) {
  const readings = [];
  let value = startValue;
  let currentTime = new Date(endDate); // Start from the end date and go backward

  // Generate data backward in time from endDate
  for (let i = 0; i < count; i++) {
    const time = new Date(currentTime); // Clone the date for this reading
    const delta = (Math.random() - 0.5) * variation * 2;
    value = +(value + delta).toFixed(1);
    // Ensure value is never negative
    if (value < 0) {
      value = 0;
    }
    readings.unshift({ time, value }); // Add to the beginning of the array to keep chronological order

    // Decrement time for the next reading (going backward)
    currentTime.setSeconds(currentTime.getSeconds() - intervalSeconds);
  }

  return readings;
}

// Get the current date and time
const now = new Date();

// Define the interval for simulation (same as in SensorsPage.tsx useEffect)
const SIMULATION_INTERVAL_SECONDS = 120; // 2 minutes in seconds

// For the main sensor, let's generate enough data to cover a bit more than a month
// to ensure the '1 month' filter always has data.
// A month has roughly 30 days * 24 hours/day * 60 minutes/hour / (10 sec/reading / 60 sec/min) = 4320 readings for one month.
// Let's go for 35 days of initial data to be safe.
const mainSensorInitialReadingsCount = Math.ceil(14 * 24 * 60 * 60 / SIMULATION_INTERVAL_SECONDS);

export const sensors = [
  {
    id: 1,
    name: "Energy Meter",
    unit: "kWh",
    // Energy meters usually accumulate, so we'll simulate accumulation.
    // For initial readings, it's easier to use a `generateFixedReadings` and then
    // ensure `useEffect` adds accumulation behavior if needed for this specific sensor.
    // For now, it will generate fluctuating 'rate' of kWh, not cumulative.
    // A more realistic energy meter would have a different data generation pattern.
    readings: generateFixedReadings(now, mainSensorInitialReadingsCount, SIMULATION_INTERVAL_SECONDS, 0.5, 0.1), // e.g., current kWh reading per interval, or small fluctuating value
  },
    
  {
    id: 2,
    name: "Water Flow Sensor",
    unit: "L/s",
    readings: generateFixedReadings(now, mainSensorInitialReadingsCount, SIMULATION_INTERVAL_SECONDS, 0.5, 0.1), // e.g., 1200 Watts (1.2 kW)
    
  },
  {
    id: 3,
    name: "Gas Pressure Sensor",
    unit: "bar",
    readings: generateFixedReadings(now, mainSensorInitialReadingsCount, SIMULATION_INTERVAL_SECONDS, 4.2, 0.4),
  },
  {
    id: 4,
    name: "Temperature Sensor",
    unit: "°C",
    readings: generateFixedReadings(now, 60, SIMULATION_INTERVAL_SECONDS, 65, 3),
    
  },
  {
    id: 5,
    name: "Humidity Sensor",
    unit: "%",
    readings: generateFixedReadings(now, 60, SIMULATION_INTERVAL_SECONDS, 55, 6),
  },
  {
    id: 6,
    name: "Voltage Sensor",
    unit: "V",
    readings: generateFixedReadings(now, 60, SIMULATION_INTERVAL_SECONDS, 230, 8),
  },
  // --- NEW POWER CONSUMPTION SENSORS ---
  {
    id: 7,
    name: "Current Sensor",
    unit: "A",
    readings: generateFixedReadings(now, 60, SIMULATION_INTERVAL_SECONDS, 5.0, 1.5), // e.g., 5 Amperes average
  },
  {
    id: 8,
    name: "Flow Meter",
    unit: "L/min",
    readings: generateFixedReadings(now, 60, SIMULATION_INTERVAL_SECONDS, 110, 15),
   
  },
  {
    id: 9,
    name: "Vibration Sensor",
    unit: "mm/s",
    readings: generateFixedReadings(now, 60, SIMULATION_INTERVAL_SECONDS, 2.5, 0.5),
    
  },
].map(sensor => ({
  ...sensor,
  value: sensor.readings[sensor.readings.length - 1].value, // Still get the last value for current display
}));