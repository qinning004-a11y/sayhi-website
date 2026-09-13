import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDown, ArrowUp, ArrowRight, X, List, Plus, Minus } from '@phosphor-icons/react';
import ShowcaseReel from './ShowcaseReel.jsx';
import AmbientAtmosphere from './AmbientAtmosphere.jsx';
import CreationJourney from './CreationJourney.jsx';
import { copy, products } from './content.js';

const MascotModel = lazy(() => import('./MascotModel.jsx'));
const PortalEffects = lazy(() => import('./PortalEffects.jsx'));
const sectionIds = ['world', 'products', 'universe'];
const poseData = [
  { src: `${import.meta.env.BASE_URL}assets/mascot-poses-8.png`, x: 18, width: 505, height: 941, sheet: 1672 },
  { src: `${import.meta.env.BASE_URL}assets/mascot-poses-10.png`, x: 578, width: 606, height: 941, sheet: 1672 },
  { src: `${import.meta.env.BASE_URL}assets/mascot-poses-11.png`, x: 1110, width: 562, height: 941, sheet: 1672 },
];

function Mascot({ pose = 1, className = '' }) {
  const p = poseData[pose];
  return <span className={`mascot-crop ${className}`} style={{ aspectRatio: `${p.width}/${p.height}` }} aria-hidden="true">
    <img src={p.src} draggable="false" alt="" style={{ width: `${p.sheet / p.width * 100}%`, left: `${-p.x / p.width * 100}%` }} />
  </span>;
}

function Brand({ onClick }) {
  return <a className="brand" href="#home" aria-label="Sayhi 四海 — Home" onClick={onClick}><span>sayhi<sup>®</sup></span><b>四海</b></a>;
}

