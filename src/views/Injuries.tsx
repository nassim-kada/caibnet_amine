"use client";

import React, { useState } from 'react';
import clsx from 'clsx';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useApi as useLocalStorage } from '../hooks/useApi';
import { defaultCategories } from '../data/mockData';
import styles from './Injuries.module.css';

export const Injuries = () => {
  const [injuries, , , fetchInjuries] = useLocalStorage<any[]>('app_injuries', []);
  const [categories, , , fetchCategories] = useLocalStorage<any[]>('app_injury_categories', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{_id: string, name: string} | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const [currentInjury, setCurrentInjury] = useState({ _id: '', categoryId: '', name: '', description: '', treatments: [] as string[] });

  const filteredInjuries = (injuries || []).filter(i => {
    const matchesSearch = i.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? i.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleSaveInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedInjury = {
      ...currentInjury,
      treatments: currentInjury.treatments.filter(t => t.trim() !== '')
    };

    if (cleanedInjury._id) {
      await fetch(`/api/injuries/${cleanedInjury._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedInjury)
      });
    } else {
      await fetch('/api/injuries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedInjury)
      });
    }
    fetchInjuries();
    setIsInjuryModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteModal.id) {
      await fetch(`/api/injuries/${deleteModal.id}`, { method: 'DELETE' });
      fetchInjuries();
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    if (editingCategory) {
      await fetch(`/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
    } else {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
    }
    fetchCategories();
    setNewCategoryName('');
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
      if (selectedCategory === id) setSelectedCategory('');
    }
  };

  const openInjuryModal = (injury?: any) => {
    if (injury) {
      setCurrentInjury({ ...injury, treatments: injury.treatments || [] });
    } else {
      setCurrentInjury({ id: '', categoryId: '', name: '', description: '', treatments: [''] });
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
            placeholder="Rechercher une pathologie..." 
            leftIcon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => openInjuryModal()}>
          Nouvelle pathologie
        </Button>
      </div>

      <div className={styles.layout}>
        {/* Categories Sidebar */}
        <div className={styles.sidebar}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Catégories</h3>
            <button 
              onClick={() => {
                setEditingCategory(null);
                setNewCategoryName('');
                setIsCategoryModalOpen(true);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
              title="Ajouter une catégorie"
            >
              <Plus size={16} />
            </button>
          </div>
          <button 
            className={clsx(styles.categoryTab, { [styles.active]: selectedCategory === '' })}
            onClick={() => setSelectedCategory('')}
          >
            Toutes les catégories
          </button>
          
          {categories.map(cat => {
            const count = (injuries || []).filter(i => i.categoryId === cat._id).length;
            const isActive = selectedCategory === cat._id;
            return (
              <div 
                key={cat._id}
                className={clsx(styles.categoryTab, { [styles.active]: isActive })}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setSelectedCategory(cat._id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{cat.name}</span>
                  <span className={styles.categoryCount}>{count}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => { setEditingCategory(cat); setNewCategoryName(cat.name); setIsCategoryModalOpen(true); }}
                    style={{ background: 'none', border: 'none', color: isActive ? '#fff' : 'var(--color-primary)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
                    title="Modifier"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat._id)}
                    style={{ background: 'none', border: 'none', color: isActive ? '#ffb3b3' : 'var(--color-danger)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
                    title="Supprimer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content (Injuries Grid) */}
        <div className={styles.mainContent}>
          <div className={styles.injuriesList}>
            {filteredInjuries.length > 0 ? (
              <div className={styles.grid}>
                {filteredInjuries.map(injury => {
                  const cat = categories.find(c => c._id === injury.categoryId);
                  return (
                    <Card key={injury._id} className={styles.injuryCard}>
                      <CardHeader>
                        <div className={styles.injuryHeader}>
                          <CardTitle>{injury.name}</CardTitle>
                          <div className={styles.injuryActions}>
                            <button 
                              className={styles.iconBtn} 
                              onClick={() => openInjuryModal(injury)}
                              title="Modifier pathologie"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className={`${styles.iconBtn} ${styles.danger}`} 
                              onClick={() => setDeleteModal({ isOpen: true, id: injury._id })}
                              title="Supprimer pathologie"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        {cat && selectedCategory === '' && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500, marginBottom: '0.25rem' }}>
                            Catégorie: {cat.name}
                          </div>
                        )}
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
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Aucune pathologie trouvée. Ajoutez-en une pour commencer.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Injury Modal */}
      <Modal
        isOpen={isInjuryModalOpen}
        onClose={() => setIsInjuryModalOpen(false)}
        title={currentInjury._id ? "Modifier la pathologie" : "Nouvelle pathologie"}
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
            <Select
              label="Catégorie"
              required
              options={[
                { label: '-- Sélectionnez une catégorie --', value: '' },
                ...categories.map(c => ({ label: c.name, value: c._id }))
              ]}
              value={currentInjury.categoryId}
              onChange={e => setCurrentInjury({...currentInjury, categoryId: e.target.value})}
            />
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

      {/* Categories Management Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setNewCategoryName('');
        }}
        title="Gérer les catégories"
        footer={
          <Button onClick={() => setIsCategoryModalOpen(false)}>Fermer</Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Add / Edit Form */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label={editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                placeholder="Nom de la catégorie..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
              />
            </div>
            <Button onClick={handleSaveCategory} disabled={!newCategoryName.trim()}>
              {editingCategory ? 'Sauvegarder' : 'Ajouter'}
            </Button>
            {editingCategory && (
              <Button variant="ghost" onClick={() => { setEditingCategory(null); setNewCategoryName(''); }}>
                Annuler
              </Button>
            )}
          </div>

          {/* List of categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {categories.map(cat => (
              <div key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 500 }}>{cat.name}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => { setEditingCategory(cat); setNewCategoryName(cat.name); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '0.25rem' }}
                    title="Modifier"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat._id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.25rem' }}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
