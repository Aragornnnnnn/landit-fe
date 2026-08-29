// 앱을 홈 화면으로 내린다 — 위젯 설치 안내 끝에서 사용자가 직접 위젯을 얹으러 나가게 한다
import ExpoModulesCore
import UIKit

public class AppSuspenderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppSuspender")

    Function("goHome") {
      // 홈 버튼을 누른 것과 같은 백그라운드 전환. UIApplication의 비공개 suspend를
      // URLSessionTask.suspend라는 동명의 공개 셀렉터로 우회 호출한다 (메인 스레드에서)
      DispatchQueue.main.async {
        UIControl().sendAction(
          #selector(URLSessionTask.suspend),
          to: UIApplication.shared,
          for: nil
        )
      }
    }
  }
}
