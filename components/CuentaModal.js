import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { useTheme, THEMES } from "../context/ThemeContext";

const THEME_ORDER = [
  "azul",
  "teal",
  "morado",
  "vino",
  "rosa",
  "naranja",
  "azulclaro",
  "menta",
  "negro",
];

export default function CuentaModal({
  visible,
  onClose,
  onLogout,
  apkVersion,
}) {
  const { userData, ticketProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = width > 710;

  const displayName = (
    userData?.name ||
    ticketProfile?.sellerName ||
    userData?.username ||
    "USUARIO"
  ).toUpperCase();

  const versionText = apkVersion ? `V${apkVersion}` : "";
  const subtitle = versionText
    ? `${displayName} · ${versionText}`
    : displayName;

  const sortedThemes = Object.values(THEMES).sort((a, b) => {
    const indexA = THEME_ORDER.indexOf(a.key);
    const indexB = THEME_ORDER.indexOf(b.key);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.overlay,
          isWeb ? styles.overlayWeb : styles.overlayMobile,
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modalCard,
            isWeb ? styles.modalCardWeb : styles.modalCardMobile,
          ]}
          onPress={(e) => {
            if (Platform.OS === "web" && e?.stopPropagation) {
              e.stopPropagation();
            }
          }}
        >
          {/* Indicador de arrastre en móvil */}
          {!isWeb && <View style={styles.handleBar} />}

          {/* Encabezado: Título y botón de cerrar */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Cuenta</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Subtítulo: Nombre y versión */}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Separador */}
          <View style={styles.divider} />

          {/* Sección de Tema */}
          <View style={styles.themeSection}>
            <View style={styles.themeHeaderRow}>
              <Text style={styles.themeLabel}>Tema</Text>
              <Text style={styles.themeSelectedName}>{theme.name}</Text>
            </View>

            {/* Cuadrícula de círculos de tema */}
            <View style={styles.themeGrid}>
              {sortedThemes.map((t) => {
                const isSelected = theme.key === t.key;
                const ringColor = t.key === "negro" ? "#121212" : t.primary;
                return (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setTheme(t.key)}
                    activeOpacity={0.8}
                    style={[
                      styles.themeCircleOuter,
                      { backgroundColor: t.secondary },
                      isSelected
                        ? { borderColor: ringColor, borderWidth: 3 }
                        : {
                          borderColor: "rgba(0, 0, 0, 0.08)",
                          borderWidth: 1,
                        },
                    ]}
                  >
                    {/* Círculo interior: Color primario */}
                    <View
                      style={[
                        styles.themeCircleInner,
                        { backgroundColor: t.primary },
                        t.key === "negro" && styles.themeCircleInnerNegro,
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.themeCaption}>
            </Text>
          </View>

          {/* Separador */}
          <View style={styles.divider} />

          {/* Botón Salir */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="logout"
              size={20}
              color="#ef4444"
              style={styles.logoutIcon}
            />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  overlayMobile: {
    justifyContent: "flex-end",
  },
  overlayWeb: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#ffffff",
  },
  modalCardMobile: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  modalCardWeb: {
    width: 400,
    maxWidth: "92%",
    borderRadius: 16,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.6,
    marginTop: 6,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 14,
  },
  themeSection: {},
  themeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  themeSelectedName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 10,
  },
  themeCircleOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  themeCircleInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  themeCircleInnerNegro: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  themeCaption: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 6,
    lineHeight: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
  },
});
