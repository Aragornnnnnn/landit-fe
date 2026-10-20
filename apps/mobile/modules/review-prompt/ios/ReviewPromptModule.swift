// 앱 안 별점 카드(OS 리뷰 요청)를 띄우고 떴는지 돌려준다 — iOS는 콜백이 없어, 카드가 별도 창으로 뜨는 것을 보고 알아낸다
import ExpoModulesCore
import StoreKit
import UIKit

public class ReviewPromptModule: Module {
  // 카드가 뜨면 이 안에 창이 보인다. 안 뜨면 아무 일도 없으니 이만큼 기다리고 not_shown으로 답한다.
  // 실측(iPhone 13, 콜드 스타트 포함) 38~44ms에 창이 보였다 — 12배 여유를 두고 사용자 대기는 0.5초로 묶는다
  private static let detectWindowSeconds: Double = 0.5

  public func definition() -> ModuleDefinition {
    Name("ReviewPrompt")

    AsyncFunction("requestReview") { (promise: Promise) in
      DispatchQueue.main.async {
        var observer: NSObjectProtocol?
        var settled = false
        let finish: (String) -> Void = { status in
          guard !settled else { return }
          settled = true
          if let observer { NotificationCenter.default.removeObserver(observer) }
          promise.resolve(status)
        }

        // 별점 카드는 StoreKit이 자기 창(SKStoreReviewPresentationWindow)을 띄운다 — 창이 보이는 순간이 "떴다"
        observer = NotificationCenter.default.addObserver(
          forName: UIWindow.didBecomeVisibleNotification,
          object: nil,
          queue: .main
        ) { notification in
          guard let window = notification.object as? UIWindow else { return }
          let className = NSStringFromClass(type(of: window))
          if className.contains("StoreReview") { finish("shown") }
        }

        guard
          let scene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
        else {
          finish("not_shown")
          return
        }

        AppStore.requestReview(in: scene)

        DispatchQueue.main.asyncAfter(deadline: .now() + Self.detectWindowSeconds) {
          finish("not_shown")
        }
      }
    }
  }
}
