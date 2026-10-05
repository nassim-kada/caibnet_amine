"use client";

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Activity, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
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
  const [sessions] = useLocalStorage<any[]>('app_sessions', []);
  const [injuries] = useLocalStorage<any[]>('app_injuries', []);
  const [categories] = useLocalStorage<any[]>('app_injury_categories', defaultCategories);
  
  const todaySessions = useMemo(() => sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()), [sessions]);
  
  // Calculate some mock stats
  const todayPatientsCount = todaySessions.length;
  const todayCompletedCount = todaySessions.filter(s => s.isCompleted).length;
  const activePatientsCount = patients.filter((p: any) => p.status === 'En cours').length;
  const totalCompletedCount = patients.filter((p: any) => p.status === 'Terminé').length;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' })
      .format(amount)
      .replace('DZD', 'DA');
  };

  const totalExpected = patients.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
  const totalPaid = patients.reduce((sum: number, p: any) => sum + p.paidAmount, 0);
  const totalRemaining = totalExpected - totalPaid;

  const currentPatient = useMemo(() => patients.find((p: any) => p.inWaitingRoom), [patients]);

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
        const inj = injuries.find(i => i._id === p.injuryId);
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
        const cat = categories.find(c => c._id === catId);
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
      {/* Current Patient Alert */}
      {currentPatient && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-primary)', borderLeft: '4px solid var(--color-accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', color: 'white' }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="white" /> Client d'aujourd'hui (En cours de consultation)
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
              {currentPatient.firstName} {currentPatient.lastName}
            </p>
          </div>
          <button 
            onClick={() => router.push(`/patients/${currentPatient._id}`)}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', color: 'var(--color-primary)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            Consulter le dossier <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className={styles.statsGrid}>
        <Card>
          <div className={styles.statCard}>
            <div className={clsx(styles.statIcon, styles.primary)}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Patients reçus aujourd'hui</span>
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
              <span className={styles.statLabel}>Séances terminées (Jour)</span>
              <span className={styles.statValue}>{todayCompletedCount}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.statCard}>
            <div className={clsx(styles.statIcon, styles.accent)}>
              <Activity size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Patients en cours</span>
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
              <span className={styles.statLabel}>Total patients terminés</span>
              <span className={styles.statValue}>{totalCompletedCount}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.mainGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Today's Patients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Patients du jour</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              <TableContainer style={{ border: 'none', borderRadius: 0 }}>
                <TableHead>
                  <TableRow>
                    <TableHeader>Patient</TableHeader>
                    <TableHeader>Médecin</TableHeader>
                    <TableHeader>Heure</TableHeader>
                    <TableHeader>Statut</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todaySessions.map((session) => {
                    const patient = patients.find((p: any) => p._id === session.patientId);
                    const time = new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <TableRow key={session._id}>
                        <TableCell>
                          <strong>{patient?.lastName} {patient?.firstName}</strong>
                        </TableCell>
                        <TableCell>{patient?.doctor}</TableCell>
                        <TableCell>{time}</TableCell>
                        <TableCell>
                          <Badge variant={session.isCompleted ? 'success' : 'warning'}>
                            {session.isCompleted ? 'Terminé' : 'En attente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                    unpaidPatients.slice(0, 10).map((patient: any) => (
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
