// 앱 안 별점 카드(Google Play 인앱 리뷰)를 띄우고 떴는지 돌려준다 — Play는 떴는지 알려주지 않아, 카드 단계가 바로 끝나는지로 알아낸다
package expo.modules.reviewprompt

import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import com.google.android.play.core.review.ReviewManagerFactory
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ReviewPromptModule : Module() {
  companion object {
    // Play 서버 왕복(requestReviewFlow)이 이 안에 안 끝나면 카드를 띄우지 않는다 — 웹이 답을 기다리는 시간(3.5초) 안에
    // 답하려면 왕복 + 카드 단계(1초)가 그 안에 들어야 한다. 늦은 왕복은 unavailable로 답해 스토어로 보낸다
    private const val REQUEST_FLOW_DEADLINE_MS = 2000L
    // Play 서버 왕복이 끝난 뒤 카드 단계(launchReviewFlow)만 잰다 — 망 속도는 판정에 안 들어간다.
    // 카드를 안 주면 이 단계가 수백 ms 안에 끝나고(실측 81~545ms), 주면 사용자가 별을 고르거나 닫을 때까지 안 끝난다.
    // 이 시간이 지나도록 안 끝났으면 떴다고 보고 바로 답한다 — 카드가 닫히길 기다리면 웹의 회신 대기를 넘긴다
    private const val SHOWN_THRESHOLD_MS = 1000L
    private const val PLAY_STORE_PACKAGE = "com.android.vending"
  }

  override fun definition() = ModuleDefinition {
    Name("ReviewPrompt")

    AsyncFunction("requestReview") { promise: Promise ->
      requestReview(promise)
    }
  }

  private fun requestReview(promise: Promise) {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    // Play 스토어가 없는 기기(사이드로드·일부 에뮬레이터)엔 카드가 없다
    if (!isPlayStoreInstalled(context.packageManager)) {
      promise.resolve("unavailable")
      return
    }

    var settled = false
    val finish: (String) -> Unit = { status ->
      if (!settled) {
        settled = true
        promise.resolve(status)
      }
    }
    val handler = Handler(Looper.getMainLooper())
    handler.postDelayed({ finish("unavailable") }, REQUEST_FLOW_DEADLINE_MS)

    val manager = ReviewManagerFactory.create(context)
    manager.requestReviewFlow().addOnCompleteListener { request ->
      // 마감 뒤에 온 응답 — 웹은 이미 스토어로 갔으니 카드를 띄우면 겹친다
      if (settled) return@addOnCompleteListener
      handler.removeCallbacksAndMessages(null)

      val reviewInfo = request.takeIf { it.isSuccessful }?.result
      // Play가 카드를 줄 수 없다고 답했거나, 왕복 사이 화면이 사라졌다 — 카드가 없는 것과 같다.
      // 리스너 안에서 throwingActivity가 던지면 promise가 아니라 앱이 죽는다
      val activity = appContext.currentActivity
      if (reviewInfo == null || activity == null) {
        finish("unavailable")
        return@addOnCompleteListener
      }

      handler.postDelayed({ finish("shown") }, SHOWN_THRESHOLD_MS)
      manager.launchReviewFlow(activity, reviewInfo)
        .addOnCompleteListener { finish("not_shown") }
    }
  }

  private fun isPlayStoreInstalled(packageManager: PackageManager): Boolean = try {
    packageManager.getPackageInfo(PLAY_STORE_PACKAGE, 0)
    true
  } catch (e: PackageManager.NameNotFoundException) {
    false
  }
}
