var express = require("express");
const nunjucks = require("nunjucks");
var app = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
const MongoClient = require("mongodb").MongoClient;
const MONGO_URL = "mongodb://localhost:27017/menu";
const dbdata = { db: "menu", colcat: "categorias", colplatos: "platos" };

app.get("/", (req, res) => {
  MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
    const dbo = db.db(dbdata.db);
    dbo
      .collection(dbdata.colcat)
      .find()
      .toArray((err, categorias) => {
        dbo
          .collection(dbdata.colplatos)
          .find()
          .toArray((err, platos) => {
            res.render("index.html", {
              categorias: categorias,
              platos: platos,
            });
          });
      });
  });
});
app.get("/platos/:id", (req, res) => {
  MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
    const dbo = db.db(dbdata.db);
    var id = parseInt(req.params.id);
    dbo.collection(dbdata.colplatos).findOne({ id: id }, function (err, data) {
      if (err) throw err;
      if (data) {
        res.render("platos.html", { data });
      } else {
        res.send("No encontrado");
      }
      db.close();
    });
  });
});
app.get("/categorias/:nombre", (req, res) => {
  MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
    const dbo = db.db(dbdata.db);
    dbo
      .collection(dbdata.colcat)
      .aggregate([
        {
          $lookup: {
            from: "platos",
            localField: "nombre",
            foreignField: "idCat",
            as: "datos_platos",
          },
        },
        { $unwind: "$datos_platos" },
        {
          $project: {
            _id: 0,
            categoria: 1,
            "datos_platos.plato": 1,
          },
        },
      ])
      .toArray(function (err, categ) {
        let array = [];
        for (let dato of categ) {
          if (req.params.nombre == dato.nombre) {
            var n = dato.categoria;
            var p = dato.datos_platos.plato;
            array.push(p);
          }
        }
        res.render("categorias.html", { nombre: n, platos: array });
      });
  });
});
app.all("/altacategorias", (req, res) => {
  if (req.body.nombre) {
    MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
      const dbo = db.db(dbdata.db);
      var d = new Date();
      var n = d.getTime();
      dbo.collection(dbdata.colcat).insertOne(
        {
          nombre: req.body.nombre,
          id: parseInt(n),
        },
        function (err, res) {
          db.close();
        }
      );
      res.render("altacategorias.html", {
        mensaje: "alta existosa amigo de " + req.body.nombre,
      });
    });
  } else {
    res.render("altacategorias.html");
  }
});
app.all("/altaplatos", (req, res) => {
  if (req.body.plato) {
    MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
      const dbo = db.db(dbdata.db);
      var d = new Date();
      var n = d.getTime();
      dbo.collection(dbdata.colplatos).insertOne(
        {
          id: parseInt(n),

          plato: req.body.plato,
          descripcion: req.body.descrip,
          imagen: req.body.imagen,
          idCat: req.body.categ,
        },
        function (err, res) {
          db.close();
        }
      );
      res.render("altaplatos.html", {
        mensaje: "alta existosa amigo" + req.body.plato,
      });
    });
  } else {
    res.render("altaplatos.html");
  }
});
app.listen(8080);
