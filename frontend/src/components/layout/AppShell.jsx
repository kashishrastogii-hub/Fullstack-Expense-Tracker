import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './appShell.css';

const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className='app-shell'>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      {sidebarOpen && <div className='app-shell__overlay' onClick={closeSidebar}></div>}
      <div className='app-shell__main'>
        <Header onMenuClick={toggleSidebar} />
        <main className='app-shell__content'>
          <div className='app-shell__content-inner'>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
