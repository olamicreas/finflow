import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { api, setAuthToken } from "../api/client";

const STORAGE_TOKEN_KEY = "@creaspay_auth_token";
const STORAGE_USER_KEY = "@creaspay_user_profile";
const STORAGE_BIOMETRIC_KEY = "@creaspay_biometric_enabled";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  kyc_tier: number;
  kyc_status: string;
  bvn?: string;
  date_of_birth?: string;
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
  // Real Biometric Features
  canUseBiometrics: boolean;
  isBiometricEnabled: boolean;
  isAppLocked: boolean;
  unlockWithBiometrics: () => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
  // Quick Add Money Modal State
  addMoneyModalVisible: boolean;
  setAddMoneyModalVisible: (visible: boolean) => void;
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

  // Biometric & Lock state
  const [canUseBiometrics, setCanUseBiometrics] = useState<boolean>(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(true);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isPromptingBioRef = useRef<boolean>(false);

  // Add Money Modal state
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState<boolean>(false);

  // 1. Initial Session Restore & Biometric Check on App Launch
  useEffect(() => {
    const initSessionAndBiometrics = async () => {
      try {
        const hasHw = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const bioSetting = await AsyncStorage.getItem(STORAGE_BIOMETRIC_KEY);
        const bioActive = bioSetting !== "false";
        setIsBiometricEnabled(bioActive);

        const savedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
        const savedUserStr = await AsyncStorage.getItem(STORAGE_USER_KEY);

        if (savedToken && savedUserStr) {
          const parsedUser = JSON.parse(savedUserStr);
          setAuthToken(savedToken);
          setUser(parsedUser);

          if (hasHw && isEnrolled && bioActive) {
            setCanUseBiometrics(true);
            setIsAppLocked(true);
            setTimeout(() => {
              unlockWithBiometrics();
            }, 350);
          } else {
            setIsAppLocked(false);
            refreshData();
          }
        }
      } catch (e) {
        console.warn("Session restore error:", e);
      }
    };
    initSessionAndBiometrics();
  }, []);

  // 2. Lock app whenever user leaves and returns
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        const savedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
        const bioSetting = await AsyncStorage.getItem(STORAGE_BIOMETRIC_KEY);
        const bioActive = bioSetting !== "false";

        if (savedToken && isBiometricEnabled && bioActive) {
          setIsAppLocked(true);
          setTimeout(() => {
            unlockWithBiometrics();
          }, 250);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        const savedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
        if (savedToken && isBiometricEnabled) {
          setIsAppLocked(true);
        }
      }
      appStateRef.current = nextAppState;
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [isBiometricEnabled]);

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
      console.warn("Error refreshing CreasPay data:", err.message);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setAuthToken(res.access_token);
      setUser(res.user);

      // Persist for instant biometric access
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.access_token);
      await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));

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

      // Persist for instant biometric access
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.access_token);
      await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));

      await refreshData();
      showToast("Account created successfully!");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    try {
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHw || !isEnrolled) {
        showToast("Biometric sensor not enrolled on this device.");
        return false;
      }

      const savedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
      const savedUserStr = await AsyncStorage.getItem(STORAGE_USER_KEY);
      if (!savedToken || !savedUserStr) {
        return false;
      }

      const authRes = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to CreasPay",
        fallbackLabel: "Use Password",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (authRes.success) {
        setAuthToken(savedToken);
        const parsedUser = JSON.parse(savedUserStr);
        setUser(parsedUser);

        // Fetch fresh profile in background
        api.getMe().then((fresh) => {
          if (fresh) {
            setUser(fresh);
            AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(fresh));
          }
        }).catch(() => {});

        await refreshData();
        showToast(`Welcome back, ${parsedUser.full_name.split(" ")[0]}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn("Biometric login failed:", err.message);
      return false;
    }
  };

  const toggleBiometrics = async (enabled: boolean) => {
    if (enabled) {
      // Prompt user to verify biometrics before enabling
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify Face ID / Fingerprint to enable",
        fallbackLabel: "Cancel",
      });
      if (!res.success) {
        showToast("Biometric verification cancelled.");
        return;
      }
    }
    setIsBiometricEnabled(enabled);
    await AsyncStorage.setItem(STORAGE_BIOMETRIC_KEY, enabled ? "true" : "false");
    showToast(enabled ? "Biometric login enabled" : "Biometric login disabled");
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    if (isPromptingBioRef.current) return false;
    try {
      isPromptingBioRef.current = true;
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHw || !isEnrolled) {
        setIsAppLocked(false);
        return true;
      }

      const authRes = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock CreasPay",
        fallbackLabel: "Use Password",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (authRes.success) {
        setIsAppLocked(false);
        refreshData();
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn("Biometric unlock error:", err.message);
      return false;
    } finally {
      isPromptingBioRef.current = false;
    }
  };

  const logout = async () => {
    setAuthToken(null);
    setUser(null);
    setIsAppLocked(false);
    setWallets([]);
    setCards([]);
    setActiveCard(null);
    setVirtualAccount(null);
    setTransactions([]);
    await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
    await AsyncStorage.removeItem(STORAGE_USER_KEY);
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
        canUseBiometrics,
        isBiometricEnabled,
        isAppLocked,
        unlockWithBiometrics,
        loginWithBiometrics,
        toggleBiometrics,
        addMoneyModalVisible,
        setAddMoneyModalVisible,
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

// Aliases for CreasPay branding
export const CreasPayProvider = FinFlowProvider;
export const useCreasPay = useFinFlow;
