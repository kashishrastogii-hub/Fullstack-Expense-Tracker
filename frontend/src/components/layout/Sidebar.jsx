import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PlusCircle, 
  Bookmark, 
  BarChart3, 
  Settings, 
  LogOut,
  Wallet,
  X
} from 'lucide-react';
import AuthService from '../../services/auth.service';
import './sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  const navItems = [
    { path: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/user/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/user/newTransaction', icon: PlusCircle, label: 'New Transaction' },
    { path: '/user/savedTransactions', icon: Bookmark, label: 'Saved Transactions' },
    { path: '/user/statistics', icon: BarChart3, label: 'Statistics' },
    { path: '/user/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    AuthService.logout();
    navigate('/auth/login');
    setShowLogoutModal(false);
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className='sidebar__header'>
          <div className='sidebar__logo'>
            <div className='sidebar__logo-icon'>
              <Wallet size={24} />
            </div>
            <div className='sidebar__logo-text'>
              <span className='sidebar__logo-title'>PocketWise</span>
              <span className='sidebar__logo-subtitle'>Finance</span>
            </div>
          </div>
          <button className='sidebar__close' onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className='sidebar__nav'>
          <div className='sidebar__nav-section'>
            <p className='sidebar__nav-label'>Menu</p>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
                }
                onClick={onClose}
              >
                <item.icon size={20} className='sidebar__nav-icon' />
                <span className='sidebar__nav-text'>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className='sidebar__footer'>
          <div className='sidebar__user'>
            <div className='sidebar__user-avatar'>
              {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className='sidebar__user-info'>
              <p className='sidebar__user-name'>{currentUser?.username || 'User'}</p>
              <p className='sidebar__user-email'>{currentUser?.email || ''}</p>
            </div>
          </div>
          <button className='sidebar__logout' onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div className='modal-overlay' onClick={() => setShowLogoutModal(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal__header'>
              <h3 className='modal__title'>Confirm Logout</h3>
            </div>
            <div className='modal__body'>
              <p className='modal__text'>Are you sure you want to log out?</p>
            </div>
            <div className='modal__footer'>
              <button className='btn btn--secondary' onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className='btn btn--danger' onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
