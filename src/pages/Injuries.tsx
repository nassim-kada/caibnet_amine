import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import styles from './Injuries.module.css';

export const Injuries = () => {
  const [injuries, setInjuries] = useLocalStorage<any[]>('app_injuries', []);
  const [searchTerm, setSearchTerm] = useState('');

  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const [currentInjury, setCurrentInjury] = useState({ id: '', name: '', description: '', treatments: [] as string[] });

  const filteredInjuries = injuries.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveInjury = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty treatments
    const cleanedInjury = {
      ...currentInjury,
      treatments: currentInjury.treatments.filter(t => t.trim() !== '')
    };

    if (cleanedInjury.id) {
      setInjuries(injuries.map(i => i.id === cleanedInjury.id ? cleanedInjury : i));
    } else {
      setInjuries([...injuries, { ...cleanedInjury, id: `inj-${Date.now()}` }]);
    }
    setIsInjuryModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteModal.id) {
      setInjuries(injuries.filter(i => i.id !== deleteModal.id));
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  const openInjuryModal = (injury?: any) => {
    if (injury) {
      setCurrentInjury({ ...injury, treatments: injury.treatments || [] });
    } else {
      setCurrentInjury({ id: '', name: '', description: '', treatments: [''] });
    }
    setIsInjuryModalOpen(true);
  };

  const addTreatmentStep = () => {
    setCurrentInjury({ ...currentInjury, treatments: [...currentInjury.treatments, ''] });
  };

  const updateTreatmentStep = (index: number, value: string) => {
    const newTreatments = [...currentInjury.treatments];
    newTreatments[index] = value;
    setCurrentInjury({ ...currentInjury, treatments: newTreatments });
  };

  const removeTreatmentStep = (index: number) => {
    const newTreatments = currentInjury.treatments.filter((_, i) => i !== index);
    setCurrentInjury({ ...currentInjury, treatments: newTreatments });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Input 
            placeholder="Rechercher une blessure..." 
            leftIcon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => openInjuryModal()}>
          Nouvelle pathologie / blessure
        </Button>
      </div>

      <div className={styles.injuriesList}>
        {filteredInjuries.length > 0 ? (
          <div className={styles.grid}>
            {filteredInjuries.map(injury => (
              <Card key={injury.id} className={styles.injuryCard}>
                <CardHeader>
                  <div className={styles.injuryHeader}>
                    <CardTitle>{injury.name}</CardTitle>
                    <div className={styles.injuryActions}>
                      <button 
                        className={styles.iconBtn} 
                        onClick={() => openInjuryModal(injury)}
                        title="Modifier blessure"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className={`${styles.iconBtn} ${styles.danger}`} 
                        onClick={() => setDeleteModal({ isOpen: true, id: injury.id })}
                        title="Supprimer blessure"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {injury.description && (
                    <div className={styles.injuryDesc}>{injury.description}</div>
                  )}
                </CardHeader>
                
                <CardContent>
                  {injury.treatments && injury.treatments.length > 0 ? (
                    <div className={styles.treatmentList}>
                      <div className={styles.treatmentListTitle}>Étapes de traitement prévues :</div>
                      <ol className={styles.treatmentSteps}>
                        {injury.treatments.map((step: string, idx: number) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <div className={styles.emptyTreatment}>Aucun traitement défini</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Aucune blessure enregistrée. Ajoutez-en une pour commencer.</p>
          </div>
        )}
      </div>

      {/* Injury Modal */}
      <Modal
        isOpen={isInjuryModalOpen}
        onClose={() => setIsInjuryModalOpen(false)}
        title={currentInjury.id ? "Modifier la pathologie" : "Nouvelle pathologie"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsInjuryModalOpen(false)}>Annuler</Button>
            <Button form="injury-form" type="submit">Enregistrer</Button>
          </>
        }
      >
        <form id="injury-form" onSubmit={handleSaveInjury} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input 
              label="Nom de la pathologie / Blessure" 
              required 
              value={currentInjury.name}
              onChange={e => setCurrentInjury({...currentInjury, name: e.target.value})}
              placeholder="Ex: Entorse de la cheville"
            />
            <Input 
              label="Description (optionnel)" 
              value={currentInjury.description}
              onChange={e => setCurrentInjury({...currentInjury, description: e.target.value})}
            />
          </div>

          <div className={styles.treatmentsSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-primary)' }}>Étapes de traitement</h4>
              <Button type="button" variant="outline" size="sm" onClick={addTreatmentStep} leftIcon={<Plus size={16} />}>
                Ajouter une étape
              </Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentInjury.treatments.map((treatment, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', width: '24px' }}>
                    {idx + 1}.
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input 
                      placeholder={`Traitement ou étape ${idx + 1}`}
                      value={treatment}
                      onChange={e => updateTreatmentStep(idx, e.target.value)}
                    />
                  </div>
                  <button 
                    type="button"
                    className={`${styles.iconBtn} ${styles.danger}`} 
                    onClick={() => removeTreatmentStep(idx)}
                    title="Supprimer l'étape"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              {currentInjury.treatments.length === 0 && (
                <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                  Aucune étape définie. Cliquez sur "Ajouter une étape".
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        title="Confirmation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ isOpen: false, id: null })}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <p>Êtes-vous sûr de vouloir supprimer cette pathologie ?</p>
      </Modal>
    </div>
  );
};
