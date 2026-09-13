import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default function MascotModel({ paused, source, name, lang }) {
  const host = useRef(null), pausedRef = useRef(paused);
  const [status, setStatus] = useState('loading');
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    const element = host.current, abort = new AbortController();
    let renderer, model, frame, disposed = false, visible = false, started = false;
    setStatus('loading');
    const scene = new THREE.Scene();
    function disposeModel(root) {
      const textures = new Set(), materials = new Set();
      root?.traverse(object => { object.geometry?.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean).forEach(m => materials.add(m)); });
      materials.forEach(m => { Object.values(m).forEach(v => { if(v?.isTexture) textures.add(v); }); m.dispose(); });
      textures.forEach(t => { t.source?.data?.close?.(); t.dispose(); });
    }
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setStatus('error'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    element.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(35, 1, .01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false; controls.enableZoom = true;
    controls.enableDamping = true; controls.dampingFactor = .08;
    controls.autoRotate = false;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x667080, 2));
    for (const [color, intensity, position] of [[0xfff2e5, 2.8, [3,5,5]], [0xc7d9ff, 1.4, [-4,2,1]], [0xffffff, 2, [0,3,-4]]]) {
      const light = new THREE.DirectionalLight(color,intensity);light.position.set(...position);scene.add(light);
    }
    const scan = { value: -1.3 }, finish = { value: 0 };
    let size = new THREE.Vector3(2,2,2), elapsed = 0;
    function fit() {
      const distance = Math.max(size.y,size.x/camera.aspect) / (2*Math.tan(THREE.MathUtils.degToRad(17.5))) * 1.1 + size.z/2;
      camera.position.set(0,size.y*.03,distance);controls.target.set(0,0,0);controls.minDistance=distance*.45;controls.maxDistance=distance*2;controls.update();
    }
    function resize() {
      const {width,height}=element.getBoundingClientRect();if(!width||!height)return;
      renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();fit();renderer.render(scene,camera);
    }
    const ro = new ResizeObserver(resize);ro.observe(element);
    async function load() {
      if(started)return;started=true;
      try {
        const response=await fetch(source,{signal:abort.signal});if(!response.ok)throw new Error('Model unavailable');
        const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
        if(disposed){disposeModel(gltf.scene);return;}
        model=gltf.scene;
        const bounds=new THREE.Box3().setFromObject(model), center=bounds.getCenter(new THREE.Vector3());
        const scale=2/bounds.getSize(new THREE.Vector3()).y;
        model.scale.multiplyScalar(scale);model.position.sub(center.multiplyScalar(scale));
        scene.add(model);new THREE.Box3().setFromObject(model).getSize(size);
        model.traverse(object => {
          if(!object.isMesh)return;
          for(const material of (Array.isArray(object.material)?object.material:[object.material])) {
            // Keep the supplied PBR textures and material values. Only the entrance is shaded.
            material.onBeforeCompile=shader=>{
              shader.uniforms.uScan=scan;shader.uniforms.uFinish=finish;
              shader.vertexShader='varying vec3 vScanPosition;\n'+shader.vertexShader;
              shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvScanPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
              shader.fragmentShader='uniform float uScan; uniform float uFinish; varying vec3 vScanPosition;\n'+shader.fragmentShader;
              shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
                if(uFinish<1.0){
                  float edge=1.0-smoothstep(0.0,0.075,abs(vScanPosition.y-uScan));
                  float above=step(uScan,vScanPosition.y);
                  float lines=step(0.80,fract(vScanPosition.y*65.0));
                  if(above>0.5 && lines<0.5) discard;
                  vec3 hologram=vec3(0.15,0.85,1.0);
                  gl_FragColor.rgb=mix(gl_FragColor.rgb,hologram,above*0.85*(1.0-uFinish));
                  gl_FragColor.rgb+=hologram*edge*1.4*(1.0-uFinish);
                }`);
            };
            material.needsUpdate=true;
          }
        });
        elapsed=0;fit();setStatus('ready');
      } catch(error) { if(!disposed && error.name!=='AbortError')setStatus('error'); }
    }
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)load();},{rootMargin:'150px'});observer.observe(element);
    let previous=0;
    function draw(now) {
      frame=requestAnimationFrame(draw);const delta=Math.min((now-previous)/1000,.05);previous=now;
      if(!visible||document.hidden)return;
      if(model){elapsed+=pausedRef.current?3:delta;scan.value=-1.2+Math.min(elapsed/1.8,1)*2.4;finish.value=Math.min(Math.max((elapsed-1.8)/.35,0),1);element.dataset.entrance=finish.value===1?'complete':'scanning';}
      controls.update(delta);renderer.render(scene,camera);
    }
    function lost(e){e.preventDefault();cancelAnimationFrame(frame);setStatus('error');}
    renderer.domElement.addEventListener('webglcontextlost',lost);
    resize();frame=requestAnimationFrame(draw);
    return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();ro.disconnect();controls.dispose();disposeModel(model);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.domElement.remove();};
  },[source]);
  return <div className="model-viewer" data-status={status}>
    <div className="model-canvas" ref={host} role="img" aria-label={`${name} — ${lang==='zh'?'拖拽旋转，滚轮缩放':'Drag to rotate, scroll to zoom'}`} style={{visibility:status==='ready'?'visible':'hidden'}}/>
    {status!=='ready'&&<div className="model-loading" role="status"><span className="scan-loader"/><strong>{name}</strong><span>{lang==='zh'?(status==='loading'?'正在载入作品…':'作品载入失败，请切换作品后重试'):(status==='loading'?'Loading artwork…':'Unable to load. Switch artworks to retry.')}</span></div>}
  </div>;
}
