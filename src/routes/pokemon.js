const { Router } = require("express");
const router = Router();
const axios = require("axios");
const { Pokemon, Type } = require("../db");
const { Op } = require("sequelize");

const idSearchApi = async (id) => {
  try {
    const poke = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    return {
      id: poke.data.id,
      name: poke.data.name,
      life: poke.data.stats[0].base_stat,
      attack: poke.data.stats[1].base_stat,
      defense: poke.data.stats[2].base_stat,
      speed: poke.data.stats[5].base_stat,
      height: poke.data.height,
      weight: poke.data.weight,
      types: poke.data.types.map((pt) => pt.type),
      image: poke.data.sprites.other.home.front_default,
    };
  } catch (e) {
    console.log(e);
    return false;
  }
};

const idSearchDB = async (id) => {
  try {
    const poke = await Pokemon.findByPk(id, {
      include: {
        model: Type,
        attributes: ["name"],
        through: {
          attributes: [],
        },
      },
    });
    return poke;
  } catch {
    return undefined;
  }
};

const idSearch = async (id) => {
  const api = idSearchApi(id);
  const db = idSearchDB(id);

  const [apiPoke, dbPoke] = await Promise.all([api, db]);
  return apiPoke || dbPoke;
};

router.get("/", async (req, res, next) => {
  const { name } = req.query;
  console.log(req.query);
  try {
    if (!name) {
      let apiPoke = await axios.get(
        "https://pokeapi.co/api/v2/pokemon?limit=40&offset=0"
      );
      let urlPoke = apiPoke.data.results?.map((e) => axios.get(e.url));

      let pokeApiUrl = await axios.all(urlPoke);

      let pokemonApi = pokeApiUrl.map((e) => {
        let obj = {};
        obj = {
          id: e.data.id,
          name: e.data.name.charAt(0).toUpperCase() + e.data.name.slice(1),
          attack: e.data.stats[1].base_stat,
          image: e.data.sprites.front_default,
          createInDb: false,
          types:
            e.data.types.length > 0
              ? e.data.types.map((obj) => obj.type.name)
              : [],
        };
        return obj;
      });

      
      let pokemonDb = await Pokemon.findAll({
        include: { model: Type, attributes: ["name"] },
      });
      console.log(pokemonDb);

      let pokemonBasDat = pokemonDb.map((e) => {
        let obj = {
          id: e.id,
          name: e.name.charAt(0).toUpperCase() + e.name.slice(1),
          attack: e.attack,
          image: e.image,
          createInDb: e.createInDb,
          types: e.types?.map((obj) => obj.name),
        };
        return obj;
      });
      return res.json([...pokemonApi, ...pokemonBasDat]);
    } else {
      console.log('Holi entramo')
      let pokeDb = await Pokemon.findAll({
        where: { name: { [Op.like]: `${name}` } },
        include: { model: Type, attributes: ["name"] },
      });
      let pokemonDb = pokeDb.map((e) => {
        let obj = {
          id: e.id,
          name: e.name.charAt(0).toUpperCase() + e.name.slice(1).toLowerCase(),
          image: e.image,
          createInDb: e.createInDb,
          types: e.types.map((obj) => obj.name),
        };
        return obj;
      });
      if (pokemonDb.length > 0) {
        return res.json(pokemonDb);
      }

      let resApi = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`
      );
      let pokeEncontrado = {
        id: resApi.data.id,
        name:
          resApi.data.name.charAt(0).toUpperCase() + resApi.data.name.slice(1),
        image: resApi.data.sprites.front_default,
        createInDb: false,
        types:
          resApi.data.types.length > 0
            ? resApi.data.types.map((obj) => obj.type.name)
            : [],
          };
      if (pokeEncontrado) {
        return res.json([pokeEncontrado]);
      } else {
        return next({ message: "Pokemon no encontrado", status: 400 });
      }
    }
  } catch (e) {
    res.status(500).json({ message: "Error interno del servidor" });
    console.log(e);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const idDetails = await idSearch(id);
    if (!idDetails) {
      return res.status(404).send("No hay ningun pokemon con ese ID");
    }
    res.status(200).json(idDetails);
  } catch (err) {
    console.log(err);
  }
});

router.post("/", async (req, res) => {
  let = { name, life, attack, defense, speed, height, weight, types, image } = req.body;
  console.log(req.body);
  try {
    let nuevopoke = await Pokemon.create({
      name,
      life,
      attack,
      defense,
      speed,
      height,
      weight,
      image,
      types,
    });

    let typesDb = await Type.findAll({ where: { name: types } });
    console.log(typesDb);
    nuevopoke.addTypes(typesDb);
    res.send("Personaje creado");
  } catch (e) {
    console.log(e);
    res.send({msg: e.message});
  }
});

module.exports = router;
