import { useEffect } from 'react'; // Import useEffect
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import MainDashboard from './pages/MainDashboard';
import FactoryDetails from './pages/FactoryDetails';
import MachinesPage from './pages/MachinesPage';
import SensorsPage from './pages/SensorsPage';
import AnalysisPage from './pages/AnalysisPage';


import { factories, machines, allSensors } from './data/factoryData';
import { verifySensorUniqueness, verifyMachineUniqueness } from './utils/dataVerifiers';

function App() {
  useEffect(() => {
    // Run data verification when the app component mounts
    console.log('--- Running data verifications ---');
    const sensorsOk = verifySensorUniqueness(allSensors, machines, factories);
    const machinesOk = verifyMachineUniqueness(machines, factories);

    if (sensorsOk && machinesOk) {
      console.log('🎉 All data relationships verified successfully!');
    } else {
      console.error('⚠️ Data verification issues found. Check console for details.');
    }
    console.log('--- Data verifications complete ---');
  }, []); // The empty dependency array ensures this effect runs only once after the initial render

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<MainDashboard />} />
          <Route path="factory" element={<FactoryDetails />} />
          <Route path="machines" element={<MachinesPage />} />
          <Route path="sensors" element={<SensorsPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;