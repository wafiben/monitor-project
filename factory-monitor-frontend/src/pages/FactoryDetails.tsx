import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { factoryDetail } from '../data/factoryDetails';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#00C49F', '#FFBB28', '#FF8042'];

export default function FactoryDetails() {
  const navigate = useNavigate();

  const { energy, costs, co2, location } = factoryDetail;

  const costImport = energy.activeImport * costs.importRate;
  const costExport = energy.activeExport * costs.exportRate;
  const costGas = energy.gas * costs.gasRate;
  const totalCost = costImport + costGas - costExport;

  const costData = [
    { name: 'Electricity Import', value: costImport },
    { name: 'Electricity Export (saved)', value: -costExport },
    { name: 'Gas', value: costGas },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Factory Details: {factoryDetail.name}</h2>

      {/* 1. Energy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Active Energy Import" value={`${energy.activeImport} kWh`} />
        <Card title="Active Energy Export" value={`${energy.activeExport} kWh`} />
        <Card title="Reactive Energy" value={`${energy.reactive} kWh`} />
        <Card title="Gas" value={`${energy.gas} Nm³`} />
      </div>

      {/* 2. Cost Conversions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Electricity Import Cost" value={`€${costImport.toFixed(2)}`} />
        <Card title="Electricity Export Savings" value={`-€${costExport.toFixed(2)}`} />
        <Card title="Gas Cost" value={`€${costGas.toFixed(2)}`} />
      </div>

      {/* 3. Pie Chart */}
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4">Total Energy Cost Breakdown</h3>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={costData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {costData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. CO2 Footprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="CO₂ from Electricity" value={`${co2.electricity} kg`} />
        <Card title="CO₂ from Gas" value={`${co2.gas} kg`} />
      </div>

      {/* 5. Location */}
      <Card title="Factory Location" value={location} />

      {/* 6. Machines Navigation */}
      <div
        className="bg-gradient-to-r from-cyan-700 to-blue-800 p-6 rounded-xl text-white cursor-pointer hover:opacity-90"
        onClick={() => navigate('/machines')}
      >
        <h3 className="text-lg font-bold">View Machines →</h3>
        <p className="text-sm mt-1">See detailed data for individual machines.</p>
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
