const { Router } = require("express");
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const pokemon = require("./pokemon");
const types = require("./types");
const { Type } = require("../db.js");
const axios = require("axios");


const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
router.use("/pokemon", pokemon);
router.use('/types', types); 

//cargo los types a mi db
async function loadTypes(){
    let tiposApi = await axios.get("https://pokeapi.co/api/v2/type");
    tiposApi = tiposApi.data.results.filter((e) => e.name !== "unknown");
    tiposApi.forEach(async (tipo)=>{await Type.create({name: tipo.name})})
}
loadTypes()

module.exports = router;
