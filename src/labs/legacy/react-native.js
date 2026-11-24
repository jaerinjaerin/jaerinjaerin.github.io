// 이전 형식 React Native 실습 (원본 코드 보존)
// 원래 단일 페이지(subjects/react-native/index.html)의 실습 코드를 강의별 페이지에서
// 그대로 실행하기 위해 함수로 감쌌다. 로직은 수정하지 않았다.
// @ts-nocheck
export function mountLegacyLab(root, labId) {
  'use strict';
  const $ = (id) => root.querySelector('[data-legacy="' + id + '"]');
  let state = {};
  const lessons = [{ lab: labId }];
  const current = 0;
const el=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x};
function control(label,type,initial,onInput,opts){let wrap=el('div');let lab=el('label',label);wrap.append(lab);let input=el(type==='select'?'select':'input');if(type==='select'){opts.forEach(([val,title])=>{let o=el('option',title);o.value=val;input.append(o)});input.value=initial}else{input.type=type;input.value=initial}input.addEventListener(type==='range'||type==='text'?'input':'change',()=>onInput(input.value));wrap.append(input);return wrap}
function button(text,fn,cls='btn'){let b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b}

function renderDeepLab(kind,c,s,e){
 const mk=(tag,txt,cls)=>{const node=document.createElement(tag);if(txt!==undefined)node.textContent=txt;if(cls)node.className=cls;return node};
 const append=(parent,...children)=>{children.forEach(child=>parent.append(child));return parent};
 const choose=(name,values,initial,change)=>{const wrap=mk('div',undefined,'lab-field');const label=mk('label',name);const input=mk('select');for(const [value,title] of values){const option=mk('option',title);option.value=value;input.append(option)}input.value=String(initial);input.addEventListener('change',()=>change(input.value));wrap.append(label,input);c.append(wrap);return input};
 const slide=(name,min,max,step,initial,change)=>{const wrap=mk('div',undefined,'lab-field');const label=mk('label',name);const value=mk('output',String(initial),'lab-slider-value');const input=mk('input');input.type='range';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(initial);label.append(document.createTextNode(' '),value);input.addEventListener('input',()=>{value.textContent=input.value;change(Number(input.value))});wrap.append(label,input);c.append(wrap);return input};
 const action=(label,fn,secondary=false)=>{const b=mk('button',label,'btn'+(secondary?' secondary':''));b.type='button';b.addEventListener('click',fn);c.append(b);return b};
 const note=(title,detail)=>{const box=mk('div',undefined,'lab-event');append(box,mk('strong',title),mk('p',detail));s.append(box);return box};
 const write=(title,details)=>{e.textContent=title+' · '+details};
 const format=n=>Number(n).toLocaleString('ko-KR');
 if(kind==='scrollDepth'){
  state.count??=12;state.viewport??=4;state.offset??=0;
  slide('전체 항목',4,120,4,state.count,n=>{state.count=n;state.offset=Math.min(state.offset,state.count-state.viewport);show()});
  slide('뷰포트에 보이는 행',2,8,1,state.viewport,n=>{state.viewport=n;state.offset=Math.min(state.offset,Math.max(0,state.count-n));show()});
  const offset=slide('스크롤 시작 행',0,Math.max(0,state.count-state.viewport),1,state.offset,n=>{state.offset=n;show()});
  const summary=mk('div',undefined,'lab-summary');const frame=mk('div',undefined,'lab-viewport');
  const tail=mk('div',undefined,'lab-event');s.append(summary,frame,tail);
  function show(){offset.max=String(Math.max(0,state.count-state.viewport));offset.value=String(state.offset);
   summary.textContent='전체 생성된 자식: '+format(state.count)+'개 / 현재 보이는 행: '+Math.min(state.count-state.offset,state.viewport)+'개';
   frame.replaceChildren();const shown=Math.min(state.viewport,state.count-state.offset);
   for(let i=0;i<shown;i++)frame.append(mk('div',(state.offset+i+1)+'번째 카드 · 설정 화면','lab-list-row'));
   tail.textContent='내부 상태: 전체 높이 ≈ '+(state.count*48)+'px, 뷰포트 ≈ '+(state.viewport*48)+'px, 스크롤 시작 ≈ '+(state.offset*48)+'px. 화면 밖 행도 ScrollView의 자식으로 생성될 수 있습니다.';
   write('표시된 행만 잘라 보여주는 교육용 화면','실제 ScrollView는 모든 자식을 렌더링하고 플랫폼이 스크롤 뷰포트 부분을 표시합니다.');
  }show();
 }
 if(kind==='flatDepth'){
  state.total??=200;state.window??=6;state.buffer??=2;state.start??=0;
  slide('전체 데이터 수',40,1000,40,state.total,n=>{state.total=n;state.start=Math.min(state.start,n-state.window);show()});
  slide('한 화면의 행 수',3,12,1,state.window,n=>{state.window=n;state.start=Math.min(state.start,state.total-n);show()});
  slide('앞뒤 버퍼 행 수',0,8,1,state.buffer,n=>{state.buffer=n;show()});
  const seek=slide('화면 시작 인덱스',0,state.total-state.window,1,state.start,n=>{state.start=n;show()});
  const summary=mk('div',undefined,'lab-summary'),frame=mk('div',undefined,'lab-viewport');
  const info=mk('div',undefined,'lab-event');s.append(summary,frame,info);
  function show(){seek.max=String(state.total-state.window);seek.value=String(state.start);const lo=Math.max(0,state.start-state.buffer),hi=Math.min(state.total,state.start+state.window+state.buffer);
   summary.textContent='data 전체 '+format(state.total)+'개 → 가상화 범위 '+format(hi-lo)+'개 (예시) · 화면 '+state.window+'개';
   frame.replaceChildren();for(let i=lo;i<hi;i++){const row=mk('div','id-'+(i+1000)+' / '+(i+1)+'번 행','lab-list-row');if(i<state.start||i>=state.start+state.window)row.classList.add('lab-buffer');frame.append(row)}
   info.textContent='렌더링 창: ['+lo+', '+hi+') · 화면 밖의 연한 행은 주변 버퍼입니다. keyExtractor의 key는 index보다 안정적인 데이터 ID가 권장됩니다.';
   write('FlatList의 가상화 원리를 단순화한 교육 모델','실제 윈도우 크기와 렌더링 시점은 기기·속성·스크롤 속도에 따라 달라집니다.');
  }show();
 }
 if(kind==='imageDepth'){
  state.sourceRatio??='1.5';state.targetRatio??='1';state.mode??='cover';state.status??='loaded';
  choose('원본 이미지 비율',[['2','가로 2:1'],['1.5','가로 3:2'],['1','정사각형 1:1'],['0.67','세로 2:3']],state.sourceRatio,v=>{state.sourceRatio=v;show()});
  choose('표시 영역 비율',[['1','정사각형 1:1'],['1.5','가로 3:2'],['0.67','세로 2:3']],state.targetRatio,v=>{state.targetRatio=v;show()});
  choose('resizeMode',[['cover','cover · 채우고 자르기'],['contain','contain · 전체 보이기'],['stretch','stretch · 비율 변형']],state.mode,v=>{state.mode=v;show()});
  choose('로딩 상태',[['loaded','로드 성공'],['loading','로딩 중'],['error','로드 실패']],state.status,v=>{state.status=v;show()});
  const summary=mk('div',undefined,'lab-summary');const frame=mk('div',undefined,'lab-image-frame');const art=mk('div','🌄 원본 이미지','lab-image-art');frame.append(art);s.append(summary,frame);
  function show(){const r=Number(state.sourceRatio),t=Number(state.targetRatio);const w=260,h=Math.round(w/t);
   frame.style.width=w+'px';frame.style.height=h+'px';frame.style.maxWidth='100%';
   art.style.display=state.status==='loaded'?'grid':'none';frame.classList.toggle('lab-image-loading',state.status==='loading');
   frame.classList.toggle('lab-image-error',state.status==='error');
   if(state.mode==='stretch'){art.style.width='100%';art.style.height='100%';art.style.position='static';art.style.transform='none'}
   else {const iw=state.mode==='cover'?(r>t?r/t*w:w):(r>t?w:r/t*w),ih=iw/r;
    art.style.width=iw+'px';art.style.height=ih+'px';art.style.position='absolute';art.style.left='50%';art.style.top='50%';art.style.transform='translate(-50%,-50%)'}
   const crop=state.mode==='cover'?(r>t?'좌우 잘림':'상하 잘림'):(state.mode==='contain'?(r>t?'상하 여백':'좌우 여백'):'비율 변형');
   summary.textContent='원본 비율 '+r.toFixed(2)+' / 컨테이너 비율 '+t.toFixed(2)+' → '+(r===t?'크기 맞음':crop);
   if(state.status!=='loaded')frame.setAttribute('data-message',state.status==='loading'?'⏳ 로딩 중':'⚠️ 이미지 로드 실패');else frame.removeAttribute('data-message');
   write('비율과 크기 계산','실제 네트워크 이미지는 불러오지 않는 시각화입니다. 이미지가 실패하면 대체 이미지를 제공해야 합니다.');
  }show();
 }
 if(kind==='pressDepth'){
  state.events??=[];state.pressed??=false;
  const pad=mk('button','여기를 눌러 보세요','lab-touch-pad');pad.type='button';
  const log=mk('div',undefined,'lab-event-log');s.append(pad,log);
  let holdTimer=0,longFired=false;
  const record=t=>{state.events.unshift(t);state.events=state.events.slice(0,9);paint()};
  const paint=()=>{pad.classList.toggle('is-pressed',state.pressed);log.replaceChildren();state.events.forEach((t,i)=>log.append(mk('div',(i+1)+'. '+t,'lab-log-entry')));write('이벤트 로그','onPressIn → onPressOut → onPress, 긴 누르기는 별도 이벤트입니다. 브라우저에서 React Native 이벤트를 재현한 교육용 모델입니다.')};
  pad.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;state.pressed=true;longFired=false;record('onPressIn / pressed=true');holdTimer=setTimeout(()=>{if(state.pressed){longFired=true;record('onLongPress / 500ms 경과')}},500)});
  pad.addEventListener('pointerup',()=>{if(!state.pressed)return;clearTimeout(holdTimer);state.pressed=false;record('onPressOut / pressed=false');if(!longFired)record('onPress / 짧은 탭')});
  pad.addEventListener('pointercancel',()=>{clearTimeout(holdTimer);if(state.pressed){state.pressed=false;record('제스처 취소 / onPress 실행 안 함')}});
  pad.addEventListener('pointerleave',()=>{if(!state.pressed)return;clearTimeout(holdTimer);state.pressed=false;record('영역 이탈 / 교육용 취소 처리')});
  action('짧은 터치 시뮬레이션',()=>{record('onPressIn');record('onPressOut');record('onPress')},true);
  action('길게 누르기 시뮬레이션',()=>{record('onPressIn');record('onLongPress');record('onPressOut')},true);
  action('취소 시뮬레이션',()=>{record('onPressIn');record('pointercancel → onPress 없음')},true);
  action('로그 비우기',()=>{state.events=[];paint()},true);paint();
 }
 if(kind==='keyboardDepth'){
  state.kb??=220;state.behavior??='padding';state.header??=0;state.focus??=false;
  slide('가상 키보드 높이(px)',100,280,20,state.kb,n=>{state.kb=n;paint()});
  slide('상단 헤더 오프셋(px)',0,100,10,state.header,n=>{state.header=n;paint()});
  choose('behavior',[['none','회피 적용 안 함'],['padding','padding'],['height','height'],['position','position']],state.behavior,v=>{state.behavior=v;paint()});
  action('입력 포커스 토글',()=>{state.focus=!state.focus;paint()});
  const visual=mk('div',undefined,'lab-keyboard-phone'),header=mk('div','앱 상단 헤더','lab-keyboard-header'),input=mk('div','메시지를 입력하세요','lab-keyboard-input'),kb=mk('div','가상 소프트 키보드','lab-keyboard-board');
  visual.append(header,input,kb);s.append(visual);
  const info=mk('div',undefined,'lab-event');s.append(info);
  function paint(){const shift=state.focus&&state.behavior!=='none'?Math.max(0,state.kb-state.header):0;
   const base=308;input.style.bottom=(20+shift)+'px';kb.style.height=(state.focus?state.kb:0)+'px';
   visual.style.height='350px';kb.style.display=state.focus?'grid':'none';
   const obscured=state.focus&&shift<state.kb-20;
   info.textContent='포커스 '+(state.focus?'ON':'OFF')+' · 키보드 '+(state.focus?state.kb:0)+'px · 입력창 상승 '+shift+'px · '+(obscured?'가림 가능성 있음':'예시 상 가림 없음');
   write('키보드 회피의 단순화된 좌표 모델','실제 iOS/Android의 behavior는 애니메이션·안전 영역·내비게이션 설정에 따라 다릅니다. 숫자는 실제 측정값이 아닙니다.');
  }paint();
 }
 if(kind==='formDepth'){
  state.email??='';state.pw??='';state.agree??=false;state.submitted??=false;
  const wrap=mk('div',undefined,'lab-form'),email=mk('input'),pw=mk('input'),agree=mk('input'),status=mk('div',undefined,'lab-event'),submit=mk('button','제출하기','btn');
  email.type='email';email.placeholder='이메일';email.value=state.email;email.autocomplete='off';
  pw.type='password';pw.placeholder='비밀번호 8자 이상';pw.value=state.pw;
  agree.type='checkbox';agree.checked=state.agree;
  const agreeLabel=mk('label','필수 약관 동의');agreeLabel.className='lab-check';agreeLabel.prepend(agree);
  const feedback=mk('div',undefined,'lab-form-errors');append(wrap,email,pw,agreeLabel,feedback,submit,status);s.append(wrap);
  const emailValid=x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
  function paint(){const errors=[];if(!emailValid(state.email))errors.push('이메일 형식을 확인하세요');if(state.pw.length<8)errors.push('비밀번호는 8자 이상이어야 합니다');if(!state.agree)errors.push('필수 약관에 동의해야 합니다');
   const valid=errors.length===0;submit.disabled=!valid;feedback.replaceChildren();errors.forEach(msg=>feedback.append(mk('div','• '+msg)));
   status.textContent='State: email='+JSON.stringify(state.email)+', password 길이='+state.pw.length+', 동의='+state.agree+' / 제출 가능='+valid;
   write('입력 상태 → 검증 함수 → 제출 가능 여부','이 실습의 정규식은 기본 형식만 검사합니다. 실제 계정 생성에는 서버 검증·인증·보안 저장이 필요합니다.');
  }
  email.addEventListener('input',()=>{state.email=email.value;state.submitted=false;paint()});
  pw.addEventListener('input',()=>{state.pw=pw.value;state.submitted=false;paint()});
  agree.addEventListener('change',()=>{state.agree=agree.checked;paint()});
  submit.addEventListener('click',()=>{status.textContent='✅ 모든 클라이언트 조건을 만족하여 제출 요청을 보낼 수 있습니다. 실제 서버에는 전송하지 않습니다.'});
  paint();
 }
 if(kind==='modalDepth'){
  state.visible??=false;state.items??=['프로젝트 메모','학습 기록','임시 파일'];state.selected??=1;
  const list=mk('div',undefined,'lab-modal-list'),overlay=mk('div',undefined,'lab-modal-overlay'),dialog=mk('div',undefined,'lab-modal-dialog'),summary=mk('div',undefined,'lab-event');
  const h=mk('h4','삭제 확인');const p=mk('p','정말 삭제할까요?');const buttons=mk('div',undefined,'row');
  const cancel=mk('button','취소','btn secondary'),confirm=mk('button','삭제 확인','btn danger');
  buttons.append(cancel,confirm);dialog.append(h,p,buttons);overlay.append(dialog);s.append(list,overlay,summary);
  const close=()=>{state.visible=false;paint()};
  cancel.addEventListener('click',close);confirm.addEventListener('click',()=>{if(state.selected!==null)state.items=state.items.filter((_,i)=>i!==state.selected);state.selected=null;state.visible=false;paint()});
  action('Android 뒤로 가기 요청',close,true);
  function paint(){list.replaceChildren();state.items.forEach((item,i)=>{const row=mk('div',undefined,'lab-modal-row');const name=mk('span',item);const b=mk('button','삭제…','btn secondary');b.addEventListener('click',()=>{state.selected=i;state.visible=true;paint()});row.append(name,b);list.append(row)});
   if(!state.items.length)list.append(mk('p','모든 항목을 삭제했습니다.'));
   overlay.hidden=!state.visible;p.textContent=state.selected===null?'항목을 선택하세요.':'“'+(state.items[state.selected]||'선택한 항목')+'”을 삭제할까요?';
   summary.textContent='Modal visible='+state.visible+' · 선택된 인덱스='+state.selected+' · 데이터 '+JSON.stringify(state.items);
   write('상태 전이: closed → open → cancel/confirm → closed','취소는 배열을 변경하지 않고, 확인 시에만 데이터에서 삭제합니다.');
  }paint();
 }
 if(kind==='projectDepth'){
  state.items??=[{id:'p1',name:'사과',price:1200},{id:'p2',name:'배',price:2100},{id:'p3',name:'포도',price:3300},{id:'p4',name:'바나나',price:1700},{id:'p5',name:'딸기',price:4500}];
  state.query??='';state.selectedId??=null;state.nextId??=6;
  const search=mk('input');search.type='search';search.placeholder='상품 이름 검색';search.value=state.query;
  const list=mk('div',undefined,'lab-project-items'),modal=mk('div',undefined,'lab-project-confirm'),info=mk('div',undefined,'lab-event');
  s.append(search,list,modal,info);
  search.addEventListener('input',()=>{state.query=search.value;render()});
  action('검색어 비우기',()=>{state.query='';search.value='';render()},true);
  action('새 상품 추가',()=>{state.items=[...state.items,{id:'p'+state.nextId++,name:'신상품 '+state.nextId,price:2500}];render()});
  function render(){const filtered=state.items.filter(item=>item.name.toLowerCase().includes(state.query.trim().toLowerCase()));
   list.replaceChildren();if(!filtered.length)list.append(mk('p','검색 결과가 없습니다.'));
   filtered.forEach(item=>{const row=mk('div',undefined,'lab-modal-row');row.append(mk('span',item.name+' · '+format(item.price)+'원'));
    const b=mk('button','선택','btn secondary');b.addEventListener('click',()=>{state.selectedId=item.id;render()});row.append(b);list.append(row)});
   modal.replaceChildren();
   if(state.selectedId!==null){const found=state.items.find(x=>x.id===state.selectedId);
    if(found){modal.append(mk('strong','“'+found.name+'”을 삭제할까요?'));const controls=mk('div',undefined,'row');
     const no=mk('button','취소','btn secondary'),yes=mk('button','삭제 확인','btn danger');
     no.addEventListener('click',()=>{state.selectedId=null;render()});
     yes.addEventListener('click',()=>{state.items=state.items.filter(item=>item.id!==state.selectedId);state.selectedId=null;render()});
     controls.append(no,yes);modal.append(controls)}
   }
   info.textContent='원본 items='+state.items.length+'개 · query='+JSON.stringify(state.query)+' · 파생 필터 목록='+filtered.length+'개 · selectedId='+state.selectedId;
   write('items State → filter(query) → 행 선택 → 확인 → 불변 삭제','이 목록은 FlatList의 데이터 흐름을 웹으로 재현한 교육용 실습이며 실제 네이티브 목록이나 서버 저장소가 아닙니다.');
  }render();
 }
}

