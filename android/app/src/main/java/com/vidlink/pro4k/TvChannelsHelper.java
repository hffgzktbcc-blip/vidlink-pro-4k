package com.vidlink.pro4k;

import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.tvprovider.media.tv.Channel;
import androidx.tvprovider.media.tv.ChannelLogoUtils;
import androidx.tvprovider.media.tv.PreviewProgram;
import androidx.tvprovider.media.tv.TvContractCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class TvChannelsHelper {
    private static final String TAG = "TvChannelsHelper";
    private static final String CHANNEL_NAME = "VidLink 4K: Trending Now";
    private static final String CHANNEL_DESCRIPTION = "Top 4K HDR Movies and TV Series trending today.";

    public static long getOrCreateTrendingChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return -1;
        }

        try (Cursor cursor = context.getContentResolver().query(
                TvContractCompat.Channels.CONTENT_URI,
                new String[]{TvContractCompat.Channels._ID, TvContractCompat.Channels.COLUMN_DISPLAY_NAME},
                null,
                null,
                null
        )) {
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String name = cursor.getString(cursor.getColumnIndexOrThrow(TvContractCompat.Channels.COLUMN_DISPLAY_NAME));
                    if (CHANNEL_NAME.equals(name)) {
                        return cursor.getLong(cursor.getColumnIndexOrThrow(TvContractCompat.Channels._ID));
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error querying existing channels: " + e.getMessage());
        }

        try {
            Channel.Builder builder = new Channel.Builder()
                    .setType(TvContractCompat.Channels.TYPE_PREVIEW)
                    .setDisplayName(CHANNEL_NAME)
                    .setDescription(CHANNEL_DESCRIPTION)
                    .setAppLinkIntentUri(Uri.parse("vidlink://open"));

            Uri channelUri = context.getContentResolver().insert(
                    TvContractCompat.Channels.CONTENT_URI,
                    builder.build().toContentValues()
            );

            if (channelUri != null) {
                long channelId = ContentUris.parseId(channelUri);
                TvContractCompat.requestChannelBrowsable(context, channelId);

                // Set app icon as channel logo
                try {
                    Bitmap appIcon = BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher);
                    if (appIcon != null) {
                        ChannelLogoUtils.storeChannelLogo(context, channelId, appIcon);
                    }
                } catch (Exception ignore) {}

                return channelId;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to create Android TV channel: " + e.getMessage());
        }

        return -1;
    }

    public static void syncTrendingPrograms(Context context, String jsonMediaArrayString) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        new Thread(() -> {
            try {
                long channelId = getOrCreateTrendingChannel(context);
                if (channelId == -1) return;

                // Clear previous programs to maintain fresh lineup
                context.getContentResolver().delete(
                        TvContractCompat.PreviewPrograms.CONTENT_URI,
                        TvContractCompat.PreviewPrograms.COLUMN_CHANNEL_ID + "=?",
                        new String[]{String.valueOf(channelId)}
                );

                JSONArray items = new JSONArray(jsonMediaArrayString);
                int limit = Math.min(items.length(), 15);

                for (int i = 0; i < limit; i++) {
                    JSONObject item = items.getJSONObject(i);
                    int id = item.optInt("id");
                    String title = item.optString("title", item.optString("name", "4K Title"));
                    String overview = item.optString("overview", "Watch in 4K Ultra HD on VidLink Pro.");
                    String posterPath = item.optString("poster_path", "");
                    String backdropPath = item.optString("backdrop_path", "");
                    String mediaType = item.optString("media_type", "movie");

                    String imagePath = !backdropPath.isEmpty() ? backdropPath : posterPath;
                    String imageUrl = imagePath.startsWith("http") ? imagePath : "https://image.tmdb.org/t/p/w780" + imagePath;

                    Uri deepLinkUri = Uri.parse("vidlink://watch?watch=" + mediaType + "&id=" + id);
                    Intent intent = new Intent(Intent.ACTION_VIEW, deepLinkUri);

                    PreviewProgram.Builder progBuilder = new PreviewProgram.Builder()
                            .setChannelId(channelId)
                            .setTitle(title)
                            .setDescription(overview)
                            .setType(TvContractCompat.PreviewPrograms.TYPE_MOVIE)
                            .setPosterArtUri(Uri.parse(imageUrl))
                            .setIntent(intent)
                            .setWeight(limit - i);

                    context.getContentResolver().insert(
                            TvContractCompat.PreviewPrograms.CONTENT_URI,
                            progBuilder.build().toContentValues()
                    );
                }
                Log.d(TAG, "Successfully synced " + limit + " trending programs to Android TV home screen.");
            } catch (Exception e) {
                Log.e(TAG, "Error syncing programs: " + e.getMessage(), e);
            }
        }).start();
    }
}
