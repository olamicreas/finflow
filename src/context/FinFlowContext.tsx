import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "../api/client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  kyc_tier: number;
  kyc_status: string;
  bitnob_customer_id?: string;
}

export interface WalletItem {
  id: string;
  currency: "NGN" | "USD";
  balance: number;
  ledger_balance: number;
  is_active: boolean;
}

export interface VirtualAccountItem {
  id: string;
  provider: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code?: string;
  currency: string;
  status: string;
}

export interface VirtualCardItem {
  id: string;
  bitnob_card_id: string;
  customer_id?: string;
  card_type: string;
  card_scheme: string;
  currency: string;
  balance: number;
  balance_microunits: number;
  masked_pan: string;
  last4: string;
  expiry_month: string;
  expiry_year: string;
  cardholder_name: string;
  status: "active" | "frozen" | "terminated";
  contactless_enabled: boolean;
  card_theme: "obsidian" | "emerald" | "violet" | "sunset";
  daily_limit: number;
  monthly_limit: number;
  created_at: string;
}

export interface TransactionItemData {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  fee: number;
  exchange_rate?: number;
  counterparty_name?: string;
  counterparty_account?: string;
  counterparty_bank?: string;
  reference: string;
  status: string;
  narration: string;
  earnings_amount?: number;
  earnings_percentage?: number;
  earnings_currency?: string;
  created_at: string;
}

interface FinFlowContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  wallets: WalletItem[];
  ngnWallet: WalletItem | undefined;
  virtualAccount: VirtualAccountItem | null;
  cards: VirtualCardItem[];
  activeCard: VirtualCardItem | null;
  setActiveCard: (card: VirtualCardItem | null) => void;
  transactions: TransactionItemData[];
  toastMessage: string | null;
  showToast: (msg: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const FinFlowContext = createContext<FinFlowContextType | undefined>(undefined);

export const FinFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccountItem | null>(null);
  const [cards, setCards] = useState<VirtualCardItem[]>([]);
  const [activeCard, setActiveCard] = useState<VirtualCardItem | null>(null);
  const [transactions, setTransactions] = useState<TransactionItemData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = async () => {
    try {
      const [walletsData, vaData, cardsData, txData] = await Promise.all([
        api.getWallets().catch(() => []),
        api.getVirtualAccount().catch(() => null),
        api.getCards().catch(() => []),
        api.getTransactions().catch(() => []),
      ]);

      setWallets(walletsData);
      setVirtualAccount(vaData);
      setCards(cardsData);
      setTransactions(txData);

      if (cardsData.length > 0) {
        // Keep currently selected or pick the first
        setActiveCard((prev) => (prev ? cardsData.find((c: any) => c.id === prev.id) || cardsData[0] : cardsData[0]));
      } else {
        setActiveCard(null);
      }
    } catch (err: any) {
      console.warn("Error refreshing FinFlow data:", err.message);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setAuthToken(res.access_token);
      setUser(res.user);
      await refreshData();
      showToast(`Welcome back, ${res.user.full_name.split(" ")[0]}!`);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setAuthToken(res.access_token);
      setUser(res.user);
      await refreshData();
      showToast("Account created successfully!");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setWallets([]);
    setCards([]);
    setActiveCard(null);
    setVirtualAccount(null);
    setTransactions([]);
  };

  const ngnWallet = wallets.find((w) => w.currency === "NGN") || wallets[0];

  return (
    <FinFlowContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        wallets,
        ngnWallet,
        virtualAccount,
        cards,
        activeCard,
        setActiveCard,
        transactions,
        toastMessage,
        showToast,
        login,
        register,
        logout,
        refreshData,
      }}
    >
      {children}
    </FinFlowContext.Provider>
  );
};

export const useFinFlow = () => {
  const context = useContext(FinFlowContext);
  if (!context) {
    throw new Error("useFinFlow must be used within a FinFlowProvider");
  }
  return context;
};
