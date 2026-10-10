package expo.modules.alarm

import android.app.ActivityManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.KeyguardManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.Icon
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.widget.RemoteViews

/**
 * Notification plumbing shared by the ringing service and the no-service fallback.
 *
 * Two channels exist on purpose. The service owns its own audio, so its channel is silent —
 * otherwise the alarm would play twice from two places, only one of which can be stopped. The
 * fallback has no service and therefore no MediaPlayer, so its channel carries the alarm sound.
 */
internal object AlarmSchedulerNotifications {
  const val RING_NOTIFICATION_ID = 0xA1A2
  const val FALLBACK_NOTIFICATION_ID = 0xA1A3

  private const val CHANNEL_RING = "alarm_scheduler_ring"
  private const val CHANNEL_FALLBACK = "alarm_scheduler_fallback"

  fun buildRingNotification(context: Context, alarmId: String, options: AlarmSchedulerOptions): Notification {
    createRingChannel(context)
    return build(context, alarmId, options, CHANNEL_RING, ongoing = true)
  }

  /**
   * Last resort when the foreground service cannot be started — an OEM restriction, a revoked
   * exact-alarm grant, or any other denial. Rings through the notification channel instead of the
   * service so the user is still woken, as loudly as the platform allows without a service.
   */
  fun postFallbackNotification(context: Context, alarmId: String, options: AlarmSchedulerOptions) {
    val channelId = createFallbackChannel(context, options)
    val notification = build(context, alarmId, options, channelId, ongoing = false)
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    runCatching { manager.notify(FALLBACK_NOTIFICATION_ID, notification) }
  }

  // landit: 화면이 켜져 있고 잠금이 풀려 있으면 사용자가 폰을 쓰는 중이다
  fun isDeviceInUse(context: Context): Boolean {
    val power = context.getSystemService(PowerManager::class.java) ?: return false
    val keyguard = context.getSystemService(KeyguardManager::class.java) ?: return false
    return power.isInteractive && !keyguard.isKeyguardLocked
  }

  // landit: 폰을 쓰는 중이고 맨 앞 화면이 랜딧이다 — 우리 앱 화면이 떠 있으면 프로세스 중요도가 FOREGROUND다 (서비스만 돌면 FOREGROUND_SERVICE)
  fun isLanditInFront(context: Context): Boolean {
    if (!isDeviceInUse(context)) return false
    val process = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(process)
    return process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
  }

