import * as T from 'three';
import { RoundedBoxGeometry } from '/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { kf, place, range, smooth } from './anim.js';

const timeline = await fetch("/timeline.json").then(r=>r.json());
const scene = new T.Scene();
scene.background = new T.Color(0x091627);
scene.fog = new T.FogExp2(0x111a2f, 0.052);
const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.localClippingEnabled=true;
renderer.setSize(720, 1280);
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.19;
document.body.append(renderer.domElement);
const camera = new T.PerspectiveCamera(48, 9 / 16, 0.035, 95);
const steel = 0x34465a, rubber = 0x111825, teal = 0x206b73, warm = 0xe9a658;
const materials = new Map();
function mat(color, emissive = false) {
  const key = color + ':' + emissive;
  if (!materials.has(key)) materials.set(key, emissive ? new T.MeshBasicMaterial({color}) :
    new T.MeshStandardMaterial({color, roughness: .72, metalness: .13}));
  return materials.get(key);
}
const cube = new T.BoxGeometry(1, 1, 1);
const cushion=new RoundedBoxGeometry(.96,.86,.18,3,.075);
const sphere = new T.SphereGeometry(1, 20, 14);
function mesh(parent, geometry, material, xyz, size) {
  const item = new T.Mesh(geometry, material);
  item.position.set(...xyz);
  if (size) item.scale.set(...size);
  parent.add(item);
  return item;
}
function box(p, c, x, y, z, w, h, d, e = false) {
  return mesh(p, cube, mat(c, e), [x,y,z], [w,h,d]);
}
function orb(p, c, x,y,z,w,h,d) { return mesh(p,sphere,mat(c),[x,y,z],[w,h,d]); }
function rod(p,c,a,b,r) {
  const start = new T.Vector3(...a), end = new T.Vector3(...b), dir = end.clone().sub(start);
  const m = mesh(p, new T.CylinderGeometry(r,r,1,9), mat(c), start.addScaledVector(dir,.5).toArray(), [1,dir.length(),1]);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), dir.normalize());
  return m;
}
function sign(parent, lines, x,y,z,w,h, color, direction = 0) {
  const cv = document.createElement('canvas'); cv.width=768; cv.height=192;
  const g = cv.getContext('2d');
  g.fillStyle='#101720'; g.fillRect(0,0,768,192);
  g.strokeStyle=color; g.lineWidth=4; g.strokeRect(9,9,750,174);
  g.textAlign='center'; g.textBaseline='middle'; g.fillStyle=color;
  lines.forEach((line,i) => {
    g.font = (i === 0 ? 'bold 76' : 'bold 34') + 'px monospace';
    g.fillText(line,384,lines.length === 1 ? 96 : i === 0 ? 72 : 140,700);
  });
  const tex = new T.CanvasTexture(cv); tex.colorSpace=T.SRGBColorSpace;
  const s=mesh(parent,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}),[x,y,z]);
  s.rotation.y=direction; return s;
}
const hemi = new T.HemisphereLight(0xafecff,0x77527c,1.47); scene.add(hemi);
const light = new T.DirectionalLight(0x91cbff,1.4); light.position.set(3,6,5); scene.add(light);
const red = new T.PointLight(0xff3630,12,8); red.position.set(-.4,2,-5.4); scene.add(red);
const dashGlow = new T.PointLight(0x53dcee,9,6); dashGlow.position.set(.1,1.8,-5.25); scene.add(dashGlow);
const streetLight=new T.PointLight(0xffbd88,12,8);
scene.add(streetLight);
const bounce=new T.DirectionalLight(0xffc8a0,.92);
bounce.position.set(-4,2,-3); scene.add(bounce);
function fabric() {
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=128;
  const g=canvas.getContext('2d');
  g.fillStyle='#426070'; g.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=4) {
    g.fillStyle=y%8?'#516a78':'#395563';g.fillRect(0,y,128,1);
    for(let x=-16;x<128;x+=24){
      g.fillStyle=(x+y)%16?'#748692':'#c99365';
      g.fillRect(x+(y%32)/2,y,5,2);
    }
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  return new T.MeshStandardMaterial({map,roughness:.97});
}
const upholstery=fabric();
const cabin = new T.Group(); scene.add(cabin);
box(cabin,rubber,0,-.12,0,3.3,.24,13.1);
box(cabin,0x273446,0,-.011,0,1.03,.024,12.9);
box(cabin,steel,0,2.79,0,3.32,.18,13.1);
box(cabin,steel,0,1.39,6.5,3.25,2.8,.14);
box(cabin,steel,0,.33,-6.5,3.24,.67,.14);
box(cabin,steel,0,2.57,-6.5,3.25,.42,.14);
box(cabin,steel,0,1.5,-6.49,.075,1.8,.13);
const tubes = [];
for (const x of [-1.58,1.58]) {
  const side = Math.sign(x);
  box(cabin,steel,x,.41,side===1?.75:0,.12,.82,side===1?11.55:13);
  box(cabin,steel,x,2.45,0,.12,.55,13);
  for(let i=0;i<6;i++) box(cabin,steel,x,1.52,6.25-2.04*i,.13,1.5,.11);
  box(cabin,warm,side*.52,.008,0,.024,.027,12.9,true);
  for(let i=0;i<5;i++) {
    const z=4.8-i*1.77;
    box(cabin,rubber,side*1.07,.463,z,.96,.18,.73);
    box(cabin,teal,side*1.07,.565,z,.92,.16,.67);
    const back=box(cabin,teal,side*1.07,.93,z+.35,.96,.86,.18); back.rotation.x=-.12; back.material=upholstery; back.geometry=cushion; back.scale.setScalar(1);
    box(cabin,0x327d86,side*1.07,1.40,z+.39,.86,.085,.17);
    box(cabin,steel,side*1.07,.22,z,.38,.48,.28);
    if(i%2===0) {
      rod(cabin,warm,[side*.57,0,z+.45],[side*.57,2.7,z+.45],.035);
      box(cabin,0x601e2f,side*.57,1.38,z+.45,.083,.13,.08);
    }
  }
  rod(cabin,warm,[side*.59,2.49,-5.8],[side*.59,2.49,6.1],.026);
  for(let i=0;i<6;i++) {
    const z=5.15-i*1.98;
    box(cabin,steel,side*.29,2.69,z,.29,.14,1.45);
    tubes.push(box(cabin,0xbef5ff,side*.29,2.607,z,.17,.025,1.32,true));
  }
}
sign(cabin,['03:00','DERNIER SERVICE'],0,2.52,-5.9,1.15,.27,'#ffc06a');
const doors = [];
for (const z of [-5.91,-4.72]) {
  const d=new T.Group(); d.position.set(1.58,0,z); cabin.add(d); doors.push(d);
  for(const y of [.28,2.37]) box(d,steel,0,y,0,.11,.55,.57);
  for(const k of [-.27,.27]) box(d,steel,0,1.26,k,.103,1.58,.062);
  box(d,warm,-.07,1.11,.07,.04,.21,.035,true);
}
const dashboard = box(cabin,rubber,-.86,.98,-5.99,1.12,.24,.72); dashboard.rotation.x=-.18;
for (let i=0;i<7;i++) box(cabin,i%3===0?0xff7260:0x7ce5d1,-1.23+i*.115,1.12,-5.74,.061,.014,.032,true);
const wheel = mesh(cabin,new T.TorusGeometry(.246,.034,10,32),mat(rubber),[-.85,1.19,-5.53]);
wheel.rotation.x=-.66;
box(wheel,steel,0,0,0,.44,.037,.043);
for(const side of [-1,1]){
  for(let row=0;row<4;row++){
    const z=4.52-row*2.20;
    rod(cabin,0xc78a49,[side*.59,2.48,z],[side*.59,2.30,z],.016);
    const handle=mesh(cabin,new T.TorusGeometry(.069,.015,8,20),mat(warm),[side*.59,2.235,z]);
    handle.rotation.y=.41;
  }
}
for(let i=0;i<2;i++){
  const gauge=mesh(cabin,new T.CylinderGeometry(.108,.108,.025,28),mat(0x406075),[-1.12+i*.27,1.128,-5.97]);
  const needle=box(gauge,0xffb26d,0,.019,-.024,.009,.008,.084,true);
  needle.rotation.y=.64-i*.75;
}
const mirror = new T.Group(); mirror.position.set(-.18,2.19,-5.52); cabin.add(mirror);
box(mirror,rubber,0,0,0,.83,.325,.062);
const glass=box(mirror,0x283a54,0,0,.036,.758,.252,.011,true);
rod(cabin,steel,[-.18,2.3,-5.54],[-.18,2.68,-5.54],.024);

