const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={step:0,zoom:1,geometry:'horseshoe',electrodes:24,arms:8,period:2,width:7,radius:25,layers:{bottom:true,metal:true,top:true}};
const stages=[
 {k:'STEP 1 · STRETCHABLE GEOMETRY',t:'Generate normalized horseshoe paths',c:'Path generation',l:'Geometry from constraints',d:'A normalized horseshoe path spans the culture insert while preserving a defined period and trace width.',n:'The normalized path is replicated radially to build a mechanically compliant mesh.'},
 {k:'STEP 2 · DEVICE SCAFFOLD',t:'Build the open radial architecture',c:'Scaffold construction',l:'Open geometry for tissue integration',d:'The path is replicated, clipped to the outer ring and combined with a central opening.',n:'Radial replication creates an open architecture for cell organization, nutrient transport and tissue remodelling.'},
 {k:'STEP 3 · ROUTING DOMAIN',t:'Extract the routing skeleton',c:'Skeleton extraction',l:'Turn geometry into a routing graph',d:'The available area is reduced to a connected medial skeleton while preserving fabrication clearances.',n:'The skeleton defines valid corridors for electrically independent routes.'},
 {k:'STEP 4 · ROUTING MOCKUP',t:'Follow the support from electrode to contact',c:'Electrode autorouting',l:'Support-constrained paths',d:'This schematic places electrodes and parallel traces on a shared support path. The Python workflow uses NetworkX for actual path selection.',n:'Illustrative routes follow the scaffold; electrical isolation and fabrication rules are not validated here.'},
 {k:'STEP 5 · MASK ASSEMBLY',t:'Inspect the three-layer device concept',c:'Mask-layer assembly',l:'Metal layer: Ti/Au',d:'Bottom PaC, the Ti/Au metal layer and top PaC with openings are shown schematically. This is not an exported GDS layout.',n:'Toggle the layers to inspect the structural polymer, metal layer (Ti/Au) and electrode openings.'}
];
const code=[
`# Normalize a compliant path across the insert
path = horseshoe_normalizado(
    points=[[-r_well, 0], [r_well, 0]],
    distancia_fija=PERIODO_FRACTAL
)

sh_path = shapely.Polygon(path)
angle_step = 2 * np.pi / n_arms`,
`# Replicate the path and clip the scaffold
sh_device = sh_donut(r_ext, r_int)

for i in range(n_arms // 2):
    arm = shapely.affinity.rotate(
        sh_path, angle=angle_step * i,
        origin=(0, 0), use_radians=True
    )
    sh_device = sh_device.union(arm)

sh_device = sh_device.difference(center)`,
`# Obtain valid routing corridors
router = RoutingLayout(
    sh_device,
    border_tolerance=12
)

router.lay_down_lines(
    n_lines=n_routes,
    gap_um=12,
    add_border=True
)`,
`# Register terminals and solve independent paths
router.add_electrodes(
    electrode_boundaries,
    electrode_points,
    type="electrode"
)
router.add_electrodes(
    pad_boundaries, pad_points, type="pad"
)
router.route(resample_for_smooth=10)`,
`# Assemble fabrication layers
device = phidl.Device("BioKIN_mesh")
device << bottom_pac.remap_layers({0: 0})
device << metal_routes.remap_layers({0: 1})
device << top_pac_openings.remap_layers({0: 2})

device.write_gds(output_name)`
];
function el(name,attrs={}){const n=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n}
function polar(r,a){return [r*Math.cos(a),r*Math.sin(a)]}
function armPoint(t,angle,lane=0){
 const cycles=(state.geometry==='compound'?3.5:state.geometry==='smooth'?2:3)*2/state.period;
 const phase=2*Math.PI*cycles*t;
 const taper=Math.sin(Math.PI*t);
 const wave=state.geometry==='compound'?Math.sin(phase)+.3*Math.sin(2*phase):Math.sin(phase);
 const x=116+234*t, y=wave*(state.geometry==='smooth'?23:31)*taper+lane;
 return [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
}
function pathData(points){return 'M'+points.map(p=>p.map(v=>v.toFixed(3)).join(',')).join(' L')}
function armPoints(angle,lane=0,start=0,end=1){return Array.from({length:161},(_,i)=>armPoint(start+(end-start)*i/160,angle,lane))}
function terminals(){
 const list=[];
 for(let arm=0;arm<state.arms;arm++){
  const n=Math.floor(state.electrodes/state.arms)+(arm<state.electrodes%state.arms?1:0);
  for(let j=0;j<n;j++){
   const angle=arm*2*Math.PI/state.arms, lane=(j-(n-1)/2)*3;
   const t=.12+(n===1?.35:j/(n-1)*.7);
   list.push({angle,lane,t,point:armPoint(t,angle,lane)});
  }
 }
 return list;
}
function circle(cx,cy,r,cls,fill='none'){return el('circle',{cx,cy,r,class:cls,fill})}
function draw(){
 const v=$('#viewport');v.innerHTML='';v.setAttribute('transform',`scale(${state.zoom})`);
 const scaffold=el('g',{id:'bottomLayer'}),metal=el('g',{id:'metalLayer'}),top=el('g',{id:'topLayer'}),guides=el('g');
 const supportWidth=Math.max(28,Math.ceil(state.electrodes/state.arms)*3+16);
 const electrodeR=Math.max(4,state.radius*.18);
 const ring=()=>el('circle',{cx:0,cy:0,r:350,fill:'none',stroke:'#0d7277','stroke-width':supportWidth,opacity:.8});
 scaffold.append(ring());
 for(let i=0;i<state.arms;i++){
  const a=i*2*Math.PI/state.arms,points=armPoints(a);
  const extended=[...points,polar(395,a)];
  scaffold.append(el('path',{d:pathData(extended),fill:'none',stroke:'#0d7277','stroke-width':supportWidth,'stroke-linecap':'round','stroke-linejoin':'round',opacity:state.step===0?(i===0?1:.13):.8}));
  if(state.step>=2){
   guides.append(el('path',{d:pathData(points),fill:'none',stroke:state.step===2?'#e76551':'#8b9d9f','stroke-width':state.step===2?3:1,'stroke-dasharray':state.step===2?'none':'4 4',opacity:.8}));
   if(state.step===2)for(const lane of [-6,6])guides.append(el('path',{d:pathData(armPoints(a,lane)),fill:'none',stroke:'#50b1be','stroke-width':1.5}));
  }
  if(state.step===4)top.append(el('path',{d:pathData(extended),fill:'none',stroke:'#64c3c7','stroke-width':supportWidth-4,'stroke-linecap':'round',opacity:.5}));
 }
 if(state.step===0)guides.append(el('path',{d:pathData(armPoints(0)),fill:'none',stroke:'#e76551','stroke-width':4,'stroke-linecap':'round'}));
 for(const terminal of terminals()){
  const {angle,lane,t,point:[x,y]}=terminal;
  if(state.step===2)guides.append(circle(x,y,4,'terminal','#e76551'));
  if(state.step>=3){
   const pad=[395*Math.cos(angle)-lane*Math.sin(angle),395*Math.sin(angle)+lane*Math.cos(angle)];
   const points=[...armPoints(angle,lane,t),pad];
   metal.append(el('path',{d:pathData(points),class:'metal-route',fill:'none',stroke:'#c69720','stroke-width':Math.max(.8,state.width*.13),'stroke-linecap':'round','stroke-linejoin':'round'}));
   metal.append(circle(x,y,electrodeR,'electrode','#d6a835'));
   metal.append(el('rect',{x:pad[0]-1,y:pad[1]-8,width:2,height:16,rx:.5,class:'contact-pad',fill:'#d6a835',transform:`rotate(${angle*180/Math.PI+90} ${pad[0]} ${pad[1]})`}));
   if(state.step===4)top.append(el('circle',{cx:x,cy:y,r:electrodeR+1.5,fill:'none',stroke:'#fff','stroke-width':1.5,class:'opening'}));
  }
 }
 v.append(scaffold,top,guides,metal);
 scaffold.style.display=state.layers.bottom?'':'none';metal.style.display=state.layers.metal?'':'none';top.style.display=state.layers.top?'':'none';
}
function render(){const s=stages[state.step];$('#stageKicker').textContent=s.k;$('#stageTitle').textContent=s.t;$('#codeTitle').textContent=s.c;$('#logicTitle').textContent=s.l;$('#logicText').textContent=s.d;$('#stageNote').textContent=s.n;$('#codeBlock').textContent=code[state.step];$$('.step').forEach((b,i)=>b.classList.toggle('active',i===state.step));$('#layerPanel').hidden=state.step!==4;$('#metricElectrodes').textContent=state.electrodes;draw()}
function bindRange(id,key,format=v=>v){const n=$('#'+id),o=$('#'+id+'Out');n.addEventListener('input',()=>{state[key]=+n.value;o.textContent=format(n.value);render()})}
bindRange('electrodes','electrodes');bindRange('arms','arms');bindRange('period','period',v=>(+v).toFixed(1)+' mm');bindRange('traceWidth','width',v=>v+' µm');bindRange('electrodeRadius','radius',v=>v+' µm');
$('#geometry').addEventListener('change',e=>{state.geometry=e.target.value;render()});$$('.step').forEach(b=>b.addEventListener('click',()=>{state.step=+b.dataset.step;render()}));$('#generate').addEventListener('click',()=>{state.step=Math.min(4,state.step+1);render()});$('#reset').addEventListener('click',()=>location.reload());$('#zoomIn').onclick=()=>{state.zoom=Math.min(1.5,state.zoom+.1);draw()};$('#zoomOut').onclick=()=>{state.zoom=Math.max(.55,state.zoom-.1);draw()};$('#fit').onclick=()=>{state.zoom=1;draw()};$$('[data-layer]').forEach(c=>c.addEventListener('change',()=>{state.layers[c.dataset.layer]=c.checked;draw()}));$('#copyCode').onclick=async()=>{await navigator.clipboard.writeText(code[state.step]);$('#copyCode').textContent='Copied';setTimeout(()=>$('#copyCode').textContent='Copy',1200)};render();
