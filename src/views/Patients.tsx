"use client";

import React, { useState } from 'react';
import { Search, Filter, Plus, Eye, Edit2, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { TableContainer, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { useApi as useLocalStorage } from '../hooks/useApi';
import { defaultCategories } from '../data/mockData';
import styles from './Patients.module.css';

export const Patients = () => {
  const router = useRouter();
  const [patients, , , fetchPatients] = useLocalStorage<any[]>('app_patients', []);
  const [injuries] = useLocalStorage<any[]>('app_injuries', []);
  const [categories] = useLocalStorage<any[]>('app_injury_categories', defaultCategories);
  const [doctors] = useLocalStorage<any[]>('app_doctors', []);
  const [sessions, , , fetchSessions] = useLocalStorage<any[]>('app_sessions', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [selectedAddCategory, setSelectedAddCategory] = useState('');

  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    gender: 'H',
    phone: '',
    age: '' as number | string,
    doctor: '',
    injuryId: '',
    totalAmount: 0 as number | string,
    paidAmount: 0 as number | string
  });

  // Derived filters
  const filteredPatients = (patients || []).filter(p => {
    const matchesSearch = (p.firstName + ' ' + p.lastName).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (patientToDelete) {
      await fetch(`/api/patients/${patientToDelete}`, { method: 'DELETE' });
      fetchPatients();
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = {
      ...newPatient,
      gender: newPatient.gender as 'H' | 'F',
      sessionsTotal: 10,
      sessionsCompleted: 0,
      status: 'En cours',
      isPending: false
    };
    
    await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    });

    fetchPatients();
    setIsAddModalOpen(false);
    // Reset form
    setNewPatient({
      firstName: '', lastName: '', gender: 'H', phone: '', age: '', 
      doctor: '', injuryId: '', totalAmount: 0, paidAmount: 0
    });
    setSelectedAddCategory('');
  };

  const pendingSessions = (sessions || []).filter((s: any) => s.paymentStatus === 'pending');

  const handleValidatePayment = async (sessionId: string, patientId: string, isPaid: boolean) => {
    // 1. Update session paymentStatus to 'paid' or 'unpaid'
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: isPaid ? 'paid' : 'unpaid' })
    });
    
    // 2. If paid, update patient's paidAmount
    if (isPaid) {
      const patient = patients.find((p: any) => p._id === patientId);
      if (patient) {
        const updatedPatient = {
          ...patient,
          paidAmount: Number(patient.paidAmount || 0) + 1500 // Assuming 1500 DA per session
        };
        await fetch(`/api/patients/${patientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPatient)
        });
        fetchPatients();
      }
    }
    fetchSessions();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <Input 
              placeholder="Rechercher par nom..." 
              leftIcon={<Search size={18} />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <Filter size={18} style={{ color: 'var(--color-text-muted)' }} />
            <Select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { label: 'Tous les statuts', value: '' },
                { label: 'En cours', value: 'En cours' },
                { label: 'Terminé', value: 'Terminé' }
              ]} 
            />
          </div>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
          Nouveau patient
        </Button>
      </div>

      {/* Section : Demandes en ligne (Pré-inscriptions) */}
      {patients.filter(p => p.isPending).length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
            <Users size={20} /> Demandes en ligne (À traiter)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {patients.filter(p => p.isPending).map(patient => (
              <div key={patient._id} style={{ padding: '1rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '8px', border: '1px solid var(--color-border)', flex: '1 1 300px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{patient.firstName} {patient.lastName}</strong>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{patient.phone || 'Aucun numéro'}</div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setNewPatient({
                      ...newPatient,
                      firstName: patient.firstName,
                      lastName: patient.lastName,
                      phone: patient.phone || '',
                    });
                    setIsAddModalOpen(true);
                    // Also delete it from pending list in a real app, but here we just open the modal.
                    setPatientToDelete(patient._id);
                  }}
                >
                  Créer le dossier
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section : Paiements en attente (Secrétaire) */}
      {typeof window !== 'undefined' && localStorage.getItem('app_user_role') === 'secretary' && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '12px', border: '1px solid #ffe69c' }}>
          <h3 style={{ marginBottom: '1rem', color: '#856404' }}>⚠️ Séances en attente de paiement (Aujourd'hui)</h3>
          {pendingSessions.length === 0 ? (
            <p style={{ color: '#856404' }}>Aucune séance en attente de paiement pour le moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pendingSessions.map((session: any) => {
                const pat = patients.find((p: any) => p._id === session.patientId);
                return (
                  <div key={session._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ffe69c' }}>
                    <div>
                      <strong>{pat?.firstName} {pat?.lastName}</strong> a terminé une séance.
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button size="sm" onClick={() => handleValidatePayment(session._id, session.patientId, true)}>Oui (Payé)</Button>
                      <Button size="sm" variant="outline" onClick={() => handleValidatePayment(session._id, session.patientId, false)} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>Non (Impayé)</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <TableContainer>
        <TableHead>
          <TableRow>
            <TableHeader>Patient</TableHeader>
            <TableHeader>Médecin</TableHeader>
            <TableHeader>Blessure</TableHeader>
            <TableHeader>Séances</TableHeader>
            <TableHeader>Paiement</TableHeader>
            <TableHeader>Statut</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPatients.length > 0 ? filteredPatients.map(patient => {
            const injury = injuries.find((i: any) => i._id === patient.injuryId);
            const progress = (patient.sessionsCompleted / patient.sessionsTotal) * 100;
            const remaining = patient.totalAmount - patient.paidAmount;
            
            let paymentStatus = 'Soldé';
            let paymentVariant: 'success' | 'warning' | 'danger' = 'success';
            if (patient.paidAmount === 0) {
              paymentStatus = 'Impayé';
              paymentVariant = 'danger';
            } else if (remaining > 0) {
              paymentStatus = 'Partiel';
              paymentVariant = 'warning';
            }

            return (
              <TableRow key={patient._id}>
                <TableCell>
                  <strong>{patient.lastName} {patient.firstName}</strong>
                </TableCell>
                <TableCell>{patient.doctor}</TableCell>
                <TableCell>{injury?.name}</TableCell>
                <TableCell>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <span className={styles.progressText}>{patient.sessionsCompleted}/{patient.sessionsTotal}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={paymentVariant}>{paymentStatus}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={patient.status === 'Terminé' ? 'success' : 'warning'}>{patient.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className={styles.actions}>
                    <button className={styles.actionButton} onClick={() => router.push(`/patients/${patient._id}`)} title="Voir le dossier">
                      <Eye size={18} />
                    </button>
                    <button className={styles.actionButton} onClick={() => router.push(`/patients/${patient._id}`)} title="Modifier">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.danger}`} 
                      title="Supprimer"
                      onClick={() => {
                        setPatientToDelete(patient._id);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={7}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <Users size={32} />
                  </div>
                  <h3 className={styles.emptyStateTitle}>Aucun patient trouvé</h3>
                  <p className={styles.emptyStateText}>Aucun patient ne correspond à vos critères de recherche. Essayez de modifier vos filtres.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableContainer>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer définitivement</Button>
          </>
        }
      >
        <p>Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible et supprimera tout l'historique de ses séances, paiements et dossiers associés.</p>
      </Modal>

      {/* Add Patient Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Nouveau Patient"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
            <Button form="add-patient-form" type="submit">Créer le dossier</Button>
          </>
        }
      >
        <form id="add-patient-form" onSubmit={handleAddPatient} className={styles.formGrid}>
          <Input label="Nom" required value={newPatient.lastName} onChange={e => setNewPatient({...newPatient, lastName: e.target.value})} />
          <Input label="Prénoms" required value={newPatient.firstName} onChange={e => setNewPatient({...newPatient, firstName: e.target.value})} />
          
          <Select 
            label="Sexe" 
            options={[{label: 'Homme', value: 'H'}, {label: 'Femme', value: 'F'}]} 
            value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
          />
          <Input label="Âge" type="number" min="0" required value={String(newPatient.age)} onChange={e => setNewPatient({...newPatient, age: e.target.value ? parseInt(e.target.value) : ''})} />
          
          <Input label="Téléphone" type="tel" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
          
          <Select 
            label="Médecin orientateur (Optionnel)" 
            options={[
              { label: '-- Aucun ou à définir --', value: '' },
              ...doctors.map(d => ({ label: d.name, value: d.name }))
            ]}
            value={newPatient.doctor} 
            onChange={e => setNewPatient({...newPatient, doctor: e.target.value})}
          />
          
          <div className={styles.formRow}>
            <Select 
              label="Catégorie de blessure" 
              options={[
                { label: '-- Sélectionnez une catégorie --', value: '' },
                ...categories.map(c => ({ label: c.name, value: c._id }))
              ]}
              value={selectedAddCategory}
              onChange={e => {
                setSelectedAddCategory(e.target.value);
                setNewPatient({...newPatient, injuryId: ''}); // reset pathologie when category changes
              }}
              style={{ flex: 1 }}
            />
            {selectedAddCategory && (
              <Select 
                label="Pathologie" 
                options={[
                  { label: '-- Sélectionnez une pathologie --', value: '' },
                  ...injuries
                    .filter(i => (i.categoryId || '') === selectedAddCategory)
                    .map(i => ({ label: i.name, value: i._id }))
                ]}
                value={newPatient.injuryId}
                onChange={e => setNewPatient({...newPatient, injuryId: e.target.value})}
                style={{ flex: 1 }}
              />
            )}
          </div>

        </form>
      </Modal>
    </div>
  );
};