function person(p, color, skin, seated, blank = false, hair = 0x24212d) {
  const actor = new T.Group(); p.add(actor);
  const waist = seated ? .67 : .87;
  const headY = waist+.71;
  const body = orb(actor,color,0,waist+.25,0,.257,.37,.16);
  const outline=[[.005,-.07],[.174,-.055],[.206,.03],[.192,.15],[.215,.31],[.239,.402],[.194,.456],[.095,.486],[.015,.484]];
  body.geometry=new T.LatheGeometry(outline.map(([r,y])=>new T.Vector2(r,y)),32);
  body.position.y=waist;body.scale.set(1,1,.70);
  orb(actor,color,0,waist+.04,-.012,.22,.14,.15);
  orb(actor,skin,0,headY-.215,0,.08,.105,.076);
  const head=new T.Group(); head.position.y=headY; actor.add(head);
  orb(head,skin,0,0,0,.14,.191,.136);
  for(const side of [-1,1]){
    orb(head,skin,side*.135,-.001,-.008,.026,.042,.022);
    const lapel=box(actor, color,side*.076,waist+.39,.135,.072,.21,.032);
    lapel.rotation.z=side*-.40;
    for(let j=0;j<3;j++)orb(actor,0xa9987e,0,waist+.32-j*.077,.153,.012,.012,.006);
  }
  if (!blank) {
    orb(head,hair,0,.096,-.037,.148,.113,.132);
    orb(head,skin,0,-.02,.119,.026,.043,.029);
    for(const x of [-.054,.054]) {
      const brow=orb(head,hair,x,.055,.122,.036,.009,.008); brow.rotation.z=x*3;
      orb(head,0xe8d7c7,x,.025,.121,.029,.012,.009);
      orb(head,0x191e29,x,.026,.132,.012,.011,.006);
    }
    orb(head,0x572d42,0,-.085,.118,.043,.009,.01);
    for(let i=0;i<9;i++){
      const lock=orb(head,hair,(i-4)*.026,.102+Math.sin(i*.6)*.014,.059,.035,.065,.071);
      lock.rotation.z=-.5;
    }
  } else {
    orb(head,hair,0,.11,-.054,.142,.09,.123);
  }
  for(const s of [-1,1]) {
    const x=s*.155;
    rod(actor,color,[s*.208,waist+.43,0],[s*.285,waist+.21,.058],.074);
    rod(actor,color,[s*.285,waist+.21,.058],[s*.22,seated?waist+.055:waist-.08,seated?.29:.075],.06);
    orb(actor,skin,s*.22,seated?waist+.056:waist-.08,seated?.31:.083,.055,.065,.054);
    const knee=seated?[x,.53,.35]:[x,.47,.03];
    rod(actor,0x1d263b,[x,waist,0],knee,.093);
    rod(actor,0x222c3c,knee,[x,.08,seated?.36:.02],.066);
    orb(actor,rubber,x,.069,seated?.43:.09,.081,.063,.14);
  }
  return {actor,head,body,headY};
}
const driver = person(cabin,0x243347,0xc3a79d,true,true,0x1a2539);
driver.actor.position.set(-.85,.19,-5.17); driver.actor.rotation.y=Math.PI;
const riderBehind = person(cabin,0xa05640,0xb8785b,false,false,0x222438);
riderBehind.actor.position.set(2.8,0,-5.26); riderBehind.actor.rotation.y=-Math.PI/2;
// The mirror samples the actual driver's seat, including the aisle behind it.
const mirrorTarget=new T.WebGLRenderTarget(768,300);
const mirrorCamera=new T.PerspectiveCamera(36,768/300,.03,60);
const mirrorPane=mesh(mirror,new T.PlaneGeometry(.758,.252),new T.MeshBasicMaterial({
  map:mirrorTarget.texture,color:0xd2dfdf,toneMapped:false
}),[0,0,.048]);
mirrorPane.geometry.attributes.uv.array.forEach((v,i,uv)=>{if(i%2===0)uv[i]=1-v;});
const cap=orb(driver.head,0x242d3c,0,.128,-.01,.155,.085,.145);
const brim=orb(driver.head,0x172230,0,.093,.089,.148,.021,.11);
const passengers=[];
const colors=[0x3c536e,0x673649,0x79705c,0x3e6467,0x513657,0x75634e,0x4e535f,0x6b4c43];
for(let i=0;i<8;i++){
  const p=person(cabin,colors[i],[0xc88b70,0x965d46,0xd5ab8e][i%3],true,false, [0x212834,0x36232d,0x6c4e3a][i%3]);
  p.actor.position.set(i%2===0?-.95:.94,.02,3.07-Math.floor(i/2)*1.77);
  p.actor.rotation.y=Math.PI;
  passengers.push(p);
}
const woman=passengers[1], victim=passengers[6];
for(const s of [-1,1]) {
  orb(woman.head,0x38232a,s*.129,-.028,-.014,.039,.154,.092);
  orb(woman.head,0xe8bc75,s*.147,-.078,.034,.013,.019,.01);
}
const windowCanvas=document.createElement('canvas'); windowCanvas.width=512;windowCanvas.height=384;
const ctx=windowCanvas.getContext('2d');
let seed=2121;
const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
for(let i=0;i<830;i++){
  const x=random()*512,y=random()*384,r=.5+random()*2.7;
  ctx.fillStyle='rgba(174,211,229,.65)'; ctx.beginPath();ctx.ellipse(x,y,r*.44,r,0,0,7);ctx.fill();
  if(i%8===0){ctx.fillStyle='rgba(130,186,205,.24)';ctx.fillRect(x,y,1,5+r*6);}
}
const glassMap=new T.CanvasTexture(windowCanvas);
const wet=new T.MeshBasicMaterial({map:glassMap,transparent:true,opacity:.63,depthWrite:false,side:T.DoubleSide});
for(const side of [-1,1]) for(let row=0;row<6;row++){
  if(side===1 && row===5)continue;
  const pane=mesh(cabin,new T.PlaneGeometry(1.98,1.36),wet,[side*1.575,1.52,5.22-row*2.04]);
  pane.rotation.y=Math.PI/2;
}

