// 홈 화면에 놓인 우리 위젯의 크기 목록을 돌려준다 — iOS는 설치·삭제 콜백이 없어 앱이 목록 차이로 알아낸다
import ExpoModulesCore
import WidgetKit

public class WidgetInventoryModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetInventory")

    // 놓인 위젯 하나당 크기 이름 하나 — 같은 크기를 둘 놓으면 두 번 나온다
    AsyncFunction("getInstalledFamilies") { (promise: Promise) in
      WidgetCenter.shared.getCurrentConfigurations { result in
        switch result {
        case .success(let infos):
          promise.resolve(infos.map { familyName($0.family) })
        case .failure(let error):
          promise.reject("ERR_WIDGET_INVENTORY", error.localizedDescription)
        }
      }
    }
  }
}

// WidgetKit 크기를 브릿지 어휘(small/medium/large)로 — 잠금 화면 등 우리가 안 만든 크기는 other
private func familyName(_ family: WidgetFamily) -> String {
  switch family {
  case .systemSmall: return "small"
  case .systemMedium: return "medium"
  case .systemLarge: return "large"
  default: return "other"
  }
}
