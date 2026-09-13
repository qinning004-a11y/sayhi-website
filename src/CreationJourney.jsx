import AmbientAtmosphere from './AmbientAtmosphere.jsx';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Play } from '@phosphor-icons/react';
const MascotModel = lazy(() => import('./MascotModel.jsx'));
const content = {
  zh: {
    kicker: '03 / 创作的力量', title: ['一个故事。', '不止一种生命。'], intro: '从文字里的想象，到镜头前的存在。',
    steps: ['故事构思', '人物设计', '模型搭建', 'AI 视频创作'],
    titles: ['先让故事，拥有引力。', '让想象，有一张面孔。', '从一个侧面，到完整世界。', '让角色，走进镜头。'],
    descriptions: ['人物的动机、世界的规则、出场的瞬间。每一次创作，都从值得讲述的故事开始。', '银发、红黑外套、鲜明的轮廓。把文字中的性格转化为可以辨认的视觉语言。', '从平面设定出发，建立角色的形体与材质，让每个角度都成为表达的一部分。', '场景、镜头与角色共同推进叙事。把想象转化为能够被看见、被感受的片段。'],
    tags: ['叙事 / 世界观 / 人物动机', '造型 / 色彩 / 三视图', '形体 / 材质 / 空间', '分镜 / 表演 / 影像'],
    note: '作品片段由项目方提供；故事文案、人物设定图与模型用于创作流程演示，并非原作制作档案。',
    play: '播放作品片段', caption: '主角出场 · 作品节选', story: '月色落向水面。\n一个身影，于雾中浮现。\n故事，从此刻开始。', brief: '出场段落 · 概念叙事', next: '下一步',
  },
  en: {
    kicker: '03 / THE POWER TO CREATE', title: ['One story.', 'More ways to live.'], intro: 'From an idea on the page to a presence on screen.',
    steps: ['Story', 'Character design', '3D modeling', 'AI filmmaking'],
    titles: ['Give a story its gravity.', 'Give imagination a face.', 'Every angle tells a story.', 'Bring the character to life.'],
    descriptions: ['Motivation, a world with its own rules, an unforgettable entrance. It begins with a story worth telling.', 'Silver hair. A red-and-black silhouette. Turn personality into a distinctive visual language.', 'Build form and materials from a visual concept, giving the character presence from every angle.', 'Characters, scenes and camera language come together to turn imagination into moving images.'],
    tags: ['NARRATIVE / WORLD / MOTIVATION', 'SILHOUETTE / COLOR / TURNAROUND', 'FORM / MATERIAL / SPACE', 'STORYBOARD / PERFORMANCE / FILM'],
    note: 'Footage supplied by the project owner. Story copy, design references and model illustrate the workflow; they are not original production records.',
    play: 'Play film excerpt', caption: 'A character arrives · Film excerpt', story: 'Moonlight touches the water.\nA figure emerges from the mist.\nHere, a story begins.', brief: 'CHARACTER ENTRANCE · CONCEPT', next: 'Next step',
  },
};
export default function CreationJourney({ lang, paused }) {
  const [step,setStep]=useState(0),[started,setStarted]=useState(false);
  const video=useRef(null), c=content[lang];
  useEffect(()=>{
    setStarted(false);
    const element=video.current;if(!element)return;
    const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)element.pause();});
    observer.observe(element);return()=>observer.disconnect();
  },[step]);
  useEffect(()=>{if(paused)video.current?.pause();},[paused]);
  function select(index){video.current?.pause();setStep(index);}
  function keys(e,index){const next=e.key==='ArrowRight'?(index+1)%4:e.key==='ArrowLeft'?(index+3)%4:e.key==='Home'?0:e.key==='End'?3:null;if(next!==null){e.preventDefault();select(next);document.getElementById(`creation-tab-${next}`)?.focus();}}
  return <section className="creation-section section-pad paper-scene" id="technology"><AmbientAtmosphere paused={paused} tone="paper"/>
    <div className="section-topline"><span className="eyebrow">{c.kicker}</span><span className="micro">FROM A SPARK TO THE SCREEN</span></div>
    <div className="creation-heading"><h2>{c.title[0]}<span>{c.title[1]}</span></h2><p>{c.intro}</p></div>
    <div className="creation-steps" role="tablist" aria-label={lang==='zh'?'创作流程':'Creation process'}>{c.steps.map((label,i)=><button key={label} id={`creation-tab-${i}`} role="tab" aria-selected={step===i} aria-controls="creation-panel" tabIndex={step===i?0:-1} onClick={()=>select(i)} onKeyDown={e=>keys(e,i)}><span>0{i+1}</span><strong>{label}</strong><ArrowRight size={18}/></button>)}</div>
    <div className={`creation-panel creation-step-${step}`} id="creation-panel" role="tabpanel" aria-labelledby={`creation-tab-${step}`}>
      <div className="creation-editorial"><div className="creation-index">0{step+1}<span>/ 04</span></div><span className="eyebrow">{c.tags[step]}</span><h3>{c.titles[step]}</h3><p>{c.descriptions[step]}</p><div className="creation-project"><span>{lang==='zh'?'范太岁':'FAN TAISUI'}</span><small>{step===3?c.caption:c.steps[step]}</small></div>{step<3&&<button className="text-button" onClick={()=>select(step+1)}>{c.next}<ArrowUpRight size={19}/></button>}</div>
      <div className="creation-media" key={step}>
        {step===0&&<div className="story-treatment"><span className="eyebrow">{c.brief}</span><p>{c.story}</p><span className="story-rule"/><small>SCENE 01 / NIGHT / WATER</small></div>}
        {step===1&&<figure className="character-sheet"><img src={`${import.meta.env.BASE_URL}assets/creation/character-views.png`} width="1536" height="1024" alt={lang==='zh'?'银发男主正面、侧面和背面设定图':'Silver-haired character turnaround'} loading="lazy"/><figcaption>CHARACTER STUDY / 001</figcaption></figure>}
        {step===2&&<div className="creation-model"><Suspense fallback={<span className="model-loading">Loading…</span>}><MascotModel source={`${import.meta.env.BASE_URL}assets/taisui.glb`} name={lang==='zh'?'范太岁':'Fan Taisui'} paused={paused} lang={lang}/></Suspense><span className="creation-model-hint">{lang==='zh'?'拖拽旋转 · 滚轮缩放':'DRAG TO ROTATE · SCROLL TO ZOOM'}</span></div>}
        {step===3&&<div className="film-stage"><img className="film-ambient" src={`${import.meta.env.BASE_URL}assets/creation/taisui-poster.jpg`} alt="" aria-hidden="true"/><video ref={video} src={`${import.meta.env.BASE_URL}assets/creation/taisui-showreel.mp4`} poster={`${import.meta.env.BASE_URL}assets/creation/taisui-poster.jpg`} controls playsInline preload="metadata" onPlay={()=>setStarted(true)} aria-label={c.caption}/>{!started&&<button className="film-play" onClick={()=>video.current?.play().catch(()=>setStarted(false))} aria-label={c.play}><Play size={23} weight="fill"/><span>{c.play}</span></button>}<span className="film-time">00:21 / FILM EXCERPT</span></div>}
      </div>
    </div>
    <p className="creation-note">{c.note}</p>
  </section>;
}
