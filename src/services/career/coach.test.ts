import { describe,it,expect,vi,beforeEach } from 'vitest';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),anon:vi.fn(),invoke:vi.fn()}));
vi.mock('@/integrations/supabase',()=>({supabase:{auth:{getSession:mocks.getSession,signInAnonymously:mocks.anon},functions:{invoke:mocks.invoke}}}));
import {requestCareerCoach} from './coach';
import {exampleScenario} from '@/domain/career/examples';
import {CareerRepository} from './store';
const profile={topic:'AI engineer',experience:'new',interest:'',goal:'interview',minutes:15,diagnostic:"I'm not sure"};
beforeEach(()=>{vi.resetAllMocks();mocks.getSession.mockResolvedValue({data:{session:{}}})});
describe('Career coach client boundary',()=>{
 it('accepts scoped guest generation without anonymous Auth and privately retains capability on reload',async()=>{
 mocks.getSession.mockResolvedValue({data:{session:null}});
 mocks.invoke.mockResolvedValue({data:{id:'00000000-0000-4000-8000-000000000001',scenario:exampleScenario('Data analyst'),mode:'live-ai',provider:'Ollama',model:'test-model',capability:'opaque-test-capability'},error:null});
 const r=await requestCareerCoach({action:'generate',profile},new AbortController().signal);
 expect(mocks.anon).not.toHaveBeenCalled();expect(mocks.getSession).not.toHaveBeenCalled();
 if(!('scenario' in r))throw Error('fixture');expect(r.capability).toBe('opaque-test-capability');
 let raw='';const repo=new CareerRepository({getItem:()=>raw,setItem:(_,v)=>{raw=v}});
 repo.save({version:1,sessions:[{id:r.id,createdAt:'2026-11-05T01:00:00Z',profile:{...profile,experience:'new',goal:'interview',minutes:15},scenario:r.scenario,capability:r.capability,source:'live-ai',stage:'decisions',choices:{},answers:[],messages:[],helpUsed:0}]});
 expect(repo.load().sessions[0]?.capability).toBe('opaque-test-capability');
 });
 it('sends capability and technical text without a client scenario or rubric',async()=>{
 const data={mode:'live-ai',provider:'Ollama',model:'test',message:'Check grain',strengths:[],gaps:[],nextQuestion:'What is one row?',retrySuggestions:[],independent:false};
 mocks.invoke.mockResolvedValue({data,error:null});
 const input={action:'feedback',sessionId:'00000000-0000-4000-8000-000000000001',capability:'opaque-test-capability',stage:'decisions',intent:'answer',text:'SELECT SUM(amount) FROM orders WHERE latency < 100',choices:{}};
 expect(await requestCareerCoach(input,new AbortController().signal)).toEqual(data);
 expect(mocks.invoke.mock.calls[0]?.[1].body).toEqual(input);expect(mocks.anon).not.toHaveBeenCalled();
 });
 it('rejects malformed provider results instead of inventing feedback',async()=>{mocks.invoke.mockResolvedValue({data:{passed:true},error:null});await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('unexpected response')});
 it('rejects generation without the required scoped capability',async()=>{mocks.invoke.mockResolvedValue({data:{id:'00000000-0000-4000-8000-000000000001',scenario:exampleScenario('Data analyst'),mode:'live-ai',provider:'Ollama',model:'test'},error:null});await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('unexpected response')});
 it('maps a missing external function to an honest setup error',async()=>{mocks.invoke.mockResolvedValue({data:null,error:{context:new Response('',{status:404})}});await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('not deployed yet')});
 it('maps rate limit exhaustion without automatic replay',async()=>{mocks.invoke.mockResolvedValue({data:null,error:{context:new Response('',{status:429})}});await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('request limit');expect(mocks.invoke).toHaveBeenCalledTimes(1)});
 it('keeps failures visible when offline',async()=>{mocks.invoke.mockRejectedValue(new Error('offline'));await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('check your connection')});
 it('rejects client-supplied identity before any service call',async()=>{await expect(requestCareerCoach({action:'generate',profile,userId:'forged'},new AbortController().signal)).rejects.toThrow();expect(mocks.getSession).not.toHaveBeenCalled()});
});
