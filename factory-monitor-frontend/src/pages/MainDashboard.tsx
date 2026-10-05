// src/pages/MainDashboard.tsx
import FactoryCard from '../components/FactoryCard';
// Update the import path to use the new factoryData.ts
import { factories } from '../data/factoryData'; // Corrected import path
import { Factory } from '../types'; // Import the Factory type for clarity and type safety

export default function MainDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Factories Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {factories.map((factory: Factory) => ( // Add type annotation for factory for better type safety
          <FactoryCard
            key={factory.factoryID} // Use factoryID as the key
            id={factory.factoryID} // Pass factoryID as 'id' prop (assuming FactoryCard expects 'id')
            name={factory.factoryName} // Pass factoryName as 'name' prop (assuming FactoryCard expects 'name')
            // You can pass other relevant factory data here if FactoryCard needs them
            // For example, if FactoryCard displayed the green energy production, you'd pass:
            // greenEnergyValue={factory.greenEnergySensor.value}
          />
        ))}
      </div>
    </div>
  );
}