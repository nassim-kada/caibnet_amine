import type { Patient, Injury, Session, Payment } from '../types';

export const mockInjuries: Injury[] = [];
export const mockPatients: Patient[] = [];
export const mockSessions: Session[] = [];
export const mockPayments: Payment[] = [];

export const getTodaySessions = (): Session[] => {
  return [];
};
