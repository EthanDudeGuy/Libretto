import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');
const isWide = width >= 900;

// Soft, desaturated accents used only as small icon-chip highlights — kept
// muted so they read as calm variety against the dark UI, not new brand colors.
const ACCENTS = {
  sky: { fg: '#7dd3fc', bg: 'rgba(125, 211, 252, 0.12)', border: 'rgba(125, 211, 252, 0.28)' },
  lavender: { fg: '#c4b5fd', bg: 'rgba(196, 181, 253, 0.12)', border: 'rgba(196, 181, 253, 0.28)' },
  sage: { fg: '#86efac', bg: 'rgba(134, 239, 172, 0.12)', border: 'rgba(134, 239, 172, 0.28)' },
  rose: { fg: '#fda4af', bg: 'rgba(253, 164, 175, 0.12)', border: 'rgba(253, 164, 175, 0.28)' },
};

const FEATURES = [
  {
    icon: 'chatbubble-ellipses',
    accent: ACCENTS.sky,
    title: 'Talk to your book',
    description:
      'Ask questions, untangle plot threads, and think out loud with an AI that actually knows what you\'ve read — never spoiling what you haven\'t.',
  },
  {
    icon: 'bulb',
    accent: ACCENTS.lavender,
    title: 'Understand more, forget less',
    description:
      'Get context on characters, themes, and callbacks the moment you need it, so nothing slips through the cracks between chapters.',
  },
  {
    icon: 'git-network',
    accent: ACCENTS.sage,
    title: 'See the connections',
    description:
      'Surface the links between ideas, characters, and chapters that are easy to miss on a single read-through.',
  },
  {
    icon: 'library',
    accent: ACCENTS.rose,
    title: 'One shelf, every book',
    description:
      'Track what you\'re reading, pick up right where you left off, and keep every conversation attached to the book it came from.',
  },
];

