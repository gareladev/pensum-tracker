import { useState, useCallback } from 'react';
import { X, Instagram } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

const INSTAGRAM_URL = 'https://www.instagram.com/gareladev';
const TIKTOK_URL = 'https://www.tiktok.com/@gareladev';

type Mode = 'signin' | 'signup';

interface Props {
  onClose: () => void;
  defaultMode?: Mode;
}

export function AuthModal({ onClose, defaultMode = 'signin' }: Props) {
  const { signIn, signUp, error, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = useCallback(() => {
    setLocalError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Escribe tu correo electrónico.');
      return false;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setLocalError('Correo electrónico no válido.');
      return false;
    }
    if (!password) {
      setLocalError('Escribe tu contraseña.');
      return false;
    }
    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      setLocalError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return false;
    }
    return true;
  }, [email, password, mode]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();
      if (!validate()) return;
      setLoading(true);
      setSuccessMessage(null);
      const trimmedEmail = email.trim();
      if (mode === 'signin') {
        const { error: err } = await signIn(trimmedEmail, password);
        setLoading(false);
        if (!err) onClose();
      } else {
        const { error: err } = await signUp(trimmedEmail, password);
        setLoading(false);
        if (!err) {
          setSuccessMessage(
            'Revisa tu correo y haz clic en el enlace para confirmar tu cuenta. Luego inicia sesión.'
          );
        }
      }
    },
    [email, password, mode, validate, signIn, signUp, onClose, clearError]
  );

  const displayError = localError ?? error;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        <h2 className="auth-modal__title">
          {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>
        <p className="auth-modal__subtitle">
          {mode === 'signin'
            ? 'Entra para guardar tu progreso en la nube.'
            : 'Regístrate con tu correo para guardar tu progreso.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-modal__form">
          <label className="auth-modal__label">
            Correo electrónico
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="auth-modal__input"
              disabled={loading}
            />
          </label>
          <label className="auth-modal__label">
            Contraseña
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
              className="auth-modal__input"
              disabled={loading}
              minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
            />
          </label>

          {displayError && (
            <p className="auth-modal__error" role="alert">
              {displayError}
            </p>
          )}
          {successMessage && (
            <p className="auth-modal__success" role="status">
              {successMessage}
            </p>
          )}

          <button type="submit" className="auth-modal__submit" disabled={loading}>
            {loading ? 'Espera…' : mode === 'signin' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        <div className="auth-modal__toggle">
          {mode === 'signin' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={() => setMode('signup')} className="auth-modal__link">
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => setMode('signin')} className="auth-modal__link">
                Inicia sesión
              </button>
            </>
          )}
        </div>

        <div className="auth-modal__social">
          <p className="auth-modal__social-title">Sígueme en redes</p>
          <div className="auth-modal__social-links">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="auth-modal__social-btn auth-modal__social-btn--ig"
            >
              <Instagram size={20} />
              <span>Instagram</span>
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="auth-modal__social-btn auth-modal__social-btn--tt"
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden>
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
              <span>TikTok</span>
            </a>
          </div>
          <p className="auth-modal__social-handles">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">@gareladev</a>
            {' · '}
            <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer">TikTok @gareladev</a>
          </p>
        </div>
      </div>
    </div>
  );
}
