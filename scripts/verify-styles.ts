import fs from "node:fs";
import path from "node:path";
import { STYLE_IDS, themes } from "../src/styles";

const REQUIRED_FILES = [
  "tokens.ts",
  "style-guide.md",
  "image-prompt.md",
  "reference.png",
];

let failed = false;

for (const id of STYLE_IDS) {
  const dir = path.resolve(process.cwd(), "src", "styles", id);
  const tokens = themes[id];
  if (!tokens) {
    console.error(`✗ 风格包未注册: ${id}`);
    failed = true;
    continue;
  }

  const missing = REQUIRED_FILES.filter(
    (f) => !fs.existsSync(path.join(dir, f)),
  );
  if (missing.length > 0) {
    console.error(`✗ 风格包 [${id}] 缺少文件: ${missing.join(", ")}`);
    failed = true;
  } else {
    console.log(
      `✓ 风格包 [${id}] (${tokens.name}) 校验通过：4 件套齐全 (bg=${tokens.colors.bg}, accent=${tokens.colors.accent})`,
    );
  }
}

if (failed) {
  process.exit(1);
}
console.log(`✓ 共验证 ${STYLE_IDS.length} 套风格包，视觉系统完整性 100%。`);