  private fun build(
    context: Context,
    alarmId: String,
    options: AlarmSchedulerOptions,
    channelId: String,
    ongoing: Boolean
  ): Notification {
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, channelId)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context).setPriority(Notification.PRIORITY_MAX)
    }

    val contentIntent = fullScreenPendingIntent(context, alarmId, options)
    builder
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle(options.alertTitle)
      .setContentText(options.alertBody)
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setOngoing(ongoing)
      // landit: 서비스 알림은 Android 12+에서 10초까지 늦게 뜰 수 있다. 소리와 함께 바로 띄운다
      .apply { if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE) }
      .setAutoCancel(false)
      .setContentIntent(contentIntent)
      // landit: 브랜드 주황
      .setColor(Color.rgb(0xE0, 0x7A, 0x3A))

    // landit: 랜딧이 맨 앞이면 전체 화면 표시를 붙이지 않는다 — 붙이면 시스템이 위쪽 카드를 띄우지 않는다
    if (options.fullScreen && !isLanditInFront(context)) {
      builder.setFullScreenIntent(contentIntent, true)
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O && !ongoing) {
      @Suppress("DEPRECATION")
      builder.setSound(fallbackSoundUri(context, options))
    }

    // landit: "대화하러 가기"는 앱을 바로 연다. 서비스를 거쳐 열면 Android 12+가 알림 트램펄린으로 막는다.
    // 울림은 앱이 열리면서 끈다(completeNativeAlarmAsync)
    val openIntent = appPendingIntent(context, alarmId, options) ?: servicePendingIntent(context, AlarmSchedulerRingService.ACTION_OPEN, alarmId, "open")
    val stopIntent = servicePendingIntent(context, AlarmSchedulerRingService.ACTION_STOP, alarmId, "stop")
    val canStop = options.alertActionMode != ALERT_ACTION_MODE_OPEN_APP_ONLY
    // landit: Android 14부터 울리는 중인 알림도 밀어서 지울 수 있다. 지우면 소리만 남지 않게 끄기와 똑같이 멈춘다
    if (canStop) builder.setDeleteIntent(stopIntent)
    // landit: 폰을 쓰는 중에 뜨는 위쪽 카드와 펼친 알림은 우리가 그린 화면을 쓴다.
    // 기본 알림은 접힌 채로 떠서 버튼을 보려면 눌러 펼쳐야 했다. 버튼은 카드 안에 있어서 기본 버튼은 붙이지 않는다
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      val stop = stopIntent.takeIf { canStop }
      builder
        .setStyle(Notification.DecoratedCustomViewStyle())
        .setCustomHeadsUpContentView(landitCard(context, R.layout.landit_alarm_heads_up, options, openIntent, stop))
        .setCustomBigContentView(landitCard(context, R.layout.landit_alarm_expanded, options, openIntent, stop))
    } else {
      builder.addAction(action(options.secondaryButtonTitle, openIntent))
      if (canStop) builder.addAction(action(options.stopButtonTitle, stopIntent))
    }

    return builder.build()
  }

  // landit: 알람 카드 — 위쪽 카드는 제목과 버튼만, 펼친 카드는 램프 그림을 위에 크게 얹는다.
  // 램프 그림은 호스트 앱이 drawable/landit_alarm_lamp로 넣어 둔다
  private fun landitCard(
    context: Context,
    layout: Int,
    options: AlarmSchedulerOptions,
    openIntent: PendingIntent,
    stopIntent: PendingIntent?
  ): RemoteViews {
    val card = RemoteViews(context.packageName, layout)
    val lampId = context.resources.getIdentifier("landit_alarm_lamp", "drawable", context.packageName)
    if (layout == R.layout.landit_alarm_expanded && lampId != 0) {
      card.setImageViewResource(R.id.landit_alarm_lamp, lampId)
    }
    card.setTextViewText(R.id.landit_alarm_title, options.alertTitle)
    card.setTextViewText(R.id.landit_alarm_body, options.alertBody)
    card.setTextViewText(R.id.landit_alarm_open, options.secondaryButtonTitle)
    card.setOnClickPendingIntent(R.id.landit_alarm_open, openIntent)
    if (stopIntent != null) {
      card.setTextViewText(R.id.landit_alarm_stop, options.stopButtonTitle)
      card.setOnClickPendingIntent(R.id.landit_alarm_stop, stopIntent)
    } else {
      card.setViewVisibility(R.id.landit_alarm_stop, android.view.View.GONE)
    }
    return card
  }

  private fun action(title: String, intent: PendingIntent): Notification.Action {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Notification.Action.Builder(null as Icon?, title, intent).build()
    } else {
      @Suppress("DEPRECATION")
      Notification.Action.Builder(0, title, intent).build()
    }
  }

  private fun createRingChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_RING, "Alarms", NotificationManager.IMPORTANCE_HIGH).apply {
        setSound(null, null)
        enableVibration(false)
        setBypassDnd(true)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        setShowBadge(false)
      }
    )
  }

  private fun createFallbackChannel(context: Context, options: AlarmSchedulerOptions): String {
    val sound = fallbackSoundUri(context, options)
    val vibrationKey = if (options.vibrate) "vibrate" else "no_vibration"
    val channelId = "${CHANNEL_FALLBACK}_${sound.toString().hashCode().toUInt().toString(16)}_$vibrationKey"
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return channelId
    }
    val manager = context.getSystemService(NotificationManager::class.java) ?: return channelId
    manager.createNotificationChannel(
      NotificationChannel(channelId, "Alarms (fallback)", NotificationManager.IMPORTANCE_HIGH).apply {
        setSound(
          sound,
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        )
        enableVibration(options.vibrate)
        setBypassDnd(true)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        setShowBadge(false)
      }
    )
    return channelId
  }

  private fun fallbackSoundUri(context: Context, options: AlarmSchedulerOptions): Uri? {
    if (options.silent) {
      return null
    }
    options.soundUri?.let { raw ->
      runCatching { Uri.parse(raw) }.getOrNull()?.takeUnless { it.scheme == "file" }?.let { return it }
    }
    options.soundName?.let { name ->
      val resourceId = context.resources.getIdentifier(name.substringBeforeLast('.'), "raw", context.packageName)
      if (resourceId != 0) {
        return Uri.parse("android.resource://${context.packageName}/$resourceId")
      }
    }
    return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
  }

  fun servicePendingIntent(context: Context, action: String, alarmId: String, suffix: String): PendingIntent {
    val intent = Intent(context, AlarmSchedulerRingService::class.java).apply {
      this.action = action
      putExtra(AlarmSchedulerRingService.EXTRA_ALARM_ID, alarmId)
    }
    return PendingIntent.getService(
      context,
      AlarmSchedulerScheduler.requestCode("$suffix-$alarmId"),
      intent,
      AlarmSchedulerScheduler.pendingFlags()
    )
  }

  fun fullScreenPendingIntent(context: Context, alarmId: String, options: AlarmSchedulerOptions): PendingIntent {
    if (options.fullScreenTarget == FULL_SCREEN_TARGET_APP) {
      return PendingIntent.getActivity(
        context,
        AlarmSchedulerScheduler.requestCode("app-$alarmId"),
        appIntent(context, alarmId, options) ?: Intent(),
        AlarmSchedulerScheduler.pendingFlags()
      )
    }
    return PendingIntent.getActivity(
      context,
      AlarmSchedulerScheduler.requestCode("ring-$alarmId"),
      AlarmSchedulerRingActivity.intent(context, alarmId),
      AlarmSchedulerScheduler.pendingFlags()
    )
  }

  // landit: 알림 버튼에서 앱을 바로 여는 PendingIntent
  private fun appPendingIntent(context: Context, alarmId: String, options: AlarmSchedulerOptions): PendingIntent? {
    val intent = appIntent(context, alarmId, options) ?: return null
    return PendingIntent.getActivity(
      context,
      AlarmSchedulerScheduler.requestCode("open-app-$alarmId"),
      intent,
      AlarmSchedulerScheduler.pendingFlags()
    )
  }

  fun appIntent(context: Context, alarmId: String, options: AlarmSchedulerOptions): Intent? {
    val intent = AlarmSchedulerScheduler.launchIntent(context) ?: return null
    options.launchUri?.let { template ->
      val uri = if (template.contains(ALARM_ID_PLACEHOLDER)) {
        template.replace(ALARM_ID_PLACEHOLDER, Uri.encode(alarmId))
      } else {
        val separator = if (template.contains("?")) "&" else "?"
        "$template${separator}alarmId=${Uri.encode(alarmId)}"
      }
      intent.data = runCatching { Uri.parse(uri) }.getOrNull()
      // landit: 링크를 실었으면 "링크 열기"로 보낸다 — 리액트 네이티브는 VIEW일 때만 링크를 JS에 넘긴다(MAIN이면 무시)
      if (intent.data != null) intent.action = Intent.ACTION_VIEW
    }
    return intent
      .putExtra(AlarmSchedulerRingService.EXTRA_ALARM_ID, alarmId)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
  }

  private const val ALARM_ID_PLACEHOLDER = "{alarmId}"
}
