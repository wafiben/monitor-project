import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom'; // NEW: Import useLocation hook
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { allSensors as initialAllSensors, machines, factories } from '../data/factoryData';
import { Sensor, Machine, Factory } from '../types'; // Ensure Factory is imported for type safety

function isOutOfRange(sensor: Sensor) {
  if (sensor.name.includes('Temperature')) return sensor.value > 35 || sensor.value < 10;
  if (sensor.name.includes('Flow')) return sensor.value > 80 || sensor.value < 5;
  if (sensor.name.includes('Pressure')) return sensor.value > 7 || sensor.value < 1;
  if (sensor.name.includes('Voltage')) return sensor.value > 240 || sensor.value < 210;
  if (sensor.name.includes('Current')) return sensor.value > 25 || sensor.value < 1;
  if (sensor.name.includes('Humidity')) return sensor.value > 90 || sensor.value < 30;
  return false;
}

const calculateAverage = (readings: any[]) => {
  if (readings.length === 0) return 0;
  const sum = readings.reduce((acc, r) => acc + r.value, 0);
  return +(sum / readings.length).toFixed(1);
};

export default function SensorsPage() {
  const location = useLocation(); // NEW: Get location object from react-router-dom
  // NEW: Extract machineId from location.state. This will be null if no machineId is passed.
  const machineId = (location.state as { machineId?: string })?.machineId;

  // NEW: Memoized initial filtering of sensors based on machineId
  const initialFilteredSensors = useMemo(() => {
    if (machineId) {
      const machine = machines.find(m => m.machineID === machineId);
      if (machine) {
        // Filter initialAllSensors to only include those belonging to the selected machine
        return initialAllSensors.filter(sensor => machine.sensors.includes(sensor.id));
      }
    }
    // If no machineId or machine not found, default to showing all sensors (original behavior)
    return initialAllSensors;
  }, [machineId]); // Dependency on machineId ensures re-calculation when it changes

  // NEW: liveSensorsForDisplay will now be initialized with the filtered sensors
  const [liveSensorsForDisplay, setLiveSensorsForDisplay] = useState<Sensor[]>(initialFilteredSensors);

  // Default to the first Active Energy Sensor from the *filtered* list
  // If no energy sensor, default to the first available sensor in the filtered list
  const [mainSensor, setMainSensor] = useState<Sensor>(
    initialFilteredSensors.find(s => s.name.includes("Active Energy Sensor")) || initialFilteredSensors[0]
  );
  const [timeFilter, setTimeFilter] = useState('1min');

  const SIMULATION_INTERVAL_SECONDS = 10;
  const MAX_SMALL_SENSOR_READINGS = 6;

  // NEW: Effect to update liveSensorsForDisplay and reset mainSensor when initialFilteredSensors changes
  // This ensures the page reacts correctly when navigating from MachinesPage with a new machineId
  useEffect(() => {
    setLiveSensorsForDisplay(initialFilteredSensors);
    setMainSensor(initialFilteredSensors.find(s => s.name.includes("Active Energy Sensor")) || initialFilteredSensors[0]);
  }, [initialFilteredSensors]);


  const currentMainSensor = useMemo(() => {
    return liveSensorsForDisplay.find(s => s.id === mainSensor.id) || mainSensor;
  }, [liveSensorsForDisplay, mainSensor]);

  // Small sensors are now ALL sensors *except* the main sensor from the currently displayed set
  const smallSensors = useMemo(() => { // This memo is now effectively filtering the `liveSensorsForDisplay`
    return liveSensorsForDisplay.filter(sensor => sensor.id !== currentMainSensor.id);
  }, [liveSensorsForDisplay, currentMainSensor]);


  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSensorsForDisplay(prev => { // Update liveSensorsForDisplay, which is already filtered
        return prev.map(sensor => {
          const now = new Date();
          const lastValue = sensor.readings[sensor.readings.length - 1]?.value || sensor.value;
          const delta = (Math.random() - 0.5) * 2;
          let newValue = +(lastValue + delta).toFixed(1);

          if (sensor.name.includes("Temperature")) {
            if (newValue < -10) newValue = -10;
            if (newValue > 40) newValue = 40;
          } else if (sensor.name.includes("Flow")) {
            if (newValue < 0) newValue = 0;
            if (newValue > 100) newValue = 100;
          } else if (sensor.name.includes("Pressure")) {
            if (newValue < 0) newValue = 0;
            if (newValue > 10) newValue = 10;
          } else if (sensor.name.includes("Energy")) {
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
          let updatedReadings = [...sensor.readings, newReading];

          if (sensor.id !== currentMainSensor.id) {
            updatedReadings = updatedReadings.slice(-MAX_SMALL_SENSOR_READINGS);
          }

          return {
            ...sensor,
            value: newValue,
            readings: updatedReadings,
          };
        });
      });
    }, SIMULATION_INTERVAL_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [SIMULATION_INTERVAL_SECONDS, currentMainSensor.id]);


  const filteredMainSensorReadings = useMemo(() => {
    if (!currentMainSensor || !currentMainSensor.readings || currentMainSensor.readings.length === 0) return [];

    const now = new Date();
    let periodStart: Date;
    let filteredData: { time: Date; value: number }[] = [];
    const rawReadings = currentMainSensor.readings;

    switch (timeFilter) {
      case '1min':
        periodStart = new Date(now.getTime() - 60 * 1000);
        filteredData = rawReadings.filter(r => r.time.getTime() >= periodStart.getTime());
        filteredData = filteredData.slice(-6);
        break;

      case '1hour':
        periodStart = new Date(now.getTime() - 60 * 60 * 1000);
        const readingsInLastHour = rawReadings.filter(r => r.time.getTime() >= periodStart.getTime());

        for (let i = 0; i < 12; i++) {
          const segmentStart = new Date(periodStart.getTime() + i * 5 * 60 * 1000);
          const segmentEnd = new Date(periodStart.getTime() + (i + 1) * 5 * 60 * 1000);

          const segmentReadings = readingsInLastHour.filter(
            r => r.time.getTime() >= segmentStart.getTime() && r.time.getTime() < segmentEnd.getTime()
          );

          filteredData.push({
            time: segmentEnd,
            value: calculateAverage(segmentReadings),
          });
        }
        break;

      case '1day':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const readingsInLastDay = rawReadings.filter(r => r.time.getTime() >= periodStart.getTime());

        for (let i = 0; i < 24; i++) {
          const segmentStart = new Date(periodStart.getTime() + i * 60 * 60 * 1000);
          const segmentEnd = new Date(periodStart.getTime() + (i + 1) * 60 * 60 * 1000);

          const segmentReadings = readingsInLastDay.filter(
            r => r.time.getTime() >= segmentStart.getTime() && r.time.getTime() < segmentEnd.getTime()
          );

          filteredData.push({
            time: segmentEnd,
            value: calculateAverage(segmentReadings),
          });
        }
        break;

      case '1week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const readingsInLastWeek = rawReadings.filter(r => r.time.getTime() >= periodStart.getTime());

        for (let i = 0; i < 7; i++) {
          const segmentStart = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
          const segmentEnd = new Date(periodStart.getTime() + (i + 1) * 24 * 60 * 60 * 1000);

          const segmentReadings = readingsInLastWeek.filter(
            r => r.time.getTime() >= segmentStart.getTime() && r.time.getTime() < segmentEnd.getTime()
          );

          filteredData.push({
            time: segmentEnd,
            value: calculateAverage(segmentReadings),
          });
        }
        break;

      case '1month':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
        const readingsInLastMonth = rawReadings.filter(r => r.time.getTime() >= periodStart.getTime());

        for (let i = 0; i < 30; i++) {
            const segmentStart = new Date(periodStart);
            segmentStart.setDate(periodStart.getDate() + i);
            const segmentEnd = new Date(periodStart);
            segmentEnd.setDate(periodStart.getDate() + i + 1);

            const segmentReadings = readingsInLastMonth.filter(
                r => r.time.getTime() >= segmentStart.getTime() && r.time.getTime() < segmentEnd.getTime()
            );

            filteredData.push({
                time: segmentEnd,
                value: calculateAverage(segmentReadings),
            });
        }
        break;

      default:
        periodStart = new Date(now.getTime() - 60 * 1000);
        filteredData = rawReadings.filter(r => r.time.getTime() >= periodStart.getTime());
        filteredData = filteredData.slice(-6);
        break;
    }
    return filteredData;
  }, [currentMainSensor.readings, timeFilter, currentMainSensor]);


  const mainSensorStats = useMemo(() => {
    if (!currentMainSensor || !currentMainSensor.readings || currentMainSensor.readings.length === 0) {
      return { min: null, max: null, avg: null, minTime: null, maxTime: null };
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

    const readingsInPeriod = currentMainSensor.readings.filter(r => r.time.getTime() >= periodStart.getTime());

    if (readingsInPeriod.length === 0) {
      return { min: null, max: null, avg: null, minTime: null, maxTime: null };
    }

    let minVal = readingsInPeriod[0].value;
    let maxVal = readingsInPeriod[0].value;
    let minTime = readingsInPeriod[0].time;
    let maxTime = readingsInPeriod[0].time;
    let sum = 0;

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

    const avgVal = +(sum / readingsInPeriod.length).toFixed(1);

    return { min: minVal, max: maxVal, avg: avgVal, minTime, maxTime };
  }, [currentMainSensor.readings, timeFilter]);


  const xAxisTickFormatter = (tick: Date | string) => {
    const date = typeof tick === 'string' ? new Date(tick) : tick;

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return String(tick);
    }

    switch (timeFilter) {
      case '1min':
        return date.toLocaleTimeString([], { second: '2-digit', minute: '2-digit' });
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

  const getMachineNameForSensor = (sensorId: string) => {
    for (const machine of machines) {
      if (machine.sensors.includes(sensorId)) {
        return machine.machineName;
      }
    }
    return "Unknown Machine";
  };

  const getFactoryNameForMachine = (machineId: string) => {
    for (const factory of factories) {
      if (factory.machines.includes(machineId)) {
        return factory.factoryName;
      }
    }
    return "Unknown Factory";
  };

  // NEW: Get the current machine object if a machineId is present
  const currentMachine = useMemo(() => {
    if (machineId) {
      return machines.find(m => m.machineID === machineId);
    }
    return null; // No specific machine selected
  }, [machineId]);

  return (
    <div className="space-y-6">
      {/* NEW: Dynamic title based on whether a machine is selected */}
      <h2 className="text-2xl font-bold">
        {currentMachine ? `Sensors for ${currentMachine.machineName}` : 'All Individual Sensors'}
      </h2>
      {/* NEW: Display factory name if a machine is selected */}
      {currentMachine && (
        <p className="text-lg text-gray-400">
          Factory: {getFactoryNameForMachine(currentMachine.machineID)}
        </p>
      )}

      <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-10rem)] min-h-0 overflow-hidden">
        {/* === LEFT: Main Large Graph === */}
        <div className="flex-1 bg-gray-900 rounded-xl p-4 shadow space-y-4 flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {currentMainSensor.name} <br/>
              {/* REMOVED: The inline machine/factory name here as it's now in the page title/subtitle */}
              {/* The original code had: <span className="text-sm text-gray-400">(Machine: {getMachineNameForSensor(currentMainSensor.id)} | Factory: {getFactoryNameForMachine(getMachineNameForSensor(currentMainSensor.id))})</span> */}
            </h3>
            <span className={`text-xl font-semibold ${isOutOfRange(currentMainSensor) ? 'text-red-400' : 'text-gray-400'}`}>
              {currentMainSensor.value} {currentMainSensor.unit} {isOutOfRange(currentMainSensor) && '⚠️'}
            </span>
          </div>

          {/* Time Filter Dropdown */}
          <div className="flex justify-end">
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

          {/* Main Chart */}
          <div className="w-full flex-1 min-h-0">
            <div style={{ height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredMainSensorReadings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    minTickGap={5}
                    tickFormatter={xAxisTickFormatter}
                  />
                  <YAxis />
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
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isOutOfRange(currentMainSensor) ? '#FF4444' : '#00C49F'}
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Main Sensor Statistics */}
          <div className="bg-gray-800 rounded-lg p-3 text-white text-sm mt-4">
            <h4 className="font-semibold text-base mb-2">Period Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <p className="text-gray-400">Min Value:</p>
                <p className="font-bold">{mainSensorStats.min !== null ? `${mainSensorStats.min} ${currentMainSensor.unit}` : 'N/A'}</p>
                <p className="text-gray-500 text-xs">at {formatStatTime(mainSensorStats.minTime)}</p>
              </div>
              <div>
                <p className="text-gray-400">Max Value:</p>
                <p className="font-bold">{mainSensorStats.max !== null ? `${mainSensorStats.max} ${currentMainSensor.unit}` : 'N/A'}</p>
                <p className="text-gray-500 text-xs">at {formatStatTime(mainSensorStats.maxTime)}</p>
              </div>
              <div>
                <p className="text-gray-400">Average Value:</p>
                <p className="font-bold">{mainSensorStats.avg !== null ? `${mainSensorStats.avg} ${currentMainSensor.unit}` : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* === RIGHT: Smaller Sensor Graphs (list all sensors and allow selection) === */}
        <div className="flex flex-col gap-4 w-full xl:w-1/3 min-h-0 overflow-y-auto hide-scrollbar">
          {/* NOW MAPPING OVER liveSensorsForDisplay (which is filtered) instead of liveAllSensors */}
          {liveSensorsForDisplay.map(sensor => (
            <div
              key={sensor.id}
              onClick={() => setMainSensor(sensor)}
              className={`bg-gray-900 rounded-xl p-4 shadow space-y-2 transition cursor-pointer ${
                isOutOfRange(sensor) ? 'ring-2 ring-red-500 bg-red-900/80' : ''
              } ${sensor.id === currentMainSensor.id ? 'ring-2 ring-cyan-500' : 'opacity-70 hover:opacity-100'}`}
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold">{sensor.name}</h4>
                <span className={`text-sm font-semibold ${isOutOfRange(sensor) ? 'text-red-400' : 'text-gray-400'}`}>
                  {sensor.value} {sensor.unit} {isOutOfRange(sensor) && '⚠️'}
                </span>
              </div>
              <p className="text-xs text-gray-500 -mt-1 mb-2">
                Machine: {getMachineNameForSensor(sensor.id)} | Factory: {getFactoryNameForMachine(getMachineNameForSensor(sensor.id))}
              </p>

              {/* Small sensor chart */}
              <div className="w-full">
                <div style={{ height: '100px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensor.readings.slice(-MAX_SMALL_SENSOR_READINGS)}>
                      <XAxis hide dataKey="time" />
                      <YAxis hide />
                      <Tooltip
                        labelFormatter={(label) => {
                          if (label instanceof Date) {
                            return label.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          }
                          return String(label);
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={isOutOfRange(sensor) ? '#FF4444' : '#00C49F'}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}