"use strict";
const INTAKE_FIELDS=[
 ["name","사업명","정식 사업명"],["type","투자사업 유형","신설 / 증설 / 교체 / 안전환경 / 에너지 중 하나"],
 ["purpose","투자 목적","현재 문제, 미추진 영향, 기대효과"],["location","사업장·지역","사업장과 설치 위치"],
 ["budget","예상 투자비 (억원)","억원 기준 숫자만, 미정이면 비워 두기"],["scale","사업 규모·목표 성능","단위, 기준 시점, 목표 성능"],
 ["start","검토 시작일","YYYY-MM-DD"],["target","목표 심의일","YYYY-MM-DD"],
 ["conditions","현장·운영 조건","해당하는 조건명을 쉼표로 구분. 없으면 '없음'"],["docs","확보한 자료","보유한 자료명을 쉼표로 구분. 없으면 '없음'"]
];
function intakeFields(t){return [...INTAKE_FIELDS,...(TYPE_IO[t]?.fields||[]).map(([k,l,h])=>[`${t}.${k}`,l,h])]}
function intakeBlank(v){return !v||/^(<입력.*>|미정|미입력|확인 필요|작성 필요|해당 없음)$/i.test(String(v).trim())}
function intakeValidate(key,raw){
 const v=String(raw).trim();if(intakeBlank(v))return {error:"미입력"};
 if(key==="type"&&!Object.keys(TYPE_IO).includes(v))return {error:"유형 5개 중 하나를 입력하세요"};
 if(key==="budget"&&!/^\d+(\.\d+)?$/.test(v))return {error:"억원 기준의 0 이상 숫자만 입력하세요"};
 if(["start","target"].includes(key)&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))return {error:"실제 날짜를 YYYY-MM-DD로 입력하세요"};
 if(key==="conditions"||key==="docs"){
   if(v==="없음")return {value:[]};
   const map=key==="conditions"?CONDITIONS:DOCS,parts=v.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
   const values=parts.map(x=>Object.keys(map).find(k=>map[k]===x||k===x));
   if(values.some(x=>!x))return {error:"서식의 정확한 선택지 명칭을 사용하세요"};
   return {value:[...new Set(values)]};
 }return {value:v};
}