export default function LandingScreen({ onGetStarted, onLogin }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.brandLogo}
                resizeMode='contain'
              />
              <Text style={styles.brandName}>Libretto</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onLogin} style={styles.headerLoginLink}>
                <Text style={styles.headerLoginText}>Log in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onGetStarted}
                style={styles.headerCtaButton}
              >
                <Text style={styles.headerCtaText}>Get started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Read deeper.{'\n'}
            Understand{' '}
            <Text style={styles.heroTitleAccent}>every book.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Libretto helps you turn everything you read into a conversation —
            so you understand it, remember it, and connect with it in a way
            reading alone never could.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onGetStarted}
            >
              <Text style={styles.primaryButtonText}>Get started free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onLogin}>
              <Text style={styles.secondaryButtonText}>I have an account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview card */}
        <View style={styles.previewWrapper}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeaderRow}>
              <View style={styles.previewDot} />
              <View style={[styles.previewDot, styles.previewDotMuted]} />
              <View style={[styles.previewDot, styles.previewDotMuted]} />
              <Text style={styles.previewHeaderText}>
                Chatting about Dune
              </Text>
            </View>
            <View style={styles.previewBubbleRow}>
              <View style={styles.previewBubbleUser}>
                <Text style={styles.previewBubbleUserText}>
                  Why doesn't Paul trust the Baron yet?
                </Text>
              </View>
            </View>
            <View style={styles.previewBubbleRow}>
              <View style={styles.previewBubbleAI}>
                <Text style={styles.previewBubbleAIText}>
                  Up to where you've read, Paul's only seen the Baron through
                  House Atreides' warnings — nothing spoiler-y yet, just
                  well-founded suspicion of House Harkonnen...
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <LinearGradient
            colors={['rgba(125, 211, 252, 0.05)', 'transparent']}
            style={styles.featuresWash}
            pointerEvents='none'
          />
          <Text style={styles.sectionTitle}>
            A new way to experience books
          </Text>
          <Text style={styles.sectionSubtitle}>
            Not another tracker. Libretto is built for actually engaging with
            what you read.
          </Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map(feature => (
              <View key={feature.title} style={styles.featureCard}>
                <View
                  style={[
                    styles.featureIconChip,
                    {
                      backgroundColor: feature.accent.bg,
                      borderColor: feature.accent.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={22}
                    color={feature.accent.fg}
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Final CTA */}
        <View style={styles.finalCta}>
          <Text style={styles.finalCtaTitle}>
            Your next book is waiting.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onGetStarted}
          >
            <Text style={styles.primaryButtonText}>Join Libretto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Libretto
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.x6,
  },
  // Header
  headerWrapper: {
    paddingHorizontal: theme.spacing.x2,
    paddingTop: theme.spacing.x3,
    paddingBottom: theme.spacing.x2,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.x2_5,
    paddingVertical: theme.spacing.x1_5,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.25)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.x1,
  },
  brandLogo: {
    width: 32,
    height: 32,
  },
  brandName: {
    fontSize: theme.typography.lg,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilyBold,
    marginLeft: theme.spacing.x1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.x2,
  },
  headerLoginLink: {
    paddingVertical: theme.spacing.x0_5,
    paddingHorizontal: theme.spacing.x1,
  },
  headerLoginText: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  headerCtaButton: {
    backgroundColor: theme.colors.textPrimary,
    paddingVertical: theme.spacing.x1,
    paddingHorizontal: theme.spacing.x2_5,
    borderRadius: theme.radii.pill,
  },
  headerCtaText: {
    fontSize: theme.typography.sm,
    color: theme.colors.textInverse,
    fontFamily: theme.typography.fontFamilySemibold,
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.x3,
    paddingTop: theme.spacing.x5,
    paddingBottom: theme.spacing.x4,
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  heroTitle: {
    fontSize: isWide ? 56 : theme.typography.h1,
    lineHeight: isWide ? 62 : 40,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilyBold,
    textAlign: 'center',
    marginBottom: theme.spacing.x2_5,
  },
  heroTitleAccent: {
    color: theme.colors.textPrimary,
    textDecorationLine: 'underline',
    textDecorationColor: theme.colors.orange,
    textDecorationStyle: 'solid',
  },
  heroSubtitle: {
    fontSize: theme.typography.md,
    lineHeight: theme.typography.lineRelaxed,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
    maxWidth: 560,
    marginBottom: theme.spacing.x4,
  },
  heroActions: {
    flexDirection: isWide ? 'row' : 'column',
    gap: theme.spacing.x1_5,
    width: isWide ? undefined : '100%',
  },
  primaryButton: {
    backgroundColor: theme.colors.orange,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.x1_5,
    paddingHorizontal: theme.spacing.x4,
    alignItems: 'center',
    boxShadow: '0px 8px 20px rgba(254, 138, 31, 0.35)',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: theme.typography.md,
    fontFamily: theme.typography.fontFamilySemibold,
  },
  secondaryButton: {
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.x1_5,
    paddingHorizontal: theme.spacing.x4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.md,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  // Preview card
  previewWrapper: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.x3,
    marginBottom: theme.spacing.x6,
  },
  previewCard: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.x3,
    boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.35)',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.x2_5,
    gap: theme.spacing.x0_5,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.orange,
  },
  previewDotMuted: {
    backgroundColor: theme.colors.borderStrong,
  },
  previewHeaderText: {
    marginLeft: theme.spacing.x1_5,
    fontSize: theme.typography.sm,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  previewBubbleRow: {
    marginBottom: theme.spacing.x1_5,
  },
  previewBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.orange,
    borderRadius: theme.radii.lg,
    borderBottomRightRadius: theme.radii.sm,
    paddingVertical: theme.spacing.x1_5,
    paddingHorizontal: theme.spacing.x2,
    maxWidth: '80%',
  },
  previewBubbleUserText: {
    color: '#fff',
    fontSize: theme.typography.sm,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  previewBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    borderBottomLeftRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.x1_5,
    paddingHorizontal: theme.spacing.x2,
    maxWidth: '90%',
  },
  previewBubbleAIText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sm,
    lineHeight: theme.typography.lineBase,
    fontFamily: theme.typography.fontFamily,
  },
  // Features
  featuresSection: {
    position: 'relative',
    paddingHorizontal: theme.spacing.x3,
    paddingTop: theme.spacing.x4,
    alignItems: 'center',
    marginBottom: theme.spacing.x5,
  },
  featuresWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
  },
  sectionTitle: {
    fontSize: theme.typography.xl,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilyBold,
    textAlign: 'center',
    marginBottom: theme.spacing.x1,
  },
  sectionSubtitle: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.x4,
    maxWidth: 520,
  },
  featuresGrid: {
    flexDirection: isWide ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.x2,
    maxWidth: 1000,
    width: '100%',
  },
  featureCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.x2_5,
    width: isWide ? 460 : '100%',
  },
  featureIconChip: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.x1_5,
  },
  featureTitle: {
    fontSize: theme.typography.lg,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilySemibold,
    marginBottom: theme.spacing.x1,
  },
  featureDescription: {
    fontSize: theme.typography.sm,
    lineHeight: theme.typography.lineBase,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  // Final CTA
  finalCta: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.x3,
    paddingVertical: theme.spacing.x5,
    marginHorizontal: theme.spacing.x3,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderGlass,
    maxWidth: 700,
    alignSelf: 'center',
    width: '90%',
  },
  finalCtaTitle: {
    fontSize: theme.typography.xl,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilyBold,
    marginBottom: theme.spacing.x2_5,
    textAlign: 'center',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: theme.spacing.x4,
  },
  footerText: {
    fontSize: theme.typography.xs,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
  },
});
