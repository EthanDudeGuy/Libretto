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
  Animated,
} from 'react-native';
import theme from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllPersonalities } from '../utils/AIPersonality';

export default function SettingsScreen({ onClose }) {
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
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Load user data and settings
    loadUserData();
    loadSettings();
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
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
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement profile update API call
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
      // TODO: Implement password change API call
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
      // TODO: Implement account deletion API call
      console.log('Deleting account');
      await logout();
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  const handlePersonalityChange = async (personality) => {
    setSelectedPersonality(personality);
    await saveSettings();
  };

  const renderProfileSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Profile Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your name"
          editable={isEditing}
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          editable={isEditing}
          keyboardType="email-address"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.buttonGroup}>
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderAccountSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Management</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current Password</Text>
        <TextInput
          style={styles.input}
          value={formData.currentPassword}
          onChangeText={(text) => setFormData(prev => ({ ...prev, currentPassword: text }))}
          placeholder="Enter current password"
          secureTextEntry
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>New Password</Text>
        <TextInput
          style={styles.input}
          value={formData.newPassword}
          onChangeText={(text) => setFormData(prev => ({ ...prev, newPassword: text }))}
          placeholder="Enter new password"
          secureTextEntry
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
          placeholder="Confirm new password"
          secureTextEntry
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={handleChangePassword}
      >
        <Text style={styles.changePasswordButtonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteAccountButton}
        onPress={() => setShowDeleteConfirm(true)}
      >
        <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAISection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Waddle's personality</Text>
      <Text style={styles.sectionDescription}>
        Choose how your AI literary companion interacts with you
      </Text>
      
      {getAllPersonalities().map((personality) => (
        <TouchableOpacity
          key={personality.id}
          style={[
            styles.personalityOption,
            selectedPersonality === personality.id && styles.personalitySelected,
          ]}
          onPress={() => handlePersonalityChange(personality.id)}
        >
          <View style={styles.personalityHeader}>
            <Text style={styles.personalityEmoji}>{personality.emoji}</Text>
            <Text style={[
              styles.personalityName,
              selectedPersonality === personality.id && styles.personalityNameSelected,
            ]}>
              {personality.name}
            </Text>
          </View>
          <Text style={[
            styles.personalityDescription,
            selectedPersonality === personality.id && styles.personalityDescriptionSelected,
          ]}>
            {personality.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDeleteConfirmation = () => (
    <Modal
      visible={showDeleteConfirm}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteConfirm(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <Text style={styles.confirmTitle}>Delete Account</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.
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
              <Text style={styles.confirmDeleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.fullScreenOverlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Settings</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {renderProfileSection()}
              {renderAccountSection()}
              {renderAISection()}
            </ScrollView>

            {renderDeleteConfirmation()}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  section: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    fontFamily: 'Inter_700Bold',
  },
  sectionDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    fontFamily: 'Inter_500Medium',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    fontFamily: 'Inter_500Medium',
  },
  buttonGroup: {
    marginTop: 10,
  },
  editButton: {
    backgroundColor: theme.colors.orange,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.orange,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  changePasswordButton: {
    backgroundColor: theme.colors.orange,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  changePasswordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  deleteAccountButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff5252',
  },
  deleteAccountButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  personalityOption: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personalitySelected: {
    borderColor: theme.colors.orange,
    backgroundColor: theme.colors.orangeMuted,
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personalityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  personalityName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  personalityNameSelected: {
    color: theme.colors.orange,
  },
  personalityDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  personalityDescriptionSelected: {
    color: theme.colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
