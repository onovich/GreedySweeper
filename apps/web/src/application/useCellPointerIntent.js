import { useCallback, useEffect, useRef } from 'react';
import { TIMING_CONFIG } from '../game/config/game-config';

export function useCellPointerIntent({
  onReveal,
  onFlag,
  longPressMs = TIMING_CONFIG.longPressMs,
}) {
  const timerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  const clearPendingPress = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingPress, [clearPendingPress]);

  const onPointerDown = useCallback(
    (event, row, column) => {
      if (event.button === 2) return;

      clearPendingPress();
      longPressTriggeredRef.current = false;
      timerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        timerRef.current = null;
        onFlag(row, column);
      }, longPressMs);
    },
    [clearPendingPress, longPressMs, onFlag],
  );

  const onPointerUp = useCallback(
    (event, row, column) => {
      if (event.button === 2) return;

      const hasPendingPress = timerRef.current !== null;
      clearPendingPress();
      if (hasPendingPress && !longPressTriggeredRef.current) {
        onReveal(row, column);
      }
    },
    [clearPendingPress, onReveal],
  );

  const onPointerLeave = useCallback(() => {
    clearPendingPress();
  }, [clearPendingPress]);

  const onContextMenu = useCallback(
    (event, row, column) => {
      event.preventDefault();
      if (event.pointerType !== 'touch') {
        onFlag(row, column);
      }
    },
    [onFlag],
  );

  return { onPointerDown, onPointerUp, onPointerLeave, onContextMenu };
}