const scarf=new T.Group(); cabin.add(scarf);
// A single knitted strip wraps the neck and uncoils across the cushion.
const steps=68, ribbon=new T.PlaneGeometry(1,1,1,steps);
const yarn=document.createElement('canvas'); yarn.width=48; yarn.height=256;
const yg=yarn.getContext('2d');
yg.fillStyle='#942c38'; yg.fillRect(0,0,48,256);
for(const y of [10,18,228,236]){ yg.fillStyle='#d9a773';yg.fillRect(0,y,48,4); }
for(let y=0;y<256;y+=4)for(let x=0;x<48;x+=4){
  yg.fillStyle=(x+y)%8?'#ffffff24':'#150b212e';yg.fillRect(x,y,2,3);
}
const weave=new T.CanvasTexture(yarn);weave.colorSpace=T.SRGBColorSpace;
const textile=mesh(scarf,ribbon,new T.MeshStandardMaterial({map:weave,roughness:1,side:T.DoubleSide}),[0,0,0]);
textile.frustumCulled=false;
const neckWorld=new T.Vector3();
function drape(t){
  const descent=range(t,22.30,22.83);
  const relax=smooth(range(t,22.32,23.03));
  victim.actor.localToWorld(neckWorld.set(0,1.184,.0));
  scarf.position.copy(neckWorld);
  scarf.position.x+=(-.96-neckWorld.x)*smooth(descent);
  scarf.position.z+=(-2.27-neckWorld.z)*smooth(descent);
  scarf.position.y+=(.675-neckWorld.y)*descent*descent;
  const attr=ribbon.attributes.position;
  for(let i=0;i<=steps;i++){
    const u=i/steps, angle=(u/.73)*Math.PI*2+.2;
    const tail=Math.max(0,(u-.73)/.27);
    const theta=Math.min(angle,Math.PI*2+.2);
    for(let side=0;side<2;side++){
      const edge=(side-.5)*.066;
      const x=Math.sin(theta)*.132+tail*.052+tail*edge;
      const y=edge*(1-tail)-tail*.256;
      const z=-Math.cos(theta)*.16-tail*.047;
      const flatX=(u-.5)*.49;
      const flatZ=Math.sin(u*5.8)*.085+edge*1.4;
      attr.setXYZ(i*2+side,x+(flatX-x)*relax,y*(1-relax)+(.009+.013*Math.sin(u*10)**2)*relax,z+(flatZ-z)*relax);
    }
  }
  attr.needsUpdate=true; ribbon.computeVertexNormals();
}
const hands=new T.Group(); cabin.add(hands);
for(const side of [-1,1]){
  rod(hands,0xa05640,[-.85+side*.24,.8,-4.87],[-.85+side*.22,1.17,-5.47],.079);
  orb(hands,0xb8785b,-.85+side*.233,1.19,-5.51,.07,.075,.072);
}

