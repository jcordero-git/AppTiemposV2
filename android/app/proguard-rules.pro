# === CORE REACT & REACT NATIVE ===
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# === HERMES JS ENGINE ===
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# === TURBOMODULES ===
-keep class com.facebook.react.turbomodule.** { *; }

# === REACT NATIVE PAPER ===
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# === REACT NATIVE REANIMATED v3+ ===
-keep class com.swmansion.reanimated.** { *; }

# === EXPO CAMERA ===
-keep class expo.modules.camera.** { *; }
-dontwarn expo.modules.camera.**

# === EXPO SHARING / FILESYSTEM / SPLASHSCREEN / CONSTANTS ===
-keep class expo.modules.filesystem.** { *; }
-keep class expo.modules.splashscreen.** { *; }
-keep class expo.modules.constants.** { *; }
-keep class expo.modules.sharing.** { *; }

# === BLE (react-native-ble-plx) ===
-keep class com.polidea.rxandroidble.** { *; }
-dontwarn com.polidea.rxandroidble.**

# === REACT-NATIVE-WEBVIEW ===
-keepclassmembers class com.reactnativecommunity.webview.** { *; }
-dontwarn com.reactnativecommunity.webview.**

# === SAFETY: mantener anotaciones, constructores y métodos nativos ===
-keepattributes *Annotation*
-keepclassmembers class * {
   native <methods>;
   public <init>(...);
}
-keepclasseswithmembers class * {
   public <init>(...);
}
