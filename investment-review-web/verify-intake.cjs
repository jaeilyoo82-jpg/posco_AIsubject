const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:"",checked:false,innerHTML:"",textContent:"",hidden:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},reportValidity(){return true}});return nodes.get(id)};
const ctx={console,document:{getElementById:node,querySelectorAll:()=>[],querySelector:()=>node("close")},localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout};
vm.createContext(ctx);
for(const file of ["criteria.js","app.js","intake-schema.js","intake.js"])vm.runInContext(fs.readFileSync("dist/"+file,"utf8"),ctx);
vm.runInContext(`
const check=(v,m)=>{if(!v)throw Error(m)};
check(intakeBlank("<입력>"),"placeholder ignored");
check(intakeValidate("budget","12억원").error,"no silent units conversion");
check(intakeValidate("budget","0").value==="0","zero valid");
check(intakeValidate("start","2026-02-30").error,"invalid date");
check(intakeValidate("start","2026-02-28").value==="2026-02-28","valid date");
check(intakeValidate("type","other").error,"invalid type");
check(intakeValidate("docs","모르는 자료").error,"unknown evidence");
check(intakeValidate("conditions","없음").value.length===0,"explicit none");
check(intakeValidate("conditions","전력·용수 등 유틸리티 변경").value[0]==="utility","condition mapping");
for(const t of TYPES)check(intakeFields(t).length===15,t+" field coverage");
knowledgeChunks=[{text:"생산능력은 10만 톤에서 12만 톤으로 증가",source:"test:1"},{text:"무관한 휴가 규정",source:"test:2"}];
check(retrieve("생산능력")[0].source==="test:1","grounded retrieval");
check(retrieve("xyzunmatch").length===0,"no invented results");
setInputValue("안전환경.target","배출 기준");check(typeValues["안전환경"].target==="배출 기준","namespaced target");
check($("target").value==="","date not overwritten");
setInputValue("증설.capacity","10만 톤");check(projectInput().typeInputs.capacity==="10만 톤","structured value applied");
recordEvidence("증설.capacity","test slide 1","test");check(evidenceLog.length===1&&evidenceLog[0].value==="10만 톤","provenance");
`,ctx);
(async()=>{
 const zip=await require("./dist/vendor/jszip.min.js").loadAsync(fs.readFileSync("dist/templates/investment-request.pptx"));
 const files=Object.values(zip.files).filter(f=>/^ppt\/slides\/slide\d+\.xml$/.test(f.name));
 assert.equal(files.length,9);
 const keys=[];for(const file of files){const xml=await file.async("string");keys.push(...[...xml.matchAll(/name="field\.([^"]+)"/g)].map(m=>m[1]));}
 assert.equal(keys.length,35);assert.equal(new Set(keys).size,35);
 console.log("PASS: 9-slide PPTX, 35 unique fields, 5 types, date/units/conditions validation, retrieval/no-results, namespace safety, provenance");
})().catch(e=>{console.error(e);process.exitCode=1});
