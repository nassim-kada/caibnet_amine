"use client";

import React from 'react';
import clsx from 'clsx';
import styles from './Table.module.css';

export const TableContainer = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx(styles.tableContainer, className)} {...props}>
    <table className={styles.table}>{children}</table>
  </div>
);

export const TableHead = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={className} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={className} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={clsx(styles.tr, className)} {...props}>
    {children}
  </tr>
);

export const TableHeader = ({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={clsx(styles.th, className)} {...props}>
    {children}
  </th>
);

export const TableCell = ({ className, tabular, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { tabular?: boolean }) => (
  <td className={clsx(styles.td, tabular && styles.tabular, className)} {...props}>
    {children}
  </td>
);
