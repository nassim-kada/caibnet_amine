"use client";

import { useState } from 'react';
import clsx from 'clsx';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import styles from './AppLayout.module.css';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* Overlay for mobile when sidebar is open */}
      <div 
        className={clsx(styles.overlay, { [styles.open]: isSidebarOpen })} 
        onClick={closeSidebar}
        aria-hidden="true"
      />
      
      <div className={styles.mainContent}>
        <Header onMenuClick={toggleSidebar} />
        
        <main className={styles.pageContainer}>
          {children}
        </main>
      </div>
    </div>
  );
};
