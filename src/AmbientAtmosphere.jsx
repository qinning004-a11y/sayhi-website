import { useEffect, useRef } from 'react';

// Decorative layers share the artwork's space without intercepting its controls.
export default function AmbientAtmosphere({ paused = false, tone = 'ember' }) {
  const host = useRef(null);
  useEffect(() => {
    const element = host.current, parent = element.parentElement;
    let visible = false;
    const update = () => { element.dataset.running = String(visible && !document.hidden && !paused); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(parent);
    function move(event) {
      if (paused || event.pointerType === 'touch') return;
      const box = parent.getBoundingClientRect();
      element.style.setProperty('--drift-x', `${((event.clientX - box.left) / box.width - .5) * 26}px`);
      element.style.setProperty('--drift-y', `${((event.clientY - box.top) / box.height - .5) * 18}px`);
    }
    function reset() { element.style.setProperty('--drift-x', '0px'); element.style.setProperty('--drift-y', '0px'); }
    parent.addEventListener('pointermove', move, { passive: true });
    parent.addEventListener('pointerleave', reset);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); parent.removeEventListener('pointermove', move); parent.removeEventListener('pointerleave', reset); document.removeEventListener('visibilitychange', update); };
  }, [paused]);
  return <div ref={host} className={`ambient-atmosphere ambient-${tone}`} aria-hidden="true"><div className="ambient-depth"><span className="ambient-glow glow-one"/><span className="ambient-glow glow-two"/>{tone === 'paper' && <div className="paper-orbits"><span/><span/><span/></div>}{Array.from({ length: 18 }, (_, i) => <i className="ambient-mote" key={i} style={{ left: `${(i * 37 + 9) % 100}%`, top: `${(i * 23 + 13) % 100}%`, '--duration': `${9 + i % 7}s`, '--delay': `${-i * 1.7}s`, '--size': `${2 + i % 3}px` }}/>)}</div></div>;
}
