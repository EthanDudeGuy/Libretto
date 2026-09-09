import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getAllPersonalities } from '../utils/AIPersonality';
import AppHeader from '../components/AppHeader';

export default function SettingsScreen({
  onNavigateHome,
  onNavigateSettings,
  onSelectBook,
}) {
  const { user, logout, getAIPersonality, setAIPersonality } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState('kind_queen');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = async () => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  };

  const loadSettings = async () => {
    try {
      const personality = await getAIPersonality();
      setSelectedPersonality(personality);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await setAIPersonality(selectedPersonality);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      console.log('Saving profile:', formData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      console.log('Changing password');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      console.log('Deleting account');
      await logout();
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted.'
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  const handlePersonalityChange = async personality => {
    setSelectedPersonality(personality);
    await saveSettings();
  };

  const initials = (formData.name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  return (
    <View style={styles.appContainer}>
      <AppHeader
        onSelectBook={onSelectBook}
        onNavigateHome={onNavigateHome}
        onNavigateSettings={onNavigateSettings}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile summary */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'U'}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>
              {formData.name || 'Your name'}
            </Text>
            <Text style={styles.profileEmail}>
              {formData.email || 'your@email.com'}
            </Text>
          </View>
          {!isEditing && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons
                name='pencil'
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name='person-circle-outline'
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Profile Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <View
              style={[
                styles.inputRow,
                !isEditing && styles.inputRowDisabled,
              ]}
            >
              <Ionicons
                name='person-outline'
                size={16}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={text =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
                placeholder='Enter your name'
                editable={isEditing}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View
              style={[
                styles.inputRow,
                !isEditing && styles.inputRowDisabled,
              ]}
            >
              <Ionicons
                name='mail-outline'
                size={16}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={text =>
                  setFormData(prev => ({ ...prev, email: text }))
                }
                placeholder='Enter your email'
                editable={isEditing}
                keyboardType='email-address'
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.textButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.textButtonLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Password */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name='shield-checkmark-outline'
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Password</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name='lock-closed-outline'
                size={16}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={formData.currentPassword}
                onChangeText={text =>
                  setFormData(prev => ({ ...prev, currentPassword: text }))
                }
                placeholder='Enter current password'
                secureTextEntry
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name='lock-closed-outline'
                size={16}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={formData.newPassword}
                onChangeText={text =>
                  setFormData(prev => ({ ...prev, newPassword: text }))
                }
                placeholder='Enter new password'
                secureTextEntry
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name='lock-closed-outline'
                size={16}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={text =>
                  setFormData(prev => ({ ...prev, confirmPassword: text }))
                }
                placeholder='Confirm new password'
                secureTextEntry
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, styles.fullWidthButton]}
            onPress={handleChangePassword}
          >
            <Text style={styles.primaryButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Personality */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name='sparkles-outline'
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Waddle's personality</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Choose how your AI literary companion interacts with you
          </Text>

          <View style={styles.personalityGrid}>
            {getAllPersonalities().map(personality => (
              <TouchableOpacity
                key={personality.id}
                style={[
                  styles.personalityOption,
                  selectedPersonality === personality.id &&
                    styles.personalitySelected,
                ]}
                onPress={() => handlePersonalityChange(personality.id)}
              >
                <View style={styles.personalityHeader}>
                  <Text style={styles.personalityEmoji}>
                    {personality.emoji}
                  </Text>
                  <Text
                    style={[
                      styles.personalityName,
                      selectedPersonality === personality.id &&
                        styles.personalityNameSelected,
                    ]}
                  >
                    {personality.name}
                  </Text>
                  {selectedPersonality === personality.id && (
                    <Ionicons
                      name='checkmark-circle'
                      size={18}
                      color={theme.colors.orange}
                      style={styles.personalityCheck}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.personalityDescription,
                    selectedPersonality === personality.id &&
                      styles.personalityDescriptionSelected,
                  ]}
                >
                  {personality.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name='warning-outline'
              size={18}
              color={theme.colors.danger}
            />
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>
              Danger Zone
            </Text>
          </View>
          <Text style={styles.sectionDescription}>
            Permanently delete your account and all of your data. This cannot
            be undone.
          </Text>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType='fade'
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete Account</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to permanently delete your account? This
              action cannot be undone and all your data will be lost.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 18,
  },
  // Profile summary card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.orangeMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: theme.colors.orangeLight,
    fontFamily: 'Inter_700Bold',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  // Sections
  section: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
    marginBottom: 16,
    fontFamily: 'Inter_500Medium',
  },
  // Inputs
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: 14,
  },
  inputRowDisabled: {
    opacity: 0.6,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    outlineStyle: 'none',
  },
  // Buttons
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
  },
  textButton: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  textButtonLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  primaryButton: {
    backgroundColor: theme.colors.orange,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  fullWidthButton: {
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  // Personality
  personalityGrid: {
    gap: 12,
  },
  personalityOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  personalitySelected: {
    borderColor: theme.colors.orange,
    backgroundColor: theme.colors.orangeMuted,
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  personalityEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  personalityName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  personalityNameSelected: {
    color: theme.colors.orangeLight,
  },
  personalityCheck: {
    marginLeft: 'auto',
  },
  personalityDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  personalityDescriptionSelected: {
    color: theme.colors.textPrimary,
  },
  // Danger zone
  dangerSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  dangerTitle: {
    color: theme.colors.danger,
  },
  dangerButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  dangerButtonText: {
    color: theme.colors.danger,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  confirmMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter_500Medium',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  confirmCancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff5252',
  },
  confirmDeleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
