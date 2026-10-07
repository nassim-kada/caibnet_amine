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

type Tab = 'infos' | 'traitements' | 'dossiers';

export const PatientDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('infos');
  const [patients, , , fetchPatients] = useLocalStorage<any[]>('app_patients', []);
  const [injuries] = useLocalStorage<any[]>('app_injuries', []);
  const [categories] = useLocalStorage<any[]>('app_injury_categories', defaultCategories);
  const [doctors] = useLocalStorage<any[]>('app_doctors', []);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('app_user_role');
      if (role === 'admin') {
        setIsAdmin(true);
      }
    }
  }, []);
  
  // Find patient
  const patient = patients.find((p: any) => p._id === id);
  const injury = patient ? injuries.find((i: any) => i._id === patient.injuryId) : null;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditCategory, setSelectedEditCategory] = useState('');
  const [editPatient, setEditPatient] = useState({
    firstName: '',
    lastName: '',
    injuryId: '',
    doctor: '',
    sessionsCompleted: 0,
    paidSessions: 0,
    unpaidSessions: 0
  });

  const openEditModal = () => {
    const pInjury = injuries.find(i => i._id === patient.injuryId);
    setSelectedEditCategory(pInjury?.categoryId || '');
    setEditPatient({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      injuryId: patient.injuryId || '',
      doctor: patient.doctor || '',
      sessionsCompleted: patient.sessionsCompleted || 0,
      paidSessions: patient.paidSessions || 0,
      unpaidSessions: patient.unpaidSessions || 0
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
      doctor: editPatient.doctor,
      sessionsCompleted: editPatient.sessionsCompleted,
      paidSessions: editPatient.paidSessions,
      unpaidSessions: editPatient.unpaidSessions
    };
    
    await fetch(`/api/patients/${patient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPatient)
    });
    
    fetchPatients();
    setIsEditModalOpen(false);
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

  const handleInlineSessionSave = async (data: any) => {
    const updatedPatient = { ...patient, ...data };
    
    await fetch(`/api/patients/${patient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPatient)
    });
    
    fetchPatients();
  };

  const InlineSessionEditorDetail = ({ patient, onSave }: { patient: any, onSave: (data: any) => void }) => {
    const [paidSessions, setPaidSessions] = useState(patient.paidSessions || 0);
    const [unpaidSessions, setUnpaidSessions] = useState(patient.unpaidSessions || 0);
  
    React.useEffect(() => {
      setPaidSessions(patient.paidSessions || 0);
      setUnpaidSessions(patient.unpaidSessions || 0);
    }, [patient.paidSessions, patient.unpaidSessions]);
  
    const hasChanges = paidSessions !== (patient.paidSessions || 0) ||
                       unpaidSessions !== (patient.unpaidSessions || 0);
  
    return (
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
        <div className={styles.infoRow} style={{ alignItems: 'center' }}>
          <span className={styles.infoLabel}>Séances payées</span>
          <span className={styles.infoValue}>
            <input type="number" min="0" value={paidSessions} onChange={e => setPaidSessions(parseInt(e.target.value) || 0)} style={{ width: '60px', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', textAlign: 'right' }} />
          </span>
        </div>
        <div className={styles.infoRow} style={{ alignItems: 'center' }}>
          <span className={styles.infoLabel}>Séances impayées</span>
          <span className={styles.infoValue}>
            <input type="number" min="0" value={unpaidSessions} onChange={e => setUnpaidSessions(parseInt(e.target.value) || 0)} style={{ width: '60px', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', textAlign: 'right' }} />
          </span>
        </div>
        {hasChanges && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button size="sm" onClick={() => onSave({ paidSessions, unpaidSessions })}>
              Enregistrer les modifications
            </Button>
          </div>
        )}
      </div>
    );
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
              {patient.firstName ? patient.firstName[0] : ''}{patient.lastName ? patient.lastName[0] : ''}
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
                <span>{patient.doctor || 'Aucun médecin'}</span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" leftIcon={<Edit2 size={18} />} onClick={openEditModal}>
          Modifier le dossier
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
              <h3>Médical & Séances</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Médecin traitant</span>
                <span className={styles.infoValue}>{patient.doctor || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Blessure / Motif</span>
                <span className={styles.infoValue}>{injury?.name || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Créé le</span>
                <span className={styles.infoValue}>{new Date(patient.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
              </div>
              {isAdmin ? (
                <InlineSessionEditorDetail patient={patient} onSave={handleInlineSessionSave} />
              ) : (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Séances payées</span>
                    <span className={styles.infoValue}>{patient.paidSessions || 0}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Séances impayées</span>
                    <span className={styles.infoValue}>
                      <Badge variant={(patient.unpaidSessions || 0) > 0 ? 'danger' : 'success'}>
                        {patient.unpaidSessions || 0}
                      </Badge>
                    </span>
                  </div>
                </div>
              )}
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
          {isAdmin && (
            <>
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
            </>
          )}

          {isAdmin && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>Gestion avancée des séances</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input 
                  label="Séances payées" 
                  type="number" 
                  value={editPatient.paidSessions} 
                  onChange={e => setEditPatient({...editPatient, paidSessions: parseInt(e.target.value) || 0})} 
                />
                <Input 
                  label="Séances NON payées (Dettes)" 
                  type="number" 
                  value={editPatient.unpaidSessions} 
                  onChange={e => setEditPatient({...editPatient, unpaidSessions: parseInt(e.target.value) || 0})} 
                />
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
