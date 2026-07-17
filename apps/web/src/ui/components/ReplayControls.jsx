import { Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react';

export function ReplayControls({ replay }) {
  if (!replay.isAvailable) return null;

  if (!replay.isReplaying) {
    return (
      <button
        type="button"
        onClick={replay.start}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-800 bg-teal-950 px-4 py-3 text-sm font-bold text-teal-100 transition-colors hover:bg-teal-900 sm:w-auto"
      >
        <Play aria-hidden="true" className="h-4 w-4" /> Replay moves ({replay.total})
      </button>
    );
  }

  return (
    <section
      className="flex flex-col gap-2 rounded-xl border border-teal-900 bg-teal-950/40 p-3 sm:flex-row sm:items-center"
      aria-label="Replay controls"
    >
      <p className="text-xs font-bold text-teal-200">
        Replay {replay.position} / {replay.total} · {replay.aiPolicy?.difficulty ?? 'normal'} /{' '}
        {replay.aiPolicy?.style ?? 'balanced'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={replay.togglePlay} className="replay-button">
          {replay.isPlaying ? (
            <Pause aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Play aria-hidden="true" className="h-4 w-4" />
          )}
          {replay.isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={replay.step}
          className="replay-button"
          disabled={replay.position >= replay.total}
        >
          <SkipForward aria-hidden="true" className="h-4 w-4" /> Step
        </button>
        <button type="button" onClick={replay.reset} className="replay-button">
          <RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset
        </button>
        <button type="button" onClick={replay.exit} className="replay-button">
          <X aria-hidden="true" className="h-4 w-4" /> Exit
        </button>
      </div>
    </section>
  );
}
