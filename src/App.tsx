import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import AdminLayout from '@/components/AdminLayout';
import Stations from '@/pages/Stations';
import RentConfirm from '@/pages/RentConfirm';
import MyRentals from '@/pages/MyRentals';
import Overview from '@/pages/admin/Overview';
import Unreturned from '@/pages/admin/Unreturned';
import PricingRules from '@/pages/admin/PricingRules';
import Simulator from '@/pages/admin/Simulator';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Stations />} />
          <Route path="/rent/:stationId" element={<RentConfirm />} />
          <Route path="/my-rentals" element={<MyRentals />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="unreturned" element={<Unreturned />} />
            <Route path="pricing" element={<PricingRules />} />
            <Route path="simulator" element={<Simulator />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
