//Dosya islemleri (CommonJS)
const fs = require("node:fs/promises");
const path = require("node:path");

const filmYolu = path.join(__dirname, "../data/films.json");
const KategoriYolu = path.join(__dirname, "../data/categories.json");

//async - await  {dosya okunmadan asagi gecmez} -- Dosya okuma json
async function okuJSON(filmYolu) {
  const yazi = await fs.readFile(filmYolu, "utf-8");
  return JSON.parse(yazi);
}

//Ayni sekilde dosya yazma
async function yazJSON(filmYolu, data) {
  try {
    const yazi = JSON.stringify(data, null, 2);
    await fs.writeFile(filmYolu, yazi, "utf-8");
  } catch (err) {
    console.log("Dosya Yazma Hatası:", err.message);
  }
}

//route lari olustur
//oku json film dosyasi
async function getirFilm(params) {
  const data = await okuJSON(filmYolu);
  return data.films;
}

async function getirFilmId(id) {
  const films = await getirFilm();
  return films.find((ff) => ff.id === Number(id)); //id den filmi bulur
}

//kategri oku
async function getirkategori() {
  return await okuJSON(KategoriYolu);
}

async function getFilmsByCategory(name) {
  const films = await getirFilm();
  const normalized = String(name).toLowerCase();
  return films.filter((f) => String(f.category).toLowerCase() === normalized);
}

//istatistik getir
async function getirIstatistik(params) {
  const films = await getirFilm();

  const toplamFilm = films.length;
  const izlenenFilm = films.filter((f) => f.watched).length;

  const ortalamaPuan =
    toplamFilm === 0
      ? 0
      : Number(
          (
            films.reduce((sum, f) => sum + (f.rating || 0), 0) / toplamFilm
          ).toFixed(1),
        );

  const kategoriler = {};
  for (const film of films) {
    const anahtar = String(film.category || "unkown").toLowerCase();
    kategoriler[anahtar] = (kategoriler[anahtar] || 0) + 1;
  }

  return {
    toplamFilm,
    izlenenFilm,
    ortalamaPuan,
    kategoriler,
  };
}

module.exports = {
  okuJSON,
  yazJSON,
  getirFilm,
  getirFilmId,
  getirkategori,
  getFilmsByCategory,
  getirIstatistik,
};
