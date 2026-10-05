import { Factory, Machine, Sensor } from '../types';

/**
 * Verifies that each sensor (by ID) is assigned to exactly one machine or exactly one factory's green energy sensor.
 * @param allSensors The global list of all sensor objects.
 * @param machines The global list of all machine objects.
 * @param factories The global list of all factory objects.
 * @returns true if all sensors are uniquely assigned, false otherwise.
 */
export function verifySensorUniqueness(
  allSensors: Sensor[],
  machines: Machine[],
  factories: Factory[]
): boolean {
  console.log('--- Verifying Sensor Uniqueness ---');
  let isValid = true;
  const sensorOwnerMap = new Map<string, string>(); // Maps sensorID to "MachineID" or "FactoryID"

  // 1. Check sensors within machines
  machines.forEach(machine => {
    machine.sensors.forEach(sensorId => {
      if (sensorOwnerMap.has(sensorId)) {
        console.error(
          `❌ ERROR: Sensor ID '${sensorId}' is assigned to multiple entities. ` +
          `Already assigned to '${sensorOwnerMap.get(sensorId)}', now also in Machine '${machine.machineID}'.`
        );
        isValid = false;
      } else {
        sensorOwnerMap.set(sensorId, `Machine:${machine.machineID}`);
      }
    });
  });

  // 2. Check green energy sensors within factories
  factories.forEach(factory => {
    const greenSensorId = factory.greenEnergySensor.id;
    if (sensorOwnerMap.has(greenSensorId)) {
      console.error(
        `❌ ERROR: Green Energy Sensor ID '${greenSensorId}' from Factory '${factory.factoryID}' is assigned to multiple entities. ` +
        `Already assigned to '${sensorOwnerMap.get(greenSensorId)}', now also in Factory '${factory.factoryID}' (Green Energy).`
      );
      isValid = false;
    } else {
      sensorOwnerMap.set(greenSensorId, `Factory:${factory.factoryID} (Green Energy)`);
    }
  });

  // 3. Verify that all sensors in allSensors are accounted for and unique
  allSensors.forEach(sensor => {
    if (!sensorOwnerMap.has(sensor.id)) {
      console.warn(`⚠️ WARNING: Sensor ID '${sensor.id}' ('${sensor.name}') exists in 'allSensors' but is not assigned to any machine or factory's green energy sensor.`);
      // This is a warning, not necessarily an error for uniqueness, but indicates data inconsistency
    }
  });

  // Optional: Check for duplicate sensor IDs within the global allSensors list itself
  const uniqueSensorIdsInAllSensors = new Set<string>();
  allSensors.forEach(sensor => {
    if (uniqueSensorIdsInAllSensors.has(sensor.id)) {
      console.error(`❌ ERROR: Duplicate Sensor ID '${sensor.id}' found in the 'allSensors' list itself.`);
      isValid = false;
    }
    uniqueSensorIdsInAllSensors.add(sensor.id);
  });


  if (isValid) {
    console.log('✅ Sensor uniqueness verified: Each sensor is assigned to a unique machine or factory green energy sensor.');
  } else {
    console.error('❌ Sensor uniqueness verification FAILED.');
  }
  console.log('--- End Sensor Uniqueness Verification ---');
  return isValid;
}


/**
 * Verifies that each machine (by ID) is assigned to exactly one factory.
 * @param machines The global list of all machine objects.
 * @param factories The global list of all factory objects.
 * @returns true if all machines are uniquely assigned, false otherwise.
 */
export function verifyMachineUniqueness(
  machines: Machine[],
  factories: Factory[]
): boolean {
  console.log('--- Verifying Machine Uniqueness ---');
  let isValid = true;
  const machineOwnerMap = new Map<string, string>(); // Maps machineID to factoryID

  factories.forEach(factory => {
    factory.machines.forEach(machineId => {
      if (machineOwnerMap.has(machineId)) {
        console.error(
          `❌ ERROR: Machine ID '${machineId}' is assigned to multiple factories. ` +
          `Already assigned to Factory '${machineOwnerMap.get(machineId)}', now also in Factory '${factory.factoryID}'.`
        );
        isValid = false;
      } else {
        machineOwnerMap.set(machineId, factory.factoryID);
      }
    });
  });

  // Verify that all machines in the global 'machines' array are accounted for
  machines.forEach(machine => {
    if (!machineOwnerMap.has(machine.machineID)) {
      console.warn(`⚠️ WARNING: Machine ID '${machine.machineID}' ('${machine.machineName}') exists in 'machines' but is not assigned to any factory.`);
      // This is a warning, not necessarily an error for uniqueness, but indicates data inconsistency
    }
  });

  // Optional: Check for duplicate machine IDs within the global machines list itself
  const uniqueMachineIdsInAllMachines = new Set<string>();
  machines.forEach(machine => {
    if (uniqueMachineIdsInAllMachines.has(machine.machineID)) {
      console.error(`❌ ERROR: Duplicate Machine ID '${machine.machineID}' found in the 'machines' list itself.`);
      isValid = false;
    }
    uniqueMachineIdsInAllMachines.add(machine.machineID);
  });

  if (isValid) {
    console.log('✅ Machine uniqueness verified: Each machine is assigned to a unique factory.');
  } else {
    console.error('❌ Machine uniqueness verification FAILED.');
  }
  console.log('--- End Machine Uniqueness Verification ---');
  return isValid;
}