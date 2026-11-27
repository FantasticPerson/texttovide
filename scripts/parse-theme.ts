import { STYLE_IDS, ThemeId, themes } from "../src/styles";

/**
 * 解析命令行中的 `--theme <id>` 或 `--theme=<id>`，并校验是否属于已注册风格包。
 */
export function parseThemeArg(args: string[]): ThemeId | undefined {
  let raw: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--theme=")) {
      raw = a.slice("--theme=".length).trim();
    } else if (a === "--theme" && i + 1 < args.length) {
      raw = args[i + 1].trim();
    }
  }
  if (!raw) return undefined;
  if (!STYLE_IDS.includes(raw as ThemeId)) {
    console.error(`✗ 不支持的风格: "${raw}"`);
    console.error(`  可用风格: ${STYLE_IDS.map((id) => `${id} (${themes[id].name})`).join(" | ")}`);
    process.exit(1);
  }
  return raw as ThemeId;
}

export function printThemes(): void {
  console.log("可用视觉风格包：");
  for (const id of STYLE_IDS) {
    const t = themes[id];
    console.log(`  - ${id.padEnd(16)} ${t.name} (bg=${t.colors.bg}, accent=${t.colors.accent})`);
  }
}
