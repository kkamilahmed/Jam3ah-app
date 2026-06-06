import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, Pressable, ScrollView,
} from 'react-native';
import LeafletMap from '../components/LeafletMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useEvents } from '../hooks/usePrayerData';

const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatEventDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.toLocaleDateString('en-US', { weekday: 'long' });
  return `${day}, ${MONTH_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [view, setView] = useState('list');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { events, loading, error } = useEvents();

  const renderEventCard = useCallback(({ item }) => {
    const date = item.date ? new Date(item.date + 'T00:00:00') : null;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.72}
        onPress={() => setSelectedEvent(item)}
      >
        {/* Left date block */}
        <View style={styles.dateBadge}>
          {date ? (
            <>
              <Text style={styles.badgeDay}>{date.getDate()}</Text>
              <Text style={styles.badgeMonth}>{MONTH_SHORT[date.getMonth()]}</Text>
            </>
          ) : (
            <MaterialCommunityIcons name="calendar-blank" size={22} color={colors.primary} />
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            {item.time ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={colors.muted} />
                <Text style={styles.metaText}>{item.time}</Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
              </View>
            ) : null}
          </View>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.border} style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  }, [styles, colors]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerApp}>JAM3AH</Text>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
            onPress={() => setView('list')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={17}
              color={view === 'list' ? colors.primary : colors.muted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
            onPress={() => setView('map')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="map-outline"
              size={17}
              color={view === 'map' ? colors.primary : colors.muted}
            />
          </TouchableOpacity>
        </View>
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
      ) : view === 'list' ? (
        events.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySubtitle}>Check back soon for masjid events</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(e) => String(e.id)}
            renderItem={renderEventCard}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )
      ) : (
        <View style={styles.mapContainer}>
          <LeafletMap
            events={[]}
            coords={{}}
            onMarkerPress={setSelectedEvent}
          />
        </View>
      )}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedEvent(null)}
        >
          <Pressable style={styles.overlay} onPress={() => setSelectedEvent(null)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                {selectedEvent.date && (
                  <Text style={styles.sheetDate}>
                    {formatEventDate(selectedEvent.date)}
                  </Text>
                )}
                <Text style={styles.sheetTitle}>{selectedEvent.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedEvent(null)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetDivider} />

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {selectedEvent.time ? (
                <View style={styles.sheetMetaRow}>
                  <View style={styles.sheetMetaIcon}>
                    <MaterialCommunityIcons name="clock-outline" size={15} color={colors.primary} />
                  </View>
                  <Text style={styles.sheetMeta}>{selectedEvent.time}</Text>
                </View>
              ) : null}
              {selectedEvent.location ? (
                <View style={styles.sheetMetaRow}>
                  <View style={styles.sheetMetaIcon}>
                    <MaterialCommunityIcons name="map-marker-outline" size={15} color={colors.primary} />
                  </View>
                  <Text style={styles.sheetMeta}>{selectedEvent.location}</Text>
                </View>
              ) : null}
              {selectedEvent.description ? (
                <Text style={styles.sheetDesc}>{selectedEvent.description}</Text>
              ) : null}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },

    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },
    headerLeft: { gap: 4 },
    headerApp: {
      fontFamily: 'Sora_700Bold',
      fontSize: 11,
      letterSpacing: 3,
      color: c.muted,
    },
    headerTitle: {
      fontFamily: 'Sora_700Bold',
      fontSize: 28,
      color: c.onSurface,
      letterSpacing: -0.5,
    },

    viewToggle: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      paddingBottom: 4,
    },
    toggleBtn: {
      width: 38,
      height: 38,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleBtnActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryBg,
    },

    list: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 120,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      overflow: 'hidden',
    },
    dateBadge: {
      width: 62,
      backgroundColor: c.primaryBg,
      borderRightWidth: 1,
      borderRightColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      gap: 2,
    },
    badgeDay: {
      fontFamily: 'Sora_700Bold',
      fontSize: 22,
      color: c.primary,
      lineHeight: 24,
    },
    badgeMonth: {
      fontFamily: 'Inter_500Medium',
      fontSize: 9,
      letterSpacing: 1,
      color: c.primary,
    },
    cardContent: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 6,
    },
    cardTitle: {
      fontFamily: 'Sora_600SemiBold',
      fontSize: 15,
      color: c.onSurface,
      lineHeight: 21,
    },
    cardMeta: { gap: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: c.muted,
      flexShrink: 1,
    },
    cardDesc: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: c.onSurfaceDim,
      lineHeight: 18,
    },

    mapContainer: { flex: 1, overflow: 'hidden' },

    overlay: { flex: 1, backgroundColor: c.overlay },
    sheet: {
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '70%',
      paddingTop: 12,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 12,
    },
    sheetHeaderLeft: { flex: 1, gap: 4 },
    sheetDate: {
      fontFamily: 'Inter_500Medium',
      fontSize: 11,
      letterSpacing: 0.5,
      color: c.primary,
    },
    sheetTitle: {
      fontFamily: 'Sora_700Bold',
      fontSize: 20,
      color: c.onSurface,
      lineHeight: 26,
      letterSpacing: -0.3,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    sheetDivider: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: 20,
      marginBottom: 16,
    },
    sheetBody: {
      paddingHorizontal: 20,
    },
    sheetMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    sheetMetaIcon: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor: c.primaryBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetMeta: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: c.onSurfaceVariant,
      flex: 1,
    },
    sheetDesc: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: c.onSurfaceDim,
      lineHeight: 22,
      marginTop: 4,
    },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: c.primaryBg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    emptyTitle: {
      fontFamily: 'Sora_600SemiBold',
      fontSize: 16,
      color: c.onSurface,
      letterSpacing: -0.2,
    },
    emptySubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: c.muted,
    },
    errorText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: c.error,
    },
  });
}
