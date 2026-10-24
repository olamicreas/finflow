export type NigerianNetwork = "MTN" | "Airtel" | "Glo" | "9mobile" | "Smile";

export interface NetworkMeta {
  name: NigerianNetwork;
  brandColor: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
}

export const NETWORK_METAS: Record<NigerianNetwork, NetworkMeta> = {
  MTN: {
    name: "MTN",
    brandColor: "#FFCC00",
    badgeBg: "#FFFBEB",
    badgeBorder: "#FDE68A",
    textColor: "#92400E",
  },
  Airtel: {
    name: "Airtel",
    brandColor: "#E60000",
    badgeBg: "#FEF2F2",
    badgeBorder: "#FECACA",
    textColor: "#991B1B",
  },
  Glo: {
    name: "Glo",
    brandColor: "#00A859",
    badgeBg: "#ECFDF5",
    badgeBorder: "#A7F3D0",
    textColor: "#065F46",
  },
  "9mobile": {
    name: "9mobile",
    brandColor: "#005C42",
    badgeBg: "#F0FDF4",
    badgeBorder: "#BBF7D0",
    textColor: "#166534",
  },
  Smile: {
    name: "Smile",
    brandColor: "#E6007E",
    badgeBg: "#FDF2F8",
    badgeBorder: "#FBCFE8",
    textColor: "#9D174D",
  },
};

/**
 * Automatically detects the Nigerian telecommunication provider from the first 4-5 digits of a phone number.
 * Supports +234, 234, and local 0-prefixed formats.
 */
export const detectNigerianNetwork = (rawPhone: string): NigerianNetwork | null => {
  if (!rawPhone) return null;

  // Strip non-numeric characters except leading +
  const clean = rawPhone.replace(/[^0-9+]/g, "").trim();
  let digits = clean;

  if (digits.startsWith("+234")) {
    digits = "0" + digits.slice(4);
  } else if (digits.startsWith("234") && digits.length >= 13) {
    digits = "0" + digits.slice(3);
  }

  // Need at least 4 digits to detect network prefix
  if (digits.length < 4) return null;

  const prefix4 = digits.slice(0, 4);
  const prefix5 = digits.slice(0, 5);

  // MTN Prefixes
  const mtnPrefixes = [
    "0803",
    "0806",
    "0703",
    "0706",
    "0813",
    "0816",
    "0810",
    "0814",
    "0903",
    "0906",
    "0913",
    "0916",
    "0704",
    "07025",
    "07026",
  ];
  if (mtnPrefixes.includes(prefix4) || mtnPrefixes.includes(prefix5)) {
    return "MTN";
  }

  // Airtel Prefixes
  const airtelPrefixes = [
    "0802",
    "0808",
    "0708",
    "0812",
    "0701",
    "0902",
    "0901",
    "0904",
    "0907",
    "0912",
    "0911",
  ];
  if (airtelPrefixes.includes(prefix4)) {
    return "Airtel";
  }

  // Glo Prefixes
  const gloPrefixes = [
    "0805",
    "0807",
    "0705",
    "0815",
    "0811",
    "0905",
    "0915",
  ];
  if (gloPrefixes.includes(prefix4)) {
    return "Glo";
  }

  // 9mobile Prefixes
  const nineMobilePrefixes = [
    "0809",
    "0817",
    "0818",
    "0909",
    "0908",
  ];
  if (nineMobilePrefixes.includes(prefix4)) {
    return "9mobile";
  }

  // Smile Broadband Prefixes
  if (prefix5 === "07020" || (prefix4 === "0702" && !["07025", "07026"].includes(prefix5))) {
    return "Smile";
  }

  return null;
};
