import React from 'react';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './header.css';

const Header = ({ onMenuClick }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className='header'>
      <div className='header__left'>
        <button className='header__menu-btn' onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div className='header__date'>
          <span className='header__date-text'>{currentDate}</span>
        </div>
      </div>
      <div className='header__right'>
        <button className='header__icon-btn' onClick={toggleTheme} title='Toggle theme'>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className='header__icon-btn'>
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
