'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/use-app-store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import styles from './auth-modal.module.css';

export function AuthModal() {
  const router = useRouter();
  const {
    authEntryMode,
    isAuthModalOpen,
    setAuthEntryMode,
    setAuthModalOpen,
    showSignupReminder,
    setShowSignupReminder,
  } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isSignup = authEntryMode === 'signup';

  const passwordRules = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    return {
      hasMinLength,
      hasUppercase,
      hasSymbol,
      isValid: hasMinLength && hasUppercase && hasSymbol,
    };
  }, [password]);

  const canSubmit = isSignup
    ? Boolean(email && passwordRules.isValid)
    : Boolean(email && password);

  const handleClose = useCallback(() => {
    setAuthModalOpen(false);
    setPassword('');
    setErrorMessage('');
    setShowSignupReminder(false);
  }, [setAuthModalOpen, setShowSignupReminder]);

  useEffect(() => {
    if (!isAuthModalOpen) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthModalOpen, handleClose]);

  if (!isAuthModalOpen) {
    return null;
  }

  const enterWorkspace = () => {
    setAuthModalOpen(false);
    router.push('/generate');
    router.refresh();
  };

  const handleModeChange = (nextMode: 'signin' | 'signup') => {
    setAuthEntryMode(nextMode);
    setErrorMessage('');
    if (nextMode === 'signup') {
      setShowSignupReminder(false);
    }
  };

  const handleContinue = async () => {
    if (isSignup && !passwordRules.isValid) {
      setErrorMessage('Password must be at least 8 characters, include 1 uppercase letter, and 1 symbol.');
      return;
    }

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        throw new Error('The account service is not configured.');
      }

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/generate` },
        });

        if (error) {
          throw error;
        }

        // Supabase returns a session right away when email confirmation is off.
        if (data.session) {
          enterWorkspace();
          return;
        }

        setAuthEntryMode('signin');
        setEmail('');
        setPassword('');
        setShowSignupReminder(true);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('confirm')) {
          throw new Error('Please confirm your email before signing in.');
        }

        throw error;
      }

      enterWorkspace();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const isNetworkError = message.toLowerCase().includes('failed to fetch');

      setErrorMessage(
        isNetworkError
          ? 'We could not connect to the account service. Check your internet connection and try again.'
          : message || 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={styles.authModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close sign in modal"
        >
          ×
        </button>

        <p className={styles.modalEyebrow}>Welcome to freemium video funnel!</p>

        <div className={styles.authTabs}>
          <button
            type="button"
            className={`${styles.authTab} ${!isSignup ? styles.authTabActive : ''}`}
            onClick={() => handleModeChange('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`${styles.authTab} ${isSignup ? styles.authTabActive : ''}`}
            onClick={() => handleModeChange('signup')}
          >
            Sign up
          </button>
        </div>

        <h3 id="auth-modal-title" className={styles.modalTitle}>{isSignup ? 'Create your account' : 'Welcome back'}</h3>
        <p className={styles.modalText}>
          {isSignup
            ? 'Create an account to continue creating your video and unlock your generation flow.'
            : 'Sign in to continue with your saved upload and generation draft.'}
        </p>

        <div className={styles.modalFields}>
          {showSignupReminder ? (
            <span className={styles.passwordMismatch} role="status">
              Check your inbox and open the confirmation link in this browser. It signs you in and takes you to the workspace.
            </span>
          ) : null}

          <input
            className={styles.modalInput}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            aria-label="Email"
          />

          <div className={styles.passwordFieldWrap}>
            <input
              className={styles.modalInput}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              aria-label="Password"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3.75 20.25 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M10.58 10.58A2 2 0 0 1 13.42 13.42" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M9.1 5.47A10.7 10.7 0 0 1 12 5.25c4.97 0 9.14 3.54 10.5 6.75-.8 1.8-2.23 3.47-4.05 4.69" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14.9 18.53A10.7 10.7 0 0 1 12 18.75c-4.97 0-9.14-3.54-10.5-6.75.8-1.8 2.23-3.47 4.05-4.69" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </button>
          </div>

          {isSignup ? (
            <div className={styles.passwordRules}>
              <span className={passwordRules.hasMinLength ? styles.rulePassed : ''}>8+ characters</span>
              <span className={passwordRules.hasUppercase ? styles.rulePassed : ''}>1 uppercase</span>
              <span className={passwordRules.hasSymbol ? styles.rulePassed : ''}>1 symbol</span>
            </div>
          ) : null}

          {errorMessage ? (
            <span className={styles.passwordMismatch} role="alert">
              {errorMessage}
            </span>
          ) : null}
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.modalPrimary}
            onClick={handleContinue}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Please wait...' : isSignup ? 'Create account' : 'Continue'}
          </button>
          <button type="button" className={styles.modalSecondary} onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
