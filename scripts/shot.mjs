#!/usr/bin/env node
/**
 * Screenshot headless com viewport EXATO (o Chrome não aceita janela < 500px,
 * e o CSP do app proíbe iframe — então usamos o DevTools Protocol direto).
 *
 *   node scripts/shot.mjs --url http://localhost:3000/ --w 390 --h 1600 --out C:\tmp\home.png
 *
 * Opções:
 *   --full            captura a página inteira (altura do conteúdo), não só o viewport
 *   --cookie "user={\"userId\":1,\"role\":\"PRODUTOR\",\"nivelProdutor\":2}"
 *                     grava um cookie antes de navegar (telas logadas no modo mock)
 *   --hover 280,52    move o mouse pra (x,y) antes de capturar (testa :hover)
 *   --click 280,52    clica em (x,y) antes de capturar (abre menus/dialogs)
 *   --type "neon"     digita no elemento focado (use depois de --click num campo)
 *   --key Enter       tecla única (Enter|Escape|Tab) no elemento focado
 *   --wait 2500       ms extra depois do load (dados do mock chegam com latência)
 *   --dark/--light    força o tema via classe no <html> (painel)
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? "true" : all[i + 1]] : null))
    .filter(Boolean),
);

const url = args.url ?? "http://localhost:3000/";
const width = Number(args.w ?? 390);
const height = Number(args.h ?? 1600);
const out = args.out;
const extraWait = Number(args.wait ?? 2500);
if (!out) {
  console.error("--out obrigatório");
  process.exit(1);
}

const candidates = [
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].filter(Boolean);
const chrome = candidates.find((c) => existsSync(c));
if (!chrome) {
  console.error("Chrome não encontrado");
  process.exit(1);
}

const port = 9300 + Math.floor(Math.random() * 600);
const profile = mkdtempSync(join(tmpdir(), "nokta-shot-"));
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDevtools() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error("DevTools não respondeu");
}

function cleanup() {
  try {
    proc.kill();
  } catch {}
  setTimeout(() => {
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  }, 500);
}

try {
  await waitForDevtools();
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method && listeners.has(msg.method)) {
      listeners.get(msg.method)(msg.params);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const myId = ++id;
      pending.set(myId, { resolve, reject });
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  const once = (method) => new Promise((resolve) => listeners.set(method, resolve));

  await send("Page.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  if (width < 768) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

  if (args.cookie) {
    const [name, ...rest] = args.cookie.split("=");
    await send("Network.setCookie", { name, value: rest.join("="), url: new URL(url).origin, path: "/" });
  }

  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await Promise.race([loaded, sleep(20000)]);

  if (args.dark || args.light) {
    await send("Runtime.evaluate", { expression: `document.documentElement.classList.${args.light ? "remove" : "add"}("dark");localStorage.setItem("theme","${args.light ? "light" : "dark"}")` });
  }

  await sleep(extraWait);

  if (args.hover) {
    const [x, y] = args.hover.split(",").map(Number);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await sleep(600);
  }
  if (args.click) {
    const [x, y] = args.click.split(",").map(Number);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    await sleep(800);
  }
  // --type "texto": digita no elemento focado (depois de --click num input).
  if (args.type && args.type !== "true") {
    await send("Input.insertText", { text: args.type });
    await sleep(900);
  }
  // --key Enter|Escape|Tab: tecla única no elemento focado.
  if (args.key && args.key !== "true") {
    const key = args.key;
    const code = key === "Enter" ? 13 : key === "Escape" ? 27 : key === "Tab" ? 9 : 0;
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
    await sleep(800);
  }

  let clip;
  if (args.full) {
    const m = await send("Page.getLayoutMetrics");
    const h = Math.ceil(m.cssContentSize?.height ?? m.contentSize.height);
    await send("Emulation.setDeviceMetricsOverride", { width, height: h, deviceScaleFactor: 1, mobile: width < 768 });
    await sleep(300);
    clip = { x: 0, y: 0, width, height: h, scale: 1 };
  }
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: Boolean(args.full), ...(clip ? { clip } : {}) });
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log(`ok ${out} (${width}x${clip ? clip.height : height})`);
  ws.close();
} catch (e) {
  console.error("FALHOU:", e.message);
  process.exitCode = 1;
} finally {
  cleanup();
}