function Preview({ product, lang, onClose }) {
  const dialog = useRef(null);
  const text = product[lang];
  const c = copy[lang];
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const focusables = dialog.current?.querySelectorAll('button, a[href]');
        if (!focusables?.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="preview-dialog" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="preview-title" onClick={e => e.stopPropagation()}>
      <button className="icon-button close-preview" onClick={onClose} aria-label={c.close}><X size={24}/></button>
      <div className="preview-art"><img src={product.image} alt={text.scene}/><span className="image-label">{c.concept}</span><div className="preview-scene"><span>{product.name}</span><h2 id="preview-title">{text.scene}</h2><p>{text.caption}</p></div></div>
      <div className="preview-description"><span className="eyebrow">{c.modalLabel}</span><p>{text.detail}</p><small>{c.modalNote}</small><button className="text-button" onClick={onClose}>{c.close}<ArrowUpRight size={18}/></button></div>
    </section>
  </div>;
}

export function App() {
  const [lang, setLang] = useState('zh');
  const [activeProduct, setActiveProduct] = useState(0);
  const [pose, setPose] = useState(0);
  const artworks = [{ name: '哪吒', source: `${import.meta.env.BASE_URL}assets/ne-zha.glb?v=e00eb89e12` }, { name: '范太岁', source: `${import.meta.env.BASE_URL}assets/taisui.glb` }, { name: '祢豆子', source: `${import.meta.env.BASE_URL}assets/anime.glb` }];
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [preview, setPreview] = useState(null);
  const hero = useRef(null);
  const footer = useRef(null);
  const ipStage = useRef(null);
  const menuToggle = useRef(null);
  const c = copy[lang];
  const product = products[activeProduct];
  const text = product[lang];

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh' ? '中文四海 Sayhi — 每一个故事，都是一个世界' : 'Sayhi & Co. — Every story. A whole new world.';
  }, [lang]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPaused(preference.matches);
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, []);
  useEffect(() => { document.documentElement.dataset.motion = paused ? 'paused' : 'active'; }, [paused]);
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    const navObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    ['home', ...sectionIds].forEach(id => { const el = document.getElementById(id); if (el) navObserver.observe(el); });
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); navObserver.disconnect(); };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    function escape(e) { if(e.key === 'Escape') { setMenuOpen(false); menuToggle.current?.focus(); } }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 701px)');
    const closeOnDesktop = () => { if (query.matches) setMenuOpen(false); };
    query.addEventListener('change', closeOnDesktop);
    return () => query.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    let timer;
    function transition(event) {
      const link = event.target.closest('a[href^="#"]');
      if (!link || paused || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      document.documentElement.classList.remove('chapter-transition');
      void document.documentElement.offsetWidth;
      document.documentElement.classList.add('chapter-transition');
      clearTimeout(timer);
      timer = setTimeout(() => document.documentElement.classList.remove('chapter-transition'), 850);
    }
    document.addEventListener('click', transition);
    return () => { document.removeEventListener('click', transition); clearTimeout(timer); document.documentElement.classList.remove('chapter-transition'); };
  }, [paused]);

  function tilt(e, ref) {
    if(paused || e.pointerType === 'touch') return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--pointer-x', `${(e.clientX - rect.left) / rect.width - .5}`);
    ref.current.style.setProperty('--pointer-y', `${(e.clientY - rect.top) / rect.height - .5}`);
  }
  function resetTilt(ref) { ref.current?.style.setProperty('--pointer-x', '0'); ref.current?.style.setProperty('--pointer-y', '0'); }
  function keyboardTabs(e, index) {
    const next = e.key === 'ArrowRight' ? (index + 1) % 3 : e.key === 'ArrowLeft' ? (index + 2) % 3 : e.key === 'Home' ? 0 : e.key === 'End' ? 2 : null;
    if (next !== null) { e.preventDefault(); setActiveProduct(next); document.getElementById(`product-tab-${next}`)?.focus(); }
  }

  return <>
    <a className="skip-link" href="#world">{lang === 'zh' ? '跳至主要内容' : 'Skip to content'}</a>
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <Brand onClick={() => setMenuOpen(false)}/>
      <nav className="desktop-nav" aria-label={lang === 'zh' ? '主导航' : 'Main navigation'}>{c.nav.map((label, i) => <a key={sectionIds[i]} className={activeSection === sectionIds[i] ? 'active' : ''} href={`#${sectionIds[i]}`}>{label}</a>)}</nav>
      <div className="header-right"><div className="language-switch" aria-label="Language"><button className={lang === 'zh' ? 'selected' : ''} aria-pressed={lang === 'zh'} onClick={() => setLang('zh')}>中文</button><span>/</span><button className={lang === 'en' ? 'selected' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button></div><button ref={menuToggle} className="icon-button menu-toggle" aria-label={menuOpen ? c.closeMenu : c.menu} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24}/> : <List size={24}/>}</button></div>
    </header>
    {menuOpen && <nav className="mobile-menu" id="mobile-menu" aria-label={c.menu}>{c.nav.map((label, i) => <a key={sectionIds[i]} href={`#${sectionIds[i]}`} onClick={() => setMenuOpen(false)}><span>0{i + 1}</span>{label}<ArrowUpRight size={25}/></a>)}</nav>}
    <div className="chapter-wipe" aria-hidden="true"/>
    <main>
      <section id="home" className="hero" ref={hero} onPointerMove={e => tilt(e, hero)} onPointerLeave={() => resetTilt(hero)}>
        <div className="hero-background" aria-hidden="true"/><AmbientAtmosphere paused={paused}/>
        <Suspense fallback={null}><PortalEffects paused={paused} variant="hero"/></Suspense>
        <div className="hero-copy"><p className="eyebrow hero-kicker">SAYHI & CO. / CHINESE CREATIVITY, GLOBAL STORIES</p><h1>{c.hero.map(line => <span key={line}>{line}</span>)}</h1><p className="hero-intro">{c.intro}</p><a href="#world" className="pill-button">{c.explore}<ArrowUpRight size={25} weight="bold"/></a></div>
        <div className="hero-character"><Mascot pose={1}/></div>
        <div className="hero-side-note"><span>{c.side}</span><span className="short-rule"/></div>
        <div className="hero-bottom"><div className="chapter-links">{products.map((p, index) => <a key={p.id} href="#products" className={activeProduct === index ? 'selected' : ''} onClick={() => setActiveProduct(index)}><span className="chapter-number">{p.number}</span><span>{p[lang].label}<small>{p.word}</small></span></a>)}</div><a className="scroll-hint" href="#world"><span>BEYOND THE FRAME</span><ArrowDown size={18}/></a></div>
      </section>
      <section id="world" className="world-section section-pad paper-scene"><AmbientAtmosphere paused={paused} tone="paper"/>
        <div className="section-topline reveal"><span className="eyebrow">01 / {c.aboutLabel}</span><span className="micro">IDEAS BECOME WORLDS.</span></div>
        <div className="world-grid"><h2 className="world-title reveal">{c.aboutTitle.map((line, i) => <span key={line} className={i === 1 ? 'muted' : ''}>{line}</span>)}</h2><div className="world-description reveal"><p>{c.aboutText}</p><a href="#products" className="text-button">{c.productLabel}<ArrowDown size={20}/></a></div></div>
        <div className="story-line reveal">{products.map((p, i) => <div key={p.id}><span className="micro">{p.number} / {p[lang].label}</span><strong>{p.word}</strong>{i < 2 && <ArrowRight className="journey-arrow" size={28} weight="thin"/>}</div>)}</div>
      </section>
      <section id="products" className="products-section section-pad" style={{ '--product-color': product.color }}>
        <div className="section-topline reveal"><span className="eyebrow">02 / {c.productLabel}</span><span className="micro">READ. WATCH. EXPLORE.</span></div>
        <div className="products-heading reveal"><h2>{c.productTitle}</h2><p>{c.productIntro}</p></div>
        <div className="product-tabs" role="tablist" aria-label={c.productLabel}>{products.map((p, i) => <button key={p.id} role="tab" id={`product-tab-${i}`} aria-selected={activeProduct === i} aria-controls="product-panel" tabIndex={activeProduct === i ? 0 : -1} onKeyDown={e => keyboardTabs(e, i)} onClick={() => setActiveProduct(i)}><span>{p.number}</span>{p.name}<ArrowUpRight size={20}/></button>)}</div>
        <div id="product-panel" role="tabpanel" aria-labelledby={`product-tab-${activeProduct}`} className="product-showcase">
          <div className="product-visual"><img key={product.image} src={product.image} loading="lazy" alt={text.scene}/><span className="image-label">{c.concept}</span><div className="visual-caption"><span>{product.word}</span><span>{text.scene}</span></div><button className="preview-circle" onClick={() => setPreview(product)} aria-label={`${c.preview} — ${product.name}`}><ArrowUpRight size={32}/></button></div>
          <div className="product-copy" key={product.id}><span className="eyebrow">{text.tag}</span><h3>{text.title}</h3><p>{text.description}</p><span className="product-format">{text.format}</span><button className="text-button" onClick={() => setPreview(product)}>{c.preview}<ArrowUpRight size={21}/></button></div>
        </div>
      </section>
      <ShowcaseReel lang={lang} paused={paused}/>
      <CreationJourney lang={lang} paused={paused}/>
      <section id="universe" className="ip-section section-pad"><div className="section-topline reveal"><span className="eyebrow">04 / {c.ipLabel}</span><span className="micro">CHARACTERS WITH CHARACTER.</span></div><div className="ip-grid"><div className="ip-copy reveal"><h2>{c.ipTitle.map(line => <span key={line}>{line}</span>)}</h2><p>{c.ipText}</p><div className="pose-buttons" aria-label={lang === 'zh' ? '模型作品' : 'Model artworks'}>{artworks.map(({ name: label }, i) => <button key={label} aria-pressed={pose === i} onClick={() => { setPose(i); }}><span>0{i + 1}</span>{label}</button>)}</div><small className="ip-caption">{lang === 'zh' ? '3D 作品展示 · 选择作品，自由探索' : '3D COLLECTION · SELECT & EXPLORE'}</small></div><div className="ip-stage" ref={ipStage}><AmbientAtmosphere paused={paused} tone="cool"/><span className="ip-watermark" aria-hidden="true">HI.</span><Suspense fallback={<div className="model-loading">Loading…</div>}><MascotModel key={artworks[pose].source} paused={paused} source={artworks[pose].source} name={artworks[pose].name} lang={lang}/></Suspense><div className="ip-stage-bottom"><span className="micro">{c.ipHint}</span><span className="micro">{artworks[pose].name} · 0{pose + 1} / 03</span></div></div></div></section>
      <footer id="contact" ref={footer} className="site-footer section-pad" onPointerMove={e => tilt(e, footer)} onPointerLeave={() => resetTilt(footer)}><AmbientAtmosphere paused={paused} tone="footer"/><div className="footer-top"><span className="eyebrow">{c.footerLabel}</span><span className="micro">THE NEXT CHAPTER IS YOURS.</span></div><a href="#home" className="footer-title" aria-label={c.back}><span className="footer-lettering">{c.footerTitle[0]}<br/><b>{c.footerTitle[1]}</b></span><span className="footer-arrow"><ArrowUpRight weight="thin"/></span></a><div className="footer-bottom"><Brand/><span>© {new Date().getFullYear()} SAYHI & CO.</span><span>{c.footerNote}</span><a href="#home" className="back-top" aria-label={c.back}><ArrowUp size={20}/></a></div></footer>
    </main>

    {preview && <Preview product={preview} lang={lang} onClose={() => setPreview(null)}/>}
  </>;
}
