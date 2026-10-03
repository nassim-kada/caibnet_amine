import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, onRightIconClick, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={clsx(styles.wrapper, className)}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputContainer}>
          {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
          
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              styles.input,
              {
                [styles.error]: !!error,
                [styles.withLeftIcon]: !!leftIcon,
                [styles.withRightIcon]: !!rightIcon,
              }
            )}
            {...props}
          />
          
          {rightIcon && (
            <button
              type="button"
              className={styles.iconRight}
              onClick={onRightIconClick}
              disabled={!onRightIconClick || props.disabled}
              tabIndex={onRightIconClick ? 0 : -1}
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
