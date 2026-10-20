"use strict";
let intakeCandidates=[],knowledgeChunks=[],evidenceLog=[],knowledgeFiles=[];
try{evidenceLog=JSON.parse(localStorage.getItem("investment-review-evidence-v2")||"[]")}catch{}
const XMLNS="http://schemas.openxmlformats.org/drawingml/2006/main";
function xmlDoc(s){const d=new DOMParser().parseFromString(s,"application/xml");if(d.querySelector("parsererror"))throw Error("손상된 XML입니다.");return d}
function xmlTexts(el){return [...el.getElementsByTagNameNS(XMLNS,"p")].map(p=>[...p.getElementsByTagNameNS(XMLNS,"t")].map(t=>t.textContent).join("")).join("\n").trim()}
async function readPptx(file){
 if(file.size>15*1024*1024)throw Error("파일당 15MB 이하만 지원합니다.");
 const bytes=await file.arrayBuffer(),v=new DataView(bytes);let end=-1;
 for(let p=v.byteLength-22;p>=Math.max(0,v.byteLength-65557);p--)if(v.getUint32(p,true)===0x06054b50){end=p;break}
 if(end<0)throw Error("유효한 PPTX ZIP 파일이 아닙니다.");
 const count=v.getUint16(end+10,true);let at=v.getUint32(end+16,true),total=0;
 if(count>3000)throw Error("내부 항목이 너무 많습니다.");
 for(let i=0;i<count;i++){
   if(at+46>v.byteLength||v.getUint32(at,true)!==0x02014b50)throw Error("ZIP 구조 오류");
   const size=v.getUint32(at+24,true);total+=size;
   if(size>10*1024*1024||total>60*1024*1024)throw Error("압축 해제 크기 제한을 초과했습니다.");
   if(v.getUint16(at+8,true)&1)throw Error("암호화된 파일은 지원하지 않습니다.");
   at+=46+v.getUint16(at+28,true)+v.getUint16(at+30,true)+v.getUint16(at+32,true);
 }
 const zip=await JSZip.loadAsync(bytes);
 if(!zip.file("ppt/presentation.xml"))throw Error("PPTX 형식이 아닙니다.");
 const rels=xmlDoc(await zip.file("ppt/_rels/presentation.xml.rels").async("string"));
 const targets=new Map([...rels.getElementsByTagName("Relationship")].map(x=>[x.getAttribute("Id"),x.getAttribute("Target")]));
 const presentation=xmlDoc(await zip.file("ppt/presentation.xml").async("string"));
 const slides=[...presentation.getElementsByTagNameNS("*","sldId")];if(slides.length>150)throw Error("150장 이하만 지원합니다.");
 const result=[];
 for(const [i,slide] of slides.entries()){
   const id=slide.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id");
   let target=targets.get(id)||"";target=target.startsWith("/")?target.slice(1):"ppt/"+target.replace(/^\.\//,"");
   if(!/^ppt\/slides\/slide[^/]+\.xml$/.test(target)||!zip.file(target))throw Error("슬라이드 연결 오류");
   const doc=xmlDoc(await zip.file(target).async("string"));
   result.push({page:i+1,text:xmlTexts(doc),fields:[...doc.getElementsByTagNameNS("*","sp")].map(sp=>{
     const name=sp.getElementsByTagNameNS("*","cNvPr")[0]?.getAttribute("name")||"";
     return {key:name.replace(/^field\./,""),tagged:name.startsWith("field."),value:xmlTexts(sp)};
   }).filter(x=>x.tagged)});
 }return result;
}
function inputValue(key,p=projectInput()){
 if(key.includes(".")){const [t,k]=key.split(".");return t===p.type?p.typeInputs[k]||"":typeValues[t]?.[k]||""}
 if(key==="conditions"||key==="docs")return p[key].map(k=>(key==="conditions"?CONDITIONS:DOCS)[k]).join(", ");
 return p[key]||"";
}
function setInputValue(key,value){
 if(key.includes(".")){const [t,k]=key.split(".");(typeValues[t]??={})[k]=value;if(t===type)renderTypeInputs()}
 else if(key==="type"){type=value;renderTypes()}
 else if(key==="conditions"||key==="docs"){const map=key==="conditions"?CONDITIONS:DOCS;Object.keys(map).forEach(k=>$(key==="conditions"?"cond-"+k:"doc-"+k).checked=value.includes(k))}
 else $(key).value=value;
}
function recordEvidence(key,source,method){
 evidenceLog.push({field:key,value:inputValue(key),project:projectInput().name,source,method,acceptedAt:new Date().toISOString()});
 try{localStorage.setItem("investment-review-evidence-v2",JSON.stringify(evidenceLog.slice(-300)))}catch{toast("출처 저장 실패. JSON을 내보내세요.")}
 renderEvidence();
}
function renderEvidence(){
 const current=evidenceLog.filter(e=>e.project===projectInput().name&&e.value===inputValue(e.field));
 $("intake-evidence").textContent=`현재 값과 일치하는 반영 근거 ${current.length}건 · 전체 이력 ${evidenceLog.length}건`;
}
function drawCandidates(){
 const extractedType=intakeCandidates.find(c=>c.key==="type"&&!c.error)?.value||type;
 const labels=Object.fromEntries(intakeFields(extractedType).map(x=>[x[0],x[1]]));
 $("extract-results").innerHTML=intakeCandidates.length?`<p>추출 ${intakeCandidates.length}개 · 선택한 값만 반영됩니다. 기존 값은 덮어쓰기를 직접 선택하세요.</p>`+
 intakeCandidates.map((c,i)=>`<div class="extract-row"><label class="check"><input type="checkbox" data-candidate="${i}" ${!c.error&&!inputValue(c.key)?"checked":""} ${c.error?"disabled":""}><b>${esc(labels[c.key]||c.key)}</b></label><p>${esc(c.raw)}</p><small>${esc(c.source)}${inputValue(c.key)?` · 기존: ${esc(inputValue(c.key))}`:""}${c.error?` · 확인 필요: ${esc(c.error)}`:""}</small></div>`).join("")+
 `<button class="button primary" type="button" id="apply-extraction">선택한 값 반영</button>`:`<p>작성된 필드를 찾지 못했습니다. 빈 서식이거나 일반 PPT입니다. 제공 서식의 입력 상자에 작성해 주세요. 이미지·표·스캔 OCR은 지원하지 않습니다.</p>`;
 if($("apply-extraction"))$("apply-extraction").onclick=()=>{
   const selected=[...document.querySelectorAll("[data-candidate]:checked")].map(x=>intakeCandidates[Number(x.dataset.candidate)]);
   const selectedType=selected.find(x=>x.key==="type")?.value||type;
   if(selected.some(c=>c.key.includes(".")&&!c.key.startsWith(selectedType+"."))){toast("유형별 입력과 사업유형이 다릅니다. 사업유형도 함께 선택하세요.");return}
   const start=selected.find(x=>x.key==="start")?.value||$("start").value,target=selected.find(x=>x.key==="target")?.value||$("target").value;
   if(start&&target&&start>target){toast("시작일이 심의일보다 늦습니다.");return}
   selected.sort((a,b)=>a.key==="type"?-1:b.key==="type"?1:0).forEach(c=>setInputValue(c.key,c.value));
   selected.forEach(c=>recordEvidence(c.key,c.source,"PPTX 텍스트 추출"));
   invalidate();persist();drawCandidates();renderMissing();toast(`${selected.length}개 필드를 반영했습니다.`);
 };
}
$("request-pptx").onchange=async e=>{
 const file=e.target.files[0];if(!file)return;$("extract-results").textContent="PPTX를 읽고 있습니다…";intakeCandidates=[];
 try{
   if(!/\.pptx$/i.test(file.name))throw Error(".pptx만 지원합니다.");
   const slides=await readPptx(file),all=slides.flatMap(s=>s.fields.map(f=>({...f,source:`${file.name} · 슬라이드 ${s.page}`}))).filter(x=>!intakeBlank(x.value));
   const fileType=all.find(x=>x.key==="type")?.value.trim()||type,allowed=new Set(intakeFields(fileType).map(x=>x[0]));
   for(const f of all.filter(x=>allowed.has(x.key))){
     const parsed=intakeValidate(f.key,f.value),duplicate=all.filter(x=>x.key===f.key).length>1;
     intakeCandidates.push({key:f.key,raw:f.value,...parsed,error:duplicate?"중복 필드. PPT에서 한 곳만 남겨 주세요.":parsed.error,source:f.source});
   }drawCandidates();
 }catch(err){$("extract-results").textContent="읽기 실패: "+err.message}finally{e.target.value=""}
};
function terms(s){
 const words=String(s).toLowerCase().match(/[가-힣a-z0-9]+/g)||[],out=new Set(words);
 words.filter(w=>/[가-힣]/.test(w)&&w.length>2).forEach(w=>{for(let i=0;i<w.length-1;i++)out.add(w.slice(i,i+2))});return out;
}
function retrieve(query){
 const q=terms(query);return knowledgeChunks.map(c=>{const t=terms(c.text);return {...c,score:[...q].reduce((s,w)=>s+(t.has(w)?1:0),0)/Math.sqrt(Math.max(1,t.size))}}).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
}
function renderMissing(){
 const previous=$("missing-field").value,fields=intakeFields(type).filter(([k])=>!["type","conditions","docs"].includes(k)&&intakeBlank(inputValue(k)));
 $("missing-field").innerHTML=fields.map(([k,l])=>`<option value="${esc(k)}">${esc(l)}</option>`).join("");
 if(fields.some(x=>x[0]===previous))$("missing-field").value=previous;
 $("search-knowledge").disabled=!fields.length;
 $("missing-count").textContent=fields.length?`미입력 ${fields.length}개 · 현장 조건과 자료 보유 여부는 직접 확인하세요.`:"텍스트 필드 입력 완료 · 증빙 적정성은 별도 검토가 필요합니다.";
 $("rag-results").innerHTML="";renderEvidence();
}
$("knowledge-files").onchange=async e=>{
 $("knowledge-status").textContent="참고자료를 읽고 있습니다…";const errors=[];
 for(const file of [...e.target.files]){
   try{
     if(knowledgeFiles.length>=10)throw Error("참고자료 최대 10개");
     if(file.size>15*1024*1024)throw Error("파일당 15MB 제한");let pages;
     if(/\.pptx$/i.test(file.name))pages=await readPptx(file);
     else if(/\.(txt|md)$/i.test(file.name)){
       if(file.size>2*1024*1024)throw Error("텍스트 자료는 2MB 이하");
       const text=await file.text();if(text.includes("\ufffd"))throw Error("UTF-8로 저장해 주세요.");
       pages=text.split(/\n\s*\n/).filter(x=>x.trim()).map((text,i)=>({text,page:i+1}));
     }else throw Error("PPTX, UTF-8 TXT/MD만 지원");
     const added=[];pages.forEach(p=>{for(let i=0;i<p.text.length;i+=700){const text=p.text.slice(i,i+850).trim();if(text)added.push({text,source:`${file.name} · ${/pptx$/i.test(file.name)?"슬라이드":"문단"} ${p.page} · 발췌 ${Math.floor(i/700)+1}`})}});
     if(knowledgeChunks.length+added.length>2000)throw Error("전체 발췌 2,000개 제한");
     knowledgeChunks.push(...added);knowledgeFiles.push(file.name);
   }catch(err){errors.push(`${file.name}: ${err.message}`)}
 }$("knowledge-status").textContent=`${knowledgeFiles.length}개 자료 / ${knowledgeChunks.length}개 발췌 준비. ${errors.join(" / ")}`;
 $("knowledge-list").textContent=knowledgeFiles.join(" · ");e.target.value="";
};
$("refresh-missing").onclick=renderMissing;
$("clear-knowledge").onclick=()=>{knowledgeChunks=[];knowledgeFiles=[];$("knowledge-list").textContent="";$("knowledge-status").textContent="참고자료를 비웠습니다. 반영한 값과 출처 이력은 유지됩니다.";$("rag-results").innerHTML=""};
$("search-knowledge").onclick=()=>{
 const key=$("missing-field").value,field=intakeFields(type).find(x=>x[0]===key);if(!field)return;
 if(!knowledgeChunks.length){$("rag-results").textContent="먼저 해당 사업 자료나 사내 기준을 추가하세요.";return}
 const hits=retrieve(`${field[1]} ${field[2]} ${$("knowledge-query").value}`);
 $("rag-results").innerHTML=hits.length?`<p>관련도순 원문 발췌입니다. 사업·기준일·단위·최신성을 확인하세요. 서로 다른 자료의 수치는 자동 통합하지 않습니다.</p>`+
 hits.map((h,i)=>`<article class="knowledge-hit"><b>${esc(h.source)}</b><p class="excerpt">${esc(h.text)}</p><label>반영할 값 <textarea id="knowledge-value-${i}" rows="3" placeholder="근거에서 확인한 해당 사업의 값만 작성하세요"></textarea></label><label class="check"><input type="checkbox" id="knowledge-confirm-${i}">이 사업에 적용되는 정보와 기준일·단위를 확인했습니다.</label><button type="button" class="button" data-use-hit="${i}">확인한 값 반영</button></article>`).join(""):"관련 근거를 찾지 못했습니다. 검색어를 바꾸거나 원자료를 추가하세요. 미입력 상태를 유지합니다.";
 document.querySelectorAll("[data-use-hit]").forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.useHit),raw=$("knowledge-value-"+i).value,parsed=intakeValidate(key,raw);
   if(parsed.error){toast(parsed.error);return}
   if(!$("knowledge-confirm-"+i).checked){toast("해당 사업 적용성과 기준일·단위를 확인해 주세요.");return}
   if(!intakeBlank(inputValue(key))&&!confirm("입력된 값을 변경할까요?"))return;
   const other=key==="start"?$("target").value:key==="target"?$("start").value:"";
   if(other&&((key==="start"&&raw>other)||(key==="target"&&raw<other))){toast("날짜 순서를 확인하세요.");return}
   setInputValue(key,parsed.value);recordEvidence(key,{location:hits[i].source,excerpt:hits[i].text},"문서 검색 후 담당자 입력");
   invalidate();persist();renderMissing();toast("확인한 값과 출처를 반영했습니다.");
 });
};
$("export-evidence").onclick=()=>{
 const blob=new Blob([JSON.stringify({schema:"investment-intake-v1",form:projectInput(),evidence:evidenceLog},null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="투자요청_입력및출처.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
$("project-form").addEventListener("change",renderMissing);$("type-options").addEventListener("click",renderMissing);renderMissing();
