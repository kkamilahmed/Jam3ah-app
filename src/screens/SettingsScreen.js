import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  StyleSheet, Modal, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../hooks/useSettings';
import { useMasjids } from '../hooks/usePrayerData';

const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 30];

async function requestPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggle } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, loading, setNotif, setDefaultMasjid } = useSettings();
  const { masjids, loading: masjidsLoading } = useMasjids();
  const [masjidPickerOpen, setMasjidPickerOpen] = useState(false);

  const selectedMasjid = masjids.find((m) => m.id === settings.defaultMasjidId);

  async function handleToggle(type, value) {
    if (value) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setNotif(type, 'enabled', value);
  }

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerApp}>JAM3AH</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── General ── */}
        <Text style={styles.sectionLabel}>General</Text>
        <View style={styles.group}>

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons
                name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
                size={18} color={colors.primary}
              />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
              <Text style={styles.rowSub}>App appearance</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={colors.primary}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setMasjidPickerOpen(true)}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="mosque" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Default masjid</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {masjidsLoading ? 'Loading…' : selectedMasjid?.masjid_name ?? 'Not set'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
          </TouchableOpacity>

        </View>

        {/* ── Notifications ── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Notifications</Text>
        <View style={styles.group}>
          {[
            { type: 'adhan', label: 'Adhan alert', sub: 'Prayer call notification', icon: 'bell-outline' },
            { type: 'iqama', label: 'Iqama alert', sub: 'Congregation start notification', icon: 'bell-ring-outline' },
          ].map(({ type, label, sub, icon }, i) => {
            const pref = settings[type];
            return (
              <View key={type}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <View style={styles.rowIcon}>
                    <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowLabel}>{label}</Text>
                    <Text style={styles.rowSub}>{sub}</Text>
                  </View>
                  <Switch
                    value={pref.enabled}
                    onValueChange={(v) => handleToggle(type, v)}
                    trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                    thumbColor={pref.enabled ? colors.primary : colors.muted}
                  />
                </View>
                {pref.enabled && (
                  <View style={styles.chipsArea}>
                    {MINUTE_OPTIONS.map((m) => {
                      const isActive = pref.minutesBefore === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => setNotif(type, 'minutesBefore', m)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                            {m === 0 ? 'On time' : `${m}m before`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── About ── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>About</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="mosque" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Jam3ah</Text>
              <Text style={styles.rowSub}>Version 1.0</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ── Masjid Picker ── */}
      <Modal
        visible={masjidPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMasjidPickerOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMasjidPickerOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Select masjid</Text>
          <FlatList
            data={masjids}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => {
              const active = item.id === settings.defaultMasjidId;
              return (
                <TouchableOpacity
                  style={[styles.sheetItem, active && styles.sheetItemActive]}
                  activeOpacity={0.7}
                  onPress={() => { setDefaultMasjid(item.id); setMasjidPickerOpen(false); }}
                >
                  <View style={styles.sheetItemLeft}>
                    <MaterialCommunityIcons
                      name="mosque"
                      size={16}
                      color={active ? colors.primary : colors.muted}
                    />
                  </View>
                  <View style={styles.sheetItemBody}>
                    <Text style={[styles.sheetItemText, active && { color: colors.primary }]}>
                      {item.masjid_name}
                    </Text>
                    {item.city ? (
                      <Text style={styles.sheetItemSub}>
                        {item.city}{item.province ? `, ${item.province}` : ''}
                      </Text>
                    ) : null}
                  </View>
                  {active && (
                    <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
          />
        </View>
      </Modal>
    </View>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },

    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      gap: 4,
    },
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

    scroll: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 120,
    },

    sectionLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      color: c.muted,
      marginBottom: 8,
      paddingHorizontal: 4,
    },

    group: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      overflow: 'hidden',
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.primaryBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: c.onSurface,
    },
    rowSub: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: c.muted,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginLeft: 66,
    },

    chipsArea: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    chipActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryBg,
    },
    chipText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      color: c.muted,
    },
    chipTextActive: {
      color: c.primary,
    },

    overlay: { flex: 1, backgroundColor: c.overlay },
    sheet: {
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '65%',
      paddingTop: 12,
      paddingHorizontal: 16,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetTitle: {
      fontFamily: 'Sora_700Bold',
      fontSize: 16,
      color: c.onSurface,
      letterSpacing: -0.3,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sheetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 4,
      gap: 12,
    },
    sheetItemActive: {},
    sheetItemLeft: {
      width: 32,
      alignItems: 'center',
    },
    sheetItemBody: { flex: 1 },
    sheetItemText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: c.onSurface,
    },
    sheetItemSub: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: c.muted,
      marginTop: 2,
    },
  });
}
