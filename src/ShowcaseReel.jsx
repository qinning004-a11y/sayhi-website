import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from '@phosphor-icons/react';
import AmbientAtmosphere from './AmbientAtmosphere.jsx';
const works = [
  { image: 'showcase-2.png', title: ['镇海太岁', 'Guardian of the Sea'], subtitle: 'FANTASY ADVENTURE', line: ['想象越过海面，故事奔向远方。', 'Beyond the waves. Beyond imagination.'] },
  { image: 'showcase-0.png', title: ['甲骨天师', 'Oracle Masters'], subtitle: 'URBAN FANTASY', line: ['城市之下，另一个世界正在苏醒。', 'Another world awakens beneath the city.'] },
  { image: 'showcase-1.png', title: ['夏枯雪', 'Kuso'], subtitle: 'CHARACTER PORTRAIT', line: ['一个眼神，便是一整个故事。', 'A whole story in a single glance.'] },
];
export default function ShowcaseReel({ lang, paused }) {
  const [index, setIndex] = useState(0), [localPaused, setLocalPaused] = useState(false), [visible, setVisible] = useState(false), [pageVisible, setPageVisible] = useState(!document.hidden);
  const root = useRef(null), elapsed = useRef(0), language = lang === 'zh' ? 0 : 1;
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(root.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const running = visible && pageVisible && !localPaused && !paused;
  function select(next) { elapsed.current = 0; root.current?.style.setProperty('--reel-progress', '0'); setIndex(next); }
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      elapsed.current += now - last; last = now;
      if (elapsed.current >= 6500) { elapsed.current = 0; setIndex(i => (i + 1) % works.length); }
      root.current?.style.setProperty('--reel-progress', String(elapsed.current / 6500));
    }, 50);
    return () => clearInterval(timer);
  }, [running]);
  return <section className="showcase-reel" data-running={running} ref={root} aria-roledescription={lang === 'zh' ? '轮播' : 'carousel'} aria-label={lang === 'zh' ? '作品视觉精选' : 'Selected visuals'}>
    {works.map((work, i) => <div key={work.image} className={`reel-slide ${index === i ? 'is-active' : ''}`} aria-hidden={index !== i}><img src={`${import.meta.env.BASE_URL}assets/showcase/${work.image}`} alt="" loading="lazy"/><div className="reel-shade"/><div className="reel-copy"><span className="eyebrow">{work.subtitle}</span><h3>{work.title[language]}</h3><p>{work.line[language]}</p></div></div>)}
    <AmbientAtmosphere paused={!running}/>
    <div className="reel-atmosphere" aria-hidden="true"><i/><i/><i/></div>
    <div className="reel-top"><span>SELECTED WORLDS / 2026</span><span>{lang === 'zh' ? '作品视觉 · AI 艺术重构' : 'AI-REIMAGINED KEY VISUALS'}</span></div>
    <div className="reel-bottom"><div className="reel-pagination">{works.map((work, i) => <button key={work.image} onClick={() => select(i)} aria-label={work.title[language]} aria-pressed={index === i}><span>0{i + 1}</span><i><b/></i></button>)}</div><div className="reel-arrows"><button className="reel-playback" onClick={() => setLocalPaused(p => !p)} disabled={paused} aria-pressed={localPaused || paused} aria-label={lang === 'zh' ? (paused ? '系统已开启减少动态效果' : localPaused ? '播放轮播' : '暂停轮播') : paused ? 'System reduced motion is enabled' : localPaused ? 'Play carousel' : 'Pause carousel'}>{localPaused || paused ? <Play size={18} weight="fill"/> : <Pause size={18} weight="fill"/>}</button><button onClick={() => select((index + 2) % works.length)} aria-label={lang === 'zh' ? '上一张作品' : 'Previous artwork'}><ArrowLeft size={21}/></button><button onClick={() => select((index + 1) % works.length)} aria-label={lang === 'zh' ? '下一张作品' : 'Next artwork'}><ArrowRight size={21}/></button></div></div>
  </section>;
}
