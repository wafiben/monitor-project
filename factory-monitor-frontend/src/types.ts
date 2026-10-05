// types.ts
export interface SensorReading {
  time: Date;
  value: number;
}

export interface Sensor {
  id: string;
  name: string;
  unit: string;
  value: number; // Current live value
  readings: SensorReading[]; // Historical readings
  // ADD THIS LINE
  simulationIntervalSeconds: number; // Interval at which this sensor's data was generated/simulated
}

export interface Machine {
  machineID: string;
  machineName: string;
  sensors: string[]; // Array of sensor IDs associated with this machine
}

export interface Factory {
  factoryID: string;
  factoryName: string;
  machines: string[]; // Array of machine IDs in this factory
  greenEnergySensor: Sensor; // Direct reference to the green energy sensor object
}