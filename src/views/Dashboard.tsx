"use client";

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Activity, TrendingUp, AlertCircle, Banknote, XCircle, CalendarCheck } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { TableContainer, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useApi as useLocalStorage } from '../hooks/useApi';
import { defaultCategories } from '../data/mockData';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const router = useRouter();
  const [patients, , , fetchPatients] = useLocalStorage<any[]>('app_patients', []);
  const [injuries] = useLocalStorage<any[]>('app_injuries', []);
  const [categories] = useLocalStorage<any[]>('app_injury_categories', defaultCategories);
  
  // Helpers de date
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const getFormattedDate = (dateVal: any): string => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const todayPatients = useMemo(() => patients.filter((p: any) => {
    if (Array.isArray(p.visitDates) && p.visitDates.some((vd: string) => getFormattedDate(vd) === todayStr)) return true;
    if (p.lastVisitDate && getFormattedDate(p.lastVisitDate) === todayStr) return true;
    if (!Array.isArray(p.visitDates) && p.createdAt && getFormattedDate(p.createdAt) === todayStr) return true;
    return false;
  }), [patients, todayStr]);

  const todayPatientsCount = todayPatients.length;
  const totalSessionsCompleted = patients.reduce((sum: number, p: any) => sum + (p.sessionsCompleted || 0), 0);
  const activePatientsCount = patients.filter((p: any) => p.status === 'En cours' || !p.status).length;
  const totalPatientsCount = patients.length;

  // Stats payés / impayés du jour
  const todayPaidCount = useMemo(() => todayPatients.filter((p: any) =>
    p.lastSessionProcessedDate && getFormattedDate(p.lastSessionProcessedDate) === todayStr &&
    (p.consultationStatus === 'finished') &&
    (p.paidSessions || 0) > 0
  ).length, [todayPatients, todayStr]);

  const todayFinishedCount = useMemo(() => todayPatients.filter((p: any) =>
    p.consultationStatus === 'finished'
  ).length, [todayPatients]);

  const todayPaidFinished = useMemo(() => todayPatients.filter((p: any) =>
    p.consultationStatus === 'finished' &&
    p.lastSessionProcessedDate && getFormattedDate(p.lastSessionProcessedDate) === todayStr &&
    (p.unpaidSessions === undefined || p.unpaidSessions === 0 || 
      (p.lastSessionPaid === true))
  ).length, [todayPatients, todayStr]);

  // Compter les patients du jour traités aujourd'hui avec payé / impayé
  const todaySessionsPaid = useMemo(() => todayPatients.filter((p: any) =>
    p.lastSessionProcessedDate && getFormattedDate(p.lastSessionProcessedDate) === todayStr &&
    p.lastSessionPaid === true
  ).length, [todayPatients, todayStr]);

  const todaySessionsUnpaid = useMemo(() => todayPatients.filter((p: any) =>
    p.lastSessionProcessedDate && getFormattedDate(p.lastSessionProcessedDate) === todayStr &&
    p.lastSessionPaid === false
  ).length, [todayPatients, todayStr]);

  // Fallback : compter par consultationStatus si lastSessionPaid non dispo
  const todayPaidDisplay = todaySessionsPaid > 0 || todaySessionsUnpaid > 0
    ? todaySessionsPaid
    : todayPatients.filter((p: any) => p.consultationStatus === 'finished' && (p.unpaidSessions === 0 || !p.unpaidSessions)).length;
  const todayUnpaidDisplay = todaySessionsPaid > 0 || todaySessionsUnpaid > 0
    ? todaySessionsUnpaid
    : todayPatients.filter((p: any) => p.consultationStatus === 'finished' && (p.unpaidSessions || 0) > 0).length;

  const unpaidPatients = useMemo(() => {
    return patients
      .filter((p: any) => p.unpaidSessions && p.unpaidSessions > 0)
      .sort((a: any, b: any) => b.unpaidSessions - a.unpaidSessions);
  }, [patients]);


  // Dynamic top doctors donut chart
  const doctorsDonutData = useMemo(() => {
    let totalAssigned = 0;
    const counts = patients.reduce((acc, p) => {
      if (p.doctor) {
        acc[p.doctor] = (acc[p.doctor] || 0) + 1;
        totalAssigned++;
      }
      return acc;
    }, {} as Record<string, number>);
    
    if (totalAssigned === 0) return []; // Fallback
    
    const colors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-secondary)', 'var(--color-text)', 'var(--color-border)'];
    
    return (Object.entries(counts) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // top 5
      .map(([name, count], index) => {
        const percentage = Math.round((count / totalAssigned) * 100);
        return {
          label: name,
          value: percentage,
          count: count,
          color: colors[index % colors.length]
        };
      });
  }, [patients]);

  // Dynamic categories donut chart
  const donutData = useMemo(() => {
    let totalAssigned = 0;
    const catCounts = patients.reduce((acc, p) => {
      if (p.injuryId) {
        const inj = injuries.find((i: any) => i._id === p.injuryId);
        if (inj && inj.categoryId) {
          acc[inj.categoryId] = (acc[inj.categoryId] || 0) + 1;
          totalAssigned++;
        }
      }
      return acc;
    }, {} as Record<string, number>);

    if (totalAssigned === 0) return []; // Fallback

    const colors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-secondary)', 'var(--color-text)', 'var(--color-border)'];
    
    return (Object.entries(catCounts) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([catId, count], index) => {
        const cat = categories.find((c: any) => c._id === catId);
        const percentage = Math.round((count / totalAssigned) * 100);
        return {
          label: cat ? cat.name : 'Inconnu',
          value: percentage,
          color: colors[index % colors.length]
        };
      });
  }, [patients, injuries, categories]);

  // Polling to auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPatients();
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [fetchPatients]);

  return (
    <div className={styles.dashboard}>
      {/* Stats row */}
      <div className={styles.statsGrid}>
        <Card>
          <div className={styles.statCard}>
            <div className={clsx(styles.statIcon, styles.primary)}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Patients du jour</span>
              <span className={styles.statValue}>{todayPatientsCount}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.statCard}>
            <div className={clsx(styles.statIcon, styles.success)}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total séances effectuées</span>
              <span className={styles.statValue}>{totalSessionsCompleted}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.statCard}>
            <div className={clsx(styles.statIcon, styles.accent)}>
              <Activity size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Patients actifs</span>
              <span className={styles.statValue}>{activePatientsCount}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.statCard}>
            <div className={clsx(styles.statIcon, styles.secondary)}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total patients</span>
              <span className={styles.statValue}>{totalPatientsCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Bande récap paiements du jour */}
      <div className={styles.todayPaymentBanner}>
        <div className={styles.todayPaymentItem}>
          <CalendarCheck size={20} className={styles.todayPaymentIcon} style={{ color: 'var(--color-primary)' }} />
          <div>
            <span className={styles.todayPaymentLabel}>Total patients du jour</span>
            <span className={styles.todayPaymentValue}>{todayPatientsCount}</span>
          </div>
        </div>
        <div className={styles.todayPaymentDivider} />
        <div className={styles.todayPaymentItem}>
          <Banknote size={20} className={styles.todayPaymentIcon} style={{ color: 'var(--color-success)' }} />
          <div>
            <span className={styles.todayPaymentLabel}>Payés aujourd'hui</span>
            <span className={styles.todayPaymentValue} style={{ color: 'var(--color-success)' }}>{todayPaidDisplay}</span>
          </div>
        </div>
        <div className={styles.todayPaymentDivider} />
        <div className={styles.todayPaymentItem}>
          <XCircle size={20} className={styles.todayPaymentIcon} style={{ color: 'var(--color-danger)' }} />
          <div>
            <span className={styles.todayPaymentLabel}>Non payés aujourd'hui</span>
            <span className={styles.todayPaymentValue} style={{ color: 'var(--color-danger)' }}>{todayUnpaidDisplay}</span>
          </div>
        </div>
        <div className={styles.todayPaymentDivider} />
        <div className={styles.todayPaymentItem}>
          <AlertCircle size={20} className={styles.todayPaymentIcon} style={{ color: 'var(--color-text-muted)' }} />
          <div>
            <span className={styles.todayPaymentLabel}>En attente</span>
            <span className={styles.todayPaymentValue} style={{ color: 'var(--color-text-muted)' }}>
              {todayPatientsCount - todayPaidDisplay - todayUnpaidDisplay < 0 ? 0 : todayPatientsCount - todayPaidDisplay - todayUnpaidDisplay}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Today's Patients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Patients enregistrés aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              <TableContainer style={{ border: 'none', borderRadius: 0 }}>
                <TableHead>
                  <TableRow>
                    <TableHeader>Patient</TableHeader>
                    <TableHeader>Médecin</TableHeader>
                    <TableHeader>Heure</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Aucun patient enregistré aujourd'hui.
                      </TableCell>
                    </TableRow>
                  ) : (
                    todayPatients.map((patient: any) => {
                      const time = patient.createdAt ? new Date(patient.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-';
                      
                      return (
                        <TableRow key={patient._id}>
                          <TableCell>
                            <strong>{patient.lastName} {patient.firstName}</strong>
                          </TableCell>
                          <TableCell>{patient.doctor || '-'}</TableCell>
                          <TableCell>{time}</TableCell>
                          <TableCell>
                            <button 
                              onClick={() => router.push(`/patients/${patient._id}`)}
                              style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              Voir le dossier
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Unpaid Patients Table */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
                <AlertCircle size={20} /> Liste des impayés
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              <TableContainer style={{ border: 'none', borderRadius: 0 }}>
                <TableHead>
                  <TableRow>
                    <TableHeader>Patient</TableHeader>
                    <TableHeader>Téléphone</TableHeader>
                    <TableHeader>Séances non payées</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unpaidPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Aucun impayé trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    unpaidPatients.map((patient: any) => (
                      <TableRow key={patient._id}>
                        <TableCell>
                          <strong>{patient.lastName} {patient.firstName}</strong>
                        </TableCell>
                        <TableCell>{patient.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="danger">
                            {patient.unpaidSessions} séance(s)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button 
                            onClick={() => router.push(`/patients/${patient._id}`)}
                            style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            Voir le dossier
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </TableContainer>
            </CardContent>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              {donutData.length > 0 ? (
                <>
                  <div className={styles.donutChartContainer}>
                    <svg width="180" height="180" viewBox="0 0 180 180" className={styles.donutSvg}>
                      <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-bg)" strokeWidth="20" />
                      {(() => {
                        let currentAngle = -90;
                        const circumference = 2 * Math.PI * 70; // 439.82
                        return donutData.map((d) => {
                          const strokeLength = (d.value / 100) * circumference;
                          const rotation = currentAngle;
                          currentAngle += (d.value / 100) * 360;
                          return (
                            <circle 
                              key={d.label}
                              cx="90" cy="90" r="70" 
                              fill="none" 
                              stroke={d.color} 
                              strokeWidth="20" 
                              strokeDasharray={`${strokeLength} ${circumference}`} 
                              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }} 
                            />
                          );
                        });
                      })()}
                    </svg>
                    
                    <div className={styles.donutInfo}>
                      <span className={styles.donutTotal}>100%</span>
                      <span className={styles.donutLabel}>Total classés</span>
                    </div>
                  </div>

                  <div className={styles.legend}>
                    {donutData.map((item) => (
                      <div key={item.label} className={styles.legendItem}>
                        <div className={styles.legendLeft}>
                          <div className={styles.legendColor} style={{ backgroundColor: item.color }} />
                          <span>{item.label}</span>
                        </div>
                        <strong>{item.value}%</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
                  Pas assez de données pour le graphique.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Doctors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Médecins Orientateurs</CardTitle>
            </CardHeader>
            <CardContent>
              {doctorsDonutData.length > 0 ? (
                <>
                  <div className={styles.donutChartContainer}>
                    <svg width="180" height="180" viewBox="0 0 180 180" className={styles.donutSvg}>
                      <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-bg)" strokeWidth="20" />
                      {(() => {
                        let currentAngle = -90;
                        const circumference = 2 * Math.PI * 70; // 439.82
                        return doctorsDonutData.map((d) => {
                          const strokeLength = (d.value / 100) * circumference;
                          const rotation = currentAngle;
                          currentAngle += (d.value / 100) * 360;
                          return (
                            <circle 
                              key={d.label}
                              cx="90" cy="90" r="70" 
                              fill="none" 
                              stroke={d.color} 
                              strokeWidth="20" 
                              strokeDasharray={`${strokeLength} ${circumference}`} 
                              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }} 
                            />
                          );
                        });
                      })()}
                    </svg>
                    
                    <div className={styles.donutInfo}>
                      <span className={styles.donutTotal}>100%</span>
                      <span className={styles.donutLabel}>Total orientés</span>
                    </div>
                  </div>

                  <div className={styles.legend}>
                    {doctorsDonutData.map((item) => (
                      <div key={item.label} className={styles.legendItem}>
                        <div className={styles.legendLeft}>
                          <div className={styles.legendColor} style={{ backgroundColor: item.color }} />
                          <span>{item.label} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({item.count})</span></span>
                        </div>
                        <strong>{item.value}%</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--color-text-muted)' }}>
                  Aucune statistique disponible pour le moment.
                </div>
              )}
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
};
