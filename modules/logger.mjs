//Log Sistemi (ES Module )
import fs from "fs/promises";
import path from "path";

import { fileURLToPath } from "url"; //built-in url modulu fileURLToPath fonksiyonu

const __filename = fileURLToPath(import.meta.url); //url olan dosya yolunu normal dosya yolun cevirdik.
const __dirname = path.dirname(__filename);

const logYolu = path.join(__dirname, "../logs/app.log");

function tarihGetir() {
  return new Date().toLocaleString(); //sistem saat ve tarihi aldı
}

//! async - await ile fs kullandık
async function logYaz(seviye, mesaj) {
  const log = `[${tarihGetir()}] ${seviye.toUpperCase()}: ${mesaj}\n`;
  await fs.appendFile(logYolu, log);
}

export function info(mesaj) {
  logYaz("info", mesaj);
}

export function warn(mesaj) {
  logYaz("warn", mesaj);
}

export function error(mesaj) {
  logYaz("error", mesaj);
}
