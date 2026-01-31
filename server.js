const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const fsp = require("node:fs/promises");

const templateYolu = path.join(__dirname, "templates");

async function templateOku(dosyaName) {
  const dosyaYolu = path.join(templateYolu, dosyaName);
  return await fsp.readFile(dosyaYolu, "utf-8");
}
function htmlGonder(res, html) {
  res.writeHead(200, { "Content-type": "text/html; charset=utf-8" });
  res.end(html);
}
function render(template, data) {
  let cikis = template;
  for (const [key, value] of Object.entries(data)) {
    cikis = cikis.replaceAll(`{{${key}}}`, String(value));
  }
  return cikis;
}

//film kartlari 
function filmKartlariHTML(filmler) {
  return filmler
    .map(
      (f) => `
    <a class="card" href="/films/${f.id}">
      <div class="poster">🎬</div>
      <div class="meta">
        <h3>${f.title}</h3>
        <p>Yıl: ${f.year}</p>
        <p>Puan:  ${f.rating}</p>
        <p>Kategori: ${f.category}</p>
      </div>
    </a>
  `,
    )
    .join("");
}



const {
  getirFilm,
  getirIstatistik,
  getirFilmId,
  getFilmsByCategory,
} = require("./modules/fileManager");

const eventBus = require("./modules/eventBus");

//const { json } = require("node:stream/consumers");

/*
  JSON response göndermeyi kolaylaştıran yardımcı fonksiyon
  Her seferinde writeHead + JSON.stringify yazmamak için
*/
function jsonGonder(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(data, null, 2));
}

function yaziGonder(res, statusCode, yazi) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(yazi);
}


// SERVER 
const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost:3000");

  //debug
  console.log("DEBUG =>", req.method, pathname);

  //sadece get kabul edildi
  if (req.method !== "GET") {
    jsonGonder(res, 405, { hata: "Method a izin verilmiyor!! " });
    return;
  }

 //html oku GET
  if (pathname === "/") {
    const t = await templateOku("home.html");
    const istatistik = await getirIstatistik();
    const filmler = await getirFilm();
    const son3 = [...filmler].sort((a, b) => b.id - a.id).slice(0, 3);
    
    
    const statsHTML = `
      <ul>
        <li>Toplam Film: <b>${istatistik.toplamFilm}</b></li>
        <li>İzlenen: <b>${istatistik.izlenenFilm}</b></li>
        <li>Ortalama Puan: <b> ${istatistik.ortalamaPuan}</b></li>
      </ul>
    `;

    const sonEklenenlerHTML = `
      <ul>
        ${son3.map((f) => `<li><a href="/films/${f.id}">${f.title} (${f.year})</a></li>`).join("")}
      </ul>
    `;

    const html = render(t, {
      title: "Ana Sayfa",
      stats: statsHTML,
      content: sonEklenenlerHTML,
    });

    htmlGonder(res, html);
    return;
  }

  //html get/ film 
  if (pathname==="/films") {
    const t = await templateOku("films.html");
    const filmler = await getirFilm();

    const html = render(t,{
      title: "Film Listesi",
      filmList:filmKartlariHTML(filmler)
    });
    htmlGonder(res,html);
    return;
  }


 //get film kategori
  if (pathname.startsWith("/films/category/")) {
    const parcalar = pathname.split("/");
    const name = parcalar[3];

    const films = await getFilmsByCategory(name);
    jsonGonder(res, 200, { category: name, films });
    return;
  }


 // /films/:id gelecek
  // if (pathname.startsWith("/films/")) {
  //   const parcalar = pathname.split("/"); // ["","films",id]
  //   const id = parcalar[2];
  //   const film = await getirFilmId(id);

  //   if (!film) {
  //     jsonGonder(res, 404, { hata: "Film Bulunamadi" });
  //     return;
  //   }

  //   eventBus.emit("filmViewed", film);

  //   jsonGonder(res, 200, film);
  //   return;
  // }
 if (pathname.startsWith("/films/") && !pathname.startsWith("/films/category")) {
  const id = pathname.split("/")[2];
  const film = await getirFilmId(id);

 if (!film) {
  const t404 = await templateOku("404.html");
  const html404 = render(t404,{title:"404", content:"Film Bulunamadi"});
  htmlGonder(res,html404,404);
  return;
 }
eventBus.emit("filmViewed", film);
const t = await templateOku("film-detail.html");
const filmInfo = `
      <p><b>Yıl:</b> ${film.year}</p>
      <p><b>Yönetmen:</b> ${film.director}</p>
      <p><b>Kategori:</b> ${film.category}</p>
      <p><b>Puan:</b>  ${film.rating}</p>
      <p><b>Durum:</b> ${film.watched ? "✓ İzlendi" : "✗ İzlenmedi"}</p>
    `;

    const html = render(t,{title:film.title,content:filmInfo});
    htmlGonder(res,html,404)
    return;


 }











    //GET api film
  if (pathname === "/api/films") {
    const filmler = await getirFilm(); //filemanager den gelir
    jsonGonder(res, 200, { films: filmler });
    return; //baska route lara dusmemesi icinmis
  }
  //GET api stats
  if (pathname === "/api/stats") {
    const istatistik = await getirIstatistik(); //filemanager den gelir
    jsonGonder(res, 200, istatistik);
    return;
  }
 

  //get/reports/export
  if (pathname === "/reports/export") {
    const filmler = await getirFilm();

    const reportYolu = path.join(__dirname, "reports", "films-exports.txt");
    const akisYaz = fs.createWriteStream(reportYolu, { encoding: "utf-8" });

    akisYaz.write("--- Film Arsivi Raporu---\n");
    akisYaz.write(`Olusturulma? ${new Date().toLocaleString()}\n`);
    akisYaz.write(`Toplam:${filmler.length}film\n`);
    akisYaz.write("----------------------------\n\n");

    for (const film of filmler) {
      akisYaz.write(`${film.id}.${film.title} (${film.year})\n`);
      akisYaz.write(`Yonetmen:${film.director}\n`);
      akisYaz.write(`Kategori : ${film.category} | Puan:${film.rating}\n`);
      akisYaz.write(`Durum : ${film.watched ? "Izlendi" : "Izlenmedi"}\n\n`);
    }
    //akis bittiginde event ve cevap doner
    akisYaz.end(() => {
      eventBus.emit("reportGenerated", "film-exports.txt");
      yaziGonder(res, 200, "Rapor Olusturuldu: reports/films-exports.txt");
    });
    //akis hatasi olursa
    akisYaz.on("error", (err) => {
      jsonGonder(res, 500, { hata: "Rapor Yazilamadi", detay: err.mesaj });
    });
    return;
  }


 
const t404 = await templateOku("404.html");
  const html404 = render(t404, { title: "404", content: "Sayfa bulunamadı." });
  htmlGonder(res, html404, 404);
});

server.listen(3000, () => {
  console.log("Server 3000 portunda calisiyor");
});

/*// const data = require('./data/films.json')
// console.log(data);

// import { info, warn, error } from "./modules/logger.mjs";

// info("Server basladi");
// warn("Bu bir uyaridir");
// error("Bu bir hatadir");

// (async ()=>{
//     const {info,warn,error} = await import("./modules/logger.mjs");
//     info("Server basladi");
// warn("Bu bir uyaridir");
// error("Bu bir hatadir");

// })();

// const eventBus = require("./modules/eventBus");

// eventBus.emit("filmViewed", { title: "Inception" });
// eventBus.emit("filmAdded", { title: "The Matrix" });
// eventBus.emit("reportGenerated", "films-export.txt");*/
