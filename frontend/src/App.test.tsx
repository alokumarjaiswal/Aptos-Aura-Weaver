import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock wallet adapter to prevent errors in tests
jest.mock('@aptos-labs/wallet-adapter-react', () => ({
  useWallet: () => ({ connected: false, account: null }),
  AptosWalletAdapterProvider: ({ children }: { children: React.ReactNode }) => children,
}));

test('renders app without crashing', () => {
  render(<App />);
});