function renderLab(){const l=lessons[current],c=$('controls'),s=$('stage'),e=$('explain');c.replaceChildren();s.replaceChildren();e.textContent='';const put=txt=>{s.replaceChildren(el('div',txt))};const caption=txt=>{e.textContent=txt};
if(l.lab.endsWith('Depth')){renderDeepLab(l.lab,c,s,e);return;}
if(l.lab==='platform'){state.platform??='iOS';c.append(control('플랫폼','select',state.platform,v=>{state.platform=v;renderLab()},[['iOS','🍎 iOS'],['Android','🤖 Android']]));put('📱 '+state.platform+' 화면: 안녕하세요!');caption('React Native 공통 컴포넌트 정의 → '+state.platform+' 네이티브 UI로 표시됩니다. 플랫폼마다 표현은 조금 다를 수 있습니다.')}
if(l.lab==='greeting'){state.name??='민수';c.append(control('부모가 전달하는 name','text',state.name,v=>{state.name=v;show()},[]));function show(){put('부모 Props: name = '+JSON.stringify(state.name)+'\n자식 화면: 안녕하세요, '+state.name+'님!');caption('데이터 흐름: 부모의 입력 → Props 전달 → 자식 컴포넌트 렌더링')}show()}
if(l.lab==='counter'){state.count??=0;c.append(button('+1',()=>{state.count++;show()}),button('-1',()=>{state.count--;show()},'btn secondary'));function show(){put('❤️ 좋아요 '+state.count+'개');caption('부모 State count = '+state.count+' → 자식 Props likes = '+state.count+' → Text에 반영')}show()}
if(l.lab==='todos'){state.todos??=[];state.text??='';c.append(control('새로운 할 일','text',state.text,v=>state.text=v));c.append(button('추가',()=>{if(!state.text.trim()){caption('빈 문자열은 추가되지 않습니다.');return}state.todos.push({id:Date.now()+Math.random(),title:state.text.trim(),done:false});state.text='';renderLab()}));function show(){s.replaceChildren();if(!state.todos.length)s.append(el('p','아직 할 일이 없습니다.'));state.todos.forEach(x=>{const r=el('div','','row');r.style.marginBottom='8px';const t=button((x.done?'☑ ':'☐ ')+x.title,()=>{x.done=!x.done;show()},'btn secondary');const d=button('삭제',()=>{state.todos=state.todos.filter(y=>y.id!==x.id);show()},'btn danger');r.append(t,d);s.append(r)});caption('todos.length = '+state.todos.length+' / 완료 = '+state.todos.filter(x=>x.done).length+' (실제 React에서는 배열을 직접 수정하지 않고 새 배열을 만들어 갱신합니다.)')}show()}
if(l.lab==='fruits'){state.fruits??=['사과','바나나'];state.fruit??='포도';c.append(control('추가할 과일','select',state.fruit,v=>state.fruit=v,[['포도','포도'],['딸기','딸기'],['오렌지','오렌지']]));c.append(button('...배열에 추가',()=>{let before=[...state.fruits];state.fruits=[...state.fruits,state.fruit];show(before)}));function show(before){put('이전 배열: '+JSON.stringify(before||state.fruits)+'\n새 배열: '+JSON.stringify(state.fruits));caption('...은 기존 요소를 펼쳐 넣습니다. 추가 후에도 원래 배열 객체를 직접 변경하지 않습니다.')}show()}
if(['filter','map','chain'].includes(l.lab)){const src=l.lab==='chain'?[40,80,60,90,30]:[1,2,3,4,5];state.threshold??=l.lab==='chain'?60:3;state.mult??=2;state.bonus??=10;if(l.lab!=='map')c.append(control(l.lab==='chain'?'합격 기준':'남길 최솟값(초과)','range',state.threshold,v=>{state.threshold=+v;show()},[]));if(l.lab==='map')c.append(control('곱하기 값','range',state.mult,v=>{state.mult=+v;show()},[]));if(l.lab==='chain')c.append(control('더할 점수','range',state.bonus,v=>{state.bonus=+v;show()},[]));c.querySelectorAll('input[type=range]').forEach((x,i)=>{x.min=l.lab==='chain'?(i===0?'0':'0'):'0';x.max=l.lab==='chain'?(i===0?'100':'30'):'10';x.step=l.lab==='chain'?'5':'1'});function show(){const filtered=l.lab==='map'?src:src.filter(n=>l.lab==='chain'?n>=state.threshold:n>state.threshold);const out=l.lab==='filter'?filtered:filtered.map(n=>l.lab==='chain'?n+state.bonus:n*state.mult);put('원본: '+JSON.stringify(src)+'\n1단계: '+JSON.stringify(filtered)+'\n최종 결과: '+JSON.stringify(out));caption(l.lab==='filter'?'조건을 통과한 항목만 남습니다.':l.lab==='map'?'각 숫자에 '+state.mult+'을 곱했습니다.':'먼저 '+state.threshold+'점 이상만 남기고, 각 점수에 '+state.bonus+'점을 더했습니다.')}show()}
if(['toggle','dark'].includes(l.lab)){state.on??=false;c.append(button('상태 바꾸기',()=>{state.on=!state.on;show()}));function show(){s.style.background=l.lab==='dark'?(state.on?'#1b2737':'#fff'):'#fff';s.style.color=l.lab==='dark'?(state.on?'#fff':'#182a40'):'#182a40';put(l.lab==='dark'?(state.on?'🌙 다크 모드':'☀️ 라이트 모드'):(state.on?'🎉 환영합니다!':'🔐 로그인 버튼'));caption((l.lab==='dark'?'isDarkMode':'isLoggedIn')+' = '+state.on+' → 조건문 결과가 달라집니다.')}show()}
if(l.lab==='style'){state.size??=24;state.color??='red';c.append(control('글자 크기','range',state.size,v=>{state.size=+v;show()}),control('글자 색상','select',state.color,v=>{state.color=v;show()},[['red','빨강'],['blue','파랑'],['green','초록']]));const range=c.querySelector('input');range.min=12;range.max=42;function show(){s.replaceChildren();const t=el('div','나의 첫 앱');t.style.fontSize=state.size+'px';t.style.color=state.color;s.append(t);caption('fontSize: '+state.size+' / color: '+state.color+' → Text 스타일에 반영')}show()}

if(l.lab==='flexAdvanced'){
 state.direction??='row';state.justify??='flex-start';state.align??='center';state.flexMode??='none';state.parentWidth??=100;
 const settings=[
  ['방향 flexDirection','direction',[['row','row (가로)'],['column','column (세로)']]],
  ['주축 justifyContent','justify',[['flex-start','flex-start'],['center','center'],['flex-end','flex-end'],['space-between','space-between'],['space-around','space-around'],['space-evenly','space-evenly']]],
  ['교차축 alignItems','align',[['flex-start','flex-start'],['center','center'],['flex-end','flex-end'],['stretch','stretch']]],
  ['flex: 1 적용 대상','flexMode',[['none','적용 안 함'],['middle','B만 flex: 1'],['all','A·B·C 모두 flex: 1']]]
 ];
 for(const [name,key,options] of settings)c.append(control(name,'select',state[key],v=>{state[key]=v;draw()},options));
 const widthWrap=document.createElement('div');widthWrap.className='flex-advanced-width';
 const widthLabel=document.createElement('label');widthLabel.textContent='부모 너비: ';widthLabel.htmlFor='flex-parent-width';
 const widthValue=document.createElement('strong');widthValue.id='flex-parent-percent';widthValue.textContent='100%';
 const widthInput=document.createElement('input');widthInput.type='range';widthInput.id='flex-parent-width';
 widthInput.min='65';widthInput.max='100';widthInput.step='5';widthInput.value=String(state.parentWidth);
 widthInput.addEventListener('input',()=>{state.parentWidth=Number(widthInput.value);draw()});
 widthWrap.append(widthLabel,widthInput,widthValue);c.append(widthWrap);
 const legend=document.createElement('p');legend.className='flex-advanced-legend';s.append(legend);
 const frame=document.createElement('div');frame.className='flex-advanced-frame';s.append(frame);
 const stats=document.createElement('div');stats.className='flex-advanced-stats';s.append(stats);
 const appTitle=document.createElement('p');appTitle.className='flex-app-title';appTitle.textContent='실전 미니 과제: 프로필 헤더';s.append(appTitle);
 const app=document.createElement('div');app.className='flex-profile';s.append(app);
 const avatar=el('div','👩‍💻','flex-avatar'),info=el('div','개발자 프로필 · React Native','flex-profile-info');
 const follow=el('span','팔로우','flex-follow');app.append(avatar,info,follow);
 const result=el('div','','flex-step-result');s.append(result);
 function draw(){
  widthValue.textContent=state.parentWidth+'%';
  const axis=state.direction==='row'?'가로':'세로';const cross=state.direction==='row'?'세로':'가로';
  legend.textContent='주축: '+axis+' / 교차축: '+cross+' · 주축은 justifyContent, 교차축은 alignItems로 정렬';
  frame.replaceChildren();frame.style.width=state.parentWidth+'%';
  Object.assign(frame.style,{display:'flex',flexDirection:state.direction,justifyContent:state.justify,alignItems:state.align});
  ['A','B','C'].forEach((name,i)=>{const child=el('div',name,'flex-advanced-child flex-child-'+i);
   const grow=state.flexMode==='all'||(state.flexMode==='middle'&&i===1);
   child.style.flex=grow?'1 1 0%':'0 0 auto';
   if(state.direction==='row'){child.style.minWidth='0';child.style.width=grow?'0':'48px';child.style.height=state.align==='stretch'?'auto':'46px'}
   else {child.style.width=state.align==='stretch'?'auto':'48px';child.style.height=grow?'0':'46px';child.style.minHeight='0'}
   frame.append(child)});
  const hasFlex=state.flexMode!=='none';
  stats.textContent='방향='+state.direction+' · 주축 정렬='+state.justify+' · 교차축 정렬='+state.align+' · flex='+(state.flexMode==='none'?'없음':state.flexMode==='middle'?'B만 1':'모두 1');
  result.textContent='① '+state.direction+' 방향으로 A·B·C를 배치 → ② '+state.justify+' 규칙을 주축에 적용 → ③ '+state.align+' 규칙을 교차축에 적용 → ④ '+(hasFlex?'flex: 1 대상이 남는 주축 공간을 차지합니다.':'자식이 기본 크기를 유지하므로 남는 주축 공간의 정렬 차이가 보입니다.');
  caption(hasFlex?'flex: 1로 주축 공간을 채우면 justifyContent가 분배할 남는 공간이 줄어듭니다. 모바일에서는 너비를 줄여 변화도 관찰하세요.':'justifyContent가 주축에서 공간을 분배합니다. alignItems는 교차축을 정렬합니다. stretch는 교차축 크기가 고정되지 않은 요소에 효과가 나타납니다.');
 }
 draw();
}
if(l.lab==='flex'){state.direction??='column';state.justify??='flex-start';state.align??='flex-start';c.append(control('flexDirection','select',state.direction,v=>{state.direction=v;show()},[['column','column (세로)'],['row','row (가로)']]));c.append(control('justifyContent','select',state.justify,v=>{state.justify=v;show()},[['flex-start','flex-start'],['center','center'],['flex-end','flex-end'],['space-between','space-between']]));c.append(control('alignItems','select',state.align,v=>{state.align=v;show()},[['flex-start','flex-start'],['center','center'],['flex-end','flex-end']]));function show(){s.replaceChildren();const f=el('div');Object.assign(f.style,{display:'flex',height:'210px',gap:'6px',flexDirection:state.direction,justifyContent:state.justify,alignItems:state.align,border:'1px solid #d8e3f1',padding:'6px'});['빨강','파랑','초록'].forEach(x=>f.append(el('div',x,'block')));s.append(f);caption('주축 = '+(state.direction==='row'?'가로':'세로')+' / 교차축 = '+(state.direction==='row'?'세로':'가로')+' / justifyContent = '+state.justify+' / alignItems = '+state.align)}show()}
}
  renderLab();
  root.querySelector('[data-legacy-reset]').addEventListener('click', () => {
    state = {};
    $('stage').style.background = '';
    $('stage').style.color = '';
    renderLab();
  });
}
