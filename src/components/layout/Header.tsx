"use client";

import {useState, useRef, useEffect } from 'react';
import { Menu, Search, Calendar, LogOut, User, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter, usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Input } from '../ui/Input';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    router.push('/login');
  };

  // Determine page title based on route
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard': return 'Tableau de bord';
      case '/patients': return 'Gestion des patients';
      case '/injuries': return 'Catalogue des blessures';
      case '/prescriptions': return 'Générateur d\'ordonnances';
      default: return '';
    }
  };

  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
  // Capitalize first letter
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuButton} onClick={onMenuClick} aria-label="Menu">
          <Menu size={24} />
        </button>
        <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      </div>

      <div className={styles.center}>
        <Input 
          placeholder="Rechercher un patient, un dossier..." 
          leftIcon={<Search size={18} />}
          style={{ backgroundColor: 'var(--color-bg)' }}
        />
      </div>

      <div className={styles.right}>
        <div className={styles.date}>
          <Calendar size={18} />
          <span>{formattedDate}</span>
        </div>

        <div className={styles.profileContainer} ref={dropdownRef}>
          <button 
            className={styles.profileButton}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className={styles.avatar}>A</div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>Administrateur</span>
              <span className={styles.profileRole}>Physio.Pro H.A</span>
            </div>
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <button className={styles.dropdownItem}>
                <User size={18} />
                Mon profil
              </button>
              <button className={styles.dropdownItem}>
                <Settings size={18} />
                Paramètres
              </button>
              <div style={{ height: 1, backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
              <button 
                className={clsx(styles.dropdownItem, styles.danger)}
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
