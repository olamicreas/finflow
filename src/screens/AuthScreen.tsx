import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useFinFlow } from "../context/FinFlowContext";
import { CreasPayLogo } from "../components/CreasPayLogo";

type AuthMode = "login" | "register";
type RegisterStep = 1 | 2 | 3 | 4 | 5;

export const AuthScreen: React.FC = () => {
  const { login, register, canUseBiometrics, loginWithBiometrics } = useFinFlow();

  const [mode, setMode] = useState<AuthMode>("register");
  const [step, setStep] = useState<RegisterStep>(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bvn, setBvn] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passcode, setPasscode] = useState("");

  // Bitnob DOB Modal State
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const [dobModalInput, setDobModalInput] = useState("");
  const [dobModalError, setDobModalError] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (canUseBiometrics && mode === "login") {
      const timer = setTimeout(() => {
        loginWithBiometrics();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [canUseBiometrics, mode]);

  useEffect(() => {
    // Focus active field when step changes
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [step, mode]);

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

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return fullName.trim().length >= 2;
      case 2:
        return email.trim().includes("@") && email.trim().includes(".");
      case 3:
        return phoneNumber.trim().length >= 10;
      case 4:
        // BVN is optional. If entered, must be 11 digits and have valid DOB
        if (bvn.trim().length === 0) return true;
        return bvn.trim().length === 11 && validateDob(dateOfBirth.trim());
      case 5:
        return password.length >= 6 && passcode.trim().length === 4;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (step === 1) {
      if (fullName.trim().length < 2) {
        setErrorMessage("Please enter your legal full name.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email.trim().includes("@") || !email.trim().includes(".")) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (phoneNumber.trim().length < 10) {
        setErrorMessage("Please enter a valid phone number.");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      const cleanBvn = bvn.trim();
      if (cleanBvn.length > 0 && cleanBvn.length !== 11) {
        setErrorMessage("BVN must be exactly 11 digits (or leave empty to verify later).");
        return;
      }
      if (cleanBvn.length === 11 && !validateDob(dateOfBirth.trim())) {
        setDobModalInput(dateOfBirth.trim());
        setDobModalError(null);
        setDobModalVisible(true);
        return;
      }
      setStep(5);
    } else if (step === 5) {
      handleRegister();
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as RegisterStep);
    }
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
      setStep(1);
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      setStep(2);
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid phone number.");
      setStep(3);
      return;
    }
    if (cleanBvn && cleanBvn.length !== 11) {
      setErrorMessage("BVN must be exactly 11 digits.");
      setStep(4);
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      setStep(5);
      return;
    }
    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setErrorMessage("Please set a 4-digit numeric transaction PIN.");
      setStep(5);
      return;
    }

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
        date_of_birth: cleanBvn && activeDob ? activeDob : undefined,
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
      setDobModalError("Format: YYYY-MM-DD (e.g. 1995-05-12).");
      return;
    }
    setDobModalError(null);
    setDateOfBirth(dobModalInput);
    setDobModalVisible(false);
    if (step === 4) {
      setStep(5);
    } else {
      handleRegister(dobModalInput, false);
    }
  };

  const handleSkipBvnModal = () => {
    setDobModalVisible(false);
    setBvn("");
    setDateOfBirth("");
    if (step === 4) {
      setStep(5);
    } else {
      handleRegister("", true);
    }
  };

  // Render Multi-Step Signup Form
  const renderRegisterContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrowText}>Let's get to know you</Text>
            <Text style={styles.headlineText}>What do we call you?</Text>
            <Text style={styles.subheadText}>
              Enter your legal full name as registered on official identity documents.
            </Text>

            <View style={styles.heroInputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.heroInput}
                placeholder="Your Name"
                placeholderTextColor="#3A3A3C"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
              />
              <Text style={styles.charCounter}>{fullName.length}/50</Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrowText}>Account Details</Text>
            <Text style={styles.headlineText}>What's your email?</Text>
            <Text style={styles.subheadText}>
              We'll send your instant transfer receipts and virtual card notices here.
            </Text>

            <View style={styles.heroInputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.heroInput}
                placeholder="name@creaspay.com"
                placeholderTextColor="#3A3A3C"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrowText}>Contact Information</Text>
            <Text style={styles.headlineText}>Your phone number</Text>
            <Text style={styles.subheadText}>
              Used for transaction notifications and dedicated Providus Bank linkage.
            </Text>

            <View style={styles.heroInputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.heroInput}
                placeholder="+234 801 234 5678"
                placeholderTextColor="#3A3A3C"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrowText}>Instant Banking Rails</Text>
            <Text style={styles.headlineText}>Enter your 11-digit BVN</Text>
            <Text style={styles.subheadText}>
              Instantly provisions your dedicated Providus Bank virtual account (or leave blank to verify later).
            </Text>

            <View style={styles.heroInputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.heroInput}
                placeholder="e.g. 22234567890"
                placeholderTextColor="#3A3A3C"
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
              <Text style={styles.charCounter}>{bvn.length}/11</Text>
            </View>

            {/* Date of Birth field shown directly if BVN is filled */}
            {bvn.length > 0 && (
              <View style={styles.dobContainer}>
                <View style={styles.dobLabelRow}>
                  <Text style={styles.dobLabel}>Date of Birth (YYYY-MM-DD)</Text>
                  <Text style={styles.dobBadge}>Required for BVN</Text>
                </View>
                <View style={styles.dobInputBox}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.dobTextInput}
                    placeholder="1995-05-12"
                    placeholderTextColor="#48484A"
                    value={dateOfBirth}
                    onChangeText={(val) => setDateOfBirth(formatDobInput(val))}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
                <Text style={styles.dobHelper}>
                  Bitnob requires your birth date matching bank records to issue your Providus account.
                </Text>
              </View>
            )}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.eyebrowText}>Security & Protection</Text>
            <Text style={styles.headlineText}>Secure your CreasPay</Text>
            <Text style={styles.subheadText}>
              Set a strong account password and a 4-digit PIN for instant transfers and card issuance.
            </Text>

            <View style={[styles.securityGroup, { marginTop: 16 }]}>
              <Text style={styles.inputMiniLabel}>LOGIN PASSWORD (MIN 6 CHARS)</Text>
              <View style={styles.securityInputBox}>
                <TextInput
                  ref={inputRef}
                  style={styles.securityTextInput}
                  placeholder="••••••••••••"
                  placeholderTextColor="#48484A"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={19}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.securityGroup, { marginTop: 18 }]}>
              <View style={styles.dobLabelRow}>
                <Text style={styles.inputMiniLabel}>4-DIGIT TRANSACTION PIN</Text>
                <Text style={styles.pinHelperBadge}>For transfers & cards</Text>
              </View>
              <View style={styles.securityInputBox}>
                <TextInput
                  style={[styles.securityTextInput, { letterSpacing: 8, fontWeight: "800" }]}
                  placeholder="••••"
                  placeholderTextColor="#48484A"
                  value={passcode}
                  onChangeText={setPasscode}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        );
    }
  };

  // Render Login Form
  const renderLoginContent = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.loginBrandRow}>
          <CreasPayLogo size={42} showText textSize={22} textColor="#FFFFFF" />
        </View>

        <Text style={styles.eyebrowText}>Welcome Back</Text>
        <Text style={styles.headlineText}>Sign in to CreasPay</Text>
        <Text style={styles.subheadText}>
          Access your dedicated Providus Bank account, USD virtual cards, and instant rails.
        </Text>

        <View style={styles.securityGroup}>
          <Text style={styles.inputMiniLabel}>EMAIL ADDRESS</Text>
          <View style={styles.securityInputBox}>
            <TextInput
              ref={inputRef}
              style={styles.securityTextInput}
              placeholder="name@creaspay.com"
              placeholderTextColor="#48484A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={[styles.securityGroup, { marginTop: 16 }]}>
          <Text style={styles.inputMiniLabel}>PASSWORD</Text>
          <View style={styles.securityInputBox}>
            <TextInput
              style={styles.securityTextInput}
              placeholder="••••••••••••"
              placeholderTextColor="#48484A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={19}
                color="#8E8E93"
              />
            </TouchableOpacity>
          </View>
        </View>

        {canUseBiometrics && (
          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={loginWithBiometrics}
            activeOpacity={0.8}
          >
            <Ionicons name="finger-print" size={20} color="#10B981" />
            <Text style={styles.biometricBtnText}>Sign In with Face ID / Biometrics</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const valid = isStepValid();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top Ambient Glow Matching ss.mp4 */}
      <LinearGradient
        colors={["rgba(255, 30, 117, 0.25)", "rgba(255, 51, 102, 0.08)", "transparent"]}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          {/* Top Bar with Step Indicators */}
          <View style={styles.topBar}>
            {mode === "register" ? (
              <View style={styles.progressRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.progressDash,
                      s <= step ? styles.progressDashActive : styles.progressDashInactive,
                    ]}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.loginPill}>
                <Text style={styles.loginPillText}>SECURE LOGIN</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                setErrorMessage(null);
                setMode(mode === "login" ? "register" : "login");
                if (mode === "login") setStep(1);
              }}
              style={styles.modeSwitchBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.modeSwitchText}>
                {mode === "login" ? "Create Account" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Active Flow Content */}
          {mode === "register" ? renderRegisterContent() : renderLoginContent()}
        </View>

        {/* Bottom Docked Action Bar Matching ss.mp4 */}
        <View style={styles.bottomActionBar}>
          {mode === "register" && step > 1 && (
            <TouchableOpacity
              style={styles.goBackBtn}
              onPress={handlePrevStep}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.goBackBtnText}>Go Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              mode === "register" && step === 1 && { flex: 1 },
              mode === "login" && { flex: 1 },
              valid || mode === "login" || (step === 4 && bvn.length === 0)
                ? styles.primaryBtnActive
                : styles.primaryBtnDisabled,
            ]}
            onPress={mode === "login" ? handleLogin : handleNextStep}
            disabled={loading || (mode === "register" && !valid && !(step === 4 && bvn.length === 0))}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === "login"
                  ? "Sign In"
                  : step === 5
                  ? "Create Account"
                  : step === 4 && bvn.length === 0
                  ? "Skip for Now"
                  : "Continue"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bitnob BVN Date of Birth Modal Alert */}
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
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="calendar" size={26} color={Colors.primary} />
            </View>

            <Text style={styles.modalTitle}>Date of Birth Required</Text>
            <Text style={styles.modalDescription}>
              To immediately generate your dedicated Providus Bank account with your BVN, Bitnob requires your Date of Birth as registered with your bank.
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
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="YYYY-MM-DD (e.g. 1995-05-12)"
                  placeholderTextColor="#6B7280"
                  value={dobModalInput}
                  onChangeText={(t) => setDobModalInput(formatDobInput(t))}
                  keyboardType="number-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>
              <Text style={styles.modalHint}>Format: Year-Month-Day (e.g. 1995-05-12)</Text>
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
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  ambientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 14 : 20,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
  },
  contentWrap: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressDash: {
    height: 4,
    borderRadius: 2,
  },
  progressDashActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  progressDashInactive: {
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  loginPill: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loginPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 1,
  },
  modeSwitchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modeSwitchText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#FCA5A5",
  },
  stepContainer: {
    flex: 1,
  },
  loginBrandRow: {
    marginBottom: 16,
  },
  eyebrowText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  headlineText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 10,
  },
  subheadText: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    marginBottom: 28,
  },
  heroInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(255, 255, 255, 0.16)",
    paddingBottom: 12,
    marginTop: 20,
  },
  heroInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingVertical: 4,
  },
  charCounter: {
    fontSize: 13,
    fontWeight: "600",
    color: "#636366",
    marginLeft: 12,
  },
  dobContainer: {
    marginTop: 26,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dobLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dobLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dobBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dobInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(255, 30, 117, 0.4)",
  },
  dobTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  dobHelper: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 8,
    lineHeight: 15,
  },
  securityGroup: {
    width: "100%",
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E8E93",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pinHelperBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  securityInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  securityTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    height: "100%",
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
  },
  biometricBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10B981",
  },
  bottomActionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  goBackBtn: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  goBackBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  primaryBtn: {
    flex: 1.5,
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: "#1C1C1E",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#111116",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255, 30, 117, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  modalErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
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
    color: "#FCA5A5",
  },
  modalInputGroup: {
    width: "100%",
    marginBottom: 18,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E8E93",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 1,
  },
  modalHint: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 6,
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
    shadowOpacity: 0.35,
    shadowRadius: 8,
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
    color: "#8E8E93",
  },
});
