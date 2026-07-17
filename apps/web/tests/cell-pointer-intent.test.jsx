import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCellPointerIntent } from '../src/application/useCellPointerIntent';

describe('useCellPointerIntent', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('maps a short primary press to exactly one reveal', () => {
    vi.useFakeTimers();
    const onReveal = vi.fn();
    const onFlag = vi.fn();
    const { result } = renderHook(() => useCellPointerIntent({ onReveal, onFlag }));

    act(() => result.current.onPointerDown({ button: 0 }, 2, 3));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.onPointerUp({ button: 0 }, 2, 3));

    expect(onReveal).toHaveBeenCalledOnce();
    expect(onFlag).not.toHaveBeenCalled();
  });

  it('maps a long press to exactly one flag without a trailing reveal', () => {
    vi.useFakeTimers();
    const onReveal = vi.fn();
    const onFlag = vi.fn();
    const { result } = renderHook(() => useCellPointerIntent({ onReveal, onFlag }));

    act(() => result.current.onPointerDown({ button: 0 }, 1, 1));
    act(() => vi.advanceTimersByTime(400));
    act(() => result.current.onPointerUp({ button: 0 }, 1, 1));

    expect(onFlag).toHaveBeenCalledWith(1, 1);
    expect(onReveal).not.toHaveBeenCalled();
  });

  it('cancels abandoned presses and handles desktop context menus as flags', () => {
    vi.useFakeTimers();
    const onReveal = vi.fn();
    const onFlag = vi.fn();
    const preventDefault = vi.fn();
    const { result } = renderHook(() => useCellPointerIntent({ onReveal, onFlag }));

    act(() => result.current.onPointerDown({ button: 0 }, 0, 0));
    act(() => result.current.onPointerLeave());
    act(() => vi.advanceTimersByTime(400));
    act(() => result.current.onContextMenu({ preventDefault, pointerType: 'mouse' }, 0, 1));

    expect(onReveal).not.toHaveBeenCalled();
    expect(onFlag).toHaveBeenCalledOnce();
    expect(onFlag).toHaveBeenCalledWith(0, 1);
    expect(preventDefault).toHaveBeenCalledOnce();
  });
});
