import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Import the new factory data
import { factories, machines, allSensors as initialAllSensors } from '../data/factoryData';
import { Sensor, Machine, Factory } from '../types';

// Helper function to calculate accumulation for a period
const getAccumulatedSensorData = (
  currentFactorySensors: Sensor[], // Pass only sensors relevant to the selected factory
  timeFilter: string,
  simulationIntervalSeconds: number
) => {
  const energySensors = currentFactorySensors.filter(s => s.name.includes("Active Energy Sensor"));
  const waterSensors = currentFactorySensors.filter(s => s.name.includes("Water Flow Sensor"));
  const gasSensors = currentFactorySensors.filter(s => s.name.includes("Gas Pressure Sensor"));

  if (energySensors.length === 0 && waterSensors.length === 0 && gasSensors.length === 0) {
    // console.warn("No relevant sensors found for accumulation graph for this factory."); // Keep this for actual warnings
    return { graphData: [], totalEnergy: 0, totalWater: 0, totalGas: 0 };
  }

  const now = new Date();
  let periodStart: Date;

  switch (timeFilter) {
    case '1min':
      periodStart = new Date(now.getTime() - 60 * 1000);
      break;
    case '1hour':
      periodStart = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '1day':
      periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '1week':
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1month':
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
      break;
    default:
      periodStart = new Date(now.getTime() - 60 * 1000);
      break;
  }

  const allEnergyReadings = energySensors.flatMap(s => s.readings.filter((r: any) => r.time.getTime() >= periodStart.getTime()));
  const allWaterReadings = waterSensors.flatMap(s => s.readings.filter((r: any) => r.time.getTime() >= periodStart.getTime()));
  const allGasReadings = gasSensors.flatMap(s => s.readings.filter((r: any) => r.time.getTime() >= periodStart.getTime()));

  allEnergyReadings.sort((a, b) => a.time.getTime() - b.time.getTime());
  allWaterReadings.sort((a, b) => a.time.getTime() - b.time.getTime());
  allGasReadings.sort((a, b) => a.time.getTime() - b.time.getTime());

  const accumulatedData: any[] = [];
  let currentAccumulatedEnergy = 0;
  let currentAccumulatedWater = 0;
  let currentAccumulatedGas = 0;

  let segmentDurationMs: number;
  let segmentsCount: number;

  switch (timeFilter) {
    case '1min':
      segmentDurationMs = simulationIntervalSeconds * 1000;
      segmentsCount = Math.ceil((60 * 1000) / segmentDurationMs);
      if (segmentsCount === 0) segmentsCount = 1;
      break;
    case '1hour':
      segmentDurationMs = 5 * 60 * 1000; // 5 minutes
      segmentsCount = 12;
      break;
    case '1day':
      segmentDurationMs = 60 * 60 * 1000; // 1 hour
      segmentsCount = 24;
      break;
    case '1week':
      segmentDurationMs = 24 * 60 * 60 * 1000; // 1 day
      segmentsCount = 7;
      break;
    case '1month':
      segmentDurationMs = (30 * 24 * 60 * 60 * 1000) / 30; // Approx 1 day per segment for 30 segments
      segmentsCount = 30;
      break;
    default:
      segmentDurationMs = simulationIntervalSeconds * 1000;
      segmentsCount = Math.ceil((60 * 1000) / segmentDurationMs);
      if (segmentsCount === 0) segmentsCount = 1;
      break;
  }

  let segmentStartTime = new Date(periodStart.getTime());
  let energyReadingIndex = 0;
  let waterReadingIndex = 0;
  let gasReadingIndex = 0;

  for (let i = 0; i < segmentsCount; i++) {
    const segmentEndTime = new Date(segmentStartTime.getTime() + segmentDurationMs);

    let segmentEnergyIncrease = 0;
    let segmentWaterIncrease = 0;
    let segmentGasIncrease = 0;

    while (energyReadingIndex < allEnergyReadings.length && allEnergyReadings[energyReadingIndex].time.getTime() < segmentEndTime.getTime()) {
      segmentEnergyIncrease += allEnergyReadings[energyReadingIndex].value;
      energyReadingIndex++;
    }

    while (waterReadingIndex < allWaterReadings.length && allWaterReadings[waterReadingIndex].time.getTime() < segmentEndTime.getTime()) {
      segmentWaterIncrease += allWaterReadings[waterReadingIndex].value * (simulationIntervalSeconds / 60);
      waterReadingIndex++;
    }

    while (gasReadingIndex < allGasReadings.length && allGasReadings[gasReadingIndex].time.getTime() < segmentEndTime.getTime()) {
      segmentGasIncrease += (allGasReadings[gasReadingIndex].value * (simulationIntervalSeconds / 60));
      gasReadingIndex++;
    }

    currentAccumulatedEnergy += segmentEnergyIncrease;
    currentAccumulatedWater += segmentWaterIncrease;
    currentAccumulatedGas += segmentGasIncrease;

    accumulatedData.push({
      time: segmentEndTime,
      energy: +currentAccumulatedEnergy.toFixed(2),
      water: +currentAccumulatedWater.toFixed(2),
      gas: +currentAccumulatedGas.toFixed(2),
    });

    segmentStartTime = segmentEndTime;
  }
  const finalEnergy = currentAccumulatedEnergy;
  const finalWater = currentAccumulatedWater;
  const finalGas = currentAccumulatedGas;

  return {
    graphData: accumulatedData,
    totalEnergy: +finalEnergy.toFixed(2),
    totalWater: +finalWater.toFixed(2),
    totalGas: +finalGas.toFixed(2),
  };
};

