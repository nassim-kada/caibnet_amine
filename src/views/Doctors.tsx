"use client";

import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useApi as useLocalStorage } from '../hooks/useApi';
import styles from './Injuries.module.css';

export const Doctors = () => {
  const [doctors, , , fetchDoctors] = useLocalStorage<any[]>('app_doctors', []);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const [currentDoctor, setCurrentDoctor] = useState({ _id: '', name: '', phone: '', specialty: '' });

  const filteredDoctors = (doctors || []).filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.specialty && d.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDoctor._id) {
      await fetch(`/api/doctors/${currentDoctor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDoctor)
      });
    } else {
      await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDoctor)
      });
    }
    fetchDoctors();
    setIsDoctorModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteModal._id) {
      await fetch(`/api/doctors/${deleteModal._id}`, { method: 'DELETE' });
      fetchDoctors();
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  const openDoctorModal = (doctor?: any) => {
    if (doctor) {
      setCurrentDoctor({ ...doctor });
    } else {
      setCurrentDoctor({ id: '', name: '', phone: '', speciality: '' });
    }
    setIsDoctorModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Input 
            placeholder="Rechercher un médecin..." 
            leftIcon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => openDoctorModal()}>
          Nouveau médecin
        </Button>
      </div>

      <div className={styles.injuriesList}>
        {filteredDoctors.length > 0 ? (
          <div className={styles.grid}>
            {filteredDoctors.map(doctor => (
              <Card key={doctor._id} className={styles.injuryCard}>
                <CardHeader>
                  <div className={styles.injuryHeader}>
                    <CardTitle>{doctor.name}</CardTitle>
                    <div className={styles.injuryActions}>
                      <button 
                        className={styles.iconBtn} 
                        onClick={() => openDoctorModal(doctor)}
                        title="Modifier le médecin"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className={`${styles.iconBtn} ${styles.danger}`} 
                        onClick={() => setDeleteModal({ isOpen: true, id: doctor._id })}
                        title="Supprimer le médecin"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {doctor.speciality && (
                    <div className={styles.injuryDesc}>{doctor.speciality}</div>
                  )}
                </CardHeader>
                <CardContent>
                  {doctor.phone ? (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      Tél: {doctor.phone}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                      Aucun numéro enregistré
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <UserPlus size={48} style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Aucun médecin orientateur</h3>
            <p>Ajoutez les médecins qui vous orientent des patients.</p>
          </div>
        )}
      </div>

      {/* Doctor Modal */}
      <Modal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        title={currentDoctor._id ? "Modifier le médecin" : "Nouveau médecin orientateur"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDoctorModalOpen(false)}>Annuler</Button>
            <Button form="doctor-form" type="submit">Enregistrer</Button>
          </>
        }
      >
        <form id="doctor-form" onSubmit={handleSaveDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input 
            label="Nom du médecin" 
            placeholder="Dr. Nom Prénom"
            required 
            value={currentDoctor.name} 
            onChange={e => setCurrentDoctor({...currentDoctor, name: e.target.value})} 
          />
          <Input 
            label="Spécialité (optionnel)" 
            placeholder="Ex: Orthopédiste, Rhumatologue..."
            value={currentDoctor.speciality} 
            onChange={e => setCurrentDoctor({...currentDoctor, speciality: e.target.value})} 
          />
          <Input 
            label="Téléphone (optionnel)" 
            type="tel"
            value={currentDoctor.phone} 
            onChange={e => setCurrentDoctor({...currentDoctor, phone: e.target.value})} 
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ isOpen: false, id: null })}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <p>Êtes-vous sûr de vouloir supprimer ce médecin de votre liste ? Cette action est irréversible.</p>
      </Modal>
    </div>
  );
};
