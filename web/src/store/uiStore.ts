import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  showWelcomeTutorial: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';

  setShowWelcomeTutorial: (show: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      showWelcomeTutorial: true,
      sidebarCollapsed: false,
      theme: 'light',

      setShowWelcomeTutorial: (show) => set({ showWelcomeTutorial: show }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
