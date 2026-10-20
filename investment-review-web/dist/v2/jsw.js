"use strict";
// JSW TEFR chapter mapping is a reference, not an official checklist.
const JSW_URL="https://environmentclearance.nic.in/writereaddata/online/EC/290820211p0v0e0jzql25210445TEFR.pdf";
const NATURES={
 same:["동일 성능 유지","현재 부하·사양 적정성·표준품","기존 용량과 옵션을 그대로 유지해야 하는가?","운전 부하·기존 성능·표준품 견적","실무 확장"],
 up:["용량·성능 상향","전후 공정 균형·피크 수요","상향 성능을 전후 공정과 유틸리티가 수용하는가?","공정별 능력·피크 부하·수요","2.3절·5장"],
 modify:["부분 개조","개조 경계·연결·보증 책임","부분 개조만으로 목표 성능과 수명을 확보하는가?","상태 진단·연결도·보증 범위","실무 확장"],
 reuse:["기존 설비 재사용·이설","잔여수명·이설비·호환성","검사·운반·복원 비용까지 고려해 신규보다 유리한가?","상태 검사·잔여수명·이설 견적","실무 확장"],
 single:["일괄 추진","동시 시공·자금 집중·통합 시운전","전체를 동시에 건설해야 하는 공정상 이유가 있는가?","통합 일정·자금 계획·공정 의존","2.3절·9장 참고 확장"],
 phased:["단계별 추진","독립 가동·후속 연결·단계별 수익성","1단계만 가동하거나 후속 투자가 지연돼도 운영 가능한가?","단계별 물량·투자비·현금흐름·연결 계획","2.3절·10장"],
 newtech:["신규 기술 적용","실증·성능보증·실패 대응","실제 원료와 운전조건에서 검증된 기술인가?","유사 실적·시험 계획·성능 보증","5장 참고 확장"],
 shared:["표준화·공용화","동시 수요·고장 파급·예비품 통합","공용화 비용 절감과 공급 중단 영향을 함께 검토했는가?","동시 부하·공급 신뢰성·예비품 목록","6장 참고 확장"]
};
const SCOPES={
 main:["주요 공정·설비 본체","설계능력·수율·재질·예비 대수","과대 용량과 불필요한 옵션을 줄일 수 있는가?","설계조건·실부하·설비 구성","2·5장"],
 logistics:["원료·제품 이송 및 저장","반입·저장·이송·출하 균형","물류 병목과 부대설비 누락이 없는가?","물동량·재고일수·운송 경로","4장·5.1·6.8절"],
 power:["전력·전기·제어","수전·변압기·배전·제어 연결","기존 전원 여력과 추가 전기공사를 확인했는가?","부하표·단선도·제어 연결도","6.1절"],
 utility:["용수·냉각·공기·가스·증기","수요·공급 품질·압력·여유량","피크 운전 시에도 필요한 공급을 확보하는가?","평균·피크 사용량·공급 조건","6.2~6.4절"],
 piping:["배관·덕트·연결부","연결 위치·유량·압력손실·격리","배관 재사용과 연결공사 책임을 확인했는가?","연결도·재질·유량·압력","6.2.7절 참고 확장"],
 civil:["토목·건축·구조물","지반·기초·하중·보강·정비 공간","기존 구조를 활용할 수 있고 보강비가 반영됐는가?","현장 조사·구조도·하중·보강 견적","3장·6.7·9.5절"],
 environment:["환경·안전·소방","분진·폐수·소음·폐기물·방호","발생원 개선과 기존 처리계통 활용을 비교했는가?","현황 측정·처리 용량·적용 요구조건","7장·6.2.6·6.4.9절"],
 demolition:["철거·이설·임시설비","폐기·임시 공급·정지·복구","철거비와 임시운영비·생산손실을 반영했는가?","철거 목록·정지시간·복구 절차","실무 확장"],
 execution:["설계·조달·설치","발주 경계·공급사 역량·장납기","패키지 간 중복·누락과 납기 위험이 없는가?","공급범위·견적·납기·시공계획","9.6~9.10절"],
 commissioning:["시운전·교육·예비품","시험·보증·안정화·운영 준비","인수 기준과 초기 운영에 필요한 비용이 포함됐는가?","시험조건·교육·예비품·인수 기준","6.6절·8장·9.9절"],
 external:["외부 인프라","공장 밖 전력·용수·도로·철도·항만","경계 밖 비용·일정·공급 책임을 확인했는가?","공급 협의·경계도·외부 일정","3.2·6.8·9.8절"]
};
const SCOPE_STATES=["미확인","신규 설치","개조","재사용","타 사업 담당","미해당"];
const TYPE_CHECKS={
 "신설":["수요·제품 구성·공정방식·단계별 건설","처음부터 전체 용량이 필요한가? 외부 공급·공용 인프라를 활용할 수 있는가?","수요·제품별 생산계획·공정도·입지·원료 공급","2~6장"],
 "증설":["추가 수요·실제 병목·증분 효과","병목 개선만으로 달성할 수 있는가? 병목이 다른 공정으로 이동하는가?","추가 주문·공정별 능력·수율·부하 실적","2.3절·5·6장 참고 확장"],
 "교체":["전면교체 필요성·규모 재검토","수리·부분 교체·계속 사용을 동일 조건으로 비교했는가?","고장 이력·상태 진단·운전 부하·대안 견적","실무 확장"],
 "안전환경":["요구 수준·최소 범위·발생원 대책","목표를 충족하는 최소 범위는 무엇이며 발생원 개선이 가능한가?","측정·위험 평가·적용 조건·대안 효과","7장 참고 확장"],
 "에너지":["기준선·에너지 수지·실제 활용처","운전 최적화로 줄일 수 있는가? 회수 에너지를 실제 사용할 수 있는가?","계량·운전시간·요금·열 및 전력 수요","6장·10장 참고 확장"]
};
KPC_SOURCES.jsw={title:"JSW Utkal · Techno-Economic Feasibility Report",url:JSW_URL,checked:"2026-10-20",scope:"2~10장 참고. 사내 업무용 재구성·확장안이며 공식 체크리스트가 아닙니다."};
let jswState={secondary:[],natures:[],scopes:{},baseline:""};
function addJswRule(id,title,question,input,chapter,group,key){
 const r={id,title,category:group,when:[group+" · "+title],deps:["R03"],reason:question,docs:["proposal","operating"],question,deliverable:title+" 검토표",jsw:{group,key,chapter}};
 RULES.push(r);
 ITEM_DETAILS[id]={topic:chapter,source:"jsw",relation:chapter.includes("확장")?"실무 확장":"JSW 참고 재구성",inputs:input.split("·").map(s=>s.trim()),checks:[question,"기준선·목표·대안과 비용 영향을 함께 확인","미확인 사항의 담당자와 확인기한 기록"],outputs:[title+" 검토표: 현황·목표·대안·비용·결론·근거·후속조치"],acceptance:"입력 근거와 검토 결론을 연결하고 미해결 조건의 담당자·기한을 지정"};
}
Object.entries(TYPE_CHECKS).forEach(([k,v],i)=>addJswRule("JT"+(i+1),v[0],v[1],v[2],v[3],"투자 유형",k));
Object.entries(NATURES).forEach(([k,v],i)=>addJswRule("JN"+(i+1),v[0]+" · "+v[1],v[2],v[3],v[4],"투자 성격",k));
Object.entries(SCOPES).forEach(([k,v],i)=>addJswRule("JS"+(i+1),v[0]+" · "+v[1],v[2],v[3],v[4],"투자 범위",k));
addJswRule("JC1","총사업비·예비비의 포함 경계","설비·공사·설계·가동 전 비용·초기 운전자금·건설이자와 예비비를 구분했는가? 예비비 밖 물가·환율 변동은 어떻게 반영했는가?","비용 분류·견적 기준일·통화·예비비 포함 범위","10.1절","공통","cost");
const baseInput=projectInput,baseFill=fill,baseBuild=buildItems,baseExport=exportRows,baseIO=renderIO,baseDetail=detailHTML;
function jswFields(){
 const host=document.createElement("section");host.id="jsw-fields";host.className="jsw-panel";
 host.innerHTML=`<h3>투자 성격과 범위</h3><p>사양서 자동 추출 없이 담당자가 조건을 구체화합니다.</p>
 <div class="section-label">부목적 · 복수 선택</div>${TYPES.map(t=>`<label class="check"><input type="checkbox" data-secondary="${t}">${t}</label>`).join("")}
 <div class="section-label">성격 · 복수 선택</div><small>일괄·단계별 추진과 동일 성능·성능 상향은 각각 하나만 선택합니다.</small>${Object.entries(NATURES).map(([k,v])=>`<label class="check"><input type="checkbox" data-nature="${k}">${v[0]}</label>`).join("")}
 <label>현재 기준선 → 목표 (단위·측정시점·근거)<textarea id="jsw-baseline" rows="3" placeholder="예: 현재 풍량 → 목표 풍량, 연간 운전시간, 자료 위치"></textarea></label>
 <div class="section-label">범위 · 공종별 담당 경계</div><small>미확인은 판단 보류로 남습니다. 미해당도 사유가 있어야 제외합니다.</small>
 ${Object.entries(SCOPES).map(([k,v])=>`<div class="scope-row"><label>${v[0]}<select data-scope="${k}">${SCOPE_STATES.map(s=>`<option>${s}</option>`).join("")}</select></label><input data-boundary="${k}" aria-label="${v[0]} 경계와 사유" placeholder="포함·제외 경계 / 담당 / 사유"></div>`).join("")}`;
 $("type-inputs").after(host);
 host.addEventListener("change",e=>{
  if(e.target.dataset.nature&&e.target.checked){const pairs={single:"phased",phased:"single",same:"up",up:"same"},other=pairs[e.target.dataset.nature];if(other)host.querySelector(`[data-nature="${other}"]`).checked=false}
  readJsw();invalidate();
 });host.addEventListener("input",()=>{readJsw();invalidate()});
}
function readJsw(){jswState={secondary:[...document.querySelectorAll("[data-secondary]:checked")].map(n=>n.dataset.secondary),natures:[...document.querySelectorAll("[data-nature]:checked")].map(n=>n.dataset.nature),baseline:$("jsw-baseline").value,scopes:Object.fromEntries(Object.keys(SCOPES).map(k=>[k,{state:document.querySelector(`[data-scope="${k}"]`).value,boundary:document.querySelector(`[data-boundary="${k}"]`).value}]))};return jswState}
function fillJsw(s){jswState=s||{secondary:[],natures:[],scopes:{},baseline:""};document.querySelectorAll("[data-secondary]").forEach(n=>n.checked=(jswState.secondary||[]).includes(n.dataset.secondary));document.querySelectorAll("[data-nature]").forEach(n=>n.checked=(jswState.natures||[]).includes(n.dataset.nature));$("jsw-baseline").value=jswState.baseline||"";Object.keys(SCOPES).forEach(k=>{const a=jswState.scopes?.[k]||{};document.querySelector(`[data-scope="${k}"]`).value=SCOPE_STATES.includes(a.state)?a.state:"미확인";document.querySelector(`[data-boundary="${k}"]`).value=a.boundary||""})}
projectInput=function(){return {...baseInput(),jsw:JSON.parse(JSON.stringify(readJsw()))}};
fill=function(p){baseFill(p);fillJsw(p.jsw)};
buildItems=function(p,previous){
 const s=p.jsw||{},types=[p.type,...(s.secondary||[])],n=s.natures||[];
 return baseBuild(p,previous).map(i=>{
  const reasons=[];let status=i.status;const j=i.jsw;
  if(!j){if(i.when.some(t=>types.includes(t))){status="적용";reasons.push("주유형·부목적: "+types.filter(t=>i.when.includes(t)).join(", "))}}
  else if(j.group==="공통"){status="적용";reasons.push("모든 투자 공통")}
  else if(j.group==="투자 유형"){status=types.includes(j.key)?"적용":"제외";reasons.push(types.includes(j.key)?"주유형·부목적: "+j.key:"선택하지 않은 유형")}
  else if(j.group==="투자 성격"){status=n.includes(j.key)?"적용":n.length?"제외":"판단 보류";reasons.push(n.includes(j.key)?"선택한 성격: "+NATURES[j.key][0]:n.length?"선택하지 않은 성격":"투자 성격 미입력")}
  else{
   const a=s.scopes?.[j.key]||{},state=a.state||"미확인";
   status=state==="미확인"?"판단 보류":state==="미해당"?(a.boundary?.trim()?"제외":"판단 보류"):"적용";
   reasons.push(SCOPES[j.key][0]+": "+state+(a.boundary?" · "+a.boundary:" · 경계·담당·사유 확인 필요"));
   if(n.includes("up")&&["power","utility","piping","environment"].includes(j.key)){
    status="적용";reasons.push("용량·성능 상향에 따른 연계 용량 확인 필요");
   }
  }
  return {...i,status,reason:reasons.length?reasons.join(" / ")+" — "+i.question:i.reason};
 });
};
detailHTML=function(id,t){return baseDetail(id,t).replaceAll("KPC 관련 영역","참고 영역").replaceAll("KPC 공개 교육영역을 참고한 대응입니다.","공개 보고서·교육자료를 참고한 업무용 재구성입니다.").replaceAll("KPC 공식 업무표준","발행기관의 공식 업무표준")};
renderIO=function(){baseIO();const s=plan.project.jsw||{};$("view-io").insertAdjacentHTML("afterbegin",`<div class="panel jsw-summary"><h2>2번 · 투자 조건</h2><p>부목적: ${esc((s.secondary||[]).join(", ")||"미선택")}</p><p>성격: ${esc((s.natures||[]).map(k=>NATURES[k]?.[0]||k).join(", ")||"미확인")}</p><p>기준선·목표: ${esc(s.baseline||"미확인")}</p>${Object.entries(SCOPES).map(([k,v])=>`<p>${v[0]}: ${esc(s.scopes?.[k]?.state||"미확인")} · ${esc(s.scopes?.[k]?.boundary||"경계·담당 확인 필요")}</p>`).join("")}</div>`)};
exportRows=function(){const rows=baseExport(),s=plan.project.jsw||{};rows[0][21]="참고 영역";rows[0][23]="참고 출처";rows[0].push("웹페이지 버전","부목적","투자 성격","기준선·목표","범위·경계");for(const r of rows.slice(1))r.push("2번",(s.secondary||[]).join(" / "),(s.natures||[]).map(k=>NATURES[k]?.[0]||k).join(" / "),s.baseline||"",JSON.stringify(s.scopes||{}));return rows};
jswFields();
document.title="2번 · JSW 투자검토 워크스페이스";
document.querySelector(".heading h1").textContent="유형·성격·범위로 검토를 구체화하세요.";
document.querySelector(".heading p").textContent="JSW Utkal 보고서의 검토 구조를 활용한 투자비·범위 검토";
document.querySelector(".intake-panel").hidden=true;
$("knowledge-panel").open=false;
document.querySelectorAll(".notice").forEach(n=>{if(n.textContent.includes("KPC"))n.innerHTML=`<b>2번 · JSW 보고서 참고 + 실무 확장 · ${RULES.length}개 검토항목</b><span>선택 조건을 합쳐 중복 없이 추천합니다. 보고서의 수치·비율은 자동 적용하지 않습니다. 출처는 각 상세에서 확인하세요.</span>`});
$("library").innerHTML=`<table><thead><tr><th>ID</th><th>검토항목</th><th>분류·근거</th><th>상세</th></tr></thead><tbody>${RULES.map(r=>`<tr><td>${r.id}</td><td>${esc(r.title)}</td><td>${esc(r.jsw?r.jsw.group+" / "+r.jsw.chapter:"기존 공통·유형·현장 기준")}</td><td><button class="button small" data-library-detail="${r.id}">상세 보기</button></td></tr>`).join("")}</tbody></table>`;
$("actual-item").innerHTML=RULES.map(i=>`<option value="${i.id}">${i.id} · ${esc(i.title)}</option>`).join("");
$("export").onclick=()=>{const b=new Blob(["\ufeff"+exportRows().map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="2번_JSW_투자검토.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
function sampleJsw(){if(plan&&!confirm("2번의 현재 입력을 집진기 교체 예시로 바꿀까요?"))return;const scopes=Object.fromEntries(Object.keys(SCOPES).map(k=>[k,{state:"미확인",boundary:""}]));for(const k of ["main","power","piping","environment","execution","commissioning"])scopes[k]={state:"개조",boundary:"교체·연결 범위 상세 확인"};scopes.civil={state:"재사용",boundary:"기초 하중·상태 확인 필요"};fill({type:"교체",name:"집진기 교체 및 처리용량 증대",purpose:"노후 교체와 분진 포집 개선",location:"제강공장",budget:"",scale:"풍량·배출 목표 측정 후 확정",start:"",target:"",conditions:["operating","utility"],docs:["proposal","operating"],jsw:{secondary:["안전환경","에너지"],natures:["up","reuse"],scopes,baseline:"현재 풍량·차압·전력·분진농도 측정 필요"}});plan=null;generate()}
$("sample").onclick=sampleJsw;$("empty-sample").onclick=sampleJsw;
// Reload after rules and wrappers exist; never read or mutate the version-1 key.
try{const saved=JSON.parse(localStorage.getItem("investment-review-v2")||"null");if(saved?.typeValues)typeValues=saved.typeValues;if(saved?.form)fill(saved.form);if(Array.isArray(saved?.records)){records=saved.records;renderRecords()}if(saved?.plan){plan=saved.plan;formDirty=JSON.stringify(saved.form)!==JSON.stringify(plan.project);if(!plan.items.every(i=>RULES.some(r=>r.id===i.id)))plan=null;else renderPlan()}}catch{toast("2번 저장자료를 읽지 못했습니다.")}
