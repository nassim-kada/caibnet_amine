"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LayoutDashboard, Users, Activity, FileText, Stethoscope } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const pathname = usePathname();
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('app_user_role') || 'admin' : 'admin';
  
  const navItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
    { name: 'Patients', path: '/patients', icon: <Users size={20} />, roles: ['admin', 'secretary'] },
    { name: 'Médecins', path: '/doctors', icon: <Stethoscope size={20} />, roles: ['admin'] },
    { name: 'Blessures', path: '/injuries', icon: <Activity size={20} />, roles: ['admin'] },
    { name: 'Ordonnances', path: '/prescriptions', icon: <FileText size={20} />, roles: ['admin'] },
  ].filter(item => item.roles.includes(userRole));

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
          <Link
            key={item.path}
            href={item.path}
            className={clsx(styles.navItem, { [styles.active]: pathname.startsWith(item.path) })}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};
