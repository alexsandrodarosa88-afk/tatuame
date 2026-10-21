import { test } from "node:test";
import { strict as assert } from "node:assert";
import { visualDeclarations, validImage, validSelector } from "./visual-editor";

test("visual text settings allow chosen font, color and alignment", () => {
  const css = visualDeclarations({ font: "georgia", color: "#cc0000", align: "center", size: 32 });
  assert.ok(css.includes("font-family:Georgia, serif"));
  assert.ok(css.includes("--visual-text:#cc0000"));
  assert.ok(css.includes("text-align:center"));
  assert.ok(css.includes("font-size:32px"));
});
test("element positions accept bounded order values", () => {
  assert.equal(visualDeclarations({ order: -1 }), "order:-1!important");
  assert.equal(visualDeclarations({ order: 101 }), "");
});
test("visual overrides cannot inject executable styles or image URLs", () => {
  assert.equal(visualDeclarations({ color: "red;}body{display:none", size: Infinity }), "");
  assert.equal(validImage("javascript:alert(1)"), false);
  assert.equal(validSelector('[data-visual-id="home-1"]'), true);
  assert.equal(validSelector("body,html"), false);
});