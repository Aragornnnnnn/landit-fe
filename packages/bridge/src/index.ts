export {
  hapticPatternSchema,
  type WebToNativeMessage,
  type NativeToWebMessage,
  type HapticPattern,
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
