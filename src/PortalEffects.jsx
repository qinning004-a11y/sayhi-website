import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Genuine 3D particle field; supplied mascot is an independent 2D brand asset.
export default function PortalEffects({ paused, variant }) {
  const host = useRef(null);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' }); }
    catch { element.dataset.renderer = 'fallback'; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    element.appendChild(renderer.domElement);
    element.dataset.renderer = 'webgl';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 7;
    const count = window.innerWidth < 700 ? 75 : variant === 'ip' ? 110 : 190;
    const positions = new Float32Array(count * 3), sizes = new Float32Array(count), phases = new Float32Array(count);
    let seed = 57;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < count; i++) {
      positions[i * 3] = variant === 'ip' ? (random() - .5) * 7 : random() * 6 - .5;
      positions[i * 3 + 1] = (random() - .5) * 7;
      positions[i * 3 + 2] = (random() - .5) * 5;
      sizes[i] = random() * 2.3 + .8;
      phases[i] = random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(variant === 'ip' ? '#ff4432' : '#ffb078') } },
      vertexShader: `attribute float aSize; attribute float aPhase; uniform float uTime; varying float vOpacity;
        void main(){ vec3 p=position; p.y=mod(p.y+3.5+uTime*0.065,7.0)-3.5; p.x+=sin(uTime*0.22+aPhase)*0.12;
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=aSize*(8.0/-mv.z);
        vOpacity=0.22+0.35*(0.5+0.5*sin(uTime+aPhase)); }`,
      fragmentShader: `uniform vec3 uColor; varying float vOpacity; void main(){float r=length(gl_PointCoord-0.5)*2.0; if(r>1.0)discard; gl_FragColor=vec4(uColor,pow(1.0-r,1.6)*vOpacity);}`,
    });
    const particles = new THREE.Points(geometry, material); scene.add(particles);
    let visible = false, alive = true, frame = 0, lastTime = 0, elapsed = 0, lastDraw = 0;
    const pointer = new THREE.Vector2(), parent = element.parentElement;
    function pointerMove(event) { const box = parent.getBoundingClientRect(); pointer.set((event.clientX - box.left) / box.width - .5, (event.clientY - box.top) / box.height - .5); }
    function pointerLeave() { pointer.set(0, 0); }
    function resize() { const { width, height } = element.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.render(scene, camera); }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }); observer.observe(element);
    parent.addEventListener('pointermove', pointerMove, { passive: true }); parent.addEventListener('pointerleave', pointerLeave);
    function draw(now) {
      if (!alive) return;
      frame = requestAnimationFrame(draw);
      const delta = lastTime ? Math.min((now - lastTime) / 1000, .06) : 0; lastTime = now;
      if (!visible || document.hidden || pausedRef.current) return;
      elapsed += delta;
      if (now - lastDraw < 32) return;
      lastDraw = now; material.uniforms.uTime.value = elapsed;
      camera.position.x += (pointer.x * .22 - camera.position.x) * .035;
      camera.position.y += (-pointer.y * .15 - camera.position.y) * .035;
      renderer.render(scene, camera);
    }
    function lost(event) { event.preventDefault(); alive = false; cancelAnimationFrame(frame); element.dataset.renderer = 'fallback'; }
    renderer.domElement.addEventListener('webglcontextlost', lost);
    resize(); frame = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); parent.removeEventListener('pointermove', pointerMove); parent.removeEventListener('pointerleave', pointerLeave); renderer.domElement.removeEventListener('webglcontextlost', lost); geometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [variant]);
  return <div className={`portal-effects fx-${variant}`} ref={host} aria-hidden="true"/>;
}