const getAccumulatedStats = (data: any[], key: string, timeFilter: string) => {
  if (data.length === 0) {
    return { min: null, max: null, avg: null, minTime: null, maxTime: null, total: null };
  }

  let minVal = data[0][key];
  let maxVal = data[0][key];
  let minTime = data[0].time;
  let maxTime = data[0].time;
  let sum = 0;

  for (const point of data) {
    const value = point[key];
    sum += value;
    if (value < minVal) {
      minVal = value;
      minTime = point.time;
    }
    if (value > maxVal) {
      maxVal = value;
      maxTime = point.time;
    }
  }

  const avgVal = +(sum / data.length).toFixed(2);
  const totalVal = data[data.length - 1]?.[key] || 0; // Assuming the last point's value is the "total" accumulated

  return {
    min: +minVal.toFixed(2),
    max: +maxVal.toFixed(2),
    avg: avgVal,
    minTime,
    maxTime,
    total: +totalVal.toFixed(2)
  };
};

export default function MachinesPage() {
  const navigate = useNavigate();

  const [liveAllSensors, setLiveAllSensors] = useState<Sensor[]>(initialAllSensors);
  const [selectedFactory, setSelectedFactory] = useState<Factory>(factories[0]);
  const [timeFilter, setTimeFilter] = useState('1hour'); // Default to 1 hour, try '1month' to test your scenario

  const SIMULATION_INTERVAL_SECONDS = 10;

  // Simulate real-time sensor data updates for ALL sensors
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveAllSensors(prevSensors => {
        return prevSensors.map(sensor => {
          const now = new Date();
          const lastValue = sensor.readings[sensor.readings.length - 1]?.value || sensor.value;
          const delta = (Math.random() - 0.5) * 2; // Adjust delta for green energy if needed (e.g., more positive drift)
          let newValue = +(lastValue + delta).toFixed(1);

          // Specific bounds for sensor types
          if (sensor.name.includes("Temperature")) {
            if (newValue < -10) newValue = -10;
            if (newValue > 40) newValue = 40;
          } else if (sensor.name.includes("Flow")) {
            if (newValue < 0) newValue = 0;
            if (newValue > 100) newValue = 100;
          } else if (sensor.name.includes("Pressure")) {
            if (newValue < 0) newValue = 0;
            if (newValue > 10) newValue = 10;
          } else if (sensor.name.includes("Energy") || sensor.name.includes("Green Energy")) { // Added Green Energy here
            if (newValue < 0) newValue = 0;
          } else if (sensor.name.includes("Humidity")) {
            if (newValue < 0) newValue = 0;
            if (newValue > 100) newValue = 100;
          } else if (sensor.name.includes("Voltage")) {
            if (newValue < 200) newValue = 200;
            if (newValue > 240) newValue = 240;
          } else if (sensor.name.includes("Current")) {
            if (newValue < 0) newValue = 0;
            if (newValue > 30) newValue = 30;
          }

          const newReading = { time: now, value: newValue };

          // Keep the readings array from growing indefinitely for long-period sensors
          // You might want to limit the history to a certain number of readings for performance
          const maxReadingsToKeep = 4 * 30 * 24 * 60 * 60 / sensor.simulationIntervalSeconds; // Max 4 months for relevant sensors
          const updatedReadings = [...sensor.readings, newReading];
          if (updatedReadings.length > maxReadingsToKeep + 100) { // Keep a small buffer
            updatedReadings.splice(0, updatedReadings.length - maxReadingsToKeep);
          }


          return {
            ...sensor,
            value: newValue,
            readings: updatedReadings,
          };
        });
      });
    }, SIMULATION_INTERVAL_SECONDS * 1000); // This simulation interval is for small sensors.
                                        // Long-period sensors update less frequently by design,
                                        // but this interval ensures their `value` property is updated
                                        // and new readings are added.

    return () => clearInterval(interval);
  }, [SIMULATION_INTERVAL_SECONDS]);


  const selectedFactorySensors = useMemo(() => {
    const sensorIdsInFactory = new Set<string>();
    selectedFactory.machines.forEach(machineId => {
      const machine = machines.find(m => m.machineID === machineId);
      if (machine) {
        machine.sensors.forEach(sensorId => sensorIdsInFactory.add(sensorId));
      }
    });
    // This filter is for machine-specific sensors used in the aggregated consumption graph.
    // The green energy sensor is handled separately in its own useMemo.
    return liveAllSensors.filter(sensor => sensorIdsInFactory.has(sensor.id));
  }, [selectedFactory, liveAllSensors]);


  const { graphData: accumulatedSensorGraphData, totalEnergy, totalWater, totalGas } = useMemo(() => {
    return getAccumulatedSensorData(selectedFactorySensors, timeFilter, SIMULATION_INTERVAL_SECONDS);
  }, [selectedFactorySensors, timeFilter, SIMULATION_INTERVAL_SECONDS]);


  const greenEnergyStats = useMemo(() => {
    // === DEBUG LOG 1: Check if selectedFactory.greenEnergySensor exists ===
    console.log("DEBUG: selectedFactory.greenEnergySensor:", selectedFactory.greenEnergySensor);

    if (!selectedFactory.greenEnergySensor) {
      console.warn("DEBUG: No green energy sensor defined for the selected factory.");
      return { min: null, max: null, avg: null, minTime: null, maxTime: null, total: null };
    }

    const greenSensor = liveAllSensors.find(s => s.id === selectedFactory.greenEnergySensor.id);

    // === DEBUG LOG 2: Check if greenSensor is found in liveAllSensors ===
    console.log("DEBUG: greenSensor (from liveAllSensors):", greenSensor);

    if (!greenSensor) {
      console.warn("DEBUG: Green Energy Sensor not found in liveAllSensors for selected factory.");
      return { min: null, max: null, avg: null, minTime: null, maxTime: null, total: null };
    }

    if (!greenSensor.readings || greenSensor.readings.length === 0) {
        console.warn("DEBUG: Green Energy Sensor has no readings.");
        return { min: null, max: null, avg: null, minTime: null, maxTime: null, total: null };
    }


    const now = new Date();
    let periodStart: Date;

    switch (timeFilter) {
      case '1min':
        periodStart = new Date(now.getTime() - 60 * 1000);
        break;
      case '1hour':
        periodStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '1day':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        // Correctly calculate 1 month ago:
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        periodStart = oneMonthAgo;
        break;
      default:
        periodStart = new Date(now.getTime() - 60 * 1000);
        break;
    }

    // === DEBUG LOG 3: Check periodStart and now ===
    console.log("DEBUG: timeFilter:", timeFilter);
    console.log("DEBUG: periodStart:", periodStart);
    console.log("DEBUG: now:", now);


    const readingsInPeriod = greenSensor.readings.filter(
      r => r.time.getTime() >= periodStart.getTime()
    );

    // === DEBUG LOG 4: Check filtered readings ===
    console.log(`DEBUG: greenSensor.readings.length: ${greenSensor.readings.length}`);
    console.log(`DEBUG: readingsInPeriod.length (after filter for ${timeFilter}): ${readingsInPeriod.length}`);
    if (readingsInPeriod.length > 0) {
        console.log("DEBUG: First reading in period:", readingsInPeriod[0]);
        console.log("DEBUG: Last reading in period:", readingsInPeriod[readingsInPeriod.length - 1]);
    }


    if (readingsInPeriod.length === 0) {
      console.warn("DEBUG: No green energy readings found within the selected time filter period.");
      return { min: null, max: null, avg: null, minTime: null, maxTime: null, total: null };
    }

    let minVal = readingsInPeriod[0].value;
    let maxVal = readingsInPeriod[0].value;
    let sum = 0;
    let minTime = readingsInPeriod[0].time;
    let maxTime = readingsInPeriod[0].time;

    for (const reading of readingsInPeriod) {
      sum += reading.value;
      if (reading.value < minVal) {
        minVal = reading.value;
        minTime = reading.time;
      }
      if (reading.value > maxVal) {
        maxVal = reading.value;
        maxTime = reading.time;
      }
    }

    const avgVal = +(sum / readingsInPeriod.length).toFixed(2);
    const totalProduction = readingsInPeriod[readingsInPeriod.length - 1].value; // Assuming cumulative production

    const stats = {
      min: +minVal.toFixed(2),
      max: +maxVal.toFixed(2),
      avg: avgVal,
      minTime,
      maxTime,
      total: +totalProduction.toFixed(2)
    };

    // === DEBUG LOG 5: Final calculated stats ===
    console.log("DEBUG: Calculated greenEnergyStats:", stats);

    return stats;
  }, [selectedFactory.greenEnergySensor, liveAllSensors, timeFilter]);


  const energyStats = useMemo(() => getAccumulatedStats(accumulatedSensorGraphData, 'energy', timeFilter), [accumulatedSensorGraphData, timeFilter]);
  const waterStats = useMemo(() => getAccumulatedStats(accumulatedSensorGraphData, 'water', timeFilter), [accumulatedSensorGraphData, timeFilter]);
  const gasStats = useMemo(() => getAccumulatedStats(accumulatedSensorGraphData, 'gas', timeFilter), [accumulatedSensorGraphData, timeFilter]);


  const xAxisTickFormatter = (tick: Date | string) => {
    const date = typeof tick === 'string' ? new Date(tick) : tick;

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return String(tick);
    }

    switch (timeFilter) {
      case '1min':
        return date.toLocaleTimeString([], { second: '2-digit' });
      case '1hour':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1day':
        return date.toLocaleTimeString([], { hour: '2-digit' });
      case '1week':
      case '1month':
        return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
      default:
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  };

  const formatStatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    switch (timeFilter) {
      case '1min':
      case '1hour':
      case '1day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      case '1week':
      case '1month':
        return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' +
                     date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      default:
        return date.toLocaleString();
    }
  };

  // Filter machines for the currently selected factory
  const machinesInSelectedFactory = useMemo(() => {
    return machines.filter(machine => selectedFactory.machines.includes(machine.machineID));
  }, [selectedFactory, machines]);


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Factories Overview</h2>

      {/* Factory Selection Cards */}
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {factories.map(factory => (
          <div
            key={factory.factoryID}
            onClick={() => setSelectedFactory(factory)}
            className={`min-w-[220px] h-40 rounded-xl cursor-pointer relative transition ${
              selectedFactory.factoryID === factory.factoryID ? 'ring-2 ring-cyan-500' : 'opacity-70 hover:opacity-100'
            }`}
              style={{
              backgroundImage: `url('https://placehold.co/220x160/28a745/ffffff?text=${factory.factoryID}')`, // Placeholder image
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/50 flex items-end p-3 text-white font-semibold text-lg">
              {factory.factoryName}
            </div>
          </div>
        ))}
      </div>

      {/* Display Total Accumulated Values for Selected Factory */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Consumed Energy" value={`${totalEnergy} kWh`} />
        <Card title="Total Water Consumption" value={`${totalWater} L`} />
        <Card title="Total Gas Consumption" value={`${totalGas} units`} />
        <Card title="Green Energy Production" value={`${greenEnergyStats.total !== null ? `${greenEnergyStats.total} kWh` : 'N/A'}`} />
      </div>

      {/* Sensor Accumulation Graph */}
      <div className="bg-gray-900 rounded-xl p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Accumulation Over Time for {selectedFactory.factoryName}</h3>

        <div className="flex justify-end mb-4">
          <select
            className="bg-gray-800 text-white p-2 rounded"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="1min">Last 1 Minute</option>
            <option value="1hour">Last 1 Hour</option>
            <option value="1day">Last 1 Day</option>
            <option value="1week">Last 1 Week</option>
            <option value="1month">Last 1 Month</option>
          </select>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer>
            <LineChart data={accumulatedSensorGraphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={xAxisTickFormatter} />

              <YAxis yAxisId="energy" orientation="left" stroke="#00C49F" />
              <YAxis yAxisId="water" orientation="right" stroke="#FFBB28" />
              <YAxis yAxisId="gas" orientation="right" stroke="#FF8042" width={80} />

              <Tooltip
                  labelFormatter={(label) => {
                    if (label instanceof Date) {
                        if (timeFilter === '1min' || timeFilter === '1hour' || timeFilter === '1day') {
                            return label.toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        } else {
                            return label.toLocaleDateString();
                        }
                    }
                    return String(label);
                  }}
              />
              <Legend />
              <Line yAxisId="energy" type="monotone" dataKey="energy" name="Accumulated Energy (kWh)" stroke="#00C49F" />
              <Line yAxisId="water" type="monotone" dataKey="water" name="Accumulated Water (L)" stroke="#FFBB28" />
              <Line yAxisId="gas" type="monotone" dataKey="gas" name="Accumulated Gas (units)" stroke="#FF8042" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow mt-4">
          <h4 className="text-lg font-semibold mb-3">Consumption Statistics ({timeFilter.replace('1', 'Last 1 ').replace('min', 'Minute').replace('hour', 'Hour').replace('day', 'Day').replace('week', 'Week').replace('month', 'Month')})</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="text-base font-semibold text-gray-300 mb-1">Energy (kWh)</h5>
              <p className="text-sm text-gray-400">Min: <span className="font-bold">{energyStats.min !== null ? `${energyStats.min} kWh` : 'N/A'}</span> <span className="text-xs text-gray-500">at {formatStatTime(energyStats.minTime)}</span></p>
              <p className="text-sm text-gray-400">Max: <span className="font-bold">{energyStats.max !== null ? `${energyStats.max} kWh` : 'N/A'}</span> <span className="text-xs text-gray-500">at {formatStatTime(energyStats.maxTime)}</span></p>
              <p className="text-sm text-gray-400">Avg: <span className="font-bold">{energyStats.avg !== null ? `${energyStats.avg} kWh` : 'N/A'}</span></p>
              <p className="text-sm text-gray-400">Total: <span className="font-bold">{energyStats.total !== null ? `${energyStats.total} kWh` : 'N/A'}</span></p>
            </div>
            <div>
              <h5 className="text-base font-semibold text-gray-300 mb-1">Water (L)</h5>
              <p className="text-sm text-gray-400">Min: <span className="font-bold">{waterStats.min !== null ? `${waterStats.min} L` : 'N/A'}</span> <span className="text-xs text-gray-500">at {formatStatTime(waterStats.minTime)}</span></p>
              <p className="text-sm text-gray-400">Max: <span className="font-bold">{waterStats.max !== null ? `${waterStats.max} L` : 'N/A'}</span> <span className="text-xs text-gray-500">at {formatStatTime(waterStats.maxTime)}</span></p>
              <p className="text-sm text-gray-400">Avg: <span className="font-bold">{waterStats.avg !== null ? `${waterStats.avg} L` : 'N/A'}</span></p>
              <p className="text-sm text-gray-400">Total: <span className="font-bold">{waterStats.total !== null ? `${waterStats.total} L` : 'N/A'}</span></p>
            </div>
            <div>
              <h5 className="text-base font-semibold text-gray-300 mb-1">Gas (units)</h5>
              <p className="text-sm text-gray-400">Min: <span className="font-bold">{gasStats.min !== null ? `${gasStats.min} units` : 'N/A'}</span> <span className="text-xs text-gray-500">at {formatStatTime(gasStats.minTime)}</span></p>
              <p className="text-sm text-gray-400">Max: <span className="font-bold">{gasStats.max !== null ? `${gasStats.max} units` : 'N/A'}</span> <span className="text-xs text-gray-500">at {formatStatTime(gasStats.maxTime)}</span></p>
              <p className="text-sm text-gray-400">Avg: <span className="font-bold">{gasStats.avg !== null ? `${gasStats.avg} units` : 'N/A'}</span></p>
              <p className="text-sm text-gray-400">Total: <span className="font-bold">{gasStats.total !== null ? `${gasStats.total} units` : 'N/A'}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow mt-4">
          <h4 className="text-lg font-semibold mb-3">Green Energy Production Statistics ({timeFilter.replace('1', 'Last 1 ').replace('min', 'Minute').replace('hour', 'Hour').replace('day', 'Day').replace('week', 'Week').replace('month', 'Month')})</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="text-base font-semibold text-gray-300 mb-1">Production (kWh)</h5>
              <p className="text-sm text-gray-400">Min: <span className="font-bold">{greenEnergyStats.min !== null ? `${greenEnergyStats.min} kWh` : 'N/A'}</span> <span className="text-xs text-gray-500">at {formatStatTime(greenEnergyStats.minTime)}</span></p>
              <p className="text-sm text-gray-400">Max: <span className="font-bold">{greenEnergyStats.max !== null ? `${greenEnergyStats.max} kWh` : 'N/A'}</span> <span className="text-xs text-gray-500">at {formatStatTime(greenEnergyStats.maxTime)}</span></p>
              <p className="text-sm text-gray-400">Avg: <span className="font-bold">{greenEnergyStats.avg !== null ? `${greenEnergyStats.avg} kWh` : 'N/A'}</span></p>
              <p className="text-sm text-gray-400">Total: <span className="font-bold">{greenEnergyStats.total !== null ? `${greenEnergyStats.total} kWh` : 'N/A'}</span></p>
            </div>
          </div>
        </div>

      </div>

      {/* NEW: Machines in Selected Factory Section */}
      <div className="space-y-4 mt-6">
        <h3 className="text-xl font-bold">Machines in {selectedFactory.factoryName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machinesInSelectedFactory.map(machine => (
            <div
              key={machine.machineID}
              onClick={() => navigate('/sensors', { state: { machineId: machine.machineID } })}
              className="bg-gray-900 rounded-xl p-4 shadow cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
            >
              <h4 className="text-lg font-semibold">{machine.machineName}</h4>
              <p className="text-sm text-gray-400 mt-1">ID: {machine.machineID}</p>
              {/* You can add more machine-specific data here if desired */}
              <p className="text-sm text-blue-400 mt-2">View Sensors →</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow flex flex-col justify-between">
      <h4 className="text-sm text-gray-400">{title}</h4>
      <p className="text-lg font-semibold mt-2">{value}</p>
    </div>
  );
}