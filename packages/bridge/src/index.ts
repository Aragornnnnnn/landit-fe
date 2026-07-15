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
