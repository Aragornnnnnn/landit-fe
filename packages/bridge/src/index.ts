export {
  hapticPatternSchema,
  notificationPermissionStatusSchema,
  widgetDataSchema,
  widgetFamilySchema,
  widgetChangeSchema,
  EMPTY_WIDGET_DATA,
  type WebToNativeMessage,
  type NativeToWebMessage,
  type HapticPattern,
  type NotificationPermissionStatus,
  type WidgetData,
  type WidgetFamily,
  type WidgetChange,
} from './messages';

export {
  parseWebToNativeMessage,
  parseNativeToWebMessage,
  serializeBridgeMessage,
} from './serialization';

export {
  NATIVE_BRIDGE_VERSION,
  NATIVE_CONTEXT_GLOBAL,
  nativeContextSchema,
  buildNativeContextScript,
  readNativeContext,
  type NativeContext,
} from './nativeContext';
