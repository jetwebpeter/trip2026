import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TourList from './TourList';
import TourDetail from './pages/TourDetail';
import FlightSearch from './components/FlightSearch';
import HotelSearch from './components/HotelSearch';
import VoucherList from './pages/VoucherList';
import VoucherDetail from './pages/VoucherDetail';
import CruiseList from './pages/CruiseList';
import AdminProducts from './pages/AdminProducts';
import ChatPage from './pages/ChatPage';
import RailSearch from './pages/RailSearch';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  return (
    <div className="app-wrapper">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TourList />} />
          <Route path="/tours" element={<TourList />} />
          <Route path="/tour/:id" element={<TourDetail />} />
          <Route path="/flights" element={<FlightSearch />} />
          <Route path="/hotels" element={<HotelSearch />} />
          <Route path="/vouchers" element={<VoucherList />} />
          <Route path="/vouchers/:id" element={<VoucherDetail />} />
          <Route path="/cruises" element={<CruiseList />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/rail" element={<RailSearch />} />
        </Routes>
      </main>
      <footer className="footer shadow-top">
        <div className="container footer-content">
          <p>&copy; 2026 TravelPro B2B2C Platform. All rights reserved.</p>
        </div>
      </footer>
      <ChatBot />
    </div>
  );
};

export default App;
