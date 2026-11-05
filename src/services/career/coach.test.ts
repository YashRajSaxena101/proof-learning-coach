import { describe,it,expect,vi,beforeEach } from 'vitest';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),anon:vi.fn(),invoke:vi.fn()}));
vi.mock('@/integrations/supabase',()=>({supabase:{auth:{getSession:mocks.getSession,signInAnonymously:mocks.anon},functions:{invoke:mocks.invoke}}}));
import {requestCareerCoach} from './coach';
const profile={topic:'AI engineer',experience:'new',interest:'',goal:'interview',minutes:15,diagnostic:"I'm not sure"};
beforeEach(()=>{vi.resetAllMocks();mocks.getSession.mockResolvedValue({data:{session:{}}})});
describe('Career coach client boundary',()=>{
 it('does not call inference when guest access is disabled',async()=>{mocks.getSession.mockResolvedValue({data:{session:null}});mocks.anon.mockResolvedValue({error:new Error('disabled')});await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('Guest AI access is not enabled');expect(mocks.invoke).not.toHaveBeenCalled()});
 it('rejects malformed provider results instead of inventing feedback',async()=>{mocks.invoke.mockResolvedValue({data:{passed:true},error:null});await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('unexpected response')});
 it('maps a missing external function to an honest setup error',async()=>{mocks.invoke.mockResolvedValue({data:null,error:{context:new Response('',{status:404})}});await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('not deployed yet')});
 it('maps rate limit exhaustion without automatic replay',async()=>{mocks.invoke.mockResolvedValue({data:null,error:{context:new Response('',{status:429})}});await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('request limit');expect(mocks.invoke).toHaveBeenCalledTimes(1)});
 it('keeps failures visible when offline',async()=>{mocks.invoke.mockRejectedValue(new Error('offline'));await expect(requestCareerCoach({action:'generate',profile},new AbortController().signal)).rejects.toThrow('check your connection')});
 it('rejects client-supplied identity before any service call',async()=>{await expect(requestCareerCoach({action:'generate',profile,userId:'forged'},new AbortController().signal)).rejects.toThrow();expect(mocks.getSession).not.toHaveBeenCalled()});
});
