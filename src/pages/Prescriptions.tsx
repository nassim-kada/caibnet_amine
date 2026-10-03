import React, { useState } from 'react';
import { Plus, Trash2, Printer, Download } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { mockPatients, mockInjuries } from '../data/mockData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import styles from './Prescriptions.module.css';

export const Prescriptions = () => {
  const [patients] = useLocalStorage('app_patients', mockPatients);
  const [injuries] = useLocalStorage('app_injuries', mockInjuries);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('Dr. Ziani'); // Default mock doctor
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatments, setTreatments] = useState([{ act: '', sessionsCount: '' as string | number, notes: '' }]);
  const [observations, setObservations] = useState('');

  const selectedPatient = patients.find((p: any) => p.id === selectedPatientId);

  // Auto-fill diagnosis based on patient's injury
  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setSelectedPatientId(pid);
    const pat = patients.find((p: any) => p.id === pid);
    if (pat) {
      const injury = injuries.find((i: any) => i.id === pat.injuryId);
      if (injury) {
        setDiagnosis(injury.name);
      }
      setDoctorId(pat.doctor || ''); // Auto-fill doctor
    }
  };

  const addTreatment = () => {
    setTreatments([{ act: '', sessionsCount: '', notes: '' }, ...treatments]);
  };

  const updateTreatment = (index: number, field: string, value: string | number) => {
    const newTreatments = [...treatments];
    newTreatments[index] = { ...newTreatments[index], [field]: value };
    setTreatments(newTreatments);
  };

  const removeTreatment = (index: number) => {
    const newTreatments = treatments.filter((_, i) => i !== index);
    setTreatments(newTreatments);
  };

  const paperRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = paperRef.current;
    const opt = {
      margin:       10, // top, left, bottom, right
      filename:     `Ordonnance_${selectedPatient ? selectedPatient.lastName : 'Nouveau'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className={styles.container}>
      {/* Form Section */}
      <div className={styles.formSection}>
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle ordonnance / prescription</CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Select
                label="Patient"
                required
                options={[
                  { label: '-- Sélectionner un patient --', value: '' },
                  ...patients.map((p: any) => ({ label: `${p.lastName} ${p.firstName}`, value: p.id }))
                ]}
                value={selectedPatientId}
                onChange={handlePatientChange}
                style={{ flex: 1 }}
              />
              <Input 
                label="Date" 
                type="date" 
                required 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                style={{ width: '150px' }}
              />
            </div>

            <Input 
              label="Médecin prescripteur" 
              required 
              value={doctorId} 
              onChange={(e) => setDoctorId(e.target.value)} 
            />

            <Input 
              label="Diagnostic / Motif" 
              required 
              value={diagnosis} 
              onChange={(e) => setDiagnosis(e.target.value)} 
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Prescriptions (Soins)</span>
                <Button variant="outline" size="sm" onClick={addTreatment} leftIcon={<Plus size={16} />}>
                  Ajouter une ligne
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {treatments.map((t, idx) => (
                  <div key={idx} className={styles.treatmentRow}>
                    <div className={styles.treatmentInputs}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <Input 
                          placeholder="Acte (ex: Massages, Renforcement...)" 
                          value={t.act}
                          onChange={(e) => updateTreatment(idx, 'act', e.target.value)}
                          style={{ flex: 2 }}
                        />
                        <Input 
                          type="number"
                          placeholder="Nb séances" 
                          value={String(t.sessionsCount)}
                          onChange={(e) => updateTreatment(idx, 'sessionsCount', e.target.value ? parseInt(e.target.value) : '')}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <Input 
                        placeholder="Remarques (optionnel)" 
                        value={t.notes}
                        onChange={(e) => updateTreatment(idx, 'notes', e.target.value)}
                      />
                    </div>
                    {treatments.length > 1 && (
                      <button 
                        className={styles.actionButton} 
                        style={{ color: 'var(--color-danger)', border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem' }}
                        onClick={() => removeTreatment(idx)}
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Observations générales</label>
              <textarea 
                className={styles.input}
                style={{ 
                  width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--color-border)', minHeight: '100px',
                  fontFamily: 'inherit'
                }}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: À réévaluer après 5 séances..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section (A4 format) */}
      <div className={styles.previewSection}>
        <div className={styles.paper} ref={paperRef}>
          <div className={styles.paperHeader}>
            <div className={styles.paperLogo}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L8 6H16L12 2Z" fill="currentColor"/>
                <circle cx="12" cy="12" r="5" fill="currentColor"/>
                <path d="M12 22C17.5228 22 22 17.5228 22 12H20C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12H2C2 17.5228 6.47715 22 12 22Z" fill="var(--color-secondary)"/>
              </svg>
            </div>
            <div className={styles.paperTitle}>
              <h1>Physio.Pro H.A</h1>
              <p>Cabinet de Rééducation Fonctionnelle</p>
            </div>
          </div>

          <div className={styles.paperInfo}>
            <div>
              <p><strong>Médecin :</strong> {doctorId || '_________________'}</p>
              {selectedPatient && (
                <p>
                  <strong>Patient :</strong> {selectedPatient.lastName} {selectedPatient.firstName} 
                  {selectedPatient.age ? ` (${selectedPatient.age} ans)` : ''}
                </p>
              )}
            </div>
            <div className={styles.paperInfoRight}>
              <p>Le : {new Date(date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className={styles.paperBody}>
            <div className={styles.paperSectionTitle}>ORDONNANCE DE KINÉSITHÉRAPIE</div>
            
            {diagnosis && (
              <p style={{ marginBottom: '2rem' }}>
                <strong>Diagnostic :</strong> {diagnosis}
              </p>
            )}

            <ul className={styles.prescriptionList}>
              {treatments.map((t, idx) => (
                t.act && (
                  <li key={idx} className={styles.prescriptionItem}>
                    <strong>{t.sessionsCount} séances de {t.act}</strong>
                    {t.notes && <div><small><i>{t.notes}</i></small></div>}
                  </li>
                )
              ))}
            </ul>

            {observations && (
              <div className={styles.observations}>
                <strong>Observations :</strong>
                <p>{observations}</p>
              </div>
            )}
          </div>

          <div className={styles.paperFooter}>
            <div className={styles.signatureBox}>
              Cachet et Signature
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="outline" leftIcon={<Download size={18} />} onClick={handleDownloadPdf}>
            Télécharger PDF
          </Button>
          <Button leftIcon={<Printer size={18} />} onClick={handlePrint}>
            Imprimer l'ordonnance
          </Button>
        </div>
      </div>
    </div>
  );
};
