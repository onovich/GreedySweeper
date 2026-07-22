import './primitives.css';

export function LunarPanel({ as: Element = 'section', className = '', tone = 'panel', ...props }) {
  return <Element className={`gs-panel gs-panel--${tone} ${className}`.trim()} {...props} />;
}

export function LunarButton({ className = '', variant = 'primary', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`gs-button gs-button--${variant} ${className}`.trim()}
      {...props}
    />
  );
}

export function StatusText({ as: Element = 'p', className = '', tone = 'neutral', ...props }) {
  return <Element className={`gs-status gs-status--${tone} ${className}`.trim()} {...props} />;
}
