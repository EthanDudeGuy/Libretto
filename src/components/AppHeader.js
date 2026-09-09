import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import theme from '../constants/theme';
import BookSpotlightSearch from './BookSpotlightSearch';
import { useAuth } from '../context/AuthContext';

function SettingsIcon({ color = theme.colors.textPrimary }) {
  return (
    <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
      <Path
        d='M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Path
        d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.6.85 1.01 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
}

function LogoutIcon({ color = theme.colors.danger }) {
  return (
    <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
      <Path
        d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Path
        d='M16 17l5-5-5-5M21 12H9'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
}

function DuckIcon({ color = theme.colors.textPrimary, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
      {/* Body */}
      <Path
        d='M4.5 15.2c0 3 2.8 5.3 7 5.3 4.1 0 7.2-2.1 7.2-5.1 0-2.6-1.8-4.3-4.6-5.1'
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      {/* Head */}
      <Path
        d='M14.1 10.3c.1-2.6 1.9-4.3 4.2-4.3'
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      {/* Beak */}
      <Path
        d='M18.3 6c1.5.1 2.7.8 3.2 1.7-1.1.5-2.2.7-3.3.6'
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      {/* Eye */}
      <Path
        d='M16.6 7.2h.01'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
      />
      {/* Wing */}
      <Path
        d='M8 14.2c1.6-.2 3.1.2 4.2 1.1'
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
}

export default function AppHeader({
  onSelectBook,
  onNavigateHome,
  onNavigateSettings,
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
  };

  const handleSettings = () => {
    setShowUserDropdown(false);
    onNavigateSettings?.();
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={onNavigateHome}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode='contain'
            />
            <Text style={styles.title}>Libretto</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <BookSpotlightSearch onSelectBook={onSelectBook} />
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.userIconButton}
              onPress={() => setShowUserDropdown(prev => !prev)}
            >
              <DuckIcon />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showUserDropdown && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setShowUserDropdown(false)}
          />
          <View style={styles.userDropdown}>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={handleSettings}
              activeOpacity={0.65}
            >
              <View style={styles.dropdownIconWell}>
                <SettingsIcon />
              </View>
              <Text style={styles.dropdownOptionText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={handleLogout}
              activeOpacity={0.65}
            >
              <View style={styles.dropdownIconWell}>
                <LogoutIcon />
              </View>
              <Text style={[styles.dropdownOptionText, styles.logoutText]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
    zIndex: 10,
    overflow: 'visible',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    minHeight: 40,
    gap: 16,
    overflow: 'visible',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    width: 130,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'stretch',
    zIndex: 20,
    overflow: 'visible',
  },
  headerRight: {
    flexShrink: 0,
    width: 130,
    alignItems: 'flex-end',
  },
  logo: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  userIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  userDropdown: {
    position: 'absolute',
    top: 52,
    right: 18,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 168,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  dropdownIconWell: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 3,
    marginHorizontal: 8,
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.1,
  },
  logoutText: {
    color: theme.colors.danger,
  },
});
