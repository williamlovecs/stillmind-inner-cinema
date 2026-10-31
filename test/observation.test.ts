import assert from "node:assert/strict";
import test from "node:test";
import { observationText, observerFrame } from "../packages/domain/src/observation";

test("empty intake has no attributed negative thought", () => {
  assert.equal(observationText("   "), "有一个念头");
  assert.equal(observerFrame("  "), "");
});

test("observation keeps compounds, quoted speakers and facts intact", () => {
  for (const sentence of ["我们正在讨论自我观察。", "他说：‘我没错’，我不知道怎么回答。", "我是我，不是他们说的我。", " <script>alert('我')</script> "]) {
    assert.equal(observerFrame(sentence, "小林"), `小林注意到，脑中出现了这样一句话：「${sentence}」`);
  }
});

test("optional name is never invented and original thought remains the viewing subject", () => {
  assert.equal(observerFrame("我们需要时间。"), "我注意到，脑中出现了这样一句话：「我们需要时间。」");
  assert.equal(observationText("  我想晚点再说。  "), "我想晚点再说。");
});
