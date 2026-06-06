import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="book-open-variant" size={28} color="#38bdf8" />
      </View>
      <Text style={styles.title}>QURAN</Text>
      <Text style={styles.sub}>READER COMING SOON</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    backgroundColor: '#131313',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    color: '#ffffff',
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.4)',
  },
});
