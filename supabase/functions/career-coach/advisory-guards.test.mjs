import {test} from "node:test";
import assert from "node:assert/strict";
import {groundedEvidence,protectedInference} from "./advisory-guards.mjs";
test("evidence must be a nonempty exact excerpt of the supplied resume",()=>{
 assert.equal(groundedEvidence("Built SQL reports for a student team.",["Built SQL reports"]),true);
 assert.equal(groundedEvidence("Built SQL reports for a student team.",["managed a company"]),false);
 assert.equal(groundedEvidence("Built SQL reports for a student team.",[""]),false);
});
test("rejects obvious protected trait inferences in suggestions",()=>{
 assert.equal(protectedInference(["She is 30 years old"]),true);
 assert.equal(protectedInference(["Likely has a disability"]),true);
 assert.equal(protectedInference(["Build SQL dashboards"]),false);
});
