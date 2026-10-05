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
  const [patients, , , fetchPatients] = useLocalStorage<any[]>('app_patients', []);
  const [injuries] = useLocalStorage<any[]>('app_injuries', []);
  const [categories] = useLocalStorage<any[]>('app_injury_categories', defaultCategories);
  const [doctors] = useLocalStorage<any[]>('app_doctors', []);
  const [sessions, , , fetchSessions] = useLocalStorage<any[]>('app_sessions', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'tous' | 'salle' | 'jour'>('tous');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('app_user_role');
      if (role === 'admin') {
        setIsAdmin(true);
        setActiveTab('tous'); // Force admin to 'tous' tab
      }
      
      // Daily reset logic
      const lastReset = localStorage.getItem('app_last_reset_date');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastReset !== today && patients.length > 0) {
        let hasChanges = false;
        const updatedPatients = patients.map(p => {
          if (p.isPending || p.inWaitingRoom) {
            hasChanges = true;
            return { ...p, isPending: false, inWaitingRoom: false, consultationStatus: 'none' };
          }
          return p;
        });

        if (hasChanges) {
          // In a real app we'd call the API for each or a bulk endpoint
          // For simplicity here, since useLocalStorage syncs to API via its own mechanisms if wrapped, 
          // or we just call the API manually for the changed ones:
          Promise.all(updatedPatients.filter((p, i) => patients[i].isPending || patients[i].inWaitingRoom).map(p => 
            fetch(`/api/patients/${p._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(p)
            })
          )).then(() => {
            fetchPatients();
            localStorage.setItem('app_last_reset_date', today);
          });
        } else {
          localStorage.setItem('app_last_reset_date', today);
        }
      }
    }
  }, [patients.length]); // run when patients are loaded
  
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
      sessionsCompleted: 0,
      status: 'En cours',
      isPending: activeTab === 'jour',
      inWaitingRoom: activeTab === 'salle',
      consultationStatus: activeTab === 'salle' ? 'waiting' : 'none'
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

  const handleAddToWaitingRoom = async (patientId: string) => {
    const patient = patients.find((p: any) => p._id === patientId);
    if (patient) {
      await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patient, inWaitingRoom: true, consultationStatus: 'waiting' })
      });
      fetchPatients();
    }
  };

  const handleUpdateConsultationStatus = async (patientId: string, status: string) => {
    const patient = patients.find((p: any) => p._id === patientId);
    if (patient) {
      await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patient, consultationStatus: status })
      });
      fetchPatients();
    }
  };

  const handleProcessSession = async (patientId: string, isPaid: boolean) => {
    const patient = patients.find((p: any) => p._id === patientId);
    if (patient) {
      const updatedPatient = {
        ...patient,
        inWaitingRoom: false, // Sort de la salle d'attente
        consultationStatus: 'none',
        sessionsCompleted: (patient.sessionsCompleted || 0) + 1,
        paidSessions: isPaid ? (patient.paidSessions || 0) + 1 : (patient.paidSessions || 0),
        unpaidSessions: !isPaid ? (patient.unpaidSessions || 0) + 1 : (patient.unpaidSessions || 0)
      };

      await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      });
      fetchPatients();
    }
  };

  const handleCancelSession = async (patientId: string) => {
    const patient = patients.find((p: any) => p._id === patientId);
    if (patient) {
      const updatedPatient = {
        ...patient,
        inWaitingRoom: false,
        consultationStatus: 'none',
      };

      await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      });
      fetchPatients();
    }
  };

  const waitingRoomPatients = (patients || []).filter(p => p.inWaitingRoom);

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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
        {!isAdmin && (
          <>
            <button 
              style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'salle' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'salle' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'salle' ? 600 : 400, cursor: 'pointer', fontSize: '1rem' }}
              onClick={() => setActiveTab('salle')}
            >
              En cours de consultation ({waitingRoomPatients.length})
            </button>
            <button 
              style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'jour' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'jour' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'jour' ? 600 : 400, cursor: 'pointer', fontSize: '1rem' }}
              onClick={() => setActiveTab('jour')}
            >
              Patients du jour ({patients.filter(p => p.isPending).length})
            </button>
          </>
        )}
        <button 
          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'tous' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'tous' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === 'tous' ? 600 : 400, cursor: 'pointer', fontSize: '1rem' }}
          onClick={() => setActiveTab('tous')}
        >
          Tous les patients
        </button>
      </div>

      {activeTab === 'salle' && (
        <div>
          {waitingRoomPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
              Aucun patient en cours de consultation actuellement.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {waitingRoomPatients.map(patient => (
                <div key={patient._id} style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{patient.firstName} {patient.lastName}</h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{patient.doctor || 'Sans médecin assigné'}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    {typeof window !== 'undefined' && localStorage.getItem('app_user_role') === 'admin' ? (
                      // Vue Admin (Médecin)
                      <Badge variant="warning" style={{ flex: 1, textAlign: 'center' }}>En cours de consultation</Badge>
                    ) : (
                      // Vue Secrétaire
                      <>
                        <Button 
                          style={{ flex: 1, backgroundColor: 'var(--color-success)' }} 
                          onClick={() => handleProcessSession(patient._id, true)}
                        >
                          PAYÉ
                        </Button>
                        <Button 
                          style={{ flex: 1 }} 
                          variant="danger" 
                          onClick={() => handleProcessSession(patient._id, false)}
                        >
                          NON PAYÉ
                        </Button>
                        <Button 
                          style={{ flex: 1 }} 
                          variant="ghost" 
                          onClick={() => handleCancelSession(patient._id)}
                          title="Annuler l'entrée par erreur"
                        >
                          Annuler
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'jour' && (
        <>
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
      {patients.filter(p => p.isPending).length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
          Aucun patient n'a rempli le formulaire pour aujourd'hui.
        </div>
      )}
      </>
      )}

      {activeTab === 'tous' && (
        <>
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
            const totalSessions = patient.sessionsTotal || 10;
            const completed = patient.sessionsCompleted || 0;
            const progress = (completed / totalSessions) * 100;
            
            const unpaid = patient.unpaidSessions || 0;
            const paid = patient.paidSessions || 0;
            
            let paymentStatus = 'Soldé';
            let paymentVariant: 'success' | 'warning' | 'danger' = 'success';
            if (unpaid > 0) {
              paymentStatus = `${unpaid} impayée(s)`;
              paymentVariant = 'danger';
            } else if (paid > 0 && unpaid === 0) {
              paymentStatus = 'À jour';
              paymentVariant = 'success';
            } else {
              paymentStatus = 'Aucune séance';
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
                    <span className={styles.progressText}>{patient.sessionsCompleted} séance(s)</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={paymentVariant}>{paymentStatus}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={patient.status === 'Terminé' ? 'success' : 'warning'}>{patient.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className={styles.actions} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {!patient.inWaitingRoom ? (
                      !isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => handleAddToWaitingRoom(patient._id)}>
                          Faire entrer
                        </Button>
                      )
                    ) : (
                      <Badge variant="warning">En attente</Badge>
                    )}
                    <button className={styles.actionButton} onClick={() => router.push(`/patients/${patient._id}`)} title="Voir le dossier">
                      <Eye size={18} />
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
      </>
      )}

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
