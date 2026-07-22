import './utility-drawer.css';
import { useState } from 'react';
import { LunarButton, LunarPanel, StatusText } from './primitives';

export function UtilityDrawer({ viewModel, onIntent = () => {} }) {
  const tab = viewModel.utilities.activeTab;
  return (
    <LunarPanel className="gs-utility-drawer" aria-labelledby="gs-utility-title">
      <header className="gs-utility-drawer__heading">
        <div>
          <p>UTILITY CHANNEL</p>
          <h2 id="gs-utility-title">{tabTitle(tab)}</h2>
        </div>
        <span>{viewModel.utilities.state.toUpperCase()}</span>
      </header>
      {tab === 'challenge' && <ChallengePanel viewModel={viewModel} onIntent={onIntent} />}
      {tab === 'replay' && <ReplayPanel viewModel={viewModel} onIntent={onIntent} />}
      {tab === 'record' && (
        <RecordPanel
          count={viewModel.utilities.recordCount}
          progression={viewModel.utilities.progression}
          onIntent={onIntent}
        />
      )}
      {tab === 'room' && (
        <RoomPanel
          connection={viewModel.connection}
          terminal={viewModel.terminal}
          onIntent={onIntent}
        />
      )}
    </LunarPanel>
  );
}

function ChallengePanel({ viewModel, onIntent }) {
  const [code, setCode] = useState('');
  return (
    <section className="gs-utility-content" aria-label="挑战工具">
      <label className="gs-field">
        <span>挑战码</span>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.trim())}
          autoComplete="off"
        />
      </label>
      <div className="gs-utility-actions">
        <LunarButton
          disabled={!code}
          onClick={() => onIntent({ kind: 'challenge', action: 'code', code })}
        >
          挑战码
        </LunarButton>
        <LunarButton onClick={() => onIntent({ kind: 'challenge', action: 'daily' })}>
          每日挑战
        </LunarButton>
      </div>
      {viewModel.utilities.challengeError && (
        <StatusText tone="danger" role="alert">
          挑战码无效，请检查后重试。
        </StatusText>
      )}
    </section>
  );
}

function ReplayPanel({ viewModel, onIntent }) {
  const replay = viewModel.utilities.replay ?? {};
  const available = Boolean(replay.available || viewModel.session.kind === 'replay');
  return (
    <section className="gs-utility-content" aria-label="回放工具">
      <StatusText>{available ? '回放已就绪 · 对局操作保持锁定' : '暂无可回放记录'}</StatusText>
      <div className="gs-utility-actions">
        <LunarButton
          disabled={!available}
          onClick={() => onIntent({ kind: 'replay', action: 'toggle' })}
        >
          {replay.playing ? '暂停' : replay.isReplaying ? '继续播放' : '开始回放'}
        </LunarButton>
        <LunarButton
          disabled={!available}
          onClick={() => onIntent({ kind: 'replay', action: 'step' })}
        >
          单步
        </LunarButton>
        {viewModel.session.kind === 'replay' && (
          <>
            <LunarButton onClick={() => onIntent({ kind: 'replay', action: 'reset' })}>
              回到开头
            </LunarButton>
            <LunarButton onClick={() => onIntent({ kind: 'replay', action: 'exit' })}>
              退出回放
            </LunarButton>
          </>
        )}
      </div>
    </section>
  );
}

function RecordPanel({ count, progression, onIntent }) {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <section className="gs-utility-content" aria-label={count === 0 ? '空记录' : '对局记录'}>
      <div>
        <strong>{count === 0 ? '暂无对局记录' : `本地已保存 ${count} 份对局记录`}</strong>
        <StatusText>
          完成 {progression?.stats?.completedGames ?? 0} 局 · 胜利 {progression?.stats?.wins ?? 0}{' '}
          局
        </StatusText>
      </div>
      <div className="gs-utility-actions">
        <LunarButton
          disabled={count === 0}
          onClick={() => onIntent({ kind: 'record', action: 'open' })}
        >
          检查记录
        </LunarButton>
        <LunarButton
          variant={confirmReset ? 'danger' : 'quiet'}
          onClick={() => {
            if (confirmReset) onIntent({ kind: 'progression', action: 'reset', confirmed: true });
            setConfirmReset((value) => !value);
          }}
        >
          {confirmReset ? '确认清空本地进度' : '清空本地进度'}
        </LunarButton>
      </div>
    </section>
  );
}

