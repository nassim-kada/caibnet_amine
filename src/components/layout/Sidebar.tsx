import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, Users, Activity, FileText } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const navItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Patients', path: '/patients', icon: <Users size={20} /> },
    { name: 'Blessures', path: '/injuries', icon: <Activity size={20} /> },
    { name: 'Ordonnances', path: '/prescriptions', icon: <FileText size={20} /> },
  ];

  return (
    <aside className={clsx(styles.sidebar, { [styles.open]: isOpen })}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          {/* Simple SVG placeholder for the logo as requested */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L8 6H16L12 2Z" fill="currentColor"/>
            <circle cx="12" cy="12" r="5" fill="currentColor"/>
            <path d="M12 22C17.5228 22 22 17.5228 22 12H20C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12H2C2 17.5228 6.47715 22 12 22Z" fill="var(--color-secondary)"/>
          </svg>
        </div>
        <div className={styles.logoTextContainer}>
          <span className={styles.logoTitle}>Physio.Pro H.A</span>
          <span className={styles.logoSubtitle}>Cabinet de rééducation</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(styles.navItem, { [styles.active]: isActive })}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
