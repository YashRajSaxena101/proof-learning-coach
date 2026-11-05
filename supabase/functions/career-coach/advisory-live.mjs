// Explicit synthetic-only live probe; never log inputs, provider content or credentials.
const endpoint="https://vyaydusrhhcazxshadxv.supabase.co/functions/v1/career-coach";
const sample="Built SQL dashboards for a university project and presented data findings to a student team. Wrote clear documentation and checked data quality.";
const requests=[
 {action:"resume",text:sample},
 {action:"companion",topic:"Data analyst",interest:"SQL",text:"How do I get better at checking joins?",history:[]},
];
for(const body of requests) {
 const start=Date.now();
 try {
  const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
  const data=await response.json();
  const valid=body.action==="resume"
   ? typeof data.role==="string"&&Array.isArray(data.skills)&&typeof data.focus==="string"&&Array.isArray(data.evidence)&&data.evidence.length>0&&data.evidence.every(e=>typeof e==="string"&&e.length>0&&sample.includes(e))
   : typeof data.message==="string"&&data.message.length>0&&data.message.length<=800;
  console.log(JSON.stringify({action:body.action,status:response.status,code:data.code,valid,elapsedMs:Date.now()-start}));
 } catch { console.log(JSON.stringify({action:body.action,status:"transport-error"})); }
}
