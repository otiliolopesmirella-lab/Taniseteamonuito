/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AlphaFeedbackModal } from './components/AlphaFeedbackModal';
import { CharacterSelectScreen } from './components/CharacterSelectScreen';
import { DigimonSelectScreen } from './components/DigimonSelectScreen';
import { LoginCard } from './components/LoginCard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TamerWorldCanvas } from './components/TamerWorldCanvas';
import { UtilityModal } from './components/UtilityModal';
import {
  authService,
  getSavedCharacterForAccount,
  getSavedStarterDigimonForAccount,
  overrideCharacterForGm,
  overrideStarterDigimonForGm,
} from './services/authService';
import { flushPendingCloudSaves } from './services/cloudSaveService';
import { isCurrentAuthUserBootstrappedGm } from './services/gmRoleService';
import type {
  AppPreferences,
  AuthUserSummary,
  ModalSection,
} from './types/auth';
import type { SavedCharacterSelection, TamerId } from './types/character';
import type { SavedStarterDigimon, StarterDigimonId } from './types/digimon';
import { selectionThemePlayer } from './utils/soundFx';

type AppScreen = 'login' | 'character-select' | 'digimon-select' | 'world';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('login');
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthUserSummary | null>(null);
  const [selectedTamer, setSelectedTamer] =
    useState<SavedCharacterSelection | null>(null);
  const [selectedDigimon, setSelectedDigimon] =
    useState<SavedStarterDigimon | null>(null);
  const [activeModal, setActiveModal] = useState<ModalSection | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState<string>('login');
  const [preferences, setPreferences] = useState<AppPreferences>({
    soundEnabled: true,
    animationsEnabled: true,
    graphicsQuality: 'alta',
  });

  const showMotion =
    preferences.animationsEnabled && preferences.graphicsQuality === 'alta';

  const isSelectionPhase =
    activeScreen === 'character-select' || activeScreen === 'digimon-select';

  // Flush debounced Firestore cloud saves whenever the user backgrounds or closes the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushPendingCloudSaves();
      }
    };
    const handlePageHide = () => {
      void flushPendingCloudSaves();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // Keep "Vem Comigo" playing continuously across Tamer Select -> Starter Digimon Select,
  // stopping smoothly only once the player finishes selection and spawns in DATS (or returns to login).
  useEffect(() => {
    if (isSelectionPhase) {
      selectionThemePlayer.start(preferences.soundEnabled);
    } else {
      selectionThemePlayer.stop();
    }
  }, [isSelectionPhase, preferences.soundEnabled]);

  useEffect(() => {
    selectionThemePlayer.setMuted(!preferences.soundEnabled);
  }, [preferences.soundEnabled]);

  useEffect(() => {
    return () => {
      selectionThemePlayer.stop();
    };
  }, []);

  function handleToggleSound() {
    setPreferences((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  }

  function handleOpenFeedback(contextOverride?: string) {
    setFeedbackContext(contextOverride ?? activeScreen);
    setFeedbackModalOpen(true);
  }

  function handleEnterAccount(user: AuthUserSummary) {
    setAuthenticatedUser(user);
    setActiveModal(null);

    const savedChar = getSavedCharacterForAccount(user.username);
    const savedStarter = getSavedStarterDigimonForAccount(user.username);

    // Returning players with saved Tamer + Starter resume directly in the world!
    if (savedChar && savedStarter) {
      selectionThemePlayer.stop();
      setSelectedTamer(savedChar);
      setSelectedDigimon(savedStarter);
      setActiveScreen('world');
      return;
    }

    // Unlock & kick off theme music synchronously inside the login click gesture
    selectionThemePlayer.start(preferences.soundEnabled);
    if (savedChar) {
      setSelectedTamer(savedChar);
      setSelectedDigimon(null);
      setActiveScreen('digimon-select');
      return;
    }

    setSelectedTamer(null);
    setSelectedDigimon(null);
    setActiveScreen('character-select');
  }

  function handleEnterWorld(selection: SavedCharacterSelection) {
    setSelectedTamer(selection);
    const savedStarter = getSavedStarterDigimonForAccount(
      selection.accountUsername
    );
    if (savedStarter) {
      selectionThemePlayer.stop();
      setSelectedDigimon(savedStarter);
      setActiveScreen('world');
      return;
    }
    // Keep selection theme playing smoothly into Digimon Select
    setSelectedDigimon(null);
    setActiveScreen('digimon-select');
  }

  function handleConfirmStarter(savedStarter: SavedStarterDigimon) {
    // Selection complete — stop selection music cleanly before spawning into DATS Center
    selectionThemePlayer.stop();
    setSelectedDigimon(savedStarter);
    setActiveScreen('world');
  }

  const isVerifiedGmAccount = Boolean(
    authenticatedUser?.isGM && isCurrentAuthUserBootstrappedGm()
  );
  const isCloudVerifiedGm = isVerifiedGmAccount;

  function handleAdminSwitchStarter(starterId: StarterDigimonId) {
    if (!isVerifiedGmAccount || !isCurrentAuthUserBootstrappedGm()) return;
    const accountName =
      selectedTamer?.accountUsername ?? authenticatedUser?.username ?? 'TamerTeste';
    const nextStarter = overrideStarterDigimonForGm({
      accountUsername: accountName,
      digimonId: starterId,
    });
    setSelectedDigimon(nextStarter);
  }

  function handleAdminSwitchTamer(characterId: TamerId) {
    if (!isVerifiedGmAccount || !isCurrentAuthUserBootstrappedGm()) return;
    const accountName =
      selectedTamer?.accountUsername ?? authenticatedUser?.username ?? 'TamerTeste';
    const nextTamer = overrideCharacterForGm({
      accountUsername: accountName,
      characterId,
      tamerName: selectedTamer?.tamerName,
    });
    setSelectedTamer(nextTamer);
  }

  function handleOpenSelectionFlow(screen: 'character-select' | 'digimon-select') {
    if (!isVerifiedGmAccount || !isCurrentAuthUserBootstrappedGm()) return;
    setActiveScreen(screen);
  }

  async function handleBackToLogin() {
    selectionThemePlayer.stop();
    await authService.signOutAccount();
    setAuthenticatedUser(null);
    setSelectedTamer(null);
    setSelectedDigimon(null);
    setActiveScreen('login');
  }

  return (
    <div className="relative flex min-h-dvh w-full justify-center overflow-x-hidden bg-[#020816]">
      {/* Desktop / wide-screen ambient Digital World aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 hidden sm:block bg-[radial-gradient(circle_at_50%_20%,rgba(12,68,168,0.45),rgba(3,10,28,0.96)_62%,#020612_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 hidden sm:block opacity-20 [background-image:linear-gradient(to_right,rgba(0,212,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,212,255,0.16)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      {/* Primary stage: full-viewport responsive mobile/desktop canvas */}
      <main
        className={
          activeScreen === 'world'
            ? 'relative flex h-dvh w-full flex-col overflow-hidden bg-[#030b1f]'
            : 'relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[#020a24]'
        }
      >
        {activeScreen === 'login' ? (
          <LoginCard
            soundEnabled={preferences.soundEnabled}
            onOpenModal={(section) => setActiveModal(section)}
            onLoginSuccess={handleEnterAccount}
          />
        ) : activeScreen === 'character-select' ? (
          <CharacterSelectScreen
            accountUsername={authenticatedUser?.username ?? 'Domador'}
            soundEnabled={preferences.soundEnabled}
            animationsEnabled={showMotion}
            onToggleSound={handleToggleSound}
            onBackToLogin={() => {
              void handleBackToLogin();
            }}
            onEnterWorld={handleEnterWorld}
          />
        ) : activeScreen === 'digimon-select' && selectedTamer ? (
          <DigimonSelectScreen
            accountUsername={selectedTamer.accountUsername}
            tamerName={selectedTamer.tamerName}
            soundEnabled={preferences.soundEnabled}
            animationsEnabled={showMotion}
            onToggleSound={handleToggleSound}
            onBackToCharacterSelect={() => setActiveScreen('character-select')}
            onConfirmStarter={handleConfirmStarter}
          />
        ) : (
          selectedTamer &&
          selectedDigimon && (
            <TamerWorldCanvas
              selection={selectedTamer}
              starterDigimon={selectedDigimon}
              preferences={preferences}
              isGM={isVerifiedGmAccount}
              cloudIsGm={isCloudVerifiedGm}
              onUpdatePreferences={setPreferences}
              onOpenFeedback={handleOpenFeedback}
              onAdminSwitchStarter={
                isVerifiedGmAccount ? handleAdminSwitchStarter : undefined
              }
              onAdminSwitchTamer={
                isVerifiedGmAccount ? handleAdminSwitchTamer : undefined
              }
              onOpenSelectionFlow={
                isVerifiedGmAccount ? handleOpenSelectionFlow : undefined
              }
              onExitToLogin={() => {
                void (async () => {
                  await flushPendingCloudSaves();
                  await handleBackToLogin();
                })();
              }}
            />
          )
        )}
      </main>

      {/* Interactive Modal / Bottom Sheet for Menu & Account Actions */}
      <UtilityModal
        section={activeModal}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
        onAccountCreated={handleEnterAccount}
        onOpenFeedback={() => handleOpenFeedback(activeScreen)}
        onClose={() => setActiveModal(null)}
      />

      {/* Alpha Version Bug Report & Player Feedback Modal (saved to Firestore) */}
      <AlphaFeedbackModal
        open={feedbackModalOpen}
        username={authenticatedUser?.username}
        tamerName={selectedTamer?.tamerName}
        screenContext={feedbackContext}
        soundEnabled={preferences.soundEnabled}
        isGM={isCloudVerifiedGm}
        onClose={() => setFeedbackModalOpen(false)}
      />

      {/* Non-intrusive offline connectivity toast */}
      <OfflineIndicator />
    </div>
  );
}
