"use client";

import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import styles from './Input.module.css';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value?: string | number; options?: { label: string; value: string | number }[] }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={clsx(styles.wrapper, className)}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputContainer}>
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              styles.input,
              styles.withRightIcon, // Make room for custom chevron
              {
                [styles.error]: !!error,
              }
            )}
            style={{ appearance: 'none' }} // Remove native arrow
            {...props}
          >
            {options.map((opt) => (
              opt.options ? (
                <optgroup key={opt.label} label={opt.label}>
                  {opt.options.map(sub => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </optgroup>
              ) : (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              )
            ))}
          </select>
          
          <div className={styles.iconRight} style={{ pointerEvents: 'none' }}>
            <ChevronDown size={18} />
          </div>
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
