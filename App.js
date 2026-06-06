import 'react-native-url-polyfill/auto';
import * as Notifications from 'expo-notifications';
import React, { useRef, useEffect, useMemo } from 'react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
import { View, StyleSheet, ActivityIndicator, Pressable, Animated, Easing, Dimensions, PanResponder } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import PrayerScreen from './src/screens/PrayerScreen';
import EventsScreen from './src/screens/EventsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const SCREEN_W = Dimensions.get('window').width;
const TAB_ORDER = ['Events', 'Prayer', 'Settings'];
let lastTabIndex = 1;

const EASE_OUT = Easing.bezier(0.25, 0.46, 0.45, 0.94);

function SlideScreen({ children, tabIndex }) {
  const isFocused = useIsFocused();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isFocused) return;
    const fromRight = tabIndex > lastTabIndex;
    lastTabIndex = tabIndex;
    translateX.setValue(fromRight ? SCREEN_W * 0.14 : -SCREEN_W * 0.14);
    opacity.setValue(0);
    scale.setValue(0.96);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 320,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 320,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }, { scale }] }}>
      {children}
    </Animated.View>
  );
}

const TABS = [
  { name: 'Events',   icon: 'calendar-check-outline', iconFocused: 'calendar-check' },
  { name: 'Prayer',   icon: 'clock-outline',           iconFocused: 'clock'          },
  { name: 'Settings', icon: 'cog-outline',             iconFocused: 'cog'            },
];

function FloatingTabBar({ state, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[navStyles.wrapper, { bottom: insets.bottom + 20 }]}>
      <View style={[navStyles.pill, { backgroundColor: colors.navBg, borderColor: colors.navBorder }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS[index];
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                if (!focused) navigation.navigate(route.name);
              }}
              style={navStyles.tabBtn}
            >
              <View style={[navStyles.iconWrap, focused && navStyles.iconWrapActive]}>
                <MaterialCommunityIcons
                  name={focused ? tab.iconFocused : tab.icon}
                  size={23}
                  color={focused ? '#ffffff' : colors.tabInactive}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const navStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  tabBtn: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#38bdf8',
  },
});

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const navRef = useRef(null);

  const edgePan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      const x = evt.nativeEvent.pageX;
      return x < 28 || x > SCREEN_W - 28;
    },
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8,
    onPanResponderRelease: (_, { dx }) => {
      if (!navRef.current) return;
      if (dx < -60 && lastTabIndex < TAB_ORDER.length - 1) {
        navRef.current.navigate(TAB_ORDER[lastTabIndex + 1]);
      } else if (dx > 60 && lastTabIndex > 0) {
        navRef.current.navigate(TAB_ORDER[lastTabIndex - 1]);
      }
    },
  }), []);

  return (
    <View style={{ flex: 1 }} {...edgePan.panHandlers}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer ref={navRef}>
        <Tab.Navigator
          initialRouteName="Prayer"
          sceneContainerStyle={{ backgroundColor: colors.bg }}
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Events">
            {() => <SlideScreen tabIndex={0}><EventsScreen /></SlideScreen>}
          </Tab.Screen>
          <Tab.Screen name="Prayer">
            {() => <SlideScreen tabIndex={1}><PrayerScreen /></SlideScreen>}
          </Tab.Screen>
          <Tab.Screen name="Settings">
            {() => <SlideScreen tabIndex={2}><SettingsScreen /></SlideScreen>}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#38bdf8" size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
