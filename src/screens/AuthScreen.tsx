import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useFinFlow } from "../context/FinFlowContext";
import { CreasPayLogo } from "../components/CreasPayLogo";

export const AuthScreen: React.FC = () => {
  const { login, register, canUseBiometrics, loginWithBiometrics } = useFinFlow();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register Fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bvn, setBvn] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [passcode, setPasscode] = useState("");

  // Date of Birth Modal Alert State (Bitnob Requirement for BVN Virtual Account)
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const [dobModalInput, setDobModalInput] = useState("");
  const [dobModalError, setDobModalError] = useState<string | null>(null);

  useEffect(() => {
    if (canUseBiometrics && mode === "login") {
      const timer = setTimeout(() => {
        loginWithBiometrics();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [canUseBiometrics, mode]);

  const handleSwitchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrorMessage(null);
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail, password);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const formatDobInput = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  };

  const validateDob = (d: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(d)) return false;
    const [year, month, day] = d.split("-").map(Number);
    if (year < 1920 || year > 2012) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    return true;
  };

  const handleRegister = async (overrideDob?: string, skipBvn = false) => {
    setErrorMessage(null);
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim();
    const cleanBvn = skipBvn ? "" : bvn.trim();
    const cleanPin = passcode.trim();
    const activeDob = (overrideDob !== undefined ? overrideDob : dateOfBirth).trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage("Please enter your legal full name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid phone number (e.g. +2348012345678).");
      return;
    }
    if (cleanBvn && cleanBvn.length !== 11) {
      setErrorMessage("BVN must be exactly 11 digits (or leave blank to verify later).");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setErrorMessage("Please set a 4-digit numeric transaction security PIN.");
      return;
    }

    // USER REQUIREMENT: When BVN is provided, Date of Birth is required to instantly
    // create the Providus Virtual Account via Bitnob. Show modal if not provided.
    if (cleanBvn && cleanBvn.length === 11 && !skipBvn) {
      if (!activeDob || !validateDob(activeDob)) {
        setDobModalInput(activeDob);
        setDobModalError(null);
        setDobModalVisible(true);
        return;
      }
    }

    setLoading(true);
    try {
      await register({
        email: cleanEmail,
        full_name: cleanName,
        phone_number: cleanPhone,
        password: password,
        passcode: cleanPin,
        bvn: cleanBvn || undefined,
        date_of_birth: (cleanBvn && activeDob) ? activeDob : undefined,
      });
      setDobModalVisible(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDobModal = () => {
    if (!validateDob(dobModalInput)) {
      setDobModalError("Please enter a valid date in YYYY-MM-DD format (e.g. 1995-05-12).");
      return;
    }
    setDobModalError(null);
    setDateOfBirth(dobModalInput);
    handleRegister(dobModalInput, false);
  };

  const handleSkipBvnModal = () => {
    setDobModalVisible(false);
    setBvn("");
    setDateOfBirth("");
    handleRegister("", true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* JET-BLACK HERO HEADER */}
        <View style={styles.darkHeader}>
          {/* Brand Badge */}
          <View style={styles.brandBadge}>
            <CreasPayLogo size={46} />
            <View>
              <Text style={styles.brandTitle}>CREASPAY</Text>
              <Text style={styles.brandSubtitle}>INSTANT BANKING & VIRTUAL USD CARDS</Text>
            </View>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, mode === "login" && styles.tabButtonActive]}
              onPress={() => handleSwitchMode("login")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === "register" && styles.tabButtonActive]}
              onPress={() => handleSwitchMode("register")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CRISP WHITE SHEET */}
        <View style={styles.whiteSheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetHeading}>
            {mode === "login" ? "Welcome Back" : "Open Your Account"}
          </Text>
          <Text style={styles.sheetSubheading}>
            {mode === "login"
              ? "Access your NGN balances, USD cards, and real bank rails."
              : "Dedicated NGN Virtual Account, instant KYC, and USD virtual cards."}
          </Text>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* FORM FIELDS */}
          {mode === "register" && (
            <>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Legal Name</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={18} color={Colors.textOnSheetMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Samuel Adekunle"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="call-outline" size={18} color={Colors.textOnSheetMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+234 801 234 5678"
                    placeholderTextColor="#9CA3AF"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* BVN (Optional / Recommended) */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>11-Digit BVN</Text>
                  <Text style={styles.optionalBadge}>Instant Bank Account</Text>
                </View>
                <View style={styles.inputBox}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textOnSheetMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 22234567890"
                    placeholderTextColor="#9CA3AF"
                    value={bvn}
                    onChangeText={(val) => {
                      setBvn(val);
                      if (val.length === 11 && !dateOfBirth) {
                        setDobModalInput("");
                        setDobModalError(null);
                        setDobModalVisible(true);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={11}
                  />
                </View>
              </View>

              {/* Date of Birth (Required if BVN is entered) */}
              {bvn.length > 0 && (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Date of Birth</Text>
                    <Text style={styles.dobBadge}>Required for BVN</Text>
                  </View>
                  <View style={styles.inputBox}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="YYYY-MM-DD (e.g. 1995-05-12)"
                      placeholderTextColor="#9CA3AF"
                      value={dateOfBirth}
                      onChangeText={(val) => setDateOfBirth(formatDobInput(val))}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.fieldHelper}>
                    Format: YYYY-MM-DD. Needed by Bitnob to generate Providus Bank account.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color={Colors.textOnSheetMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="name@creaspay.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textOnSheetMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color={Colors.textOnSheetMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Transaction PIN (Register Only) */}
          {mode === "register" && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>4-Digit Transaction PIN</Text>
                <Text style={styles.pinHelper}>For transfers & cards</Text>
              </View>
              <View style={styles.inputBox}>
                <Ionicons name="keypad-outline" size={18} color={Colors.textOnSheetMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1234"
                  placeholderTextColor="#9CA3AF"
                  value={passcode}
                  onChangeText={setPasscode}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {/* ACTION SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={mode === "login" ? handleLogin : () => handleRegister()}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === "login" ? "Sign In to CreasPay" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Real Biometric Login Button */}
          {canUseBiometrics && mode === "login" && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={loginWithBiometrics}
              activeOpacity={0.8}
            >
              <Ionicons name="finger-print" size={22} color={Colors.primary} />
              <Text style={styles.biometricBtnText}>Sign In with Face ID / Biometrics</Text>
            </TouchableOpacity>
          )}

          {/* Switch Prompt */}
          <View style={styles.switchRow}>
            <Text style={styles.switchPromptText}>
              {mode === "login" ? "Don't have an account yet?" : "Already have a CreasPay account?"}
            </Text>
            <TouchableOpacity
              onPress={() => handleSwitchMode(mode === "login" ? "register" : "login")}
            >
              <Text style={styles.switchLinkText}>
                {mode === "login" ? " Create one" : " Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* BITNOB BVN DATE OF BIRTH MODAL ALERT */}
      <Modal
        visible={dobModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDobModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconBox}>
                <Ionicons name="calendar" size={26} color={Colors.primary} />
              </View>

              <Text style={styles.modalTitle}>Date of Birth Required</Text>
              <Text style={styles.modalDescription}>
                To immediately create your Providus Bank account with your BVN, Bitnob requires your Date of Birth exactly as registered with your bank.
              </Text>

              {dobModalError ? (
                <View style={styles.modalErrorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.modalErrorText}>{dobModalError}</Text>
                </View>
              ) : null}

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>DATE OF BIRTH (YYYY-MM-DD)</Text>
                <View style={styles.modalInputBox}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="YYYY-MM-DD (e.g. 1995-05-12)"
                    placeholderTextColor="#9CA3AF"
                    value={dobModalInput}
                    onChangeText={(t) => setDobModalInput(formatDobInput(t))}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoFocus
                  />
                </View>
                <Text style={styles.modalHint}>Enter Year-Month-Day (e.g. 1995-05-12)</Text>
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleConfirmDobModal}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>Confirm & Create Bank Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={handleSkipBvnModal}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSecondaryBtnText}>Skip BVN & Verify Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  darkHeader: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    backgroundColor: Colors.background,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  brandIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 30, 117, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 30, 117, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: Colors.sheetBackground,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 520,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeading: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textOnSheet,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sheetSubheading: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
  },
  inputGroup: {
    marginBottom: 15,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textOnSheet,
    marginBottom: 6,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textOnSheetMuted,
  },
  dobBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  fieldHelper: {
    fontSize: 11,
    color: Colors.textOnSheetMuted,
    marginTop: 4,
  },
  pinHelper: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textOnSheet,
    fontWeight: "500",
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  switchPromptText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
  },
  switchLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
  },
  biometricBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  // Date of Birth Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBackdrop: {
    width: "100%",
    maxWidth: 420,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 30, 117, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textOnSheet,
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 13,
    color: Colors.textOnSheetMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  modalErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    width: "100%",
    gap: 6,
  },
  modalErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
  },
  modalInputGroup: {
    width: "100%",
    marginBottom: 18,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textOnSheetMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textOnSheet,
    fontWeight: "600",
    letterSpacing: 1,
  },
  modalHint: {
    fontSize: 11,
    color: Colors.textOnSheetMuted,
    marginTop: 5,
    marginLeft: 2,
  },
  modalPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 50,
    width: "100%",
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalSecondaryBtn: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textOnSheetMuted,
  },
});
