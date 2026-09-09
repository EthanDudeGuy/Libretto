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

const { width } = Dimensions.get('window');

export default function RegisterScreen({ onNavigateToLogin }) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (
      !firstName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await register(
      firstName.trim(),
      email.trim(),
      password,
      confirmPassword
    );
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Registration Failed', result.error);
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
                <Text style={styles.welcomeTitle}>Join Libretto,</Text>
                <Text style={styles.welcomeSubtitle}>
                  Create your account to get started
                </Text>

                {/* First Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <View style={styles.inputBlur}>
                    <TextInput
                      style={styles.textInput}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder='Enter your first name'
                      placeholderTextColor='rgba(255, 255, 255, 0.44)'
                      autoCapitalize='words'
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputBlur}>
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder='Enter your email'
                      placeholderTextColor='rgba(255, 255, 255, 0.44)'
                      keyboardType='email-address'
                      autoCapitalize='none'
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputBlur}>
                    <TextInput
                      style={styles.textInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder='Create a password (min 6 characters)'
                      placeholderTextColor='rgba(255, 255, 255, 0.44)'
                      secureTextEntry
                      autoCapitalize='none'
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputBlur}>
                    <TextInput
                      style={styles.textInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder='Confirm your password'
                      placeholderTextColor='rgba(255, 255, 255, 0.44)'
                      secureTextEntry
                      autoCapitalize='none'
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Create Account Button */}
                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    isLoading && styles.registerButtonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  <Text style={styles.registerButtonText}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={onNavigateToLogin}>
                    <Text style={styles.loginLink}>Sign in</Text>
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
    backgroundColor: 'rgba(15, 20, 25, 0.4)',
  },
  // Glass Card
  glassCard: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0px 20px 30px rgba(0, 0, 0, 0.4)',
    elevation: 20,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(19, 26, 33, 0.8)',
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
  // Inputs
  inputContainer: {
    marginBottom: theme.spacing.x2_5,
  },
  inputLabel: {
    fontSize: theme.typography.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.x1_5,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  inputBlur: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  textInput: {
    paddingHorizontal: theme.spacing.x2,
    paddingVertical: theme.spacing.x1_5,
    fontSize: theme.typography.md,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
  },
  // Create Account Button
  registerButton: {
    backgroundColor: theme.colors.orange,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.x1_5,
    alignItems: 'center',
    marginTop: theme.spacing.x1,
  },
  registerButtonDisabled: {
    backgroundColor: theme.colors.accentMuted,
  },
  registerButtonText: {
    fontSize: theme.typography.md,
    color: '#fff',
    fontFamily: theme.typography.fontFamilySemibold,
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
  loginLink: {
    fontSize: theme.typography.sm,
    color: theme.colors.orange,
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
    color: theme.colors.orange,
    fontFamily: theme.typography.fontFamily,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: theme.typography.xs,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
});
