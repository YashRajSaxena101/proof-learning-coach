import { useSyncExternalStore } from 'react';
import { careerStateSchema, type CareerState, type CareerSession } from '@/domain/career/contracts';
export type SaveStatus='browser-saved'|'memory-only'|'corrupt';
const KEY='proof.career.v1';
export class CareerRepository {
 status:SaveStatus='browser-saved';
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>){}
 load():CareerState {try {const raw=this.storage.getItem(KEY);if(!raw)return {version:1,sessions:[]};const p=careerStateSchema.safeParse(JSON.parse(raw));if(p.success)return p.data;this.status='corrupt';}catch{this.status='corrupt';}return {version:1,sessions:[]};}
 save(data:CareerState){try{this.storage.setItem(KEY,JSON.stringify(careerStateSchema.parse(data)));this.status='browser-saved';return true;}catch{this.status='memory-only';return false;}}
}
export const latestRequest=()=>{let generation=0;return {begin:()=>++generation,current:(id:number)=>id===generation,cancel:()=>{generation++;}};};
const SERVER:CareerState={version:1,sessions:[]};let state=SERVER;let repo:CareerRepository|undefined;let initialized=false;let status:SaveStatus='browser-saved';const listeners=new Set<()=>void>();
const subscribe=(l:()=>void)=>{listeners.add(l);return()=>listeners.delete(l)};
export const careerStore={
 init(){if(initialized||typeof window==='undefined')return;initialized=true;try{repo=new CareerRepository(window.localStorage);state=repo.load();status=repo.status;}catch{status='memory-only';}listeners.forEach(l=>l());},
 get:()=>state,
 set(update:(s:CareerState)=>CareerState){state=careerStateSchema.parse(update(state));if(repo){repo.save(state);status=repo.status;}else status='memory-only';listeners.forEach(l=>l());},
 updateSession(id:string,update:(s:CareerSession)=>CareerSession){careerStore.set(s=>({...s,sessions:s.sessions.map(v=>v.id===id?update(v):v)}));},
 add(session:CareerSession){careerStore.set(s=>({...s,profile:session.profile,activeId:session.id,sessions:[session,...s.sessions].slice(0,30)}));},
 subscribe,
};
export const useCareer=()=>useSyncExternalStore(subscribe,()=>state,()=>SERVER);
export const useCareerSave=()=>useSyncExternalStore(subscribe,()=>status,()=> 'browser-saved' as SaveStatus);