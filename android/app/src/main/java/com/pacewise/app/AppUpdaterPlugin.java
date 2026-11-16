package com.pacewise.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {
    private static final String TAG = "AppUpdaterPlugin";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean canInstall = getActivity().getPackageManager().canRequestPackageInstalls();
            ret.put("canInstall", canInstall);
        } else {
            ret.put("canInstall", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestInstallPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getActivity().getPackageName()));
                getActivity().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                Log.e(TAG, "Failed to open install permission settings", e);
                call.reject("Could not open settings: " + e.getMessage());
            }
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        if (downloadUrl == null || downloadUrl.isEmpty()) {
            call.reject("URL must be provided");
            return;
        }

        executor.execute(() -> {
            File outputFile = null;
            try {
                Context context = getContext();
                File cacheDir = context.getCacheDir();
                outputFile = new File(cacheDir, "PaceWise-latest.apk");
                if (outputFile.exists()) {
                    outputFile.delete();
                }

                String currentUrl = downloadUrl;
                HttpURLConnection connection = null;
                int redirects = 0;
                final int maxRedirects = 8;

                while (redirects < maxRedirects) {
                    URL url = new URL(currentUrl);
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setInstanceFollowRedirects(false);
                    connection.setConnectTimeout(15000);
                    connection.setReadTimeout(30000);
                    connection.setRequestProperty("User-Agent", "PaceWise-Android-Updater");

                    int status = connection.getResponseCode();
                    if (status == HttpURLConnection.HTTP_MOVED_TEMP
                            || status == HttpURLConnection.HTTP_MOVED_PERM
                            || status == HttpURLConnection.HTTP_SEE_OTHER
                            || status == 307
                            || status == 308) {
                        String newUrl = connection.getHeaderField("Location");
                        if (newUrl != null && !newUrl.isEmpty()) {
                            currentUrl = newUrl;
                            redirects++;
                            connection.disconnect();
                            continue;
                        }
                    }
                    break;
                }

                if (connection == null || connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                    int code = connection != null ? connection.getResponseCode() : -1;
                    call.reject("Download failed with HTTP status: " + code);
                    return;
                }

                long fileLength = connection.getContentLengthLong();
                InputStream input = connection.getInputStream();
                FileOutputStream output = new FileOutputStream(outputFile);

                byte[] data = new byte[8192];
                long total = 0;
                int count;
                long lastProgressTime = 0;

                while ((count = input.read(data)) != -1) {
                    total += count;
                    output.write(data, 0, count);

                    long now = System.currentTimeMillis();
                    if (now - lastProgressTime > 100 || total == fileLength) {
                        lastProgressTime = now;
                        int percent = (fileLength > 0) ? (int) ((total * 100) / fileLength) : -1;

                        JSObject progress = new JSObject();
                        progress.put("received", total);
                        progress.put("total", fileLength);
                        progress.put("percent", percent);
                        notifyListeners("downloadProgress", progress);
                    }
                }

                output.flush();
                output.close();
                input.close();
                connection.disconnect();

                // Trigger package installer on UI thread
                final File finalApk = outputFile;
                getActivity().runOnUiThread(() -> {
                    try {
                        Uri contentUri = FileProvider.getUriForFile(
                                context,
                                context.getPackageName() + ".fileprovider",
                                finalApk
                        );

                        Intent installIntent = new Intent(Intent.ACTION_VIEW);
                        installIntent.setDataAndType(contentUri, "application/vnd.android.package-archive");
                        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(installIntent);

                        JSObject res = new JSObject();
                        res.put("success", true);
                        call.resolve(res);
                    } catch (Exception installErr) {
                        Log.e(TAG, "Failed to launch installer intent", installErr);
                        call.reject("Failed to open package installer: " + installErr.getMessage());
                    }
                });

            } catch (Exception e) {
                Log.e(TAG, "Error downloading APK", e);
                if (outputFile != null && outputFile.exists()) {
                    outputFile.delete();
                }
                call.reject("Download error: " + e.getMessage());
            }
        });
    }
}
