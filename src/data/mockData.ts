import type { Patient, Injury, InjuryCategory, Session, Payment } from '../types';

export const defaultCategories: InjuryCategory[] = [
  { id: 'cat-epaule', name: 'Épaule' },
  { id: 'cat-coude', name: 'Coude' },
  { id: 'cat-poignee', name: 'Poignet' },
  { id: 'cat-hanche', name: 'Hanche' },
  { id: 'cat-genou', name: 'Genou' },
  { id: 'cat-cheville', name: 'Cheville' },
  { id: 'cat-cervical', name: 'Cervicale' },
  { id: 'cat-lombaire', name: 'Lombaire' },
  { id: 'cat-pubis', name: 'Pubis' },
  { id: 'cat-adducteur', name: 'Adducteur' },
  { id: 'cat-fractures', name: 'Fractures' }
];

export const mockInjuries: Injury[] = [];
export const mockPatients: Patient[] = [];
export const mockSessions: Session[] = [];
export const mockPayments: Payment[] = [];

export const getTodaySessions = (): Session[] => {
  return [];
};
