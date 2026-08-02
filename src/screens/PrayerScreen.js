import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Animated,
  StyleSheet, ActivityIndicator, Modal, FlatList, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMasjids, usePrayerTimes, useWeekJummah } from '../hooks/usePrayerData';
import { useSettings } from '../hooks/useSettings';
import MonthlyScheduleModal from '../components/MonthlyScheduleModal';
import {
  buildPrayerRows, formatCountdown, formatGregorian, offsetDate, formatTime,
} from '../utils/prayerUtils';

export default function PrayerScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMasjid, setSelectedMasjid] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [nowMins, setNowMins] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  const { settings } = useSettings();
  const { masjids, loading: masjidsLoading } = useMasjids();
  const { data: prayerRow, loading: timesLoading, error } = usePrayerTimes(
    selectedMasjid?.id, selectedDate
  );
  const { data: jummahRow } = useWeekJummah(selectedMasjid?.id);

  useEffect(() => {
    if (!selectedMasjid && masjids.length > 0) {
      const saved = settings.defaultMasjidId
        ? masjids.find((m) => m.id === settings.defaultMasjidId)
        : null;
      setSelectedMasjid(saved ?? masjids[0]);
    }
  }, [masjids, selectedMasjid, settings.defaultMasjidId]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowMins(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const { rows, activeIndex, nextIndex, countdownMins } = buildPrayerRows(prayerRow, nowMins);
  const nextPrayer = nextIndex !== -1 ? rows[nextIndex] : null;
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const loading = masjidsLoading || timesLoading;
  const shiftDate = useCallback((d) => setSelectedDate((prev) => offsetDate(prev, d)), []);

  const progressPercent = useMemo(() => {
    if (!isToday || nextIndex === -1 || activeIndex === -1) return 0;
    const start = rows[activeIndex]?.adhanMins ?? 0;
    const end = rows[nextIndex]?.adhanMins ?? 0;
    if (end <= start) return 0;
    return Math.min(1, Math.max(0, (nowMins - start) / (end - start)));
  }, [isToday, activeIndex, nextIndex, rows, nowMins]);

  const renderPrayerRow = (prayer, i) => {
    if (!prayer) return null;
    const isActive = i === activeIndex && isToday;
    const isNext = i === nextIndex && isToday;
    const isPast = isToday && activeIndex !== -1 && i < activeIndex;
    const extraIqamas = [prayer.iqama2, prayer.iqama3].filter(Boolean);

    return (
      <View
        key={prayer.name}
        style={[
          styles.prayerRow,
          isNext && styles.prayerRowNext,
          isActive && styles.prayerRowActive,
          isPast && styles.prayerRowPast,
        ]}
      >
        {isNext && <View style={styles.leftAccent} />}

        {/* Prayer name + NEXT badge */}
        <View style={styles.prayerRowLeft}>
          <View style={styles.prayerNameRow}>
            <Text style={[
              styles.prayerName,
              (isNext || isActive) && { color: colors.primary },
            ]}>
              {prayer.name.toUpperCase()}
            </Text>
            {isNext && (
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>NEXT</Text>
              </View>
            )}
          </View>
        </View>

        {/* Adhan + Iqama columns */}
        <View style={styles.timesRow}>
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>ADHAN</Text>
            <Text style={[styles.prayerTime, (isNext || isActive) && { color: colors.primary }]}>
              {prayer.adhan}
            </Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>IQAMA</Text>
            <Text style={styles.prayerTime}>
              {prayer.iqama}
              {extraIqamas.length > 0 ? `  · ${extraIqamas.join(' · ')}` : ''}
            </Text>
          </View>
        </View>

        {isActive && isToday && (
          <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerAppName}>JAM3AH</Text>
            <TouchableOpacity
              style={styles.headerMasjid}
              activeOpacity={0.7}
              onPress={() => setPickerOpen(true)}
            >
              <MaterialCommunityIcons name="mosque" size={14} color={colors.primary} />
              <Text style={styles.headerMasjidText} numberOfLines={1}>
                {selectedMasjid
                  ? selectedMasjid.masjid_name
                  : masjidsLoading ? 'Loading…' : 'Select Masjid'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.calendarBtn}
            activeOpacity={0.7}
            onPress={() => setCalendarOpen(true)}
          >
            <MaterialCommunityIcons name="calendar-today" size={19} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Next Prayer Hero ── */}
        <View style={styles.heroCard}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 24 }} />
          ) : (
            <>
              <Text style={styles.heroLabel}>
                {isToday && nextPrayer ? 'NEXT PRAYER' : 'PRAYER TIMES'}
              </Text>
              <View style={styles.heroBody}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroName}>
                    {isToday && nextPrayer ? nextPrayer.name : rows[0]?.name ?? ''}
                  </Text>
                  <Text style={styles.heroCountdown}>
                    {isToday && countdownMins !== null
                      ? `in ${formatCountdown(countdownMins)}`
                      : isToday ? 'All prayers done' : formatGregorian(selectedDate).split(',')[0]}
                  </Text>
                </View>
                <Text style={styles.heroTime}>
                  {isToday && nextPrayer ? nextPrayer.adhan : rows[0]?.adhan ?? '--:--'}
                </Text>
              </View>
              <View style={styles.heroProgressTrack}>
                <View style={[styles.heroProgressFill, { width: `${progressPercent * 100}%` }]} />
              </View>
            </>
          )}
        </View>

        {/* ── Date Navigation ── */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateNavBtn} onPress={() => shiftDate(-1)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-left" size={18} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dateWeekday}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </Text>
            <Text style={styles.dateGregorian}>
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={styles.dateHijri}>{hijriLabel(selectedDate)}</Text>
          </View>
          <TouchableOpacity style={styles.dateNavBtn} onPress={() => shiftDate(1)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* ── Prayer List ── */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : rows.length === 0 ? (
          <Text style={styles.emptyText}>No prayer times for this date</Text>
        ) : (
          <View style={styles.prayerList}>
            {rows.map((prayer, i) => renderPrayerRow(prayer, i))}
          </View>
        )}

        {/* ── Jummah ── */}
        {jummahRow && (jummahRow.jummah_1 || jummahRow.jummah_2 || jummahRow.jummah_3) && (
          <View style={styles.jummahCard}>
            <View style={styles.jummahLeftAccent} />
            <View style={styles.jummahHeader}>
              <MaterialCommunityIcons name="mosque" size={13} color={colors.primary} />
              <Text style={styles.jummahTitle}>JUMMAH</Text>
              <Text style={styles.jummahDate}>
                {new Date(jummahRow.date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.jummahTimes}>
              {[jummahRow.jummah_1, jummahRow.jummah_2, jummahRow.jummah_3]
                .filter(Boolean)
                .map((t, i) => (
                  <View key={i} style={styles.jummahSlot}>
                    <Text style={styles.jummahSlotLabel}>
                      {i === 0 ? '1ST' : i === 1 ? '2ND' : '3RD'}
                    </Text>
                    <Text style={styles.jummahSlotTime}>{formatTime(t)}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}


      </ScrollView>

      {/* Monthly schedule modal */}
      <MonthlyScheduleModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        masjidId={selectedMasjid?.id}
      />

      {/* Masjid picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.modalTitle}>SELECT MASJID</Text>
          <FlatList
            data={masjids}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  item.id === selectedMasjid?.id && styles.modalItemActive,
                ]}
                onPress={() => { setSelectedMasjid(item); setPickerOpen(false); }}
                activeOpacity={0.7}
              >
                {item.id === selectedMasjid?.id && (
                  <View style={styles.modalItemAccent} />
                )}
                <View style={styles.modalItemContent}>
                  <Text style={[
                    styles.modalItemText,
                    item.id === selectedMasjid?.id && { color: colors.primary },
                  ]}>
                    {item.masjid_name}
                  </Text>
                  {item.city ? (
                    <Text style={styles.modalItemSub}>
                      {item.city}{item.province ? `, ${item.province}` : ''}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>
    </View>
  );
}

function hijriLabel(date) {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(date);
  } catch { return ''; }
}

function createStyles(c) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    scroll: { paddingBottom: 120 },

    // ── Header ──
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    headerLeft: {
      gap: 4,
      flex: 1,
      marginRight: 12,
    },
    headerAppName: {
      fontFamily: 'Sora_700Bold',
      fontSize: 11,
      letterSpacing: 3,
      color: c.muted,
    },
    headerMasjid: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerMasjidText: {
      fontFamily: 'Sora_700Bold',
      fontSize: 16,
      color: c.onSurface,
      letterSpacing: -0.3,
      flexShrink: 1,
    },
    calendarBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 9999,
      backgroundColor: c.surface,
    },

    // ── Next Prayer Hero ──
    heroCard: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 18,
      overflow: 'hidden',
    },
    heroLabel: {
      fontFamily: 'Sora_700Bold',
      fontSize: 9,
      letterSpacing: 2.5,
      color: c.primary,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    heroBody: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingBottom: 18,
    },
    heroLeft: {
      gap: 4,
    },
    heroName: {
      fontFamily: 'Sora_700Bold',
      fontSize: 36,
      color: c.onSurface,
      letterSpacing: -0.8,
      lineHeight: 40,
    },
    heroCountdown: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: c.muted,
    },
    heroTime: {
      fontFamily: 'Sora_700Bold',
      fontSize: 44,
      color: c.primary,
      letterSpacing: -1.5,
      lineHeight: 48,
    },
    heroProgressTrack: {
      height: 3,
      backgroundColor: c.border,
      marginHorizontal: -20,
    },
    heroProgressFill: {
      height: 3,
      backgroundColor: c.primary,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },

    // ── Date Row ──
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dateNavBtn: {
      width: 40,
      height: 40,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateCenter: { alignItems: 'center', gap: 2 },
    dateWeekday: {
      fontFamily: 'Sora_700Bold',
      fontSize: 16,
      color: c.onSurface,
      letterSpacing: -0.3,
    },
    dateGregorian: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: c.muted,
      letterSpacing: 0.2,
    },
    dateHijri: {
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      color: c.primary,
      letterSpacing: 0.2,
    },

    // ── Prayer List ──
    prayerList: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 8,
    },
    prayerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      overflow: 'hidden',
      position: 'relative',
    },
    prayerRowNext: {
      borderColor: c.primary,
      paddingLeft: 22,
    },
    prayerRowActive: {
      backgroundColor: c.activeRowBg,
    },
    prayerRowPast: {
      opacity: 0.38,
    },
    leftAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: c.primary,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    },
    prayerRowLeft: {
      flex: 1,
    },
    prayerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    prayerName: {
      fontFamily: 'Sora_700Bold',
      fontSize: 11,
      letterSpacing: 1.4,
      color: c.muted,
    },
    timesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    timeCol: {
      alignItems: 'flex-end',
      gap: 2,
    },
    timeLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 8,
      letterSpacing: 1.2,
      color: c.muted,
      textTransform: 'uppercase',
    },
    timeDivider: {
      width: 1,
      height: 32,
      backgroundColor: c.border,
    },
    prayerTime: {
      fontFamily: 'Sora_700Bold',
      fontSize: 18,
      color: c.onSurface,
      letterSpacing: -0.5,
    },
    nextBadge: {
      backgroundColor: c.primary,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    nextBadgeText: {
      fontFamily: 'Sora_700Bold',
      fontSize: 8,
      letterSpacing: 1.2,
      color: c.bg,
    },
    pulseDot: {
      position: 'absolute',
      bottom: 10,
      right: 14,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.primary,
    },
    loadingContainer: {
      paddingVertical: 48,
      alignItems: 'center',
    },
    errorText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: c.error,
      margin: 20,
    },
    emptyText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: c.muted,
      margin: 20,
      textAlign: 'center',
    },

    // ── Jummah ──
    jummahCard: {
      marginHorizontal: 12,
      marginTop: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
      paddingLeft: 20,
      overflow: 'hidden',
      position: 'relative',
    },
    jummahLeftAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: c.primary,
    },
    jummahHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 14,
    },
    jummahTitle: {
      fontFamily: 'Sora_700Bold',
      fontSize: 10,
      letterSpacing: 1.4,
      color: c.primary,
      flex: 1,
    },
    jummahDate: {
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      color: c.muted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    jummahTimes: {
      flexDirection: 'row',
      gap: 10,
    },
    jummahSlot: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
    },
    jummahSlotLabel: {
      fontFamily: 'Sora_700Bold',
      fontSize: 8,
      letterSpacing: 1.2,
      color: c.muted,
      marginBottom: 4,
    },
    jummahSlotTime: {
      fontFamily: 'Sora_600SemiBold',
      fontSize: 13,
      color: c.onSurface,
    },

    // ── Modal ──
    modalOverlay: { flex: 1, backgroundColor: c.overlay },
    modalSheet: {
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '60%',
      paddingTop: 24,
      paddingHorizontal: 20,
    },
    modalTitle: {
      fontFamily: 'Sora_700Bold',
      fontSize: 11,
      letterSpacing: 1.8,
      color: c.muted,
      marginBottom: 16,
    },
    modalItem: {
      paddingVertical: 16,
      paddingLeft: 0,
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    modalItemActive: {
      paddingLeft: 12,
    },
    modalItemAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: c.primary,
    },
    modalItemContent: { flex: 1 },
    modalItemText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: c.onSurface,
    },
    modalItemSub: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: c.muted,
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    separator: { height: 1, backgroundColor: c.border },
  });
}
