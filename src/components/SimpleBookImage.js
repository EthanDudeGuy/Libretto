import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import theme from '../constants/theme';

export default function SimpleBookImage({ book }) {
  return (
    <View style={styles.container}>
      <View style={styles.bookImage}>
        {book.thumbnail ? (
          <Image
            source={{ uri: book.thumbnail }}
            style={styles.bookThumbnail}
            resizeMode='cover'
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            {/* Placeholder for books without thumbnails */}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginHorizontal: 2,
  },
  bookImage: {
    width: 140,
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: theme.colors.surface,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.35)',
    elevation: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
