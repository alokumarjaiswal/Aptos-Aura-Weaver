import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AppState {
  moodSeed: string;
  transactionCount: number;
  imageData: string;
  loading: boolean;
  lastTransactionHash?: string;
}

export interface AppContextType {
  state: AppState;
  setMoodSeed: (moodSeed: string) => void;
  setTransactionCount: (count: number) => void;
  setImageData: (imageData: string) => void;
  setLoading: (loading: boolean) => void;
  setTransactionHash: (hash: string) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  moodSeed: '',
  transactionCount: 0,
  imageData: '',
  loading: false,
  lastTransactionHash: undefined,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  const setMoodSeed = (moodSeed: string) => {
    setState(prev => ({ ...prev, moodSeed }));
  };

  const setTransactionCount = (count: number) => {
    setState(prev => ({ ...prev, transactionCount: count }));
  };

  const setImageData = (imageData: string) => {
    setState(prev => ({ ...prev, imageData }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setTransactionHash = (hash: string) => {
    setState(prev => ({ ...prev, lastTransactionHash: hash }));
  };

  const resetState = () => {
    setState(initialState);
  };

  const value: AppContextType = {
    state,
    setMoodSeed,
    setTransactionCount,
    setImageData,
    setLoading,
    setTransactionHash,
    resetState,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};