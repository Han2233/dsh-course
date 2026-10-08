const assert = require('node:assert/strict');
const {computePatch, revisionStages} = require('../assets/lesson01-models.js');
// All selectable layer combinations, including a mistyped final target.
let cases = 0;
for (const profile of [false,true]) for (const home of [false,true]) for (const cli of [false,true]) for (const typo of [false,true]) {
  const result=computePatch({profile,home,cli,typo});
  const expected = cli && !typo ? {timeout:10,retries:1} : home ? {timeout:90} : profile ? {timeout:60,retries:2} : {timeout:30,retries:2};
  assert.deepEqual(result.target.config,expected);
  assert.equal(result.warnings.length,cli && typo ? 1 : 0);
  cases++;
}
// One run must not contaminate a subsequent reset.
computePatch({home:true}).target.config.timeout=999;
assert.deepEqual(computePatch({}).target.config,{timeout:30,retries:2});
assert.equal(revisionStages[2].a,'v1');
assert.equal(revisionStages[2].retired,true);
assert.equal(revisionStages[2].gone,false);
assert.equal(revisionStages[3].a,'v1');
assert.equal(revisionStages[3].b,'v2');
assert.equal(revisionStages[4].a,null);
assert.equal(revisionStages[4].b,'v2');
assert.equal(revisionStages[4].gone,true);
console.log(`${cases} configuration scenarios, reset independence and revision lifecycle assertions passed`);
