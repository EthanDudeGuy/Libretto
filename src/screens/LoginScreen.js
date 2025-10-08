import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import theme from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ onNavigateToRegister }) {
  const [email, setEmail] = useState('demo@libretto.com');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    const result = await login(email.trim(), 'demo123'); // Using demo password
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={require('../../assets/loginwallpaper.png')}
        style={styles.backgroundImage}
        resizeMode='cover'
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Dark overlay for better text readability */}
          <View style={styles.overlay} />

          {/* Glass Card */}
          <View style={styles.glassCard}>
            <View style={styles.blurContainer}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.15)',
                  'rgba(255, 255, 255, 0.08)',
                ]}
                style={styles.glassGradient}
              >
                {/* Logo */}
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode='contain'
                  />
                </View>

                {/* Welcome Text */}
                <Text style={styles.welcomeTitle}>Welcome,</Text>
                <Text style={styles.welcomeSubtitle}>Login to Libretto</Text>

                {/* Email Input */}
                <View style={styles.emailContainer}>
                  <Text style={styles.emailLabel}>Email</Text>
                  <View style={styles.emailInputRow}>
                    <View style={styles.emailInputBlur}>
                      <TextInput
                        style={styles.emailInput}
                        value={email}
                        onChangeText={setEmail}
                        placeholder='Enter your email'
                        placeholderTextColor='rgba(255, 255, 255, 0.44)'
                        keyboardType='email-address'
                        autoCapitalize='none'
                        autoCorrect={false}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.arrowButton}
                      onPress={handleLogin}
                      disabled={isLoading}
                    >
                      <Text style={styles.arrowIcon}>→</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me */}
                <View style={styles.rememberMeContainer}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxChecked,
                      ]}
                    >
                      {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.rememberMeText}>Remember me</Text>
                  </TouchableOpacity>
                </View>

                {/* Demo Info */}
                <View style={styles.demoInfo}>
                  <Text style={styles.demoTitle}>Demo Account</Text>
                  <Text style={styles.demoText}>Email: demo@libretto.com</Text>
                  <Text style={styles.demoText}>Password: demo123</Text>
                  <Text style={styles.demoNote}>
                    Click the arrow button to login
                  </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={onNavigateToRegister}>
                    <Text style={styles.createAccountLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>

                {/* Terms and Privacy Links */}
                <View style={styles.legalLinks}>
                  <TouchableOpacity onPress={() => {/* Handle Terms of Service */}}>
                    <Text style={styles.legalLink}>Terms of Service</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalSeparator}> • </Text>
                  <TouchableOpacity onPress={() => {/* Handle Privacy Policy */}}>
                    <Text style={styles.legalLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.x2_5,
    paddingVertical: theme.spacing.x5,
  },
  // Dark overlay for better text readability
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 20, 25, 0.4)', // Semi-transparent dark overlay
  },
  // Glass Card
  glassCard: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(19, 26, 33, 0.8)', // More transparent to show background
  },
  glassGradient: {
    padding: theme.spacing.x4,
    paddingTop: theme.spacing.x5,
  },
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.x4,
  },
  logo: {
    width: 80,
    height: 80,
  },
  // Welcome Text
  welcomeTitle: {
    fontSize: theme.typography.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.x1,
    fontFamily: theme.typography.fontFamilyBold,
  },
  welcomeSubtitle: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.x4,
    fontFamily: theme.typography.fontFamily,
  },
  // Email Input
  emailContainer: {
    marginBottom: theme.spacing.x2_5,
  },
  emailLabel: {
    fontSize: theme.typography.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.x1_5,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.x1_5,
  },
  emailInputBlur: {
    flex: 1,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  emailInput: {
    paddingHorizontal: theme.spacing.x2,
    paddingVertical: theme.spacing.x1_5,
    fontSize: theme.typography.md,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  arrowIcon: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  // Remember Me
  rememberMeContainer: {
    marginBottom: theme.spacing.x3,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    marginRight: theme.spacing.x1_5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  checkmark: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  // Separator
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.x3,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
  },
  separatorText: {
    marginHorizontal: theme.spacing.x2,
    fontSize: theme.typography.sm,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
  // Demo Info
  demoInfo: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    padding: theme.spacing.x2,
    marginBottom: theme.spacing.x3,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  demoTitle: {
    fontSize: theme.typography.sm,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.x1,
    fontFamily: theme.typography.fontFamilySemibold,
  },
  demoText: {
    fontSize: theme.typography.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 2,
  },
  demoNote: {
    fontSize: theme.typography.xs,
    color: theme.colors.blue,
    fontFamily: theme.typography.fontFamily,
    fontStyle: 'italic',
    marginTop: theme.spacing.x1,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.x3,
  },
  footerText: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  createAccountLink: {
    fontSize: theme.typography.sm,
    color: theme.colors.blue,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamilySemibold,
  },
  // Legal Links
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.x2,
  },
  legalLink: {
    fontSize: theme.typography.xs,
    color: theme.colors.blue,
    fontFamily: theme.typography.fontFamily,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: theme.typography.xs,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
});
