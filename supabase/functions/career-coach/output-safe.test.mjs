import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedGeneratedText } from './output-safe.mjs';
test('server text filter matches client rejection of markup and URLs',()=>{
 for (const s of ['<script>alert(1)</script>', '<IMG src=x>', 'https://example.test', 'javascript:alert(1)']) assert.equal(allowedGeneratedText(s),false);
 for (const s of ['SELECT SUM(total)', 'latency < 100ms']) assert.equal(allowedGeneratedText(s),true);
});
