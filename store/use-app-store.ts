import { create } from 'zustand';

type AppState = {
  isUploadOpen: boolean;
  isAuthModalOpen: boolean;
  authEntryMode: 'signin' | 'signup';
  showSignupReminder: boolean;
  selectedFile: File | null;
  errorMessage: string;
  setUploadOpen: (value: boolean) => void;
  setAuthModalOpen: (value: boolean) => void;
  setAuthEntryMode: (mode: 'signin' | 'signup') => void;
  setShowSignupReminder: (value: boolean) => void;
  setSelectedFile: (file: File | null) => void;
  setErrorMessage: (message: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  isUploadOpen: false,
  isAuthModalOpen: false,
  authEntryMode: 'signin',
  showSignupReminder: false,
  selectedFile: null,
  errorMessage: '',
  setUploadOpen: (value) => set({ isUploadOpen: value }),
  setAuthModalOpen: (value) => set({ isAuthModalOpen: value }),
  setAuthEntryMode: (mode) => set({ authEntryMode: mode }),
  setShowSignupReminder: (value) => set({ showSignupReminder: value }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setErrorMessage: (message) => set({ errorMessage: message }),
}));
