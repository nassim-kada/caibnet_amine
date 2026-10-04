export type PatientStatus = 'En cours' | 'Terminé';
export type PaymentStatus = 'Soldé' | 'Partiel' | 'Impayé';
export type Gender = 'H' | 'F';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  phone: string;
  age: number | string;
  doctor?: string;
  injuryId?: string;
  sessionsCompleted: number;
  sessionsCancelled?: number;
  sessionsTotal: number;
  completedTreatments?: number[];
  totalAmount: number | string;
  paidAmount: number | string;
  status: PatientStatus;
  createdAt: string;
}

export interface InjuryCategory {
  id: string;
  name: string;
}

export interface Injury {
  id: string;
  categoryId?: string;
  name: string;
  description: string;
  treatments: string[];
}

export interface Session {
  id: string;
  patientId: string;
  date: string;
  notes: string;
  isCompleted: boolean;
  isCancelled?: boolean;
}

export interface Payment {
  id: string;
  patientId: string;
  amount: number;
  date: string;
  method: 'Espèces' | 'Carte' | 'Chèque' | 'Virement';
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string; // Simplification, could be just doctor name
  date: string;
  diagnosis: string;
  treatments: {
    act: string;
    sessionsCount: number;
    notes?: string;
  }[];
  observations: string;
}
