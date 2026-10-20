const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{value:"",checked:false,innerHTML:"",textContent:"",hidden:false,disabled:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},insertAdjacentHTML(where,html){this.innerHTML+=html},reportValidity(){return true}});return nodes.get(id)};
const ctx={document:{getElementById:node,querySelectorAll:()=>[],querySelector:()=>node("close")},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync("dist/criteria.js","utf8"),ctx);vm.runInContext(fs.readFileSync("dist/app.js","utf8"),ctx);
vm.runInContext(`
 const assertTest=(v,m)=>{if(!v)throw Error(m)};
 const base={type:"증설",conditions:["operating","utility"],docs:[],name:"test"};
 const candidate=buildItems(base);
 assertTest(candidate.filter(i=>i.status==="적용").length===15,"증설 15개 적용");
 assertTest(candidate.filter(i=>i.status==="판단 보류").length===4,"미선택 조건 4개 판단 보류");
 for(const t of TYPES){const a=buildItems({...base,type:t,conditions:[]});assertTest(a.filter(i=>i.status==="적용").length===13,t+" 13개 공통·유형 항목")}
 const energy=buildItems({...base,type:"에너지",conditions:["roof"]});
 assertTest(energy.find(i=>i.id==="C06").status==="적용","지붕 조건 적용");
 plan={project:base,items:candidate};
 assertTest(schedule().errors.length===15,"기간 누락 시 미산정");
 plan.items=[{id:"A",status:"적용",deps:[],owner:"팀1",days:"2",durationBasis:"추정"},{id:"B",status:"적용",deps:[],owner:"팀1",days:"3",durationBasis:"추정"},{id:"C",status:"적용",deps:["A"],owner:"팀2",days:"2",durationBasis:"추정"}];
 assertTest(schedule().total===5,"담당별 직렬·병행 5일");
 plan.items[0].deps=["C"];
 assertTest(schedule().errors.includes("A"),"순환 관계 산정 차단");
 plan.items=[{id:"A",status:"적용",deps:["missing"],owner:"팀1",days:"2",durationBasis:"추정"}];
 assertTest(schedule().errors.includes("A"),"누락 선행 항목 차단");
 assertTest(dateAt("2026-10-23",1)==="2026-10-26","주말 제외");
 assertTest(csvCell("=1+1").startsWith("\\"'"),"CSV 수식 주입 방지");
 assertTest(Object.keys(ITEM_DETAILS).length===27,"27개 항목 상세");
 for(const r of RULES){const d=ITEM_DETAILS[r.id];assertTest(d.inputs.length===3&&d.checks.length===3&&d.outputs.length>0&&!!d.acceptance,"모든 항목 인풋·업무·아웃풋·기준");assertTest(!!KPC_SOURCES[d.source],"유효 출처");assertTest(detailHTML(r.id,"교체").includes("공식 업무표준이 아닙니다"),"출처 범위 명시")}
 for(const t of TYPES){assertTest(TYPE_IO[t].fields.length===5&&TYPE_IO[t].outputs.length===4,"유형별 IO");assertTest(new Set(TYPE_IO[t].fields.map(f=>f[0])).size===5,"입력 키 중복 없음")}
 plan={project:{...base,typeInputs:{demand:"<script>unsafe</script>"}},items:candidate};
 plan.items[0].inputNotes="actual input";plan.items[0].outputNotes="actual output";
 renderIO();assertTest(document.getElementById("view-io").innerHTML.includes("&lt;script&gt;"),"사용자 입력 이스케이프");
 const csvRows=exportRows();assertTest(csvRows.length===28&&csvRows.every(r=>r.length===33),"CSV 전 항목 IO 필드 정합성");
 assertTest(csvRows[1].includes("actual input")&&csvRows[1].includes("actual output"),"실제 IO 기록 내보내기");
 const rebuilt=buildItems(base,plan.items);assertTest(rebuilt[0].inputNotes==="actual input"&&rebuilt[0].outputNotes==="actual output","재도출 입력 기록 보존");
 console.log("PASS: 유형별 추천, 현장조건, 미산정, 자원제약, 순환·누락 의존관계, 영업일, CSV 보호");
 console.log("PASS: 27개 상세, 5개 유형 IO, 출처 매핑, CSV 확장, 기록 보존, 입력 이스케이프");
`,ctx);
assert.ok(fs.readFileSync("dist/index.html","utf8").includes('lang="ko"'));
