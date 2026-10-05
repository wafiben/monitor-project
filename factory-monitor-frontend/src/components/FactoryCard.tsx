// src/components/FactoryCard.tsx
interface FactoryCardProps {
  id: string;
  name: string;
  // Add other props here if you want FactoryCard to display them
  // e.g., machinesCount: number;
  // greenEnergyProduction: number;
}

export default function FactoryCard({ id, name }: FactoryCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-md text-white">
      <h3 className="text-xl font-semibold mb-2">{name} (ID: {id})</h3>
      <p className="text-gray-400">Status: Operational</p>
      {/* Add more details here */}
    </div>
  );
}