
(() => {
const root=document.querySelector('#teacher-command'), lessons=window.ScienceStudioLessons;
if(!root||!lessons)return;
const master='resources/output/current/G5_Science_Unit_5.1_Teacher_Core_Master_L01-L15.pdf';
const share='resources/output/current/Science_Studio_Teacher_Binder_Download.pdf';
const key='science-studio.section-progress.v1', sections=['A','B'];
const ready=new Map();
const activityKey='science-studio.current-activity.v1';
const bellActivities={
 1:['Deck position 15','Deck position 21'],
 2:['Slides E-F'],
 3:['Slides I-L'],
 4:['Slides J–M'],
 5:['Slides F–K'],
 6:['Slides F–H'],
 7:['Slides D–E','Slides F'],
 8:['Slides M'],
 9:['Slides G–J','Slides K–M'],
 10:['Slides D–E'],
 11:['Slides F–H'],
 12:['Slides D–J'],
 13:['Slides G–J'],
 14:['Slides C–J','Slides K–L'],
 15:['Slides H–I'],
};
let n=1,i=0,section='A',panel='lessons',records={},message='';
let briefingLesson=null;
const clean=value=>{
 const result={};
 for(const s of sections){
  const r=value?.[s];
  if(!r||!Number.isInteger(r.lesson)||!lessons[r.lesson-1]||!Number.isInteger(r.activity)||r.activity<0||r.activity>lessons[r.lesson-1].stages.length)continue;
  const str=x=>typeof x==='string'?x.slice(0,1000):'';
  result[s]={lesson:r.lesson,activity:r.activity,date:str(r.date),evidence:str(r.evidence),first:str(r.first)};
 }
 return result;
};
try{records=clean(JSON.parse(localStorage.getItem(key)||'{}'));}catch{message='Browser storage is unavailable. Export a backup if you save progress.';}
function persist(){
 try{localStorage.setItem(key,JSON.stringify(records));return true;}catch{return false;}
}
function el(tag,text='',cls=''){
 const x=document.createElement(tag);x.textContent=text;if(cls)x.className=cls;return x;
}
function btn(text,fn,cls=''){
 const x=el('button',text,cls);x.type='button';x.addEventListener('click',fn);return x;
}
function link(text,path){const x=el('a',text);x.href=path;x.target='_blank';x.rel='noopener';return x;}
function select(entries,value){
 const x=el('select');
 for(const [v,t] of entries){const o=el('option',t);o.value=v;x.append(o);}
 x.value=value;return x;
}
function field(text,control){const x=el('label',text,'tc-field');control.setAttribute('aria-label',text);x.append(control);return x;}
const sentenceReader=new Intl.Segmenter('en',{granularity:'sentence'});
function copy(title,value,cls=''){
 const x=el('section','','tc-copy '+cls);
 x.append(el('h3',title));
 const cues=Array.from(sentenceReader.segment(value),part=>part.segment.trim()).filter(Boolean);
 if(cues.length<2)x.append(el('p',value));
 else{
  const list=el('ul','','tc-cues');
  for(const cue of cues)list.append(el('li',cue));
  x.append(list);
 }
 return x;
}
function unitDeck(){
 const deck=document.querySelector('#unit-lesson-buttons');
 if(!deck)return;
 for(const l of lessons){
  const button=btn('',()=>go(l.number),'tc-lesson');
  button.dataset.unitLesson=l.number;
  button.append(el('span','LESSON '+String(l.number).padStart(2,'0'),'tc-lesson-number'),
    el('strong',l.title),el('span','Open lesson →','tc-open-label'));
  deck.append(button);
 }
}
function links(l,keys){
 const names={prep:'Prep Desk',briefing:'Science Briefing',resume:'Pause / Resume',teaching:'Teaching Moves',field:'Field Notes'};
 const x=el('div','','tc-links');
 for(const k of keys)x.append(link(names[k]+' in binder',master+'#page='+l.pages[k]));
 return x;
}
function go(lesson,activity=0,destination=''){
 briefingLesson=null;
 n=lesson;i=activity;panel=destination;root.hidden=false;document.body.classList.add('teacher-on');
 try{sessionStorage.setItem(activityKey,JSON.stringify([n,i]));}catch{}
 render();root.querySelector(destination==='briefing'?'#tc-panel h1':'#tc-activity').focus();
}
function slideRange(activity){
 const first=activity.slides[0].id,last=activity.slides.at(-1).id;
 return first===last?first:first+'–'+last;
}
function activityReference(activity){
 const range=slideRange(activity);
 return (activity.slides.length===1?'Slide ':'Slides ')+range;
}
function sequence(l){
 const list=el('div','','tc-sequence-list');
 let block;
 for(const [j,a] of l.stages.entries()){
  if(a.block&&block!==a.block){
   block=a.block;list.append(el('h3','Block '+block,'tc-sequence-block'));
  }
  const button=btn('',()=>go(n,j),'tc-stage');
  button.setAttribute('aria-label',activityReference(a)+' · '+a.title);
  if(j===i)button.setAttribute('aria-current','step');
  const ref=slideRange(a);
  button.append(el('span',ref,'tc-stage-ref'),el('span',a.title));
  list.append(button);
 }
 return list;
}
let slidePreviewOpen=false;
function slidePanel(a,l){
 const panel=el('section','','tc-secondary tc-slide-panel');
 panel.setAttribute('aria-label','Slide navigator');
 panel.append(el('div','OFFICIAL DECK / '+activityReference(a).toUpperCase(),'tc-slate-kicker'),
  el('h2','Slide navigator'),el('p','Choose a slide in this activity.','tc-note'));
 const body=el('div','','tc-slide-body');
 const display=el('div','','tc-slide-display');
 const resource=l.slideResource;
 function show(item){
  display.replaceChildren(el('strong',item.label+(item.title?' · '+item.title:'')));
  if(item.url){
   const jump=el('div');
   jump.append(link('Open slide '+item.id+' in Google Slides',item.url));
   display.append(jump);
  }
  if(!item.path){
   if(!item.url)display.append(el('p','Use this slide letter in the official lesson deck.','tc-note'));
   return;
  }
  const figure=el('figure','','tc-slide-figure');
  const img=el('img');img.alt='Official OpenSciEd '+item.label+' preview';img.loading='lazy';
  img.addEventListener('error',()=>{
   figure.replaceChildren(el('p','This preview could not load. Use the slide reference and official resource link.','tc-note'));
  },{once:true});
  img.src=item.path;
  const enlarge=el('button','','tc-slide-enlarge');
  enlarge.type='button';
  enlarge.setAttribute('aria-label','Enlarge '+item.label);
  enlarge.setAttribute('aria-haspopup','dialog');
  enlarge.append(img,el('span','Click to enlarge'));
  const dialog=el('dialog','','tc-slide-dialog');
  dialog.setAttribute('aria-label',item.label+' enlarged preview');
  const close=el('button','Close preview');
  close.type='button';
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
   if(event.target===dialog)dialog.close();
  });
  const large=el('img');
  large.alt=img.alt;
  dialog.append(close,large,el('p',item.credit,'tc-note'));
  enlarge.addEventListener('click',()=>{
   large.src=item.path;
   dialog.showModal();
  });
  figure.append(enlarge,el('figcaption',item.credit,'tc-note'),dialog);
  display.append(figure);
 }
 let selected=Math.max(0,a.slides.findIndex(item=>item.path));
 const letters=el('div','','tc-preview-letters');
 const chips=a.slides.map((item,index)=>{
  const chip=btn(item.id,()=>choose(index));
  chip.setAttribute('aria-label','Select slide '+item.id);
  chip.title='Slide '+item.id+(item.deckPosition?' · deck position '+item.deckPosition:'')+(item.title?' · '+item.title:'');
  letters.append(chip);
  return chip;
 });
 const position=el('p','','tc-note');
 position.setAttribute('aria-live','polite');
 const previous=btn('← Previous Preview',()=>choose(selected-1));
 const next=btn('Next Preview →',()=>choose(selected+1));
 const transport=el('div','','tc-preview-controls');
 transport.append(previous,next);
 display.id='tc-selected-preview';
 const reveal=btn('',()=>{
  slidePreviewOpen=!slidePreviewOpen;
  updatePreview();
 },'tc-preview-reveal');
 reveal.setAttribute('aria-controls',display.id);
 function updatePreview(){
  reveal.textContent=slidePreviewOpen?'Hide preview':'Show selected preview';
  reveal.setAttribute('aria-expanded',String(slidePreviewOpen));
  display.hidden=!slidePreviewOpen;
  if(slidePreviewOpen)show(a.slides[selected]);
  else display.replaceChildren();
 }
 function choose(index){
  selected=index;
  chips.forEach((chip,j)=>chip.setAttribute('aria-pressed',String(j===index)));
  previous.disabled=index===0;
  next.disabled=index===a.slides.length-1;
  position.textContent='Slide '+a.slides[index].id+' selected · '+(index+1)+' of '+a.slides.length;
  updatePreview();
 }
 const sources=el('details','','tc-preview-sources');
 sources.append(el('summary','Official deck'),link(resource.label,resource.url),
  el('p','Teacher reference · Promethean display stays independent.','tc-note'));
 body.append(letters,position);
 if(a.slides.length>1)body.append(transport);
 body.append(reveal,display,sources);
 panel.append(body);
 choose(selected);
 return panel;
}
function moreHelp(a,l){
 const details=el('details','','tc-secondary tc-more-help');
 const primary=[a.cue.do,a.cue.ask,a.cue.listen];
 const normalize=value=>value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const already=new Set(primary.flatMap(value=>Array.from(sentenceReader.segment(value),part=>normalize(part.segment))));
 function distinct(value){
  return Array.from(sentenceReader.segment(value||''),part=>part.segment.trim())
   .filter(text=>text&&!already.has(normalize(text))).join(' ');
 }
 const move=distinct(a.move), question=distinct(a.ask), respond=distinct(a.listen);
 details.append(el('summary','More Help'));
 if(move)details.append(copy('Extended directions',move));
 if(question)details.append(copy('Additional question',question));
 if(respond)details.append(copy('Follow-up guidance',respond));
 if(l.access)details.append(copy('Access during instruction · lesson reference',l.access));
 if(a.source)details.append(el('p','Teacher Guide · printed '+(a.source.includes('–')?'pp. ':'p. ')+a.source,'tc-note'));
 details.append(links(l,['teaching']));
 return details;
}
const names={lessons:'Episode Guide',briefing:'Science Briefing',overview:'Activity Overview',prep:'Prep Desk',pause:'Pause / Resume',resources:'Resources'};
const tourKey='science-studio.orientation.v1';
let offerTour=false,tour=null;
const orientation=el('dialog','','tc-orientation');
orientation.setAttribute('aria-labelledby','tc-orientation-title');
const spotlight=el('div','','tc-spotlight');
spotlight.setAttribute('aria-hidden','true');
const pointer=document.createElementNS('http://www.w3.org/2000/svg','svg');
pointer.classList.add('tc-tour-pointer');
pointer.setAttribute('aria-hidden','true');
const pointerLine=document.createElementNS(pointer.namespaceURI,'path');
pointer.append(pointerLine);
const orientationCard=el('div','','tc-orientation-card');
orientation.append(spotlight,pointer,orientationCard);
document.body.append(orientation);
const tourSteps=[
 ['lessons','.tc-board-lesson[aria-current]','Pick an episode','Keep the official OpenSciEd deck on the classroom display. Science Studio runs separately on your teacher monitor. Pick an episode here to see what the lesson is about.'],
 ['lessons','.tc-feature-launch','Open the Science Briefing','Open the featured lesson’s briefing to see why today’s work matters.'],
 ['briefing','.tc-brief-actions','Get ready to teach','Read what students bring from the previous lesson and what to carry forward. Choose Teach this lesson to start. For setup and materials, use Prep Desk.'],
 ['','.tc-sequence','Find your activity','Run of Show lets you jump straight to an activity. The highlighted item is the one you’re teaching.'],
 ['','.tc-cue-ask','Read the teaching cues','DO gives your next move. ASK gives you a question to pose. LISTEN FOR tells you what student evidence or ideas to notice.'],
 ['','.tc-preview-letters','Find the official slide','Choose a publisher slide letter, then open its image if you need a visual reference. Preview selection stays within this activity and leaves the classroom display independent.'],
 ['','.tc-controls','Advance your teaching cues','Next Activity changes the cues and can move to a new group of slides. The Up Next label tells you where you’re going.'],
 ['','.tc-more-help','Open help when you need it','More Help has follow-up questions and Teacher Guide pages. Science Briefing explains the lesson’s purpose. Prep Desk has materials and setup.'],
];
const quickStart=[
 'Open the official OpenSciEd deck on the classroom display. Keep Science Studio on your teacher screen.',
 'Choose an episode, open its Science Briefing, then select Teach this lesson. Use Prep Desk to get materials ready.',
 'Use Run of Show to jump to an activity and follow DO, ASK, and LISTEN FOR.',
 'Use the Slide Navigator to identify the official slide. Next Activity advances the teaching cues.',
 'Open More Help for follow-up moves. Use Pause / Resume to save each class’s stopping point.',
];
function rememberOrientation(){
 offerTour=false;
 root.querySelector('.tc-orientation-offer')?.remove();
 try{localStorage.setItem(tourKey,'seen');}catch{}
}
function closeOrientation(){
 if(!orientation.open)return;
 const saved=tour;
 tour=null;
 orientation.close();
 if(saved){
  ({n,i,panel,briefingLesson}=saved);
  root.classList.toggle('tc-board-active',panel==='lessons');
  root.replaceChildren(...saved.nodes);
  root.querySelector('.tc-content').scrollTop=saved.scroll;
  rememberOrientation();
 }
 if(!saved?.focus?.isConnected)root.querySelector('.tc-help-button')?.focus();
 else saved.focus.focus();
}
orientation.addEventListener('cancel',event=>{
 event.preventDefault();
 closeOrientation();
});
function orientationHeading(kicker,title){
 const heading=el('h2',title);heading.id='tc-orientation-title';heading.tabIndex=-1;
 orientationCard.replaceChildren(el('p',kicker,'tc-slate-kicker'),heading);
 return heading;
}
function positionSpotlight(){
 if(!orientation.open)return;
 const target=root.querySelector(tour?tourSteps[tour.step][1]:'.tc-help-button');
 if(!target)return;
 const bounds=target.getBoundingClientRect();
 const content=target.closest('.tc-content')?.getBoundingClientRect();
 const left=Math.max(4,bounds.left-5),right=Math.min(innerWidth-4,bounds.right+5);
 const top=Math.max(4,content?.top||0,bounds.top-5);
 const bottom=Math.max(top+1,Math.min(innerHeight-4,content?.bottom||innerHeight,bounds.bottom+5));
 Object.assign(spotlight.style,{left:left+'px',top:top+'px',width:(right-left)+'px',height:(bottom-top)+'px'});
 const width=orientationCard.offsetWidth,height=orientationCard.offsetHeight,gap=24;
 const clamp=(v,max)=>Math.max(gap,Math.min(v,max-gap));
 let x=clamp(left,innerWidth-width),y;
 if(bottom+gap+height<=innerHeight-gap)y=bottom+gap;
 else if(top-gap-height>=gap)y=top-gap-height;
 else if(right+gap+width<=innerWidth-gap){x=right+gap;y=clamp(top,innerHeight-height);}
 else if(left-gap-width>=gap){x=left-gap-width;y=clamp(top,innerHeight-height);}
 else y=top>innerHeight/2?gap:innerHeight-height-gap;
 Object.assign(orientationCard.style,{left:x+'px',top:y+'px'});
 const targetX=(left+right)/2,targetY=(top+bottom)/2;
 const tipX=Math.max(left,Math.min(x+width/2,right));
 const tipY=Math.max(top,Math.min(y+height/2,bottom));
 const fromX=Math.max(x,Math.min(targetX,x+width));
 const fromY=Math.max(y,Math.min(targetY,y+height));
 const dx=tipX-fromX,dy=tipY-fromY,length=Math.hypot(dx,dy);
 if(length<8){
  pointerLine.removeAttribute('d');
  return;
 }
 const ux=dx/length,uy=dy/length;
 const arrowX=tipX-8*ux,arrowY=tipY-8*uy;
 pointerLine.setAttribute('d',`M ${fromX} ${fromY} L ${tipX} ${tipY} M ${arrowX-4*uy} ${arrowY+4*ux} L ${tipX} ${tipY} L ${arrowX+4*uy} ${arrowY-4*ux}`);
}
function tourStep(step){
 tour.step=step;
 const [screen,target,title,body]=tourSteps[step];
 n=1;i=1;panel=screen;briefingLesson=null;
 render();
 orientation.classList.add('tc-spotlight-mode');
 const heading=orientationHeading('STUDIO ORIENTATION · '+(step+1)+' / '+tourSteps.length,title);
 const controls=el('div','','tc-orientation-controls');
 const back=btn('Back',()=>tourStep(step-1));back.disabled=step===0;
 controls.append(btn('Skip',closeOrientation),back,
  btn(step===tourSteps.length-1?'Finish':'Next',()=>step===tourSteps.length-1?closeOrientation():tourStep(step+1),'tc-orientation-primary'));
 if(step===0)controls.append(btn('Help options',()=>{
  closeOrientation();
  showOrientationHelp();
 }));
 orientationCard.append(el('p',body),controls);
 if(!orientation.open)orientation.showModal();
 root.querySelector(target)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 positionSpotlight();
 heading.focus({preventScroll:true});
}
function startTour(){
 tour={n,i,panel,briefingLesson,nodes:[...root.childNodes],scroll:root.querySelector('.tc-content').scrollTop,
  focus:orientation.open?root.querySelector('.tc-help-button'):document.activeElement};
 tourStep(0);
}
function showOrientationHelp(view='menu'){
 orientation.classList.add('tc-spotlight-mode');
 orientationCard.removeAttribute('style');
 const title=view==='quick'?'Quick-start guide':view==='context'?'Help for this screen':'Need help?';
 const heading=orientationHeading('SCIENCE STUDIO · TEACHER HELP',title);
 if(view==='quick'){
  const list=el('ol');
  for(const step of quickStart)list.append(el('li',step));
  orientationCard.append(list);
 }else if(view==='context'){
  const help={
   lessons:'Pick an episode to preview its artwork and description. Open its Science Briefing, then choose Teach this lesson. A saved class can resume directly from the Guide.',
   briefing:'Read the teaching roadmap for the lesson’s purpose and what to carry forward. Choose Teach this lesson when you’re ready.',
   overview:'Choose any activity to open its teaching cues on On Air.',
   prep:'Check the materials list and open the printable checklist before teaching.',
   pause:'Choose your class section and save the last completed activity. Resume from the Episode Guide.',
   resources:'Open the binder and official curriculum links in a separate tab.',
  };
  orientationCard.append(el('p',help[panel]||'Follow DO, ASK, and LISTEN FOR. Use the Slide Navigator for a reference image, and Next Activity to move the teaching cues.'));
 }
 const controls=el('div','','tc-orientation-controls');
 if(view==='menu')controls.append(btn('Restart tour',startTour,'tc-orientation-primary'),btn('Help for this screen',()=>showOrientationHelp('context')),btn('Quick-start guide',()=>showOrientationHelp('quick')));
 else controls.append(btn('Back to help',()=>showOrientationHelp()));
 controls.append(btn('Close',()=>{
  closeOrientation();
  root.querySelector('.tc-help-button')?.focus();
 }));
 orientationCard.append(controls);
 if(!orientation.open)orientation.showModal();
 positionSpotlight();
 heading.focus({preventScroll:true});
}
window.addEventListener('resize',()=>{
 if(tour)root.querySelector(tourSteps[tour.step][1])?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 positionSpotlight();
});
function toggle(name,lesson=null){
 panel=panel===name?'':name;
 briefingLesson=panel==='briefing'?lesson:null;
 render();
 root.querySelector(panel==='briefing'?'#tc-panel h1':panel?'#tc-panel h2':'[data-panel="'+name+'"]')?.focus();
}
function bellCue(l,a){
 if(!bellActivities[l.number]?.includes(a.ref))return null;
 if(l.number===3&&a.id!==4)return null;
 let [stop,save,restart]=l.resume||[];
 if(l.number===1){
  [stop,save,restart]=a.ref==='Deck position 15'
   ? ['Pause after students have had time to start their individual models.','Notice and Wonder and each student’s model.','Finish any incomplete models at N. Begin O when models are ready to compare.']
   : ['Pause after the community examples discussion.','The consensus model and related phenomena.','Finish Connect if needed. Then open U to write investigation questions.'];
 }
 if(l.number===2){
  [stop,save,restart]=['Finish E–F before moving to the moss questions.','Station observations, models, and the community chart.','Open G with what students noticed about moss.'];
 }
 if(l.number===3){
  [stop,save,restart]=['Pause during I–L after students record their procedure and measurements.','Group measurements, procedures, and unfinished comparisons.','Use Finish the pumpkin comparison to reopen the group records and continue at the unfinished slide.'];
 }
 if(l.number===4)restart='Reopen the marked graph. Finish J–M if needed, then discuss claims at N before the soil reading.';
 if(l.number===5)restart='Reopen the class chart and unfinished syringe models. Finish F–K if needed, then use the evidence in the plant models at L–M.';
 if(l.number===7&&a.ref==='Slides F')restart='Finish the community connection if needed. Set aside a full window for the G–I argument and assessment.';
 if(l.number===11)restart='Reopen the evidence tables. If reading is unfinished, recap with partners and finish F–H before modeling at I–J.';
 if(l.number===9&&a.ref==='Slides G–J'){
  save='Temperature readings, isopod counts, and the class predictions.';
  restart='Start K–M with the data and predictions. If the demonstration was interrupted, use the publisher video to fill gaps before interpreting the results.';
 }
 if(l.number===14&&a.ref==='Slides K–L'){
  restart='Finish the infographic prediction at K–L if needed. Then use the saved baseline and prediction to launch the bullfrog round at M–N.';
 }
 if(l.number===15){
  stop='Pause after H–I practice if there is too little time to give directions and allow 30 minutes of independent work at J.';
  restart='Start J in a dedicated assessment window after H–I practice is complete.';
 }
 const cue=el('section','','tc-bell-cue');
 cue.append(el('h3','At the 45-minute bell'));
 const list=el('dl');
 for(const [label,text] of [['Stop',stop],['Save',save],['Restart',restart]]){
  list.append(el('dt',label),el('dd',text));
 }
 cue.append(list,btn('Open Pause / Resume for Section '+section,()=>toggle('pause')));
 return cue;
}
function progress(l){
 const x=el('div');
 if(l.resume){
  const cards=el('div','','tc-resume');
  ['Stop','Save','Restart'].forEach((title,j)=>cards.append(copy(title,l.resume[j])));
  x.append(cards);
 }else x.append(el('div',l.earlyResume,'tc-reference'));
 const saved=records[section]?.lesson===n?records[section]:{};
 const form=el('form','','tc-form');
 const last=select([[0,'Choose completed activity'],...l.stages.map(a=>[a.id,activityReference(a)+' · '+a.title])],saved.activity||0);
 const date=el('input');date.type='date';date.value=saved.date||'';
 const evidence=el('textarea');evidence.rows=2;evidence.maxLength=1000;evidence.value=saved.evidence||'';
 const first=el('textarea');first.rows=2;first.maxLength=1000;first.value=saved.first||'';
 const save=el('button','Save Section '+section+' progress','tc-primary');save.type='submit';
 form.append(el('h3','Section '+section+' · Lesson '+n),field('Last completed activity',last),field('Date (optional)',date),field('Saved evidence or materials',evidence),field('First move next class',first),save);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  records[section]={lesson:n,activity:Number(last.value),date:date.value,evidence:evidence.value,first:first.value};
  message=persist()?'Section '+section+' progress saved in this browser.':'Progress is held for this visit. Export a backup before closing.';
  render();root.querySelector('#tc-panel h2').focus();
 });
 const tools=el('details','','tc-secondary');
 tools.append(el('summary','Back up or restore progress'));
 const backup=el('textarea');backup.rows=4;backup.spellcheck=false;
 tools.append(el('p','Copy the backup text into a safe local file. To restore later, paste the saved text here.'),
  field('Backup text',backup),
  btn('Show backup text',()=>{
   backup.value=JSON.stringify({version:1,records},null,2);
   backup.focus();backup.select();
  }),
  btn('Restore backup text',()=>{
   try{
    const parsed=JSON.parse(backup.value),restored=clean(parsed.records);
    if(parsed.version!==1||!Object.keys(restored).length)throw Error('Invalid backup');
    if(!window.confirm('Restore the saved records for the sections in this backup?'))return;
    records={...records,...restored};
    message=persist()?'Backup restored to this browser.':'Backup restored for this visit only.';
   }catch{message='Could not restore this text. Paste a Science Studio progress backup.';}
   render();root.querySelector('#tc-panel h2').focus();
  }));
 x.append(links(l,['resume','field']),form,el('p','Progress stays in this browser and profile and may be cleared. It does not sync across devices. Export a backup. Use class-level notes without student names or sensitive information.','tc-note'),tools);
 return x;
}
function savedPosition(group){
 const saved=records[group];
 const row=el('div','','tc-saved tc-section-'+group.toLowerCase());
 if(!saved){
  row.append(el('span','Section '+group+' · no saved stopping point'));
  return row;
 }
 const lesson=lessons[saved.lesson-1], stages=lesson.stages;
 const last=stages[saved.activity-1];
 const complete=saved.activity===stages.length;
 const target=Math.min(saved.activity,stages.length-1);
 const position=complete?'Lesson complete':last?'Last completed: '+last.title:'Start of lesson';
 const resume=btn(complete?'Review Section '+group:'Resume Section '+group,()=>{
  section=group;
  go(saved.lesson,target);
 });
 resume.title=activityReference(stages[target])+' · '+stages[target].title;
 row.append(el('span','Section '+group+' · Lesson '+saved.lesson+' · '+position+(saved.date?' · '+saved.date:'')),resume);
 return row;
}
const hostIntros=[
 'Take a look at this fallen tree. There’s a whole neighborhood growing on it! Give students time to spot the clues before they sketch how the log might help its neighbors. Save their questions. Next time, we’ll zoom in.',
 'Let’s take a closer look. Give students a moment to describe what they see on the log and where they see it. When they spot moss, ask what they could observe to learn more about it. That question takes us into plant growth.',
 'A pumpkin gets bigger right before our eyes. Now how would we measure that change? Let teams compare their methods and argue from the readings they collect. We’ll use those measurement ideas to test what helps plants grow.',
 'Let’s look at the setup before we look at the results. Have students find two plants they can fairly compare, then trace how each plant’s weight changes. Leave one question on the board: where did the added matter come from?',
 'Can we weigh air? Get the predictions on the board and let the readings do some work. Then give students the syringe evidence to think with as they draw what might be happening inside. Save the light question for next time.',
 'Watch what happens when the light reaches the toy. Ask students to describe the change before they explain it. Then bring in the tomato reading to help them work out how a plant uses energy from sunlight.',
 'Bring out those plant models again. This time, give every arrow a job. Ask students what moves and which evidence supports it. Their revised models can help explain how plants grow in places beyond the nurse log.',
 'The log looks different over time. Let’s take stock of what students can actually see, then compare it with the termite colony data. The readings can help us follow some of the matter and give us a new question about food.',
 'Watch the isopods and keep two records: temperature and movement. Ask students what changed in the habitat and what the animals did in response. Then use the bird readings to compare how animals use energy.',
 'Spread out the models and choose one connection to trace. Ask what the animal gets and what evidence supports the connection. Once the class has a model it can explain, let students try their ideas on a new animal.',
 'We can see a termite eating wood. What happens on the inside? Put the video and reading side by side and have students use both as they draw a pathway. That gives us a reason to ask what else can break down wood.',
 'Give each group one set of mushroom evidence to study, then bring the groups together. Ask what each source helps explain. Keep the question about where fungi get their matter open for the next investigation.',
 'Watch the flower change. Then ask students to trace where some of its matter might go. Use the reading and time-lapse to help them label what they observed and what they inferred before revising the class model.',
 'Let’s build the web once, then change one part. Save the first yarn pattern before adding the bullfrog. After the second round, ask students to trace one change they can point to. We’ll carry that reasoning into the grassland.',
 'New ecosystem, same big questions. Have students use the grassland cards to practice tracing a food chain. Then give them a full independent window to show what they can explain with the official transfer task.',
];
const briefingRoadmap=[
 ['Start with the fallen redwood. Invite students to bring in experiences with logs, moss, and other living things they’ve noticed outdoors.',
  'It takes practice to let a good question hang in the air. Give them a moment. Their first models will show which relationships they can already imagine and which they need evidence to explain.',
  'Save the models and Driving Question Board. In Lesson 2, use a student’s question to send the class back to the log for a closer look.'],
 ['Reopen the first models and the questions students posted about the fallen tree. Ask which question a closer look might help answer.',
  'Keep the observations tied to a place on the log or an image. That gives the class evidence for revising the model and helps turn a general wondering about moss into a question they can investigate.',
  'Save the observations and the questions about moss and plant growth. In Lesson 3, use one of those questions to introduce the problem of measuring growth.'],
 ['Bring back the question of how moss grows. A pumpkin gives you a bigger, more visible example of plant growth to investigate.',
  'Different teams may get different answers. Good. Ask what each tool actually measured, then help students see why weight is useful when the question is how much matter the plant gained.',
  'Save the measurements and testable plant-growth questions. Lesson 4 puts that reasoning to work with an actual plant investigation.'],
 ['Use the pumpkin work to remind students why a change in weight can tell us something about growth. Reopen their proposed tests.',
  'Have them look at what varied before you show the results. A carefully chosen comparison gives them a reason to trust a claim about what helps plants grow. It also helps them see the limits of that claim.',
  'Save a marked comparison and the question of where the plant’s added matter came from. Lesson 5 tests ideas about air, water, and light.'],
 ['Bring back the weight patterns from the plant investigation and the unresolved question of what supplied the added matter.',
  'Yes, air is tricky to teach. Give students something they can work with: actual measurements and a syringe they can observe. The observations give them evidence for drawing and revising a model of something they can’t see.',
  'Save the matter models and the question of what light provides. Lesson 6 picks up that question and separates the role of energy from the sources of plant matter.'],
 ['Reopen the Lesson 5 models showing air and water as sources of matter. Ask what those models still leave unexplained about light.',
  'Give students time to describe a change they can see in the toy. Then use the tomato reading to connect that evidence to a question the toy alone can’t answer: how plants use energy from sunlight.',
  'Save the plant energy models and the evidence chart. Lesson 7 uses both to explain how the nurse log supports plant growth.'],
 ['Put the plant investigations, models, and Growing Ideas back on the table. Ask students to attach evidence to each requirement they propose.',
  'A model gets better when students can tell you what an arrow means. Have them trace matter and energy separately. The transfer task gives you a chance to see whether that reasoning travels to another place.',
  'Save the revised nurse-log model. Lesson 8 turns the class’s attention to the changing log itself and to animals that live in the system.'],
 ['Return to the class questions about what happens to the log over time. Use the plant model as a reminder that the log is already part of a system.',
  'Separate what the class sees changing from where they think the matter goes. The termite colony data let them test part of that explanation and leave room for paths they cannot yet measure.',
  'Save one supported matter pathway and a question about what animals get from food. Lesson 9 takes up that question with isopods and birds.'],
 ['Revisit the termite evidence that helped students think about what enters an animal when it eats. Now ask what an animal does with the energy it gets.',
  'A moving pillbug can grab the whole room’s attention. Give that attention a job: record the temperature and movement separately. The comparison with birds helps students see that animals can use energy in different ways.',
  'Save an observation and a claim about animal energy use. Lesson 10 puts those findings into the class model of how the nurse log supports animals.'],
 ['Bring back the isopod observations, bird readings, and the class’s earlier plant model. Invite students to name one animal need they can now explain.',
  'Check one connection at a time. Have students say what moves or what the habitat provides, and point to their evidence. The salamander task shows whether they can apply that explanation to an unfamiliar animal.',
  'Save the revised class model and the question of how termites get matter and energy from wood. Lesson 11 looks more closely at what happens inside a termite.'],
 ['Reopen the feeding relationships in the class model, especially the connection from wood to termites. Ask what the model cannot yet show about digestion.',
  'A video of eating is a good start. The reading gives students another kind of evidence. Have them use the two together to explain how other organisms help termites break down wood.',
  'Save the termite models and ask what else might break down wood. Lesson 12 looks for evidence about mushrooms.'],
 ['Return to the question of what besides termites might help break down a log. Recall where the class has observed mushrooms.',
  'Let each group report what its source actually shows before comparing claims. Growing in the dark helps answer a question about light. To explain where a mushroom gets matter, students will need different evidence.',
  'Save the comparison chart and the unresolved matter question. Lesson 13 draws on reading and time-lapse evidence to model decomposition.'],
 ['Reopen the mushroom comparison. Ask students what they observed and what they still need to explain about material breaking down.',
  'Students may tell you the flower disappeared. That’s your opening. Ask what changed visibly and where some of the matter might have gone. Their revised model adds the decomposer pathway to the ecosystem story.',
  'Save the consensus model with the decomposer connections marked. In Lesson 14, students use that network of relationships to reason about what happens when a new species enters.'],
 ['Start with the model from Lesson 13. Have students trace a connection among producers, consumers, and decomposers before they pick up the yarn.',
  'Save the first web before you change anything. Then the second round gives the class a comparison they can use to explain how one new species affects relationships elsewhere in the system.',
  'Save a sketch or photo of both webs and the class’s evidence-backed explanation. Lesson 15 asks students to carry that way of thinking into a grassland ecosystem.'],
 ['Bring back the two yarn webs and one example of a change students could explain. Use it to remind them what a food-web model can do.',
  'The grassland has new organisms. That’s the point. Use the practice cards to help students trace relationships, then protect their independent time so you can see whether they can use the same reasoning in a new ecosystem.',
  'Collect the official transfer task and use the scoring guide to see who can trace matter and energy and explain a disruption. Those are the explanations all the log observations, measurements, and models have been building toward.'],
];
function briefingHostImage(l,decorative=false){
 const hostArt='art/briefing/lesson-'+String(l.number).padStart(2,'0')+'.webp';
 const hostImage=el('img','','tc-brief-host');
 hostImage.src=hostArt;
 hostImage.alt=decorative?'':'Illustrated '+(l.number%2===1?'Bill Nye':'Mr. Wizard');
 return hostImage;
}
const storylineCaptions=[
 'Start with what students can see. Their questions will guide a closer look at the log.',
 'Tie each observation to a place on the log. The moss questions lead to plant growth.',
 'Compare what each tool measures. The weight readings prepare students to test what helps plants grow.',
 'Use a fair comparison to explain growth. Keep the source of the added matter open.',
 'Use measurements and the syringe model to make air easier to reason about. Light is the next puzzle.',
 'Separate light’s energy from the matter plants take in. The next model needs both ideas.',
 'Have students explain what each arrow shows. Next, trace changes in the log itself.',
 'Follow some of the log’s matter into the termite system. Next, ask what animals get from food.',
 'Keep temperature and movement evidence separate. Use both to explain how the log supports animals.',
 'Trace one animal relationship with evidence. Next, look inside a termite to explain how it uses wood.',
 'Use the video and reading together. Next, investigate what else can break down the log.',
 'Compare what the mushroom sources show. Next, model where matter goes during decomposition.',
 'Trace a decomposer pathway. Next, see what happens when one part of that network changes.',
 'Save the baseline web. The before-and-after comparison is the reasoning students will take to the grassland.',
 'Protect the independent work window. The grassland task shows who can transfer their ecosystem reasoning.',
];
function storylineCue(l){
 const cue=el('aside','','tc-storyline-cue');
 cue.setAttribute('aria-label','Science Briefing storyline');
 const copy=el('div');
 const heading=el('h2','Science Briefing','tc-slate-kicker');
 const actions=el('div','','tc-storyline-actions');
 actions.append(btn('Read this briefing',()=>toggle('briefing')));
 if(l.number<lessons.length){
  actions.append(btn('Look ahead · Lesson '+(l.number+1),()=>toggle('briefing',l.number+1)));
 }
 copy.append(heading,el('p',storylineCaptions[l.number-1]),actions);
 cue.append(briefingHostImage(l,true),copy);
 return cue;
}
function browseBriefing(lesson,focus='#tc-panel h1'){
 briefingLesson=lesson;
 render();
 root.querySelector(focus)?.focus();
}
function briefing(l,back){
 const content=el('div','','tc-briefing');
 const mast=el('header','','tc-brief-mast');
 const actions=el('div','','tc-brief-actions');
 const teach=btn('Teach this lesson →',()=>go(l.number,l.number===n?i:0),'tc-primary');
 actions.append(teach,back,links(l,['briefing']));
 const navigation=el('nav','','tc-brief-navigation');
 navigation.setAttribute('aria-label','Science Briefing navigation');
 const previous=btn('← Previous briefing',()=>browseBriefing(l.number-1));
 const nextBriefing=btn('Next briefing →',()=>browseBriefing(l.number+1));
 previous.disabled=l.number===1;
 nextBriefing.disabled=l.number===lessons.length;
 navigation.append(previous,nextBriefing);
 const title=el('h1',l.question);title.tabIndex=-1;
 const signal=el('div','','tc-unit-signal');
 const progress=el('progress');progress.max=lessons.length;progress.value=l.number;
 progress.setAttribute('aria-label','Unit lesson progression');
 signal.append(el('span','UNIT SIGNAL · '+l.number+' / '+lessons.length,'tc-slate-kicker'),progress);
 mast.append(el('p','SCIENCE BRIEFING  /  FIELD BROADCAST '+String(l.number).padStart(2,'0'),'tc-slate-kicker'),
  title,actions,signal,navigation);
 const body=el('div','','tc-brief-grid');
 const story=el('article','','tc-brief-story');
 const plan=el('section','','tc-brief-plan');
 const text=l.briefing.replace(/\s+/g,' ');
 const marker=String.raw`\d+\. .+? \| \d+ min\.`;
 const end=String.raw`Where it leads\.|At the 45-minute bell\.|SOURCE \/|OPENSCIED UNIT`;
 const steps=[...text.matchAll(new RegExp(String.raw`(\d+)\. (.*?) \| (\d+) min\. (.*?)(?= ${marker}| ${end}|$)`,'g'))];
 const nye=l.number%2===1;
 const host=nye?'Bill Nye':'Mr. Wizard';
 const hostImage=briefingHostImage(l);
 const intro=el('div','','tc-brief-intro');
 intro.append(el('p','HOST SEGMENT · '+host.toUpperCase()+'–INSPIRED','tc-slate-kicker'),
  el('h2','Your teaching roadmap'),el('p',hostIntros[l.number-1]));
 story.append(hostImage,intro);
 const [before,why,next]=briefingRoadmap[l.number-1];
 story.append(el('h3',l.number===1?'Where to start':'Bring back'),el('p',before),
  el('h3','Why you’re teaching this today'),el('p',why),
  el('h3',l.number===lessons.length?'What to look for at the finish':'Carry forward'),el('p',next));
 if(l.science)story.append(el('h3','The science to keep in view'),el('p',l.science));
 plan.append(el('h2','Lesson at a glance'));
 const list=el('ol');
 for(const [,number,title,time,summary] of steps){
  const item=el('li');
  const desc=el('div');
  desc.append(el('strong',title),el('p',summary));
  item.append(el('span',number.padStart(2,'0'),'tc-slate-kicker'),desc,el('span',time+' min','tc-note'));
  list.append(item);
 }
 plan.append(list);
 const full=el('details','','tc-secondary');
 full.append(el('summary','Full binder briefing and source notes'),el('div',l.briefing,'tc-reference'));
 body.append(story,plan);
 content.append(mast,body,full);
 return content;
}
function render(){
 const l=lessons[n-1], a=l.stages[i];
 const top=el('div','','tc-top'), title=el('div','','tc-title');
 title.append(el('strong','Science Studio'),el('span','TEACHER CONSOLE · UNIT 5.1','tc-kicker'));
 const pick=select(lessons.map(k=>[k.number,'Lesson '+k.number+' · '+k.title]),panel==='briefing'?(briefingLesson||n):n);
 pick.id='tc-lesson';
 pick.addEventListener('change',()=>{
  if(panel==='briefing')browseBriefing(Number(pick.value),'#tc-lesson');
  else go(Number(pick.value));
 });
 const sec=select(sections.map(s=>[s,'Section '+s]),section);sec.id='tc-section';
 sec.addEventListener('change',()=>{section=sec.value;message='';render();root.querySelector('#tc-section').focus();});
 top.append(title,field('Lesson',pick),field('Class section',sec));
 const tabs=el('nav','','tc-tabs');tabs.setAttribute('aria-label','Teaching references');
 const live=btn('On air',()=>go(n,i),'tc-live');
 live.setAttribute('aria-pressed',String(!panel));
 tabs.append(live);
 for(const [k,t] of Object.entries(names)){
  const b=btn(t,()=>toggle(k));b.dataset.panel=k;b.setAttribute('aria-expanded',String(panel===k));tabs.append(b);
 }
 tabs.append(btn('NEED HELP?',startTour,'tc-help-button'));
 const main=el('div','','tc-content');
 const meta=el('div','','tc-meta');meta.append(el('strong',activityReference(a)),el('span',a.minutes),el('span','Activity '+(i+1)+' of '+l.stages.length));
 const h=el('h1',a.title,'tc-activity');h.id='tc-activity';h.tabIndex=-1;
 const savedRow=savedPosition(section);
 savedRow.setAttribute('aria-live','polite');
 const slate=el('div','','tc-slate');
 slate.append(el('div','LESSON '+String(n).padStart(2,'0')+'  /  '+l.title.toUpperCase(),'tc-slate-kicker'),meta,h);
 if(panel!=='lessons'&&panel!=='briefing')main.append(slate,savedRow);
 if(panel){
  const p=el('section','','tc-panel');p.id='tc-panel';
  const heading=el('h2',names[panel]);heading.tabIndex=-1;
  const back=btn('Back to current activity',()=>toggle(panel),'tc-panel-back');
  if(panel!=='lessons'&&panel!=='briefing')p.append(heading,back);
  if(panel==='lessons'){
   p.classList.add('tc-board-panel');
   const tune=el('div','','tc-tune');
   const intro=el('div');
   intro.append(el('p','UNIT 5.1  /  GRADE 5  /  CHANNEL GUIDE','tc-board-unit'),heading,
    el('p','Ecosystems & Matter Cycling · Choose an episode to preview the lesson.','tc-board-description'));
   if(offerTour&&!tour){
    const offer=el('div','','tc-orientation-offer');
    offer.append(el('span','New here? Take a one-minute tour.'),
     btn('Start tour',startTour),btn('Skip introduction',rememberOrientation));
    intro.append(offer);
   }
   tune.append(intro);
   const progress=el('div','','tc-board-progress');
   progress.setAttribute('aria-label','Saved class positions');
   progress.append(...sections.map(savedPosition));
   tune.append(progress);
   const featured=el('section','','tc-board-feature');
   const poster=el('img');poster.className='tc-board-poster';
   const featureText=el('div','','tc-feature-text');
   const featureNumber=el('p','','tc-board-unit');
   const featureTitle=el('h3');
   const featureQuestion=el('p','','tc-board-description');
   const featureDescription=el('p','','tc-feature-description');
   const episodeCartoon=el('img','','tc-episode-cartoon');
   episodeCartoon.alt='';
   featureTitle.setAttribute('aria-live','polite');
   let selectedEpisode=l;
   const launch=btn('Open Science Briefing →',()=>go(selectedEpisode.number,selectedEpisode.number===n?i:0,'briefing'),'tc-feature-launch');
   featureText.append(episodeCartoon,featureNumber,featureTitle,featureQuestion,featureDescription,launch);
   featured.append(poster,featureText);
   p.append(tune,featured);
   const board=el('div','','tc-board-grid');
   const episodeHeading=el('h3','Episode library','tc-episode-heading');
   p.append(episodeHeading);
   function showEpisode(item){
    selectedEpisode=item;
    poster.src=item.art;
    const cartoonPath='art/episode-cartoons/lesson-'+String(item.number).padStart(2,'0')+'.webp';
    episodeCartoon.src=cartoonPath;
    poster.alt=item.title+' Science Studio artwork';
    featureNumber.textContent='FEATURED BROADCAST / '+String(item.number).padStart(2,'0');
    featureTitle.textContent=item.title;
    featureQuestion.textContent=item.question;
    featureDescription.textContent=item.story;
    for(const button of board.children){
     if(Number(button.dataset.lesson)===item.number)button.setAttribute('aria-current','true');
     else button.removeAttribute('aria-current');
    }
   }
   for(const item of lessons){
    const card=btn('',()=>showEpisode(item),'tc-board-lesson');
    card.dataset.lesson=item.number;
    card.setAttribute('aria-label','Preview Lesson '+item.number+': '+item.title);
    const label=el('span');
    label.append(el('strong',item.title));
    for(const group of sections.filter(group=>records[group]?.lesson===item.number)){
     label.append(el('span','Section '+group,'tc-section-badge tc-section-'+group.toLowerCase()));
    }
    card.append(el('span',String(item.number).padStart(2,'0'),'tc-episode-number'),label);
    board.append(card);
   }
   p.append(board);
   showEpisode(l);
  }
  if(panel==='overview')p.append(sequence(l));
  if(panel==='briefing')p.append(briefing(lessons[(briefingLesson||n)-1],back));
  if(panel==='prep'){
   if(l.checklist?.length){
    const list=el('fieldset','','tc-checklist');
    list.append(el('legend','Ready for class'));
    l.checklist.forEach((item,index)=>{
     const input=el('input');input.type='checkbox';
     const id=section+'-'+n+'-'+index;
     input.checked=Boolean(ready.get(id));
     input.addEventListener('change',()=>ready.set(id,input.checked));
     const label=el('label');label.append(input,document.createTextNode(item));list.append(label);
    });p.append(list);
   }
   const full=el('details','','tc-secondary');
   full.append(el('summary','Full prep directions and exact copy counts'),el('div',l.prep,'tc-reference'));
   p.append(link('Printable Materials Checklist',master+'#page='+l.pages.checklist),full,links(l,['prep']));
  }
  if(panel==='pause')p.append(progress(l));
  if(panel==='resources'){
   const list=el('div','','tc-links');
   list.append(link('Full teacher binder',master),link('Sharing PDF',share),
    link('Official OpenSciEd resources','https://openscied.org/instructional-materials/5-1-ecosystems-matter-cycling/'),
    link('Teacher Guide · OpenSciEd downloads','https://openscied.org/curriculum/elementary-school/unit-5-1-ecosystems-matter-cycling-download/'),
    link('Student Bundle · OpenSciEd downloads','https://openscied.org/curriculum/elementary-school/unit-5-1-ecosystems-matter-cycling-download/'));
   p.append(el('p','Resource links open in a separate tab so Teaching Mode stays on this activity.','tc-note'),
    links(l,['teaching','prep','briefing','field']),list);
   const card=document.querySelector('[data-open-lesson="'+n+'"]')?.closest('details');
   const references=el('div','','tc-links'), seen=new Set();
   for(const resource of card?.querySelectorAll('a[href]')||[]){
    const raw=resource.getAttribute('href');
    if(seen.has(raw)||raw.includes('G5_Science_Unit_5.1_Teacher_Core_Master')||!(/^(https?:|resources\/)/i.test(raw)))continue;
    const label=resource.textContent.trim();
    if(!label)continue;
    seen.add(raw);
    references.append(link(label,raw));
   }
   if(seen.size)p.append(el('h3','Lesson resources from the library'),references);
  }
  main.append(p);
 }else{
  const desk=el('div','','tc-cue-desk');
  const cues=el('section','','tc-cue-sheet');
  cues.setAttribute('aria-label','Current activity cue card');
  cues.append(copy('Do',a.cue.do,'tc-cue-do'),copy('Ask',a.cue.ask,'tc-cue-ask'),copy('Listen for',a.cue.listen,'tc-cue-listen'));
  const bell=bellCue(l,a);
  if(bell)cues.append(bell);
  cues.append(moreHelp(a,l));
  const guide=el('aside','','tc-sequence');
  guide.setAttribute('aria-label','Lesson sequence');
  guide.append(el('h2','Run of show'),sequence(l));
  const references=el('div','','tc-live-references');
  references.append(slidePanel(a,l),storylineCue(l));
  desk.append(guide,cues,references);
  main.append(desk);
  const sequenceList=guide.querySelector('.tc-sequence-list');
  const current=sequenceList.querySelector('[aria-current=step]');
  requestAnimationFrame(()=>{
   if(current.offsetTop+current.offsetHeight>sequenceList.clientHeight){
    sequenceList.scrollTop=current.offsetTop;
   }
  });

 }
 const nav=el('nav','','tc-controls');nav.setAttribute('aria-label','Activity navigation');
 const prev=btn('← Previous Activity',()=>go(n,i-1)), next=btn('Next Activity →',()=>go(n,i+1),'tc-primary');
 prev.disabled=i===0;next.disabled=i===l.stages.length-1;
 const upcoming=l.stages[i+1];
 const previous=l.stages[i-1];
 if(previous)prev.title=activityReference(previous)+' · '+previous.title;
 if(upcoming)next.title=activityReference(upcoming)+' · '+upcoming.title;
 const nextCue=el('div','','tc-next-cue');
 nextCue.append(el('span',upcoming?'UP NEXT  /  '+activityReference(upcoming).toUpperCase():'LESSON COMPLETE'),
  el('strong',upcoming?.title||'End of lesson'));
 nav.append(prev,nextCue,next);
 const status=el('p',message,'tc-status');status.setAttribute('role','status');
 root.classList.toggle('tc-board-active',panel==='lessons');
 root.replaceChildren(top,tabs,status,main,nav);
}
unitDeck();
document.querySelectorAll('[data-open-lesson]').forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.openLesson))));
document.querySelector('#open-teaching-mode')?.addEventListener('click',()=>go(n,i));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!orientation.open&&panel)toggle(panel);});
root.hidden=false;
document.body.classList.add('teacher-on');
try{
 const current=JSON.parse(sessionStorage.getItem(activityKey)||'null');
 offerTour=!current&&!Object.keys(records).length&&!localStorage.getItem(tourKey);
 if(current&&Number.isInteger(current[0])&&Number.isInteger(current[1])&&lessons[current[0]-1]?.stages[current[1]]){
  n=current[0];i=current[1];
 }
}catch{}
render();
})();















