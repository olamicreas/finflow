import { Platform } from "react-native";

// Supports local development, EAS Build environment variables, and public TestFlight rails
const getDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Production VPS HTTPS endpoint for TestFlight & mobile devices
  return "https://ngnflow.com/finflow/api/v1";
};

export const API_BASE_URL = getDefaultBaseUrl();

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    throw err;
  }
};

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    email: string;
    full_name: string;
    password: string;
    phone_number?: string;
    passcode?: string;
    bvn?: string;
    date_of_birth?: string;
  }) =>
    request<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request<any>("/auth/me"),

  submitKyc: (payload: any) =>
    request<any>("/auth/kyc", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  setPasscode: (passcode: string) =>
    request<any>("/auth/set-passcode", {
      method: "POST",
      body: JSON.stringify({ passcode }),
    }),

  verifyPasscode: (passcode: string) =>
    request<any>("/auth/verify-passcode", {
      method: "POST",
      body: JSON.stringify({ passcode }),
    }),

  // Wallets & Virtual Accounts
  getWallets: () => request<any[]>("/wallets"),

  getVirtualAccount: () => request<any>("/wallets/virtual-account"),

  simulateDeposit: (amount: number, sender_name?: string, narration?: string) =>
    request<any>("/wallets/simulate-deposit", {
      method: "POST",
      body: JSON.stringify({ amount, sender_name, narration }),
    }),

  // Cards (Bitnob Virtual USD Cards)
  getCards: () => request<any[]>("/cards"),

  createCard: (payload: {
    amount: number;
    name?: string;
    card_theme?: string;
    contactless_payment?: boolean;
    passcode: string;
  }) =>
    request<any>("/cards", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getCard: (cardId: string) => request<any>(`/cards/${cardId}`),

  revealCardSecureDetails: (cardId: string, passcode: string) =>
    request<any>(`/cards/${cardId}/reveal?passcode=${encodeURIComponent(passcode)}`, {
      method: "POST",
    }),

  fundCard: (cardId: string, payload: { amount: number; source_wallet_currency: string; passcode: string }) =>
    request<any>(`/cards/${cardId}/fund`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  withdrawCard: (cardId: string, payload: { amount: number; dest_wallet_currency: string; passcode: string }) =>
    request<any>(`/cards/${cardId}/withdraw`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCardStatus: (cardId: string, status: "active" | "frozen") =>
    request<any>(`/cards/${cardId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  terminateCard: (cardId: string) =>
    request<any>(`/cards/${cardId}`, {
      method: "DELETE",
    }),

  getCardTransactions: (cardId: string) => request<{ card_id: string; transactions: any[] }>(`/cards/${cardId}/transactions`),

  // Transfers & Instant Bank Resolution
  getBanks: () => request<any[]>("/transfers/banks"),

  resolveAccount: (account_number: string, bank_code: string) =>
    request<{ account_number: string; account_name: string; bank_code: string; bank_name?: string }>("/transfers/resolve", {
      method: "POST",
      body: JSON.stringify({ account_number, bank_code }),
    }),

  sendTransfer: (payload: {
    account_bank: string;
    account_number: string;
    amount: number;
    narration?: string;
    save_beneficiary?: boolean;
    passcode: string;
  }) =>
    request<any>("/transfers/send", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getBeneficiaries: () => request<any[]>("/transfers/beneficiaries"),

  // FX
  getFxQuote: (from_currency: string, to_currency: string, amount: number) =>
    request<any>("/fx/quote", {
      method: "POST",
      body: JSON.stringify({ from_currency, to_currency, amount }),
    }),

  convertFx: (from_currency: string, to_currency: string, amount: number, passcode: string) =>
    request<any>("/fx/convert", {
      method: "POST",
      body: JSON.stringify({ from_currency, to_currency, amount, passcode }),
    }),

  // Transactions
  getTransactions: (currency?: string, category?: string) => {
    let q = "";
    if (currency) q += `?currency=${currency}`;
    if (category) q += `${q ? "&" : "?"}category=${category}`;
    return request<any[]>(`/transactions${q}`);
  },

  getTransactionReceipt: (txId: string) => request<any>(`/transactions/${txId}`),

  // Bill Payments & Utilities (Airtime, Data, Electricity, Cable)
  getBillCategories: () => request<any[]>("/bills/categories"),

  getBillers: (category: string) => request<any[]>(`/bills/billers?category=${category}`),

  validateBillCustomer: (payload: { item_code: string; biller_code: string; customer: string }) =>
    request<any>("/bills/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  payBill: (payload: {
    category: string;
    biller_code: string;
    item_code?: string;
    customer: string;
    amount: number;
    meter_type?: string;
    passcode: string;
  }) =>
    request<any>("/bills/pay", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

