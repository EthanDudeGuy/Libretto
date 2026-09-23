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
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