export function RoomPanel({ connection, terminal, onIntent }) {
  if (!connection) {
    return (
      <section className="gs-utility-empty" aria-label="房间未连接">
        <strong>当前是本地对局</strong>
        <StatusText>创建或检查邀请，进入权威联机对局。</StatusText>
        <LunarButton onClick={() => onIntent({ kind: 'room', action: 'create' })}>
          创建房间
        </LunarButton>
      </section>
    );
  }
  const copy = roomCopy(connection.state);
  const terminalState = ['replaced', 'abandoned', 'verification-failed', 'verified'].includes(
    connection.state,
  );
  return (
    <section className="gs-room-panel" data-state={connection.state} aria-label="联机房间状态">
      <div className="gs-room-summary">
        <span>ROOM</span>
        <strong>{connection.roomCode}</strong>
        <small>{connection.rulesetLabel}</small>
      </div>
      <div>
        <h3>{copy.title}</h3>
        <StatusText
          tone={
            connection.state === 'error' || connection.state === 'verification-failed'
              ? 'danger'
              : 'neutral'
          }
        >
          {copy.message}
        </StatusText>
      </div>
      {['idle', 'unavailable', 'error'].includes(connection.state) && (
        <RoomEntry connection={connection} onIntent={onIntent} />
      )}
      {terminalState && <TerminalStatus connection={connection} terminal={terminal} />}
      {copy.action && (
        <LunarButton
          disabled={!connection.recoverable && copy.action === 'retry'}
          onClick={() => onIntent({ kind: 'room', action: copy.action })}
        >
          {copy.actionLabel}
        </LunarButton>
      )}
    </section>
  );
}

function RoomEntry({ connection, onIntent }) {
  const [roomCode, setRoomCode] = useState(
    typeof location === 'undefined'
      ? ''
      : (new URLSearchParams(location.search).get('room') ?? '').toUpperCase(),
  );
  const disabled = connection.state === 'unavailable';
  return (
    <div className="gs-room-entry">
      <div className="gs-utility-actions">
        <LunarButton
          disabled={disabled}
          onClick={() => onIntent({ kind: 'room', action: 'create', ruleset: 'classic-v1' })}
        >
          创建 Classic
        </LunarButton>
        <LunarButton
          disabled={disabled}
          onClick={() => onIntent({ kind: 'room', action: 'create', ruleset: 'greed-v2' })}
        >
          创建 Greed
        </LunarButton>
      </div>
      <label className="gs-field">
        <span>邀请房间码</span>
        <input
          value={roomCode}
          disabled={disabled}
          maxLength={8}
          autoComplete="off"
          onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
        />
      </label>
      <LunarButton
        disabled={disabled || !roomCode}
        onClick={() => onIntent({ kind: 'room', action: 'inspect', roomCode })}
      >
        检查邀请
      </LunarButton>
    </div>
  );
}

export function TerminalStatus({ connection, terminal }) {
  const danger = ['replaced', 'verification-failed'].includes(connection.state);
  return (
    <section
      className={`gs-terminal-status${danger ? ' gs-terminal-status--danger' : ''}`}
      role={danger ? 'alert' : 'status'}
    >
      <strong>{terminal?.title ?? roomCopy(connection.state).title}</strong>
      <span>
        {connection.state === 'verified' ? '结果已验证，可计入本地进度' : '对局操作已结束'}
      </span>
    </section>
  );
}

function tabTitle(tab) {
  return { challenge: '挑战', replay: '回放', record: '记录', room: '房间' }[tab] ?? '工具';
}

function roomCopy(state) {
  return (
    {
      unavailable: { title: '联机不可用', message: '此构建未配置联机端点。' },
      idle: {
        title: '联机待命',
        message: '创建房间或检查邀请。',
        action: 'create',
        actionLabel: '创建房间',
      },
      creating: { title: '正在创建', message: '等待服务端分配房间。' },
      waiting: { title: '等待对手', message: '分享房间码并等待对手加入。' },
      inspecting: { title: '正在检查', message: '正在读取不可变规则。' },
      review: {
        title: '检查规则',
        message: '接受后加入此 Greed v2 对局。',
        action: 'join',
        actionLabel: '接受并加入',
      },
      joining: { title: '正在加入', message: '等待席位确认。' },
      ready: {
        title: '席位就绪',
        message: '建立权威连接后开始。',
        action: 'connect',
        actionLabel: '连接房间',
      },
      authenticating: { title: '正在认证', message: '正在验证本席位。' },
      connected: { title: '已连接', message: '棋盘由权威服务端驱动。' },
      'command-pending': { title: '等待确认', message: '保留上一份权威状态，不进行乐观更新。' },
      reconnecting: {
        title: '正在重连',
        message: '正在取回席位与最后权威快照。',
        action: 'retry',
        actionLabel: '立即重试',
      },
      paused: { title: '对局暂停', message: '等待缺席席位重连。' },
      replaced: { title: '席位已替换', message: '另一连接已接管此席位，不会自动重试。' },
      abandoned: { title: '对局已中止', message: '无人获胜，本局不计入进度。' },
      'verification-failed': {
        title: '结果验证失败',
        message: '完整性校验失败，不展示为已验证结果。',
      },
      verified: { title: '结果已验证', message: '终局证明有效，可计入本地进度。' },
      error: {
        title: '联机请求失败',
        message: '权威状态保持不变，可以安全重试。',
        action: 'retry',
        actionLabel: '重试',
      },
    }[state] ?? { title: '未知状态', message: '等待可识别的权威状态。' }
  );
}