const street=new T.Group(); scene.add(street);
box(street,0x182539,0,-.44,0,21,.23,79);
box(street,0x40536a,3.25,-.22,0,1.8,.22,78);
const lamps=[];
for(let i=0;i<15;i++){
  const z=22-i*4.6;
  box(street,0x647c89,0,-.308,z,.085,.016,1.17);
  for(const s of [-1,1]) {
    const x=s*(5.4+(i%3)*1.5);
    box(street,0x233148+s*0x030101,x,1.18+(i%4)*.22,z,2.5,3.05+(i%4)*.5,2.5);
    for(let j=0;j<3;j++) box(street,(i+j)%4===0?0xb97656:0x29475f,s*(Math.abs(x)-1.258),1.03+j*.77,z+.35,.018,.2,.45,(i+j)%4===0);
    if(i%2===0){
      const l=new T.Group();l.position.set(s*3.95,0,z);street.add(l);lamps.push(l);
      rod(l,steel,[0,0,0],[0,4.15,0],.06);
      box(l,0xffc486,-s*.26,4.12,0,.58,.09,.25,true);
      const pool=box(l,0x303745,-s*.7,-.296,0,.32,.022,2.3); pool.rotation.y=.18;
    }
  }
}
const platform=new T.Group();scene.add(platform);
box(platform,0x485566,2.85,-.09,-5.25,2.55,.18,5.1);
for(let i=0;i<5;i++) box(platform,0xcc944a,1.77,.013,-7.54+i*1.03,.085,.02,.79,true);
for(const z of [-7.34,-3.42]) rod(platform,steel,[3.9,0,z],[3.9,2.9,z],.053);
box(platform,steel,3.44,2.92,-5.38,1.85,.12,4.2);
sign(platform,['TERMINUS','N03'],3.87,2.37,-5.10,1.65,.41,'#ffc06a',-Math.PI/2);
const rainCount=330;
const rainPos=new Float32Array(rainCount*6);
const rainSeeds=Array.from({length:rainCount},(_,i)=>[(Math.sin(i*71.3)*43758.54)%1,(Math.sin(i*25.2)*15731.14)%1,(Math.sin(i*48.7)*3141.59)%1].map(n=>n<0?n+1:n));
const rainGeo=new T.BufferGeometry();
rainGeo.setAttribute('position',new T.BufferAttribute(rainPos,3).setUsage(T.DynamicDrawUsage));
const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xa0cbe4,transparent:true,opacity:.32}));
rain.frustumCulled=false; scene.add(rain);
const shots=[
  [0,5.3,[.04,1.53,5.95],[.01,1.51,4.55],[0,1.18,-5],[0,1.33,-5],48],
  [5.3,8.35,[-.12,1.78,3.7],[.17,1.97,2.82],[.22,2.52,-2],[.26,2.57,-1.6],48],
  [8.35,12.85,[.02,1.67,-4.70],[.11,1.72,-3.48],[0,1.16,1],[.20,1.24,1.0],63],
  [12.85,16.65,[.11,1.56,1.85],[.24,1.55,1.67],[.92,1.38,3.08],[.94,1.39,3.08],43],
  [16.65,19.2,[.14,1.42,-3.15],[-.05,1.46,-3.55],[-.94,1.36,-2.23],[-.82,1.43,-2.25],47],
  [19.2,22.15,[.12,1.91,-3.72],[.01,2.05,-4.47],[-.15,2.21,-5.52],[-.18,2.18,-5.52],53],
  [22.15,27.35,[-.15,1.42,-3.50],[-.31,1.23,-3.10],[-.94,1.14,-2.21],[-.92,.66,-2.09],49],
  [27.35,32.3,[.03,1.47,-2.72],[.29,1.26,-4.36],[.89,.43,-5.48],[1.64,.72,-5.29],50],
  [32.3,36.9,[-.81,1.92,-4.75],[-.86,1.79,-4.84],[-.85,1.28,-5.49],[-.85,1.25,-5.46],53],
  [36.9,41.05,[-.81,1.89,-4.78],[-.27,2.12,-4.86],[-.18,2.18,-5.52],[-.18,2.18,-5.52],58],
  [41.05,45,[.95,1.57,-5.77],[.53,1.62,-5.48],[2.83,1.53,-5.30],[1.95,1.50,-5.26],55]
];
function setScene(t){
  streetLight.position.set(-1.4,1.96,5.7-(t*1.65)%11.5);
  const blackout = smooth(range(t,5.6,6.15))*(1-smooth(range(t,8.05,8.36)));
  const flash = Math.max(0,1-Math.abs(t-22.29)*12);
  const dark = Math.max(blackout*.94, flash*.92);
  hemi.intensity=1.47*(1-dark)+.14;
  light.intensity=1.38*(1-dark);
  red.intensity=4.3+dark*9+flash*12;
  dashGlow.intensity=4.4*(1-dark*.79);
  tubes.forEach((tube,i)=>{tube.visible = dark < .72 && !(t>7.95 && t<8.36 && Math.floor(t*28+i)%3===0);});
  driver.actor.visible = t>=8.35 && t<32.3;
  driver.head.rotation.y=-.12-smooth(range(t,18,21))*.45;
  mirrorPane.visible=(t>=19.2 && t<22.15)||(t>=36.9 && t<41.05);
  cap.visible=brim.visible=t<32.3;
  driver.body.material=mat(t>=32.3?0xa05640:0x243347);
  passengers.forEach((p,i)=>{
    p.actor.visible=t>=8.35 && t<32.3 && (p!==victim || t<22.3);
    p.head.rotation.y=.1*Math.sin(t*.8+i);
  });
  passengers[0].actor.rotation.y=1.2;
  woman.actor.rotation.y= t<12.85 ? -1.13 : -2.20;
  woman.head.rotation.y=-.45*smooth(range(t,12.9,14.1));
  const lean=smooth(range(t,16.8,18.7));
  victim.actor.position.x=-.95+lean*.36;
  victim.actor.rotation.z=-lean*.19;
  scarf.visible = t>=16.65 && t<27.35;
  if(scarf.visible)drape(t);
  hands.visible=t>=32.3 && t<36.9;
  riderBehind.actor.visible=t>=41.05;
  const walk=smooth(range(t,41.55,44.65));
  riderBehind.actor.position.set(2.86-walk*1.71,.028*Math.sin(t*13)*walk,-5.28);
  riderBehind.head.rotation.y=-.21;
  platform.visible=t>=27.35;
  street.position.z=(Math.min(t,27.35)*3.5)%4.6;
  const open = smooth(range(t,30.02,31.64))*(1-smooth(range(t,32.1,32.75))) + smooth(range(t,40.98,41.58));
  doors[0].position.z=-5.61-open*.42;
  doors[1].position.z=-5.01+open*.42;
  for(let i=0;i<rainCount;i++){
    const [a,b,c]=rainSeeds[i], x=(a-.5)*16, y=(b+9-t*.7)%4.8, z=((c+t*.45)%1-.5)*23;
    if(Math.abs(x)<1.65){rainPos.fill(0,i*6,i*6+6);continue;}
    const h=(y+4.8)%4.8;
    rainPos.set([x,h,z,x+.017,h+.10,z-.065],i*6);
  }
  rainGeo.attributes.position.needsUpdate=true;
}
window.renderAt=(t)=>{
  t = kf(t, timeline.map(([story, actual]) => [actual, story]), x => x);
  setScene(t);
  const [start,end,from,to,lookFrom,lookTo,fov] = shots.find(s=>t<s[1]) || shots.at(-1);
  const progress=range(t,start,end);
  const motion= p => p*p*(3-2*p)*.56+p*.44;
  const pos=kf(progress,[[0,from],[1,to]],motion);
  const look=kf(progress,[[0,lookFrom],[1,lookTo]],motion);
  pos[0]+=.012*Math.sin(t*3.1); pos[1]+=.008*Math.sin(t*4.6);
  camera.fov=fov; camera.updateProjectionMatrix();
  place(camera,pos,look,.011*Math.sin(t*1.9));
  if(mirrorPane.visible){
    mirror.visible=false;
    const visible=driver.actor.visible;
    driver.actor.visible=true;
    mirrorCamera.position.set(-.72+(camera.position.x+.2)*.045,1.73,-6.02);
    mirrorCamera.lookAt(-.85,1.55,-5.17);
    renderer.setRenderTarget(mirrorTarget);
    renderer.render(scene,mirrorCamera);
    renderer.setRenderTarget(null);
    driver.actor.visible=visible;
    mirror.visible=true;
  }
  renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/jpeg',.91).split(',')[1];
};
window.renderAt(Number(new URLSearchParams(location.search).get('t')) || 0);
