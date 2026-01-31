const { getirFilm, getirFilmId, getirIstatistik } = require("./modules/fileManager");

(async () => {
  console.log(await getirFilm());
  console.log(await getirFilmId(2));
  console.log(await getirIstatistik());
})();