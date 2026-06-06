import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';

export default function LeafletMap({ events = [], coords = {}, onMarkerPress }) {
  const { isDark, colors } = useTheme();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {}
    })();
  }, []);

  const html = useMemo(
    () => buildHTML(events, coords, isDark, colors, userLocation),
    [events, coords, isDark, colors, userLocation],
  );

  return (
    <WebView
      style={styles.map}
      source={{ html, baseUrl: 'https://unpkg.com' }}
      originWhitelist={['*']}
      allowsInlineMediaPlayback
      onMessage={(e) => {
        try {
          const { id } = JSON.parse(e.nativeEvent.data);
          const ev = events.find((x) => String(x.id) === String(id));
          if (ev) onMarkerPress(ev);
        } catch {}
      }}
    />
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });

function buildHTML(events, coords, isDark, colors, userLocation) {
  const tile = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const geocoded = events.filter((ev) => coords[String(ev.id)]);

  // Centre priority: user location → first geocoded event → Toronto default
  const centre = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : geocoded.length > 0
      ? [coords[String(geocoded[0].id)].latitude, coords[String(geocoded[0].id)].longitude]
      : [43.651, -79.347];

  const markersJS = geocoded.map((ev) => {
    const { latitude: lat, longitude: lng } = coords[String(ev.id)];
    const safeTitle = ev.title.replace(/'/g, "\\'").replace(/\n/g, ' ');
    return `
      L.marker([${lat}, ${lng}], { icon: dotIcon })
        .addTo(map)
        .on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ id: '${ev.id}' }));
        })
        .bindPopup('<span style="font-family:sans-serif;font-size:13px;color:${colors.onSurface}">${safeTitle}</span>');
    `;
  }).join('\n');

  const userMarkerJS = userLocation
    ? `
      var pulseIcon = L.divIcon({
        html: '<div class="pulse-wrap"><div class="pulse-ring"></div><div class="pulse-dot"></div></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: ''
      });
      L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: pulseIcon, zIndexOffset: 1000 }).addTo(map);
    `
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { height:100%; width:100%; background:${colors.bg}; }

    /* Pulsing user-location dot */
    .pulse-wrap { position:relative; width:20px; height:20px; }
    .pulse-dot {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      width:12px; height:12px; border-radius:50%;
      background:${colors.primary};
      border:2.5px solid ${colors.bg};
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    }
    .pulse-ring {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      width:20px; height:20px; border-radius:50%;
      background:${colors.primary};
      opacity:0.4;
      animation:pulse 1.8s ease-out infinite;
    }
    @keyframes pulse {
      0%   { transform:translate(-50%,-50%) scale(0.6); opacity:0.6; }
      70%  { transform:translate(-50%,-50%) scale(2.2); opacity:0; }
      100% { transform:translate(-50%,-50%) scale(2.2); opacity:0; }
    }

    /* Leaflet overrides */
    .leaflet-popup-content-wrapper {
      background:${colors.surfaceLow};
      border:1px solid ${isDark ? 'rgba(60,74,66,0.4)' : 'rgba(0,0,0,0.1)'};
      border-radius:10px;
      box-shadow:0 4px 16px rgba(0,0,0,${isDark ? '0.5' : '0.15'});
      padding:0;
    }
    .leaflet-popup-content { margin:10px 14px; }
    .leaflet-popup-tip { background:${colors.surfaceLow}; }
    .leaflet-control-attribution { display:none; }
    .leaflet-control-zoom a {
      background:${colors.surfaceLow} !important;
      color:${colors.onSurface} !important;
      border-color:${isDark ? 'rgba(60,74,66,0.4)' : 'rgba(0,0,0,0.15)'} !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${centre[0]}, ${centre[1]}], 13);
    L.tileLayer('${tile}', { subdomains:'abcd', maxZoom:19 }).addTo(map);

    var dotIcon = L.divIcon({
      html: '<div style="width:14px;height:14px;border-radius:50%;background:${colors.primary};border:2.5px solid ${colors.bg};box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
      iconSize:[14,14], iconAnchor:[7,7], className:''
    });

    ${markersJS}
    ${userMarkerJS}
  </script>
</body>
</html>`;
}
