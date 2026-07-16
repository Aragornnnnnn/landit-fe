// 브릿지 HAPTIC 패턴을 expo-haptics 실제 호출로 매핑한다 (웹이 의도만 보내고, 세기·종류는 여기서 정한다)
import type { HapticPattern } from '@landit/bridge';
import * as Haptics from 'expo-haptics';

export const runHaptic = (pattern: HapticPattern): Promise<void> => {
  switch (pattern) {
    case 'selection':
      return Haptics.selectionAsync();
    case 'light':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'heavy':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    case 'success':
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    case 'warning':
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
    case 'error':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};
