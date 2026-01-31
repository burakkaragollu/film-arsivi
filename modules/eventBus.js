const EventEmitter = require("node:events");

const myEvents = new EventEmitter();

let loglar = null;

async function logGetir() {
  if (!loglar) {
    loglar = await import("./logger.mjs");
  }
  return loglar;
}


//callback function 
myEvents.on("filmViewed", async (film)=>{
    const {info} = await logGetir();
info(`EVENT: filmViewed - Film: ${film.title} `);
});

myEvents.on("filmAdded", async (film)=>{
    const {info} = await logGetir();
info(`EVENT: filmAdded - Film: ${film.title} `);
});

myEvents.on("filmViewed", async (film)=>{
    const {info} = await logGetir();
info(`EVENT: reportGenerated - File: ${film.title} `);
});

module.exports = myEvents;