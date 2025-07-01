package tiempos.com.apptiemposv2;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;
import java.util.ArrayList;

public class ApkInstallerPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(
            com.facebook.react.bridge.ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new ApkInstallerModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(
            com.facebook.react.bridge.ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
