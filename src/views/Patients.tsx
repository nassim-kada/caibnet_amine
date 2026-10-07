"use client";

import React, { useState, useEffect } from 'react';
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
  const [patients, updatePatients, , fetchPatients] = useLocalStorage<any[]>('app_patients', []);
  const [injuries] = useLocalStorage<any[]>('app_injuries', []);
  const [categories] = useLocalStorage<any[]>('app_injury_categories', defaultCategories);
  const [doctors] = useLocalStorage<any[]>('app_doctors', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'tous' | 'jour'>('tous');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('app_user_role');
      if (role === 'admin') {
        setIsAdmin(true);
      }
    }
  }, []);
  
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
    paidAmount: 0 as number | string,
    sessionsCompleted: 0,
    paidSessions: 0,
    unpaidSessions: 0
  });

  // Derived filters
  const patientsWithIndex = (patients || [])
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    })
    .map((p, index) => ({ ...p, globalIndex: index + 1 }));

  const filteredPatients = patientsWithIndex.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const phone = p.phone || '';
    
    const matchesSearch = 
      fullName.includes(searchLower) || 
      phone.includes(searchTerm) || 
      p.globalIndex.toString() === searchTerm;

    let patientDate = '';
    if (p.createdAt) {
      patientDate = new Date(p.createdAt).toISOString().split('T')[0];
    }
    const matchesDate = dateFilter ? patientDate === dateFilter : true;
    
    let matchesTab = true;
    if (activeTab === 'jour') {
      const today = new Date().toISOString().split('T')[0];
      matchesTab = p.lastVisitDate === today;
    }

    return matchesSearch && matchesDate && matchesTab;
  });



  // ... (keep filteredPatients and handleDelete the same)
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
      lastVisitDate: new Date().toISOString().split('T')[0],
      consultationStatus: 'waiting'
    };
    
    await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    });

    fetchPatients();
    setIsAddModalOpen(false);
    setActiveTab('jour'); // Automatically switch to patients du jour tab
    // Reset form
    setNewPatient({
      firstName: '', lastName: '', gender: 'H', phone: '', age: '', 
      doctor: '', injuryId: '', totalAmount: 0, paidAmount: 0,
      sessionsCompleted: 0, paidSessions: 0, unpaidSessions: 0
    });
    setSelectedAddCategory('');
  };

  const handleAddToToday = async (patientId: string) => {
    const patient = patients.find((p: any) => p._id === patientId);
    if (patient) {
      const today = new Date().toISOString().split('T')[0];
      const { _id, ...patientData } = patient;
      
      const updatedPatient = { ...patientData, lastVisitDate: today, consultationStatus: 'waiting' };

      // Optimistic update
      updatePatients(patients.map((p: any) => p._id === patientId ? { ...p, _id: p._id, ...updatedPatient } : p));
      setActiveTab('jour'); // Automatically switch tab

      await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      });
      fetchPatients();
    }
  };

  const handleProcessSession = async (patientId: string, isPaid: boolean) => {
    const patient = patients.find((p: any) => p._id === patientId);
    if (patient) {
      const today = new Date().toISOString().split('T')[0];
      const { _id, ...patientData } = patient;
      const updatedPatient = {
        ...patientData,
        sessionsCompleted: (patient.sessionsCompleted || 0) + 1,
        paidSessions: isPaid ? (patient.paidSessions || 0) + 1 : (patient.paidSessions || 0),
        unpaidSessions: !isPaid ? (patient.unpaidSessions || 0) + 1 : (patient.unpaidSessions || 0),
        lastVisitDate: today,
        consultationStatus: 'finished'
      };

      // Optimistic update
      updatePatients(patients.map((p: any) => p._id === patientId ? { ...p, _id: p._id, ...updatedPatient } : p));

      await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      });
      fetchPatients();
    }
  };

  const handleInlineSave = async (patientId: string, data: any) => {
    const patient = patients.find((p: any) => p._id === patientId);
    if (patient) {
      const { _id, ...patientData } = patient;
      const updatedPatient = { ...patientData, ...data };
      
      // Optimistic update
      updatePatients(patients.map((p: any) => p._id === patientId ? { ...p, _id: p._id, ...updatedPatient } : p));

      await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      });
      fetchPatients();
    }
  };

  const InlineSessionEditor = ({ patient, onSave }: { patient: any, onSave: (id: string, data: any) => void }) => {
    const [paidSessions, setPaidSessions] = useState(patient.paidSessions || 0);
    const [unpaidSessions, setUnpaidSessions] = useState(patient.unpaidSessions || 0);
  
    useEffect(() => {
      setPaidSessions(patient.paidSessions || 0);
      setUnpaidSessions(patient.unpaidSessions || 0);
    }, [patient.paidSessions, patient.unpaidSessions]);
  
    const hasChanges = paidSessions !== (patient.paidSessions || 0) ||
                       unpaidSessions !== (patient.unpaidSessions || 0);
  
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-success)' }}>Payées</span>
          <input type="number" min="0" value={paidSessions} onChange={e => setPaidSessions(parseInt(e.target.value) || 0)} style={{ width: '50px', padding: '2px 4px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-danger)' }}>Impayées</span>
          <input type="number" min="0" value={unpaidSessions} onChange={e => setUnpaidSessions(parseInt(e.target.value) || 0)} style={{ width: '50px', padding: '2px 4px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
        </div>
        {hasChanges && (
          <Button size="sm" onClick={() => onSave(patient._id, { paidSessions, unpaidSessions })} style={{ marginTop: '0.25rem', padding: '0.25rem', width: '100%', fontSize: '0.75rem' }}>
            Enregistrer
          </Button>
        )}
      </div>
    );
  };

  const handleRemoveFromToday = async (patientId: string) => {
    const patient = patients.find((p: any) => p._id === patientId);
    if (patient) {
      const { _id, ...patientData } = patient;
      const updatedPatient = { ...patientData, lastVisitDate: '', consultationStatus: 'none' };

      updatePatients(patients.map((p: any) => p._id === patientId ? { ...p, _id: p._id, ...updatedPatient } : p));

      await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      });
      fetchPatients();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <Input 
              placeholder="Rechercher par nom, téléphone ou N°..." 
              leftIcon={<Search size={18} />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <Filter size={18} style={{ color: 'var(--color-text-muted)' }} />
            <Input 
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
          Nouveau patient
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
        <button 
          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'tous' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'tous' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'tous' ? 600 : 400, cursor: 'pointer', fontSize: '1rem' }}
          onClick={() => setActiveTab('tous')}
        >
          Tous les patients
        </button>
        <button 
          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'jour' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'jour' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'jour' ? 600 : 400, cursor: 'pointer', fontSize: '1rem' }}
          onClick={() => setActiveTab('jour')}
        >
          Patients du jour
        </button>
      </div>

      <TableContainer>
        <TableHead>
          <TableRow>
            <TableHeader style={{ width: '50px' }}>N°</TableHeader>
            <TableHeader>Patient</TableHeader>
            <TableHeader>Médecin</TableHeader>
            <TableHeader>Blessure</TableHeader>
            <TableHeader>Séances & Paiements</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPatients.length > 0 ? filteredPatients.map((patient, index) => {
            const injury = injuries.find((i: any) => i._id === patient.injuryId);
            
            return (
              <TableRow key={patient._id}>
                <TableCell>
                  <strong>{activeTab === 'jour' ? index + 1 : patient.globalIndex}</strong>
                </TableCell>
                <TableCell>
                  <strong>{patient.lastName} {patient.firstName}</strong>
                </TableCell>
                <TableCell>{patient.doctor || '-'}</TableCell>
                <TableCell>{injury?.name || '-'}</TableCell>
                <TableCell>
                  {isAdmin ? (
                    <InlineSessionEditor patient={patient} onSave={handleInlineSave} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-success)' }}><strong>{patient.paidSessions || 0}</strong> payées</span>
                      {(patient.unpaidSessions || 0) > 0 ? (
                        <Badge variant="danger" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                          {patient.unpaidSessions} impayée(s)
                        </Badge>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>0 impayée</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className={styles.actions} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {activeTab === 'tous' ? (
                      patient.lastVisitDate !== new Date().toISOString().split('T')[0] ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddToToday(patient._id)} 
                          title="Ajouter à la liste du jour"
                        >
                          Présent
                        </Button>
                      ) : (
                        <Badge variant="success">Dans la liste du jour</Badge>
                      )
                    ) : (
                      patient.consultationStatus === 'finished' ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>Traité</span>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            style={{ backgroundColor: 'var(--color-success)', color: 'white' }} 
                            onClick={() => handleProcessSession(patient._id, true)}
                          >
                            Payé
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger" 
                            onClick={() => handleProcessSession(patient._id, false)}
                          >
                            Impayé
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRemoveFromToday(patient._id)}
                            title="Retirer de la liste du jour"
                            style={{ marginLeft: '0.5rem' }}
                          >
                            Annuler
                          </Button>
                        </>
                      )
                    )}
                    <button className={styles.actionButton} onClick={() => router.push(`/patients/${patient._id}`)} title="Voir/Modifier le dossier">
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
        title={
          <div className={styles.premiumModalHeader}>
            <h2>Créer un nouveau dossier patient</h2>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.875rem' }}>Veuillez remplir les informations ci-dessous</p>
          </div>
        }
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', width: '100%' }}>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
            <button form="add-patient-form" type="submit" className={styles.premiumSubmitBtn}>Créer le dossier</button>
          </div>
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
