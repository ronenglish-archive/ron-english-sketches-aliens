(()=>{'use strict';
const info=window.ALIEN_SET_RECORDS;
const overview=document.getElementById('set-overview'),view=document.getElementById('member-view'),detail=document.getElementById('detail-content'),preview=document.getElementById('member-preview');
const cards=[...document.querySelectorAll('.member')],back=document.getElementById('slider-back'),next=document.getElementById('slider-next');
let restoreScroll=0,previewTimer=null,hideTimer=null,activeCard=null,suppressCard=null;
// Responsive set carousel: show every member when they fit; otherwise show
// as many complete fixed-size cards as available width permits. Arrows occupy
// the sides of the row only when some members cannot be shown at once.
const slider=document.querySelector('.slider');
const memberRow=document.querySelector('.member-row');
let firstVisible=0,visibleCount=cards.length;
function fitCount(available,cardWidth,gap){
  return Math.max(1,Math.floor((Math.max(0,available)+gap)/(cardWidth+gap)));
}
function layoutMembers(){
  const sliderWidth=slider.clientWidth;
  const cardWidth=parseFloat(getComputedStyle(cards[0]).width)||164;
  const cardGap=parseFloat(getComputedStyle(memberRow).gap)||14;
  const controlWidth=Math.max(30,back.getBoundingClientRect().width||30);
  const sliderGap=parseFloat(getComputedStyle(slider).gap)||10;
  const allWidth=cards.length*cardWidth+(cards.length-1)*cardGap;
  const fitsAll=sliderWidth>=allWidth;
  visibleCount=fitsAll?cards.length:Math.min(cards.length,fitCount(sliderWidth-2*(controlWidth+sliderGap),cardWidth,cardGap));
  firstVisible=Math.min(firstVisible,Math.max(0,cards.length-visibleCount));
  if(fitsAll){firstVisible=0;back.hidden=true;next.hidden=true}
  else {back.hidden=false;next.hidden=false}
  cards.forEach((card,i)=>{const shown=i>=firstVisible&&i<firstVisible+visibleCount;card.hidden=!shown;card.style.display=shown?'':'none'});
  if(!fitsAll){
    const atStart=firstVisible===0,atEnd=firstVisible+visibleCount>=cards.length;
    for(const [button,inactive] of [[back,atStart],[next,atEnd]]){
      button.classList.toggle('edge-hidden',inactive);
      button.disabled=inactive;
      button.setAttribute('aria-hidden',String(inactive));
      button.tabIndex=inactive?-1:0;
    }
  }
  if(activeCard&&activeCard.hidden)hidePreview();
}
back.addEventListener('click',()=>{if(firstVisible>0){firstVisible--;hidePreview();layoutMembers()}});
next.addEventListener('click',()=>{if(firstVisible+visibleCount<cards.length){firstVisible++;hidePreview();layoutMembers()}});
window.addEventListener('resize',layoutMembers);
layoutMembers();
function clearPending(){clearTimeout(previewTimer);clearTimeout(hideTimer)}
function hidePreview(){clearPending();preview.hidden=true;preview.replaceChildren();activeCard=null}
function openRecord(id){const d=info[id];if(!d)return;hidePreview();restoreScroll=window.scrollY;overview.hidden=true;view.hidden=false;detail.innerHTML=d.html;window.scrollTo(0,0);document.getElementById('close-top').focus()}
function closeRecord(){view.hidden=true;detail.replaceChildren();overview.hidden=false;window.scrollTo(0,restoreScroll)}
function showPreview(c){if(overview.hidden||c.hidden||suppressCard===c)return;const id=c.dataset.record,d=info[id];if(!d)return;clearPending();activeCard=c;preview.replaceChildren();
const b=document.createElement('button');b.type='button';b.className='close-circle';b.setAttribute('aria-label','Close preview');b.textContent='×';b.addEventListener('click',e=>{e.stopPropagation();suppressCard=c;hidePreview()});
const content=document.createElement('div');content.className='preview-full-record detail-content';content.innerHTML=d.html;
// Preserve the actual complete catalogue record, not a synthetic summary.
// Preview is one navigation surface: embedded links are visual/documentary only.
preview.append(b,content);preview.dataset.record=id;preview.setAttribute('role','link');preview.setAttribute('tabindex','0');preview.setAttribute('aria-label','Open complete detail view for '+(c.textContent||'this drawing').trim());preview.scrollTop=0;preview.hidden=false}
function requestPreview(c,delay){clearPending();if(suppressCard===c)return;previewTimer=setTimeout(()=>showPreview(c),delay)}
function requestHide(c){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(activeCard===c&&!preview.matches(':hover')&&!c.matches(':hover'))hidePreview()},140)}
for(const c of cards){const id=c.dataset.record;
c.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();openRecord(id)});
c.addEventListener('pointerenter',()=>{if(suppressCard&&suppressCard!==c)suppressCard=null;requestPreview(c,activeCard?65:300)});
c.addEventListener('pointerleave',()=>{if(suppressCard===c)suppressCard=null;clearTimeout(previewTimer);requestHide(c)});
c.addEventListener('focus',()=>{suppressCard=null;showPreview(c)});
}
preview.addEventListener('pointerenter',()=>{clearTimeout(hideTimer);clearTimeout(previewTimer)});
preview.addEventListener('pointerleave',()=>{if(activeCard&&!activeCard.matches(':hover'))hidePreview()});
// Capture all clicks inside preview before nested artwork/source anchors can navigate.
// The sole exception is the close button, which keeps its own handler.
preview.addEventListener('click',e=>{
  if(e.target.closest('.close-circle'))return;
  e.preventDefault();e.stopPropagation();openRecord(preview.dataset.record);
},true);
preview.addEventListener('auxclick',e=>{if(!e.target.closest('.close-circle'))e.preventDefault()},true);
preview.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('.close-circle')){e.preventDefault();openRecord(preview.dataset.record)}});

for(const id of ['close-top','close-bottom'])document.getElementById(id).addEventListener('click',closeRecord);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!view.hidden)closeRecord();else{if(activeCard)suppressCard=activeCard;hidePreview()}}});
})();
