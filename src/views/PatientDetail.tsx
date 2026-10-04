"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Calendar as CalendarIcon, UploadCloud, FileText, File as FileIcon, Image as ImageIcon, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TableContainer, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useApi as useLocalStorage } from '../hooks/useApi';
import { defaultCategories } from '../data/mockData';
import styles from './PatientDetail.module.css';

type Tab = 'infos' | 'traitements' | 'seances' | 'paiements' | 'dossiers' | 'ordonnances';

export const PatientDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('infos');
  const [patients, , , fetchPatients] = useLocalStorage<any[]>('app_patients', []);
  const [injuries] = useLocalStorage<any[]>('app_injuries', []);
  const [categories] = useLocalStorage<any[]>('app_injury_categories', defaultCategories);
  const [doctors] = useLocalStorage<any[]>('app_doctors', []);
  const [payments, , , fetchPayments] = useLocalStorage<any[]>('app_payments', []);
  const [sessions, , , fetchSessions] = useLocalStorage<any[]>('app_sessions', []);
  
  // Find patient
  const patient = patients.find((p: any) => p._id === id);
  const injury = patient ? injuries.find((i: any) => i._id === patient.injuryId) : null;
  const patientPayments = patient ? payments.filter(p => p.patientId === patient._id) : [];
  const patientSessions = patient ? sessions.filter(s => s.patientId === patient._id) : [];

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({ amount: '', method: 'Espèces' });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditCategory, setSelectedEditCategory] = useState('');
  const [editPatient, setEditPatient] = useState({
    firstName: '',
    lastName: '',
    injuryId: '',
    doctor: ''
  });

  const openEditModal = () => {
    const pInjury = injuries.find(i => i._id === patient.injuryId);
    setSelectedEditCategory(pInjury?.categoryId || '');
    setEditPatient({
      firstName: patient.firstName,
      lastName: patient.lastName,
      injuryId: patient.injuryId || '',
      doctor: patient.doctor || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPatient = {
      ...patient,
      firstName: editPatient.firstName,
      lastName: editPatient.lastName,
      injuryId: editPatient.injuryId,
      doctor: editPatient.doctor
    };
    
    await fetch(`/api/patients/${patient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPatient)
    });
    
    fetchPatients();
    setIsEditModalOpen(false);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' })
      .format(amount)
      .replace('DZD', 'DA');
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.amount || isNaN(Number(newPayment.amount))) return;
    const amount = Number(newPayment.amount);
    
    const payment = {
      patientId: patient._id,
      amount,
      date: new Date().toISOString(),
      method: newPayment.method
    };
    
    // We should technically save this to a /api/payments route, but since it's missing, let's just update the patient for now
    // Create /api/payments if we want fully dynamic payments
    
    const updatedPatient = {
      ...patient,
      paidAmount: Number(patient.paidAmount || 0) + amount
    };
    
    await fetch(`/api/patients/${patient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPatient)
    });
    
    fetchPatients();
    setIsPaymentModalOpen(false);
    setNewPayment({ amount: '', method: 'Espèces' });
  };

  const handleToggleTreatment = async (index: number) => {
    const completed = patient.completedTreatments || [];
    let newCompleted;
    if (completed.includes(index)) {
      newCompleted = completed.filter((i: number) => i !== index);
    } else {
      newCompleted = [...completed, index];
    }
    const updatedPatient = { ...patient, completedTreatments: newCompleted };
    
    await fetch(`/api/patients/${patient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPatient)
    });
    fetchPatients();
  };

  const handleMarkSessionCompleted = async (sessionIndex: number) => {
    const session = {
      patientId: patient._id,
      date: new Date().toISOString(),
      notes: `Séance ${sessionIndex + 1} réalisée.`,
      isCompleted: true,
      paymentStatus: 'pending'
    };
    
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    fetchSessions();
    
    const updatedPatient = {
      ...patient,
      sessionsCompleted: (patient.sessionsCompleted || 0) + 1
    };
    
    await fetch(`/api/patients/${patient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPatient)
    });
    fetchPatients();
  };

  const handleCancelSession = async (sessionIndex: number) => {
    const session = {
      patientId: patient._id,
      date: new Date().toISOString(),
      notes: `Séance ${sessionIndex + 1} annulée (Absence/Autre).`,
      isCompleted: false,
      isCancelled: true
    };
    
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    fetchSessions();
    
    const updatedPatient = {
      ...patient,
      sessionsCancelled: (patient.sessionsCancelled || 0) + 1
    };
    
    await fetch(`/api/patients/${patient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPatient)
    });
    fetchPatients();
  };

  if (!patient) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" onClick={() => router.push('/patients')} leftIcon={<ArrowLeft size={18} />}>
            Retour
          </Button>
        </div>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
          Patient introuvable.
        </div>
      </div>
    );
  }

  const remaining = Number(patient.totalAmount || 0) - Number(patient.paidAmount || 0);

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="ghost" onClick={() => router.push('/patients')} leftIcon={<ArrowLeft size={18} />}>
          Retour
        </Button>
      </div>

      {/* Header Profile */}
      <div className={styles.header}>
        <div className={styles.profile} style={{ flex: 1 }}>
          <div className={styles.avatar}>
            <span style={{ fontSize: '2rem', fontWeight: 600 }}>
              {patient.firstName[0]}{patient.lastName[0]}
            </span>
          </div>
          <div className={styles.info}>
            <h2>{patient.lastName} {patient.firstName}</h2>
            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span>{patient.phone}</span>
              </div>
              <span>•</span>
              <div className={styles.metaItem}>
                <span>{patient.doctor}</span>
              </div>
              <span>•</span>
              <Badge variant={patient.status === 'Terminé' ? 'success' : 'warning'}>
                {patient.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" leftIcon={<Edit2 size={18} />} onClick={openEditModal}>
          Modifier
        </Button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'infos' ? styles.active : ''}`} onClick={() => setActiveTab('infos')}>
          Informations
        </button>
        <button className={`${styles.tab} ${activeTab === 'traitements' ? styles.active : ''}`} onClick={() => setActiveTab('traitements')}>
          Suivi Traitements
        </button>
        <button className={`${styles.tab} ${activeTab === 'seances' ? styles.active : ''}`} onClick={() => setActiveTab('seances')}>
          Séances ({patientSessions.length}/{patient.sessionsTotal})
        </button>
        <button className={`${styles.tab} ${activeTab === 'paiements' ? styles.active : ''}`} onClick={() => setActiveTab('paiements')}>
          Paiements
        </button>
        <button className={`${styles.tab} ${activeTab === 'dossiers' ? styles.active : ''}`} onClick={() => setActiveTab('dossiers')}>
          Dossiers médicaux
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'infos' && (
          <div className={styles.infoGrid}>
            <div className={styles.infoSection}>
              <h3>Identité</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nom complet</span>
                <span className={styles.infoValue}>{patient.lastName} {patient.firstName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Sexe</span>
                <span className={styles.infoValue}>{patient.gender === 'H' ? 'Homme' : 'Femme'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Âge</span>
                <span className={styles.infoValue}>{patient.age ? `${patient.age} ans` : 'Non renseigné'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Téléphone</span>
                <span className={styles.infoValue}>{patient.phone}</span>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h3>Médical</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Médecin traitant</span>
                <span className={styles.infoValue}>{patient.doctor}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Blessure / Motif</span>
                <span className={styles.infoValue}>{injury?.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Créé le</span>
                <span className={styles.infoValue}>{new Date(patient.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Statut</span>
                <span className={styles.infoValue}>
                  <Badge variant={patient.status === 'Terminé' ? 'success' : 'warning'}>{patient.status}</Badge>
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'traitements' && (
          <div className={styles.infoSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Suivi des étapes de traitement</h3>
              <Badge variant="success">
                {(patient.completedTreatments?.length || 0)} / {injury?.treatments?.length || 0} étapes
              </Badge>
            </div>
            
            {injury?.treatments && injury.treatments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {injury.treatments.map((step: string, idx: number) => {
                  const isChecked = patient.completedTreatments?.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '1rem', 
                        padding: '1rem', backgroundColor: 'var(--color-surface)',
                        border: `1px solid ${isChecked ? 'var(--color-success)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onClick={() => handleToggleTreatment(idx)}
                    >
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '4px',
                        border: `2px solid ${isChecked ? 'var(--color-success)' : 'var(--color-border)'}`,
                        backgroundColor: isChecked ? 'var(--color-success)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white'
                      }}>
                        {isChecked && <Check size={16} />}
                      </div>
                      <span style={{ 
                        flex: 1, 
                        fontWeight: isChecked ? 600 : 400,
                        textDecoration: isChecked ? 'line-through' : 'none',
                        color: isChecked ? 'var(--color-text-muted)' : 'var(--color-text-main)'
                      }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                Aucune étape de traitement définie pour cette blessure.
              </div>
            )}
          </div>
        )}

        {activeTab === 'seances' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Historique des séances</h3>
              <Button leftIcon={<CalendarIcon size={18} />}>Nouvelle séance</Button>
            </div>
            
            <div className={styles.timeline}>
              {Array.from({ length: patient.sessionsTotal }).map((_, idx) => {
                const session = patientSessions[idx];
                const isCompleted = session && session.isCompleted && !session.isCancelled;
                const isCancelled = session && session.isCancelled;
                const isNext = !session && (idx === 0 || !!patientSessions[idx - 1]);
                
                return (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={`${styles.timelineIcon} ${isCompleted ? styles.completed : isCancelled ? styles.danger : ''}`} style={isCancelled ? { backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : {}}>
                      {isCompleted ? <Check size={20} /> : isCancelled ? <span style={{ color: 'white', fontWeight: 'bold' }}>X</span> : <span>{idx + 1}</span>}
                    </div>
                    <div className={styles.timelineContent} style={{ opacity: isCompleted || isNext || isCancelled ? 1 : 0.6 }}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineDate} style={{ color: isCancelled ? 'var(--color-danger)' : undefined }}>
                          {isCompleted ? `Séance ${idx + 1} - Réalisée` : isCancelled ? `Séance ${idx + 1} - Annulée` : isNext ? `Séance ${idx + 1} - Prochaine` : `Séance ${idx + 1} - Prévue`}
                        </span>
                        {isNext && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button size="sm" onClick={() => handleMarkSessionCompleted(idx)}>Marquer réalisée</Button>
                            <Button size="sm" variant="outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => handleCancelSession(idx)}>Annuler (Absence)</Button>
                          </div>
                        )}
                        {(isCompleted || isCancelled) && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                            {new Date(session.date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <p className={styles.timelineNotes}>
                        {isCompleted ? session.notes : isCancelled ? session.notes : 'En attente...'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'paiements' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Total à payer</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatMoney(Number(patient.totalAmount || 0))}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Déjà payé</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>{formatMoney(Number(patient.paidAmount || 0))}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Restant dû</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: remaining > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {formatMoney(remaining)}
                  </div>
                </div>
              </div>
              <Button onClick={() => setIsPaymentModalOpen(true)}>Ajouter un versement</Button>
            </div>

            <TableContainer>
              <TableHead>
                <TableRow>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Montant</TableHeader>
                  <TableHeader>Méthode</TableHeader>
                  <TableHeader>Reçu</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {patientPayments.length > 0 ? patientPayments.map((p: any) => (
                  <TableRow key={p._id}>
                    <TableCell>{new Date(p.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell tabular><strong>{formatMoney(p.amount)}</strong></TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" leftIcon={<FileText size={16} />}>Facture</Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Aucun paiement enregistré</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </TableContainer>

            <Modal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              title="Ajouter un versement"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Annuler</Button>
                  <Button form="payment-form" type="submit">Valider le paiement</Button>
                </>
              }
            >
              <form id="payment-form" onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Input 
                  label="Montant (DA)" 
                  type="number" 
                  min="0"
                  required 
                  value={newPayment.amount}
                  onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                  placeholder="Ex: 5000"
                />
                <Select
                  label="Méthode de paiement"
                  options={[
                    { label: 'Espèces', value: 'Espèces' },
                    { label: 'Carte', value: 'Carte' },
                    { label: 'Chèque', value: 'Chèque' },
                    { label: 'Virement', value: 'Virement' }
                  ]}
                  value={newPayment.method}
                  onChange={e => setNewPayment({...newPayment, method: e.target.value})}
                />
              </form>
            </Modal>
          </div>
        )}

        {activeTab === 'dossiers' && (
          <div>
            <div className={styles.uploadZone}>
              <UploadCloud size={48} className={styles.uploadIcon} />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>Glissez-déposez vos fichiers ici</h3>
                <p className={styles.uploadText}>ou cliquez pour parcourir (PDF, JPG, PNG)</p>
              </div>
              <Button variant="outline">Parcourir les fichiers</Button>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Documents joints</h3>
            <div className={styles.gallery}>
              {/* Mock documents */}
              <div className={styles.galleryItem}>
                <FileIcon size={32} className={styles.docIcon} />
                <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>IRM_Rachis.pdf</span>
              </div>
              <div className={styles.galleryItem}>
                <ImageIcon size={32} style={{ color: 'var(--color-accent)' }} />
                <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>Radio_1.jpg</span>
              </div>
              <div className={styles.galleryItem}>
                <FileIcon size={32} className={styles.docIcon} />
                <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>Lettre_Medecin.pdf</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier le dossier du patient"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button form="edit-patient-form" type="submit">Enregistrer les modifications</Button>
          </>
        }
      >
        <form id="edit-patient-form" onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Input label="Nom" required value={editPatient.lastName} onChange={e => setEditPatient({...editPatient, lastName: e.target.value})} style={{ flex: 1 }} />
            <Input label="Prénoms" required value={editPatient.firstName} onChange={e => setEditPatient({...editPatient, firstName: e.target.value})} style={{ flex: 1 }} />
          </div>
          <Select 
            label="Médecin orientateur (Optionnel)" 
            options={[
              { label: '-- Aucun ou à définir --', value: '' },
              ...doctors.map(d => ({ label: d.name, value: d.name }))
            ]}
            value={editPatient.doctor} 
            onChange={e => setEditPatient({...editPatient, doctor: e.target.value})}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Select 
              label="Catégorie de blessure" 
              options={[
                { label: '-- Sélectionnez une catégorie --', value: '' },
                ...categories.map(c => ({ label: c.name, value: c._id }))
              ]}
              value={selectedEditCategory}
              onChange={e => {
                setSelectedEditCategory(e.target.value);
                setEditPatient({...editPatient, injuryId: ''});
              }}
              style={{ flex: 1 }}
            />
            {selectedEditCategory && (
              <Select 
                label="Pathologie" 
                options={[
                  { label: '-- Sélectionnez une pathologie --', value: '' },
                  ...injuries
                    .filter(i => (i.categoryId || '') === selectedEditCategory)
                    .map(i => ({ label: i.name, value: i._id }))
                ]}
                value={editPatient.injuryId}
                onChange={e => setEditPatient({...editPatient, injuryId: e.target.value})}
                style={{ flex: 1 }}
              />
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};
