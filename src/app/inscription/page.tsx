"use client";

import { useState } from 'react';
import styles from './page.module.css';

export default function InscriptionPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    age: '',
    isPending: true
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('Une erreur est survenue.');
      }

      setSuccess(true);
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <svg className={styles.logo} viewBox="0 0 120 120" role="img" aria-label="شعار Physio.Pro H.A">
          <circle cx="60" cy="56" r="38" fill="#0f8f94" opacity=".9"/>
          <path d="M22 62a40 40 0 1 1 10 26" fill="none" stroke="#e3b84b" strokeWidth="5" strokeLinecap="round"/>
          <path d="M44 34c14-6 30 2 26 16s-22 10-18 24" fill="none" stroke="#0a2460" strokeWidth="7" strokeLinecap="round"/>
          <circle cx="74" cy="34" r="5" fill="#fff" opacity=".85"/>
          <path d="M46 98c14 4 34 4 52-10-8 0-16 4-26 4-8 0-14-2-26 6z" fill="#e3b84b"/>
        </svg>
        <p className={styles.subtitle}>CABINET DE RÉÉDUCATION FONCTIONNELLE</p>
        <h1 className={styles.title}>مرحباً بكم</h1>
        <p className={styles.brand}>Physio.Pro H.A</p>
        <p className={styles.description}>
          يسعدنا استقبالكم في عيادة إعادة التأهيل الوظيفي. اتركوا لنا اسمكم ورقم هاتفكم وسنتصل بكم في أقرب وقت.
        </p>
      </header>

      <section className={styles.formContainer}>
        {success ? (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <h3 className={styles.successTitle}>تم الإرسال</h3>
            <p className={styles.successMsg}>
              شكراً {formData.firstName} {formData.lastName}، يرجى الانتظار في قاعة الانتظار.
            </p>
          </div>
        ) : (
          <>
            <h2 className={styles.formTitle}>استمارة التسجيل</h2>
            <p className={styles.formSubtitle}>املأ الحقول التالية ثم اضغط إرسال.</p>

            {error && (
              <div style={{ color: '#c2362e', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>الاسم</label>
                <input 
                  type="text" 
                  name="firstName"
                  className={styles.input} 
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>اللقب</label>
                <input 
                  type="text" 
                  name="lastName"
                  className={styles.input} 
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>العمر</label>
                <input 
                  type="number" 
                  name="age"
                  className={styles.input} 
                  required
                  value={formData.age}
                  onChange={handleChange}
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>رقم الهاتف</label>
                <input 
                  type="tel" 
                  name="phone"
                  className={styles.input} 
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>

              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'جارٍ الإرسال...' : 'إرسال'}
              </button>
            </form>
          </>
        )}
      </section>

      <footer className={styles.footer}>© Physio.Pro H.A</footer>
    </div>
  );
}
