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
    // Play 서버 왕복(requestReviewFlow)이 끝난 뒤 카드 단계(launchReviewFlow)만 잰다 — 망 속도는 판정에 안 들어간다.
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

    val manager = ReviewManagerFactory.create(context)
    manager.requestReviewFlow().addOnCompleteListener { request ->
      val reviewInfo = request.takeIf { it.isSuccessful }?.result
      if (reviewInfo == null) {
        // Play가 카드를 줄 수 없다고 답한 것 — 카드가 없는 것과 같다
        promise.resolve("unavailable")
        return@addOnCompleteListener
      }

      var settled = false
      val finish: (String) -> Unit = { status ->
        if (!settled) {
          settled = true
          promise.resolve(status)
        }
      }
      val handler = Handler(Looper.getMainLooper())
      handler.postDelayed({ finish("shown") }, SHOWN_THRESHOLD_MS)
      manager.launchReviewFlow(appContext.throwingActivity, reviewInfo)
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
