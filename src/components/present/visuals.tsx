import { WorkScene } from '@/components/career/WorkScene';
import { exampleScenario } from '@/domain/career/examples';
import { ParticleField } from '@/components/fx/ParticleField';
export function SlideVisual({index}:{index:number}){
 if(index===0||index===7)return <ParticleField className="hidden aspect-square w-full max-w-md justify-self-end md:block" density={0.5}/>;
 const topics=['AI engineer','Software engineer','AI engineer','Cybersecurity','Data analyst','Product/Business'];
 const topic=topics[index-1]??'AI engineer';
 return <div className="hidden w-full max-w-md justify-self-end md:block"><WorkScene scene={exampleScenario(topic).scene} compact/></div>;
}
