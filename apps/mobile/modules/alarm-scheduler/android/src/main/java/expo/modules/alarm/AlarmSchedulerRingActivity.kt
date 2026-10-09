package expo.modules.alarm

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The lock-screen ringing surface.
 *
 * Android — unlike AlarmKit — lets the app own this screen outright, so there is no system Stop
 * button to work around: when `alertActionMode` is `openAppOnly` the only way out is the
 * button that hands off to the app. The UI is built in code so the library ships no resources and
 * inherits no theme from the host app.
 */
class AlarmSchedulerRingActivity : Activity() {
  private var alarmId: String? = null
  private var options: AlarmSchedulerOptions? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    showOverLockScreen()
    bind(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent != null) {
      setIntent(intent)
      bind(intent)
    }
  }

  @Deprecated("Deliberately swallowed: the alarm may not be dismissed with the back gesture.")
  override fun onBackPressed() {
    // No-op by design.
  }

  private fun bind(intent: Intent) {
    val id = intent.getStringExtra(AlarmSchedulerRingService.EXTRA_ALARM_ID)
    val stored = id?.let { AlarmSchedulerStore.alarm(this, it) }
    if (id == null || stored == null) {
      finish()
      return
    }
    alarmId = id
    options = AlarmSchedulerOptions.fromJson(
      stored.optJSONObject("options"),
      stored.optString("title", "Alarm"),
      id
    )
    setContentView(buildContentView(stored.optString("title", "Alarm")))
  }

  private fun showOverLockScreen() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      // landit: 잠금 위에 띄우기만 한다. 뜨자마자 잠금 해제를 요청하면 비밀번호 화면이 알람을 가린다 — 해제는 "대화하러 가기"를 눌렀을 때만
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  // landit: 피그마 밤 톤 화면(v2.1) — 날짜·시각·래디 램프·제목(램프 폭에 맞춘 한 줄), 버튼은 앱 디자인 시스템의 입체 버튼
  private fun buildContentView(title: String): View {
    val resolved = options
    window.statusBarColor = Color.parseColor("#17121F")
    window.navigationBarColor = Color.parseColor("#2E1A1C")
    val root = FrameLayout(this).apply {
      background = GradientDrawable(
        GradientDrawable.Orientation.TOP_BOTTOM,
        intArrayOf(Color.parseColor("#17121F"), Color.parseColor("#231726"), Color.parseColor("#2E1A1C"))
      )
    }

    root.addView(
      View(this).apply {
        background = GradientDrawable().apply {
          shape = GradientDrawable.OVAL
          gradientType = GradientDrawable.RADIAL_GRADIENT
          gradientRadius = dp(210).toFloat()
          colors = intArrayOf(Color.argb(96, 0xE0, 0x7A, 0x3A), Color.argb(0, 0xE0, 0x7A, 0x3A))
        }
      },
      FrameLayout.LayoutParams(dp(420), dp(420), Gravity.CENTER_HORIZONTAL).apply { topMargin = dp(200) }
    )

    // 짧은 화면이면 램프와 여백부터 줄인다 — 버튼 두 개는 늘 맨 아래에 다 보여야 한다
    val metrics = resources.displayMetrics
    val screenDp = metrics.heightPixels / metrics.density
    val tight = ((ROOMY_HEIGHT_DP - screenDp) / (ROOMY_HEIGHT_DP - TIGHT_HEIGHT_DP)).coerceIn(0f, 1f)
    fun fit(roomy: Int, cramped: Int) = dp((roomy + (cramped - roomy) * tight).toInt())

    val column = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(32), fit(84, 32), dp(32), fit(44, 20))
    }
    val now = Date()
    column.addView(
      // 날짜·시각은 사용자 글자 크기 설정에 끌려가지 않게 dp로 — 커지면 아래 버튼을 밀어낸다
      label(SimpleDateFormat("M월 d일 EEEE", Locale.KOREAN).format(now), 20f, "#E9E3EF", Typeface.DEFAULT_BOLD, TypedValue.COMPLEX_UNIT_DIP)
    )
    // 시각은 한눈에 보이게 굵게, 주인공인 제목보다는 한 발 물러난 크기로
    column.addView(
      label(SimpleDateFormat("h:mm", Locale.getDefault()).format(now), 88f - 24f * tight, "#FFFFFF", Typeface.DEFAULT_BOLD, TypedValue.COMPLEX_UNIT_DIP).apply {
        includeFontPadding = false
        letterSpacing = -0.03f
      },
      wrap().apply { topMargin = dp(2) }
    )
    lampDrawableId()?.let { id ->
      column.addView(
        ImageView(this).apply {
          setImageResource(id)
          adjustViewBounds = true
          scaleType = ImageView.ScaleType.FIT_CENTER
        },
        LinearLayout.LayoutParams(dp(LAMP_WIDTH_DP), fit(216, 112)).apply { topMargin = fit(26, 10) }
      )
    }
    // 제목도 램프 폭에 맞춘 한 줄 — 넘치면 글자를 줄인다
    column.addView(
      label(resolved?.alertTitle?.takeIf { it.isNotBlank() } ?: title, 26f, "#FFFFFF", Typeface.create("sans-serif-black", Typeface.NORMAL)).apply {
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
        fitWidth(this, 14, 26)
      },
      LinearLayout.LayoutParams(dp(LAMP_WIDTH_DP), dp(36)).apply { topMargin = fit(22, 10) }
    )
    column.addView(View(this), LinearLayout.LayoutParams(0, 0, 1f))
    column.addView(
      liftButton(resolved?.secondaryButtonTitle ?: "Open app", "#E07A3A", "#A85C2C", "#FFFFFF") { openApp() },
      LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(61))
    )
    if (resolved?.alertActionMode != ALERT_ACTION_MODE_OPEN_APP_ONLY) {
      column.addView(
        liftButton(resolved?.stopButtonTitle ?: "Stop", "#2E2733", "#1C171F", "#E9E3EF") { stopAlarm() },
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(61)).apply { topMargin = dp(15) }
      )
    }
    root.addView(column, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    return root
  }

  private fun wrap() = LinearLayout.LayoutParams(
    LinearLayout.LayoutParams.WRAP_CONTENT,
    LinearLayout.LayoutParams.WRAP_CONTENT
  )

  private fun fitWidth(view: TextView, minSp: Int, maxSp: Int) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      view.setAutoSizeTextTypeUniformWithConfiguration(minSp, maxSp, 1, TypedValue.COMPLEX_UNIT_SP)
    }
  }

  private fun label(
    value: String,
    size: Float,
    color: String,
    face: Typeface,
    unit: Int = TypedValue.COMPLEX_UNIT_SP
  ): TextView = TextView(this).apply {
    text = value
    setTextColor(Color.parseColor(color))
    setTextSize(unit, size)
    typeface = face
    gravity = Gravity.CENTER
  }

  private fun lampDrawableId(): Int? {
    val id = resources.getIdentifier("landit_alarm_lamp", "drawable", packageName)
    return if (id == 0) null else id
  }

  // 앱 디자인 시스템의 입체 버튼 — 56dp 면 + 아래 5dp 진한 테두리, 둥글기 12dp. 누르면 면이 내려앉는다
  private fun liftButton(label: String, face: String, edge: String, textColor: String, onClick: () -> Unit): Button {
    val radius = dp(12).toFloat()
    val lift = dp(5)
    fun shape(color: String) = GradientDrawable().apply {
      cornerRadius = radius
      setColor(Color.parseColor(color))
    }
    val idle = android.graphics.drawable.LayerDrawable(arrayOf(shape(edge), shape(face))).apply {
      setLayerInset(0, 0, lift, 0, 0)
      setLayerInset(1, 0, 0, 0, lift)
    }
    val pressed = android.graphics.drawable.LayerDrawable(arrayOf(shape(face))).apply {
      setLayerInset(0, 0, lift, 0, 0)
    }
    return Button(this).apply {
      text = label
      isAllCaps = false
      setTextColor(Color.parseColor(textColor))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
      typeface = Typeface.DEFAULT_BOLD
      stateListAnimator = null
      setPadding(0, 0, 0, lift)
      background = android.graphics.drawable.StateListDrawable().apply {
        addState(intArrayOf(android.R.attr.state_pressed), pressed)
        addState(intArrayOf(), idle)
      }
      setOnClickListener { onClick() }
    }
  }

  // landit: 잠금을 풀고 나서 이 화면이 직접 앱을 연다 — 서비스가 열면 Android 12+가 백그라운드 실행으로 막는다.
  // 울림은 앱이 열리면서 끈다(completeNativeAlarmAsync). 잠금 해제를 취소하면 알람 화면에 그대로 남는다
  private fun openApp() {
    val id = alarmId ?: return
    val resolved = options ?: return
    val launch = {
      AlarmSchedulerNotifications.appIntent(this, id, resolved)?.let { runCatching { startActivity(it) } }
      finish()
    }
    val keyguard = getSystemService(KeyguardManager::class.java)
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || keyguard == null || !keyguard.isKeyguardLocked) {
      launch()
      return
    }
    keyguard.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
      override fun onDismissSucceeded() = launch()
    })
  }

  private fun stopAlarm() {
    val id = alarmId ?: return
    startService(
      Intent(this, AlarmSchedulerRingService::class.java).apply {
        action = AlarmSchedulerRingService.ACTION_STOP
        putExtra(AlarmSchedulerRingService.EXTRA_ALARM_ID, id)
      }
    )
    finish()
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

  companion object {
    private const val LAMP_WIDTH_DP = 270
    // 이 높이 이상이면 시안 그대로, TIGHT 이하면 램프·여백을 가장 작게
    private const val ROOMY_HEIGHT_DP = 760f
    private const val TIGHT_HEIGHT_DP = 600f
    fun intent(context: Context, alarmId: String): Intent {
      return Intent(context, AlarmSchedulerRingActivity::class.java).apply {
        action = Intent.ACTION_MAIN
        data = android.net.Uri.parse("alarm-scheduler-ring://$alarmId")
        putExtra(AlarmSchedulerRingService.EXTRA_ALARM_ID, alarmId)
        addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_SINGLE_TOP or
            Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS or
            Intent.FLAG_ACTIVITY_NO_USER_ACTION
        )
      }
    }
  }
}
