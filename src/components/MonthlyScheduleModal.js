import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, FlatList,
  TouchableOpacity, StyleSheet, ActivityIndicator, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMonthlyPrayerTimes } from '../hooks/usePrayerData';
import { formatTime } from '../utils/prayerUtils';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const TODAY = new Date().toISOString().slice(0, 10);

const PRAYERS = [
  { key: 'fajr',    label: 'Fajr',    adhan: 'fajr_adhan',    iqama: 'fajr_iqama'    },
  { key: 'dhuhr',   label: 'Dhuhr',   adhan: 'dhuhr_adhan',   iqama: 'dhuhr_iqama'   },
  { key: 'asr',     label: 'Asr',     adhan: 'asr_adhan',     iqama: 'asr_iqama'     },
  { key: 'maghrib', label: 'Maghrib', adhan: 'maghrib_adhan', iqama: 'maghrib_iqama' },
  { key: 'isha',    label: 'Isha',    adhan: 'isha_adhan',    iqama: 'isha_iqama'    },
];

export default function MonthlyScheduleModal({ visible, onClose, masjidId }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const { data, loading, error } = useMonthlyPrayerTimes(masjidId, viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="chevron-left" size={22} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTHS[viewMonth - 1]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Prayer column headers ── */}
        <View style={styles.colHeader}>
          <View style={styles.dateCol} />
          {PRAYERS.map(p => (
            <View key={p.key} style={styles.colHeaderCell}>
              <Text style={styles.colHeaderText}>{p.label}</Text>
              <Text style={styles.colHeaderSub}>Iqama</Text>
            </View>
          ))}
        </View>

        {/* ── Body ── */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={44} color={colors.border} />
            <Text style={styles.emptyText}>No times for this month</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.date}
            renderItem={({ item }) => <DayRow item={item} styles={styles} colors={colors} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

function DayRow({ item, styles, colors }) {
  const date = new Date(item.date + 'T00:00:00');
  const isToday = item.date === TODAY;
  const isFriday = date.getDay() === 5;
  const dayNum = date.getDate();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <View style={[
      styles.row,
      isToday && styles.rowToday,
      isFriday && !isToday && styles.rowFriday,
    ]}>
      {isToday && <View style={styles.rowAccent} />}
      <View style={styles.dateCol}>
        <Text style={[styles.dayNum, isToday && { color: colors.primary }]}>{dayNum}</Text>
        <Text style={[styles.dayName, isFriday && { color: colors.primary }]}>{dayName}</Text>
      </View>
      {PRAYERS.map(p => (
        <View key={p.key} style={styles.prayerCell}>
          <Text style={[styles.prayerAdhan, isToday && { color: colors.primary }]}>
            {formatTime(item[p.adhan])}
          </Text>
          <Text style={styles.prayerIqama}>
            {formatTime(item[p.iqama])}
          </Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthTitle: {
      fontFamily: 'Sora_700Bold',
      fontSize: 16,
      color: c.onSurface,
      letterSpacing: -0.3,
      minWidth: 150,
      textAlign: 'center',
    },

    colHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    dateCol: { width: 44 },
    colHeaderCell: {
      flex: 1,
      alignItems: 'center',
      gap: 1,
    },
    colHeaderText: {
      fontFamily: 'Sora_700Bold',
      fontSize: 9,
      letterSpacing: 0.5,
      color: c.onSurfaceVariant,
      textAlign: 'center',
    },
    colHeaderSub: {
      fontFamily: 'Inter_400Regular',
      fontSize: 8,
      color: c.muted,
      textAlign: 'center',
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      position: 'relative',
      overflow: 'hidden',
    },
    rowToday: {
      backgroundColor: c.activeRowBg,
    },
    rowFriday: {
      backgroundColor: 'rgba(56,189,248,0.03)',
    },
    rowAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: c.primary,
    },
    dayNum: {
      fontFamily: 'Sora_700Bold',
      fontSize: 15,
      color: c.onSurface,
      lineHeight: 18,
    },
    dayName: {
      fontFamily: 'Inter_400Regular',
      fontSize: 9,
      letterSpacing: 0.5,
      color: c.muted,
      marginTop: 1,
    },
    prayerCell: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    prayerAdhan: {
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
      color: c.onSurface,
      textAlign: 'center',
    },
    prayerIqama: {
      fontFamily: 'Inter_400Regular',
      fontSize: 9,
      color: c.muted,
      textAlign: 'center',
    },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: c.muted },
    errorText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: c.error },
  });
}
