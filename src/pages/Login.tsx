import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import styles from './Login.module.css';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username) {
      setError('Veuillez saisir votre identifiant.');
      return;
    }
    
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    if (username === 'admin' && password === 'admin123') {
      navigate('/dashboard');
    } else {
      setError('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Column - Branding */}
      <div className={styles.leftColumn}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L8 6H16L12 2Z" fill="currentColor"/>
              <circle cx="12" cy="12" r="5" fill="currentColor"/>
              <path d="M12 22C17.5228 22 22 17.5228 22 12H20C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12H2C2 17.5228 6.47715 22 12 22Z" fill="var(--color-secondary)"/>
            </svg>
          </div>
          <div>
            <h1 className={styles.appName}>Physio.Pro H.A</h1>
            <p className={styles.appSubtitle}>Votre cabinet de rééducation fonctionnelle nouvelle génération.</p>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className={styles.rightColumn}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h2 className={styles.loginTitle}>Bienvenue</h2>
            <p className={styles.loginSubtitle}>Connectez-vous pour accéder à votre espace</p>
          </div>

          <form className={styles.form} onSubmit={handleLogin}>
            <Input
              label="Identifiant"
              placeholder="Saisissez 'admin'"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<User size={18} />}
              error={error && !username ? 'Requis' : ''}
            />

            <div>
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="Saisissez 'admin123'"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={18} />}
                rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                error={error && !password ? 'Requis' : ''}
              />
              {/* Added a margin to error if present */}
            </div>

            {error && username && password && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', textAlign: 'center', marginTop: '-0.5rem' }}>
                {error}
              </div>
            )}

            <Button type="submit" className={styles.submitButton} size="lg">
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
