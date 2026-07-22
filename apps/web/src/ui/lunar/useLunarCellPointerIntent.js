import { useCallback, useEffect, useRef } from 'react';

export const CELL_LONG_PRESS_MS = 400;
export const CELL_PAN_THRESHOLD_PX = 8;

export function useLunarCellPointerIntent({ onIntent, locked }) {
  const gestureRef = useRef(null);
  const suppressClickRef = useRef(false);

  const clearGesture = useCallback(() => {
    if (gestureRef.current?.timer != null) window.clearTimeout(gestureRef.current.timer);
    gestureRef.current = null;
  }, []);

  useEffect(() => clearGesture, [clearGesture]);

  const onPointerDown = useCallback(
    (event, cell) => {
      if (locked || event.pointerType !== 'touch' || event.button !== 0) return;
      clearGesture();
      const gesture = {
        cell,
        x: event.clientX,
        y: event.clientY,
        moved: false,
        longPressed: false,
        timer: null,
      };
      gesture.timer = window.setTimeout(() => {
        gesture.longPressed = true;
        gesture.timer = null;
        suppressClickRef.current = true;
        if (gesture.cell.canFlag) {
          onIntent({ kind: 'flag', row: gesture.cell.row, column: gesture.cell.column });
        }
      }, CELL_LONG_PRESS_MS);
      gestureRef.current = gesture;
    },
    [clearGesture, locked, onIntent],
  );

  const onPointerMove = useCallback(
    (event) => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerType !== 'touch') return;
      if (
        Math.abs(event.clientX - gesture.x) >= CELL_PAN_THRESHOLD_PX ||
        Math.abs(event.clientY - gesture.y) >= CELL_PAN_THRESHOLD_PX
      ) {
        gesture.moved = true;
        suppressClickRef.current = true;
        clearGesture();
      }
    },
    [clearGesture],
  );

  const onPointerUp = useCallback(
    (event) => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerType !== 'touch') return;
      if (gesture.timer !== null) window.clearTimeout(gesture.timer);
      if (!gesture.moved && !gesture.longPressed && gesture.cell.canReveal && !locked) {
        suppressClickRef.current = true;
        onIntent({ kind: 'reveal', row: gesture.cell.row, column: gesture.cell.column });
      }
      gestureRef.current = null;
    },
    [locked, onIntent],
  );

  const onClick = useCallback(
    (cell) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (!locked && cell.canReveal)
        onIntent({ kind: 'reveal', row: cell.row, column: cell.column });
    },
    [locked, onIntent],
  );

  const onContextMenu = useCallback(
    (event, cell) => {
      event.preventDefault();
      if (!locked && event.pointerType !== 'touch' && cell.canFlag) {
        onIntent({ kind: 'flag', row: cell.row, column: cell.column });
      }
    },
    [locked, onIntent],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: clearGesture,
    onClick,
    onContextMenu,
  };
}
