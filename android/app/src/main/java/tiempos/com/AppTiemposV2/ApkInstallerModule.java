package tiempos.com.apptiemposv2;

import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;

import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;

import android.content.Intent;
import android.util.Log;
import android.os.Looper;

public class ApkInstallerModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private long downloadId = -1;
    private String fileName = "";
   // private final Handler handler = new Handler();

    public ApkInstallerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "ApkInstaller";
    }

    @ReactMethod
    public void downloadAndInstall(String url, String version) {
       
        fileName = "appt-v" + version + ".apk";
        String destination = reactContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) + "/" + fileName;

        Uri uri = Uri.parse(url);
        DownloadManager.Request request = new DownloadManager.Request(uri);
        request.setTitle("Descargando actualización");
        request.setDescription("Descargando APK");
        request.setDestinationUri(Uri.fromFile(new File(destination)));
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

        DownloadManager manager = (DownloadManager) reactContext.getSystemService(Context.DOWNLOAD_SERVICE);
        downloadId = manager.enqueue(request);
        Log.e("ApkInstaller", "DownloadManager.enqueue -> ID: " + downloadId);

        // Iniciar verificación periódica
         Handler handler = new Handler(Looper.getMainLooper());
        pollDownloadStatus(manager, downloadId, destination, handler);
    }

    private void pollDownloadStatus(DownloadManager manager, long downloadId, String destination, Handler handler) {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                DownloadManager.Query query = new DownloadManager.Query();
                query.setFilterById(downloadId);
                Cursor cursor = manager.query(query);

                if (cursor != null && cursor.moveToFirst()) {
                    int columnIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                    int status = cursor.getInt(columnIndex);
                    Log.e("ApkInstaller", "Polling download status: " + status);

                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        cursor.close();
                        installApk(destination);
                        return;
                    } else if (status == DownloadManager.STATUS_FAILED) {
                        Log.e("ApkInstaller", "Descarga fallida.");
                        cursor.close();
                        return;
                    }
                }

                if (cursor != null) {
                    cursor.close();
                }

                // Seguir revisando cada segundo
                handler.postDelayed(this, 1000);
            }
        }, 2000);
    }

    private void installApk(String filePath) {
        File file = new File(filePath);
        if (!file.exists()) {
            Log.e("ApkInstaller", "APK file not found at: " + filePath);
            return;
        }

        Uri apkUri;
        Intent intent;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            apkUri = FileProvider.getUriForFile(
                    reactContext,
                    reactContext.getPackageName() + ".provider",
                    file
            );
            intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            intent.setData(apkUri);
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        } else {
            apkUri = Uri.fromFile(file);
            intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        }

        try {
            reactContext.startActivity(intent);
        } catch (Exception e) {
            Log.e("ApkInstaller", "Error al iniciar intent de instalación: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
