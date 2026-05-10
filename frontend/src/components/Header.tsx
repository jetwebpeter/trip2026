import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Compass, Building2, Ship } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          <div className="logo-icon">🌍</div>
          <span className="logo-text">TravelPro</span>
        </Link>
        <nav className="nav">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <Compass size={18} />
            <span>團體旅遊</span>
          </Link>
          <Link
            to="/flights"
            className={`nav-link ${isActive('/flights') ? 'active' : ''}`}
          >
            <Plane size={18} />
            <span>機票</span>
          </Link>
          <Link
            to="/hotels"
            className={`nav-link ${isActive('/hotels') ? 'active' : ''}`}
          >
            <Building2 size={18} />
            <span>酒店</span>
          </Link>
          <Link
            to="/vouchers"
            className={`nav-link ${isActive('/vouchers') ? 'active' : ''}`}
          >
            <span>🎫 票券</span>
          </Link>
          <Link
            to="/cruises"
            className={`nav-link ${isActive('/cruises') ? 'active' : ''}`}
          >
            <Ship size={18} />
            <span>郵輪</span>
          </Link>
          <Link
            to="/rail"
            className={`nav-link ${isActive('/rail') ? 'active' : ''}`}
          >
            <span>🚄</span>
            <span>火車</span>
          </Link>
          <Link
            to="/admin/products"
            className={`nav-link ${isActive('/admin/products') ? 'active' : ''}`}
          >
            <span>產品管理</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
