import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import theme from '../constants/theme';

function QuestionCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.bookTag}>
        <Text style={styles.bookTagText} numberOfLines={1}>
          {item.bookTitle}
        </Text>
      </View>
      <Text style={styles.question} numberOfLines={2}>
        {item.question}
      </Text>
      <Text style={styles.answer} numberOfLines={3}>
        {item.answer || 'Waiting for a reply…'}
      </Text>
    </View>
  );
}

export default function RecentQuestionsPanel({ questions = [] }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Recent Questions</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {questions.length === 0 ? (
          <Text style={styles.emptyHint}>
            No questions yet — ask something while reading!
          </Text>
        ) : (
          questions.map(item => <QuestionCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    overflow: 'hidden',
  },
  panelTitle: {
    fontSize: theme.typography.lg,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: theme.spacing.x2_5,
    paddingTop: theme.spacing.x2_5,
    paddingBottom: theme.spacing.x1_5,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.blueMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.x2,
    gap: theme.spacing.x1_5,
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.blue,
    padding: theme.spacing.x1_5,
    gap: 6,
  },
  bookTag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.blueMuted,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  bookTagText: {
    color: theme.colors.blueLight,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  question: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sm,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: theme.typography.lineTight,
  },
  answer: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.xs,
    fontFamily: 'Inter_400Regular',
    lineHeight: theme.typography.lineTight,
  },
  emptyHint: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
