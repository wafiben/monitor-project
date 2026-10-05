// src/pages/AnalysisPage.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


// Import factory data and types
import { factories, machines, allSensors as initialAllSensors } from '../data/factoryData';
import { Sensor, Machine, Factory } from '../types';

// Import analysis calculation helpers
import {
  calculateElectricityCarbonFootprint,
  calculateGasCarbonFootprint,
  calculateWaterCarbonFootprint,
  calculateElectricityCost,
  calculateGasCost,
  calculateWaterCost,
  convertLitersToCubicMeters,
  calculatePowerFactor,
} from '../utils/analysisCalculations';

// Reusing the Card component (adjusted to accept an array of subValues for flexibility)
interface AnalysisCardProps {
  title: string;
  value: string;
  subValues?: { label: string; value: string; colorClass?: string }[];
}

function AnalysisCard({ title, value, subValues }: AnalysisCardProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow flex flex-col justify-between h-52">
      <h4 className="text-sm text-gray-400 mb-2">{title}</h4>
      <p className="text-lg font-semibold text-cyan-400">{value}</p>
      {subValues && subValues.length > 0 && (
        <div className="mt-auto pt-2 border-t border-gray-700">
          {subValues.map((sub, index) => (
            <p key={index} className={`text-sm font-medium ${sub.colorClass || 'text-gray-300'} ${index > 0 ? 'mt-1' : ''}`}>
              {sub.label}: {sub.value}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}


// Helper function to get total consumption for a given sensor type within a date range
const getTotalConsumptionForSensors = (
  sensors: Sensor[],
  sensorNameIncludes: string,
  startDate: Date,
  endDate: Date,
  simulationIntervalSeconds: number
): number => {
  const relevantSensors = sensors.filter(s => s.name.includes(sensorNameIncludes));
  let totalConsumption = 0;

  relevantSensors.forEach(sensor => {
    const readingsInPeriod = sensor.readings.filter(
      r => r.time.getTime() >= startDate.getTime() && r.time.getTime() <= endDate.getTime()
    );

    if (sensor.name.includes("Active Energy Sensor") || sensor.name.includes("Reactive Energy Sensor") || sensor.name.includes("Green Energy Production")) {
      totalConsumption += readingsInPeriod.reduce((sum, r) => sum + r.value, 0);
    } else if (sensor.name.includes("Water Flow Sensor") || sensor.name.includes("Gas Pressure Sensor")) {
      totalConsumption += readingsInPeriod.reduce((sum, r) => sum + r.value * (simulationIntervalSeconds / 60), 0);
    }
  });

  return totalConsumption;
};


export default function AnalysisPage() {
  const navigate = useNavigate();

  const [liveAllSensors, setLiveAllSensors] = useState<Sensor[]>(initialAllSensors);
  const [selectedFactory, setSelectedFactory] = useState<Factory>(factories[0]);

  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  const SIMULATION_INTERVAL_SECONDS = 10;

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveAllSensors(prevSensors => {
        return prevSensors.map(sensor => {
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
          } else if (sensor.name.includes("Energy") || sensor.name.includes("Green Energy")) {
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

          const maxReadingsToKeep = sensor.simulationIntervalSeconds === 5 * 60
            ? Math.ceil(4 * 30 * 24 * 60 * 60 / (5 * 60)) + 100
            : 60 + 10;

          const updatedReadings = [...sensor.readings, newReading];
          if (updatedReadings.length > maxReadingsToKeep) {
            updatedReadings.splice(0, updatedReadings.length - maxReadingsToKeep);
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
  }, [SIMULATION_INTERVAL_SECONDS]);


  const selectedFactoryAllSensors = useMemo(() => {
    const sensorIdsInFactory = new Set<string>();
    selectedFactory.machines.forEach(machineId => {
      const machine = machines.find(m => m.machineID === machineId);
      if (machine) {
        machine.sensors.forEach(sensorId => sensorIdsInFactory.add(sensorId));
      }
    });
    if (selectedFactory.greenEnergySensor) {
      sensorIdsInFactory.add(selectedFactory.greenEnergySensor.id);
    }
    return liveAllSensors.filter(sensor => sensorIdsInFactory.has(sensor.id));
  }, [selectedFactory, liveAllSensors]);


  // --- Calculate Total Consumptions/Productions for the selected period ---
  const totalActiveEnergyKwh = useMemo(() => {
    return getTotalConsumptionForSensors(selectedFactoryAllSensors, "Active Energy Sensor", startDate, endDate, SIMULATION_INTERVAL_SECONDS);
  }, [selectedFactoryAllSensors, startDate, endDate, SIMULATION_INTERVAL_SECONDS]);

  const totalReactiveEnergyKvarh = useMemo(() => {
    return getTotalConsumptionForSensors(selectedFactoryAllSensors, "Reactive Energy Sensor", startDate, endDate, SIMULATION_INTERVAL_SECONDS);
  }, [selectedFactoryAllSensors, startDate, endDate, SIMULATION_INTERVAL_SECONDS]);

  const totalWaterLiters = useMemo(() => {
    return getTotalConsumptionForSensors(selectedFactoryAllSensors, "Water Flow Sensor", startDate, endDate, SIMULATION_INTERVAL_SECONDS);
  }, [selectedFactoryAllSensors, startDate, endDate, SIMULATION_INTERVAL_SECONDS]);

  const totalGasNm3 = useMemo(() => {
    return getTotalConsumptionForSensors(selectedFactoryAllSensors, "Gas Pressure Sensor", startDate, endDate, SIMULATION_INTERVAL_SECONDS);
  }, [selectedFactoryAllSensors, startDate, endDate, SIMULATION_INTERVAL_SECONDS]);

  const totalGreenEnergyKwh = useMemo(() => {
    const greenSensor = selectedFactoryAllSensors.find(s => s.id === selectedFactory.greenEnergySensor.id);
    if (!greenSensor) return 0;
    const readingsInPeriod = greenSensor.readings.filter(
      r => r.time.getTime() >= startDate.getTime() && r.time.getTime() <= endDate.getTime()
    );
    return readingsInPeriod.reduce((sum, r) => sum + r.value, 0);
  }, [selectedFactoryAllSensors, selectedFactory.greenEnergySensor, startDate, endDate]);


  // --- Financial and Environmental Analysis ---

  // Power Factor Calculation
  const powerFactor = useMemo(() => {
    return calculatePowerFactor(totalActiveEnergyKwh, totalReactiveEnergyKvarh);
  }, [totalActiveEnergyKwh, totalReactiveEnergyKvarh]);

  // Electricity Costs (with and without penalty)
  const electricityCostWithPenalty = useMemo(() => calculateElectricityCost(totalActiveEnergyKwh, totalReactiveEnergyKvarh, true), [totalActiveEnergyKwh, totalReactiveEnergyKvarh]);
  const electricityCostWithoutPenalty = useMemo(() => calculateElectricityCost(totalActiveEnergyKwh, totalReactiveEnergyKvarh, false), [totalActiveEnergyKwh, totalReactiveEnergyKvarh]);
  const electricityCarbonFootprint = useMemo(() => calculateElectricityCarbonFootprint(totalActiveEnergyKwh), [totalActiveEnergyKwh]);

  // Natural Gas
  const gasCost = useMemo(() => calculateGasCost(totalGasNm3), [totalGasNm3]);
  const gasCarbonFootprint = useMemo(() => calculateGasCarbonFootprint(totalGasNm3), [totalGasNm3]);

  // Water
  const totalWaterM3 = useMemo(() => convertLitersToCubicMeters(totalWaterLiters), [totalWaterLiters]);
  const waterCost = useMemo(() => calculateWaterCost(totalWaterM3), [totalWaterM3]);
  const waterCarbonFootprint = useMemo(() => calculateWaterCarbonFootprint(totalWaterM3), [totalWaterM3]);

  // Overall Totals
  const totalFinancialCostWithPenalty = electricityCostWithPenalty + gasCost + waterCost;
  const totalFinancialCostWithoutPenalty = electricityCostWithoutPenalty + gasCost + waterCost;
  const totalCarbonFootprint = electricityCarbonFootprint + gasCarbonFootprint + waterCarbonFootprint;

  // --- Pie Chart Data Preparation ---

  // 1. Bill Distribution Data
  const billData = useMemo(() => [
    { name: 'Electricity', value: electricityCostWithPenalty },
    { name: 'Natural Gas', value: gasCost },
    { name: 'Water', value: waterCost },
  ].filter(entry => entry.value > 0), [electricityCostWithPenalty, gasCost, waterCost]);

  const BILL_COLORS = ['#8884d8', '#82ca9d', '#ffc658']; // Purple, Green, Yellow

  // 2. Carbon Footprint Data
  const carbonFootprintData = useMemo(() => [
    { name: 'Electricity', value: electricityCarbonFootprint },
    { name: 'Natural Gas', value: gasCarbonFootprint },
    { name: 'Water', value: waterCarbonFootprint },
  ].filter(entry => entry.value > 0), [electricityCarbonFootprint, gasCarbonFootprint, waterCarbonFootprint]);

  const CARBON_COLORS = ['#ff7300', '#00C49F', '#FFBB28']; // Orange, Cyan, Gold

  // 3. Green Energy Coverage Data
  const greenCoverageData = useMemo(() => {
    const coveredByGreen = Math.min(totalGreenEnergyKwh, totalActiveEnergyKwh);
    const fromGrid = totalActiveEnergyKwh - coveredByGreen;

    return [
      { name: 'Covered by Green Energy', value: coveredByGreen },
      { name: 'From Grid', value: fromGrid },
    ].filter(entry => entry.value > 0);
  }, [totalGreenEnergyKwh, totalActiveEnergyKwh]);

  const GREEN_COVERAGE_COLORS = ['#33b860', '#cc0000']; // Dark Green, Red

  // handleExportReport function using useCallback for performance
  const handleExportReport = useCallback(async () => {
    const input = document.getElementById('report-content');
    if (input) {
      const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait, millimeters, A4 size
      const scale = 2; // Higher scale for better image quality

      const originalScrollY = window.scrollY; // Store current scroll position

      // Temporarily scroll to the top of the content to ensure all is visible for html2canvas
      input.scrollIntoView({ behavior: 'auto', block: 'start' });

      // Small delay to ensure DOM has rendered after scroll (optional, but can help)
      await new Promise(resolve => setTimeout(() => resolve(null), 50));

      try {
        const canvas = await html2canvas(input, {
          scale: scale,
          useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdf.internal.pageSize.getWidth(); // PDF page width (A4: 210mm)
        const pageHeight = pdf.internal.pageSize.getHeight(); // PDF page height (A4: 297mm)

        // Calculate image height based on the ratio to maintain aspect ratio
        const imgHeight = canvas.height * imgWidth / canvas.width;

        let heightLeft = imgHeight;
        let position = 0; // Current position on the PDF page

        // Add a title with the factory name at the top of the first page
        pdf.setFontSize(24); // Set font size for the title
        pdf.text(`${selectedFactory.factoryName} - Analysis Report`, imgWidth / 2, 20, { align: 'center' }); // Centered title at Y=20mm
        position += 30; // Move down after the title for the image content

        // Add the first page content (image of the report section)
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - position); // Subtract the remaining height of the first PDF page after the title

        // If content spans multiple pages, add new pages
        while (heightLeft > 0) {
          position = - (imgHeight - heightLeft); // Calculate position for the next part of the image
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const currentDateTime = new Date().toLocaleString('en-GB', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(/[,/:\s]/g, '-'); // Format date for filename

        pdf.save(`${selectedFactory.factoryName.toLowerCase().replace(/\s/g, '-')}-analysis-report_${currentDateTime}.pdf`);

      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate report. Please try again. Check console for details.");
      } finally {
        // Restore original scroll position
        window.scrollTo(0, originalScrollY);
      }
    } else {
      console.error("Report content element (#report-content) not found.");
      alert("Error: Report content not found on the page.");
    }
  }, [
    // Dependencies to re-create the function if these values change, ensuring fresh data capture
    selectedFactory, startDate, endDate,
    totalActiveEnergyKwh, totalReactiveEnergyKvarh, totalWaterLiters, totalGasNm3, totalGreenEnergyKwh,
    electricityCostWithPenalty, electricityCostWithoutPenalty, electricityCarbonFootprint,
    gasCost, gasCarbonFootprint, waterCost, waterCarbonFootprint,
    powerFactor, totalFinancialCostWithPenalty, totalFinancialCostWithoutPenalty, totalCarbonFootprint,
    billData, carbonFootprintData, greenCoverageData
  ]);


  return (
    <div className="space-y-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Factory Analysis Overview</h2>

        {/* Export Button */}
        <button
          onClick={handleExportReport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
        >
          Export Comprehensive Report
        </button>
      </div>

      {/* Factory Selection Cards - MOVED OUTSIDE report-content */}
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {factories.map(factory => (
          <div
            key={factory.factoryID}
            onClick={() => setSelectedFactory(factory)}
            className={`min-w-[220px] h-40 rounded-xl cursor-pointer relative transition ${
              selectedFactory.factoryID === factory.factoryID ? 'ring-2 ring-cyan-500' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundImage: `url('https://placehold.co/220x160/4CAF50/ffffff?text=${factory.factoryID}')`,
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


      {/* This div now wraps the entire reportable content */}
      <div id="report-content" className="space-y-6">

        {/* Date Range Filter */}
        <div className="bg-gray-800 rounded-xl p-4 shadow flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-200">Analysis Period:</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="startDate" className="text-gray-400">From:</label>
            <input
              type="date"
              id="startDate"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="bg-gray-700 text-white p-2 rounded-md focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="endDate" className="text-gray-400">To:</label>
            <input
              type="date"
              id="endDate"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="bg-gray-700 text-white p-2 rounded-md focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Active Energy */}
          <AnalysisCard
            title="Total Active Energy Consumption"
            value={`${totalActiveEnergyKwh.toFixed(2)} kWh`}
            subValues={[
              { label: 'Cost (with PF penalty)', value: `TND ${electricityCostWithPenalty.toFixed(3)}`, colorClass: 'text-green-400' },
              { label: 'Cost (without PF penalty)', value: `TND ${electricityCostWithoutPenalty.toFixed(3)}`, colorClass: 'text-yellow-400' },
              { label: 'CO₂e', value: `${electricityCarbonFootprint.toFixed(2)} kg`, colorClass: 'text-red-400' },
              { label: 'Power Factor', value: powerFactor.toFixed(3), colorClass: powerFactor < 0.9 ? 'text-red-300' : 'text-green-300' },
            ]}
          />

          {/* Reactive Energy */}
          <AnalysisCard
            title="Total Reactive Energy Consumption"
            value={`${totalReactiveEnergyKvarh.toFixed(2)} kVARh`}
            subValues={[
              { label: 'Indirect Impact', value: `Contributes to Power Factor` },
              { label: 'Note', value: `May incur penalties if PF is low` },
            ]}
          />

          {/* Water Consumption */}
          <AnalysisCard
            title="Total Water Consumption"
            value={`${totalWaterLiters.toFixed(2)} L (${totalWaterM3.toFixed(2)} m³)`}
            subValues={[
              { label: 'Cost', value: `TND ${waterCost.toFixed(3)}`, colorClass: 'text-green-400' },
              { label: 'CO₂e', value: `${waterCarbonFootprint.toFixed(2)} kg`, colorClass: 'text-red-400' },
            ]}
          />

          {/* Gas Consumption */}
          <AnalysisCard
            title="Total Gas Consumption"
            value={`${totalGasNm3.toFixed(2)} Nm³`}
            subValues={[
              { label: 'Cost', value: `TND ${gasCost.toFixed(3)}`, colorClass: 'text-green-400' },
              { label: 'CO₂e', value: `${gasCarbonFootprint.toFixed(2)} kg`, colorClass: 'text-red-400' },
            ]}
          />

          {/* Green Energy Production */}
          <AnalysisCard
            title="Total Green Energy Production"
            value={`${totalGreenEnergyKwh.toFixed(2)} kWh`}
            subValues={[
              { label: 'Potential Savings', value: `TND ${calculateElectricityCost(totalGreenEnergyKwh, 0, false).toFixed(3)}`, colorClass: 'text-green-400' },
              { label: 'CO₂e Offset', value: `${calculateElectricityCarbonFootprint(totalGreenEnergyKwh).toFixed(2)} kg`, colorClass: 'text-blue-300' },
            ]}
          />
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <AnalysisCard
            title="Overall Estimated Financial Cost"
            value={`TND ${totalFinancialCostWithPenalty.toFixed(3)}`}
            subValues={[
              { label: 'Includes Power Factor Penalties', value: '' },
              { label: 'Cost without PF penalty', value: `TND ${totalFinancialCostWithoutPenalty.toFixed(3)}`, colorClass: 'text-yellow-300' },
            ]}
          />
          <AnalysisCard
            title="Overall Estimated Carbon Footprint"
            value={`${totalCarbonFootprint.toFixed(2)} kg CO₂e`}
            subValues={[
              { label: 'Excludes Reactive Energy Direct Impact', value: '' },
            ]}
          />
        </div>

        {/* --- Pie Charts Section --- */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Visual Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 1. Bill Distribution Pie Chart */}
            <div className="bg-gray-800 rounded-xl p-4 shadow flex flex-col items-center">
              <h4 className="text-lg font-semibold mb-4">Total Bill Distribution</h4>
              {billData.length > 0 && totalFinancialCostWithPenalty > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart margin={{ top: 60, right: 60, bottom: 60, left: 60 }}>
                    <Pie
                      data={billData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percent }) => {
                        const value = ((percent ?? 0) * 100);
                        return value > 0.1 ? `${value.toFixed(1)}%` : '';
                      }}
                    >
                      {billData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BILL_COLORS[index % BILL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`TND ${value.toFixed(3)}`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400">No bill data for selected period.</p>
              )}
            </div>

            {/* 2. Carbon Footprint Pie Chart */}
            <div className="bg-gray-800 rounded-xl p-4 shadow flex flex-col items-center">
              <h4 className="text-lg font-semibold mb-4">Carbon Footprint Distribution</h4>
              {carbonFootprintData.length > 0 && totalCarbonFootprint > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart margin={{ top: 60, right: 60, bottom: 60, left: 60 }}>
                    <Pie
                      data={carbonFootprintData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#82ca9d"
                      dataKey="value"
                      label={({ percent }) => {
                        const value = ((percent ?? 0) * 100);
                        return value > 0.1 ? `${value.toFixed(1)}%` : '';
                      }}
                    >
                      {carbonFootprintData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CARBON_COLORS[index % CARBON_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(2)} kg CO₂e`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400">No carbon footprint data for selected period.</p>
              )}
            </div>

            {/* 3. Green Energy Coverage Pie Chart */}
            <div className="bg-gray-800 rounded-xl p-4 shadow flex flex-col items-center">
              <h4 className="text-lg font-semibold mb-4">Electricity Coverage by Green Power</h4>
              {greenCoverageData.length > 0 && totalActiveEnergyKwh > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart margin={{ top: 60, right: 60, bottom: 60, left: 60 }}>
                    <Pie
                      data={greenCoverageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#ffc658"
                      dataKey="value"
                      label={({ percent }) => {
                        const value = ((percent ?? 0) * 100);
                        return value > 0.1 ? `${value.toFixed(1)}%` : '';
                      }}
                    >
                      {greenCoverageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GREEN_COVERAGE_COLORS[index % GREEN_COVERAGE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(2)} kWh`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400">No electricity consumption to cover.</p>
              )}
            </div>

          </div>
        </div>
      </div> {/* END of id="report-content" div */}
    </div>
  );
}