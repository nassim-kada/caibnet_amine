import React, { useState } from 'react';
import { Search, Filter, Plus, Eye, Edit2, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { TableContainer, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { useLocalStorage } from '../hooks/useLocalStorage';
import styles from './Patients.module.css';

export const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useLocalStorage<any[]>('app_patients', []);
  const [injuries] = useLocalStorage<any[]>('app_injuries', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    gender: 'H',
    phone: '',
    age: '' as number | string,
    doctor: '',
    injuryId: '',
    sessionsTotal: '' as number | string,
    totalAmount: '' as number | string,
    paidAmount: '' as number | string
  });

  // Derived filters
  const filteredPatients = patients.filter(p => {
    const matchesSearch = (p.firstName + ' ' + p.lastName).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = () => {
    if (patientToDelete) {
      setPatients(patients.filter(p => p.id !== patientToDelete));
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = {
      ...newPatient,
      id: `pat-${Date.now()}`,
      gender: newPatient.gender as 'H' | 'F',
      sessionsCompleted: 0,
      status: 'En cours' as const,
      createdAt: new Date().toISOString()
    };
    
    setPatients([patient, ...patients]);
    setIsAddModalOpen(false);
    // Reset form
    setNewPatient({
      firstName: '', lastName: '', gender: 'H', phone: '', age: '', 
      doctor: '', injuryId: '', sessionsTotal: '', totalAmount: '', paidAmount: ''
    });
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
            const injury = injuries.find((i: any) => i.id === patient.injuryId);
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
              <TableRow key={patient.id}>
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
                    <button className={styles.actionButton} onClick={() => navigate(`/patients/${patient.id}`)} title="Voir le dossier">
                      <Eye size={18} />
                    </button>
                    <button className={styles.actionButton} onClick={() => navigate(`/patients/${patient.id}`)} title="Modifier">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.danger}`} 
                      title="Supprimer"
                      onClick={() => {
                        setPatientToDelete(patient.id);
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
          <Input label="Médecin orientateur" value={newPatient.doctor} onChange={e => setNewPatient({...newPatient, doctor: e.target.value})} />
          
          <div className={styles.formFull}>
            <Select 
              label="Blessure / Pathologie" 
              options={[
                { label: '-- Aucune ou à définir --', value: '' },
                ...injuries.map((i: any) => ({ label: i.name, value: i.id }))
              ]}
              value={newPatient.injuryId}
              onChange={e => setNewPatient({...newPatient, injuryId: e.target.value})}
            />
          </div>

          <Input label="Nombre de séances prévues" type="number" min="1" required value={String(newPatient.sessionsTotal)} onChange={e => setNewPatient({...newPatient, sessionsTotal: e.target.value ? parseInt(e.target.value) : ''})} />
          <Input label="Montant total (DA)" type="number" min="0" required value={String(newPatient.totalAmount)} onChange={e => setNewPatient({...newPatient, totalAmount: e.target.value ? parseInt(e.target.value) : ''})} />
          
          <Input label="Montant payé (DA)" type="number" min="0" value={String(newPatient.paidAmount)} onChange={e => setNewPatient({...newPatient, paidAmount: e.target.value ? parseInt(e.target.value) : ''})} />
          <Input 
            label="Reste à payer (DA)" 
            type="number" 
            disabled 
            value={(Number(newPatient.totalAmount) || 0) - (Number(newPatient.paidAmount) || 0)} 
          />
        </form>
      </Modal>
    </div>
  );
};
