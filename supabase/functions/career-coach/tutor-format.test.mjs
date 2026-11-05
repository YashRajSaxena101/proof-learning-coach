import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeTutorMessage, coachingInstruction } from './tutor-format.mjs';

test('history stores the learner-visible message and complete follow-up within 2000 characters',()=>{
 const message='m'.repeat(1800), question='q'.repeat(400);
 const actual=composeTutorMessage(message,question);
 assert.equal(actual.length,2000);
 assert.equal(actual,'m'.repeat(1598)+'\n\n'+question);
});
test('each tutoring intent asks for the requested teaching action',()=>{
 assert.match(coachingInstruction('tutor','simpler'),/plain language/i);
 assert.match(coachingInstruction('tutor','example'),/concrete.*example/i);
 assert.match(coachingInstruction('tutor','hint'),/guiding question/i);
 assert.match(coachingInstruction('feedback','answer'),/evaluate/i);
 assert.match(coachingInstruction('tutor','simpler'),/message/i);
 assert.match(coachingInstruction('tutor','example'),/without.*complete/i);
});
