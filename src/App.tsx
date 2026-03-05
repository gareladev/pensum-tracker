import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, Save, LogOut, User } from 'lucide-react';
import { useCareers } from './hooks/useCareers';
import { useProgress } from './hooks/useProgress';
import { useDevice } from './hooks/useDevice';
import { useAuth } from './contexts/AuthContext';
import { saveProgressToCloud, loadProgressFromCloud } from './lib/progressApi';
import { MallaCurricular } from './components/MallaCurricular';
import { Leyenda } from './components/Leyenda';
import { StatsBar } from './components/StatsBar';
import { AuthModal } from './components/AuthModal';
import { CareerPickerModal } from './components/CareerPickerModal';
import type { SubjectStatus } from './types';
import { hasSupabase } from './lib/supabase';
import './App.css';

function App() {
  const { careers } = useCareers();
  const [careerId, setCareerId] = useState<string>('');
  const { progress, getProgressForCareer, setSubjectStatus, getFullProgress, setFullProgress } = useProgress();
  const { isMobile } = useDevice();
  const { user, signOut } = useAuth();
  const [careerOpen, setCareerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<'ok' | 'error' | null>(null);
  const loadedCloudRef = useRef(false);

  const career = careers.find((c) => c.id === careerId);
  const progressForCareer = career ? getProgressForCareer(career.id) : {};

  const handleProgressChange = useCallback(
    (subjectId: string, newStatus: SubjectStatus) => {
      if (career) setSubjectStatus(career.id, subjectId, newStatus);
    },
    [career, setSubjectStatus]
  );

  // Solo auto-seleccionar carrera en desktop; en mobile el usuario elige en el modal
  useEffect(() => {
    if (careers.length > 0 && !career && !isMobile) setCareerId(careers[0].id);
  }, [careers, career, isMobile]);

  // Al cerrar sesión, permitir volver a cargar la nube en el próximo login
  useEffect(() => {
    if (!user) loadedCloudRef.current = false;
  }, [user]);

  // Al iniciar sesión, cargar progreso desde la nube
  useEffect(() => {
    if (!user?.id || !hasSupabase || loadedCloudRef.current) return;
    loadedCloudRef.current = true;
    loadProgressFromCloud(user.id).then(({ data, error }) => {
      if (!error && data && Object.keys(data).length > 0) setFullProgress(data);
    });
  }, [user?.id, setFullProgress]);

  // Auto-guardado cuando hay sesión: debounce 1.5 s tras cada cambio de progreso (sin mensaje en UI)
  useEffect(() => {
    if (!user?.id || !hasSupabase) return;
    const t = setTimeout(() => {
      saveProgressToCloud(user.id, getFullProgress()).then(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [user?.id, progress]);

  const handleSave = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!hasSupabase) {
      setSaveMessage('error');
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    const { error } = await saveProgressToCloud(user.id, getFullProgress());
    setSaving(false);
    setSaveMessage(error ? 'error' : 'ok');
    if (!error) setTimeout(() => setSaveMessage(null), 3000);
  }, [user, getFullProgress]);

  const handleOpenAuth = useCallback(() => setShowAuthModal(true), []);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-brand">
          <img src="/favicon.png" alt="Logo" style={{ width: isMobile ? 22 : 26, height: isMobile ? 22 : 26, borderRadius: '50%' }} />
          {!isMobile && <h1>Malla Curricular UNICARIBE</h1>}
          {isMobile && <h1>Malla UNICARIBE</h1>}
        </div>

        {/* Desktop: select nativo */}
        {!isMobile && (
          <div className="career-select-wrap">
            <label htmlFor="career">Carrera</label>
            <select
              id="career"
              value={careerId}
              onChange={(e) => setCareerId(e.target.value)}
              className="career-select"
            >
              {careers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="app-header-actions">
          <button
            type="button"
            className="btn-save"
            onClick={handleSave}
            disabled={saving}
            title={user ? 'Guardar progreso en la nube' : 'Inicia sesión para guardar'}
          >
            <Save size={18} />
            <span>{user ? 'Guardar' : 'Guardar'}</span>
            {saveMessage === 'ok' && <span className="btn-save__badge">Guardado</span>}
            {saveMessage === 'error' && <span className="btn-save__badge btn-save__badge--err">Error</span>}
          </button>
          {user ? (
            <div className="app-user">
              <User size={14} />
              <span className="app-user__email">{user.email}</span>
              <button type="button" className="btn-logout" onClick={() => signOut()} title="Cerrar sesión">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button type="button" className="btn-login" onClick={handleOpenAuth}>
              Entrar
            </button>
          )}
        </div>

        {/* Mobile: botón compacto que abre un sheet */}
        {isMobile && (
          <button
            className="career-btn-mobile"
            onClick={() => setCareerOpen(true)}
          >
            <span className="career-btn-mobile__name">
              {career?.name.split(' ').slice(0, 3).join(' ')}…
            </span>
            <ChevronDown size={16} />
          </button>
        )}
      </header>

      {/* Mobile: modal de selección de carrera (por defecto al abrir o al tocar el botón) */}
      {isMobile && (!careerId || careerOpen) && careers.length > 0 && (
        <CareerPickerModal
          careers={careers}
          selectedId={careerId || null}
          onSelect={(id) => { setCareerId(id); setCareerOpen(false); }}
          onClose={() => setCareerOpen(false)}
          canClose={!!careerId}
        />
      )}

      {/* ── Stats + Leyenda ── */}
      {career && <StatsBar career={career} progress={progressForCareer} />}
      <Leyenda />

      {/* ── Malla ── */}
      <main className="app-main">
        {career ? (
          <MallaCurricular
            career={career}
            progress={progressForCareer}
            onProgressChange={handleProgressChange}
          />
        ) : (
          <p className="no-career">Selecciona una carrera.</p>
        )}
      </main>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

export default App;
