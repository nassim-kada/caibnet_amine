import React, { useMemo } from 'react';
import { Users, CheckCircle, Activity, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { TableContainer, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useLocalStorage } from '../hooks/useLocalStorage';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const [patients] = useLocalStorage<any[]>('app_patients', []);
  const [sessions] = useLocalStorage<any[]>('app_sessions', []);
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

  // Mock bar chart data (last 7 days)
  const chartData = [
    { day: 'Lun', value: 12 },
    { day: 'Mar', value: 15 },
    { day: 'Mer', value: 10 },
    { day: 'Jeu', value: 18 },
    { day: 'Ven', value: 14 },
    { day: 'Sam', value: 8 },
    { day: 'Dim', value: 0 }, // Closed
  ];
  const maxChartValue = Math.max(...chartData.map(d => d.value));

  // Mock donut chart data
  const donutData = [
    { label: 'Rachis', value: 45, color: 'var(--color-primary)' },
    { label: 'Membre Sup.', value: 20, color: 'var(--color-accent)' },
    { label: 'Membre Inf.', value: 25, color: 'var(--color-secondary)' },
    { label: 'Autres', value: 10, color: 'var(--color-border)' },
  ];

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
          {/* Charts Row */}
          <Card>
            <CardHeader>
              <CardTitle>Fréquentation (7 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.barChart}>
                {chartData.map((d) => (
                  <div key={d.day} className={styles.barCol}>
                    <div 
                      className={styles.bar} 
                      style={{ height: `${(d.value / maxChartValue) * 100}%` }}
                      title={`${d.value} patients`}
                    />
                    <span className={styles.barLabel}>{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                    const patient = patients.find((p: any) => p.id === session.patientId);
                    const time = new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <TableRow key={session.id}>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.donutChartContainer}>
                {/* SVG Donut implementation */}
                <svg width="180" height="180" viewBox="0 0 180 180" className={styles.donutSvg}>
                  {/* Background circle */}
                  <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-bg)" strokeWidth="20" />
                  
                  {/* We just draw a few arcs using stroke-dasharray for mock purposes */}
                  <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-primary)" strokeWidth="20" strokeDasharray="440" strokeDashoffset="242" /> {/* 45% */}
                  <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-accent)" strokeWidth="20" strokeDasharray="440" strokeDashoffset="352" style={{ transform: 'rotate(162deg)', transformOrigin: 'center' }} /> {/* 20% */}
                  <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-secondary)" strokeWidth="20" strokeDasharray="440" strokeDashoffset="330" style={{ transform: 'rotate(234deg)', transformOrigin: 'center' }} /> {/* 25% */}
                </svg>
                
                <div className={styles.donutInfo}>
                  <span className={styles.donutTotal}>100%</span>
                  <span className={styles.donutLabel}>Total cas</span>
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
            </CardContent>
          </Card>

          {/* Payments summary */}
          <Card>
            <CardHeader>
              <CardTitle>Situation financière</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <div className={styles.paymentTotal}>{formatMoney(totalPaid)}</div>
                <div className={styles.paymentSubtitle}>Total encaissé</div>
              </div>
              
              <div>
                <div className={styles.paymentRow}>
                  <span className={styles.paymentLabel}>Chiffre d'affaires estimé</span>
                  <span className={styles.paymentValue}>{formatMoney(totalExpected)}</span>
                </div>
                <div className={styles.paymentRow}>
                  <span className={styles.paymentLabel}>Restant dû</span>
                  <span className={clsx(styles.paymentValue, styles.danger)}>{formatMoney(totalRemaining)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
