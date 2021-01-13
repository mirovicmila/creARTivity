var express = require("express");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var neo4j = require("neo4j-driver");
const { type } = require("os");
var app = express(); //instanciranje express-a
var uuid = require("uuid");
var uniqid = require('uniqid'); //novi generator id-eva
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
//za inicijalizaciju ostalog
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); //za staticke fajlove, npr za css
var driver = neo4j.driver(
  "bolt://localhost",
  neo4j.auth.basic("neo4j", "tutifruti")
);
var session = driver.session();
app.get("/", function (req, res) {
  session
    .run("MATCH (n:Museum) RETURN n")
    .then(function (result) {
      var nizMuzeja = [];
      result.records.forEach(function (record) {
        //console.log(record._fields[0].properties.ticketPrice);
        nizMuzeja.push({
          //id: record._fields[0].identity.low,
          id: record._fields[0].properties.id,
          name: record._fields[0].properties.name,
          ticketPrice: record._fields[0].properties.ticketPrice,
          workingHours: record._fields[0].properties.workingHours,
          webLocation: record._fields[0].properties.webLocation,
          address: record._fields[0].properties.address,
          image: record._fields[0].properties.image,
        });
      });
      session.run("MATCH (n: Piece) RETURN n").then(function (result2) {
        var nizDela = [];
        result2.records.forEach(function (record) {
          nizDela.push({
            //id: record._fields[0].identity.low,
            id: record._fields[0].properties.id,
            name: record._fields[0].properties.name,
            type: record._fields[0].properties.type,
            author: record._fields[0].properties.author,
            image: record._fields[0].properties.image,
          });
        });
        
        res.render("index", {
          muzeji: nizMuzeja,
          dela: nizDela,
        });
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});
//ZA ADMINA
app.get("/admin", function (req, res) {
  session
    .run("MATCH (n:Museum) RETURN n")
    .then(function (result) {
      var nizMuzeja = [];
      result.records.forEach(function (record) {
        //console.log(record._fields[0].properties.ticketPrice);
        nizMuzeja.push({
          //id: record._fields[0].identity.low,
          id: record._fields[0].properties.id,
          name: record._fields[0].properties.name,
          ticketPrice: record._fields[0].properties.ticketPrice,
        });
      });
      session.run("MATCH (n: Piece) RETURN n").then(function (result2) {
        var nizDela = [];
        result2.records.forEach(function (record) {
          nizDela.push({
            //id: record._fields[0].identity.low,
            id: record._fields[0].properties.id,
            name: record._fields[0].properties.name,
            type: record._fields[0].properties.type,
            author: record._fields[0].properties.author,
            image: record._fields[0].properties.image,
          });
        });
        res.render("admin", {
          muzeji: nizMuzeja,
          dela: nizDela,
        });
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});
//dodavanje muzeja
app.post("/museum/add", function (req, res) {
  
  var name = req.body.name;
  var ticketPrice = req.body.ticketPrice;
  var type = req.body.type;
  var webLocation = req.body.webLocation;
  var workingHours = req.body.workingHours;
  var image = req.body.image;
  var address = req.body.address;
  var id= uuid.v4();
  session
    .run(
      "CREATE (n:Museum {id: $idParam, name: $nameParam, ticketPrice: $ticketPriceParam, type: $typeParam, webLocation: $webLocationParam, workingHours: $workingHoursParam, image: $imageParam, address: $addressParam}) RETURN n",
      {
        idParam: id,
        nameParam: name,
        ticketPriceParam: ticketPrice,
        typeParam: type,
        webLocationParam: webLocation,
        workingHoursParam: workingHours,
        imageParam: image,
        addressParam: address,
      }
    )
    .then(function (result) {
      res.redirect("/");
      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/museum/edit", function (req, res) {
  var id=req.body.id;
  console.log(id);
  var name = req.body.name;
  var ticketPrice = req.body.ticketPrice;
  var type = req.body.type;
  var webLocation = req.body.webLocation;
  var workingHours = req.body.workingHours;
  var image = req.body.image;
  var address = req.body.address;
  session
    .run(
      "MATCH (n:Museum) WHERE n.id=$idParam SET n.name=$nameParam, n.ticketPrice=$ticketPriceParam, n.type=$typeParam, n.webLocation= $webLocationParam, n.workingHours=$workingHoursParam, n.image=$imageParam, n.address=$addressParam RETURN n",
      {
        idParam: id,
        nameParam: name,
        ticketPriceParam: ticketPrice,
        typeParam: type,
        webLocationParam: webLocation,
        workingHoursParam: workingHours,
        imageParam: image,
        addressParam: address,
      }
    )
    .then(function (result) {

      res.redirect("/");
      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
});

//vraca muzej
app.get("/museum/:id", function (req, res) {
  var id = req.params.id;
  console.log(id);
  //var noviid=uniqid();
  //console.log(noviid);
  session
    .run(
      "MATCH (m:Museum) WHERE m.id= $idParam RETURN m.name as name, m.type as type, m.ticketPrice as ticketPrice, m.workingHours as workingHours, m.webLocation as webLocation, m.image as image, m.address as address",
      { idParam: id }
    )
    .then(function (result) {
      var name = result.records[0].get("name");
      console.log(name);
      var type = result.records[0].get("type");
      console.log(type);
      var ticketPrice = result.records[0].get("ticketPrice");
      console.log(ticketPrice);
      var workingHours = result.records[0].get("workingHours");
      console.log(workingHours);
      var webLocation = result.records[0].get("webLocation");
      console.log(webLocation);
      var image = result.records[0].get("image");
      var address = result.records[0].get("address");
      console.log(image);

      session
        .run(
          "OPTIONAL MATCH (p: Piece) - [pripada: IS_LOCATED_IN]-> (m:Museum) WHERE m.id= $idParam return p",
          { idParam: id }
        )
        .then(function (result2) {
          var nizDelaUMuzeju = [];
          result2.records.forEach(function (record) {
            if (record._fields[0] != null) {
              nizDelaUMuzeju.push({
                //id: record._fields[0].identity.low,
                id: record._fields[0].properties.id,
                name: record._fields[0].properties.name,
                type: record._fields[0].properties.type,
                author: record._fields[0].properties.author,
                image: record._fields[0].properties.image,
              }); //zagrade za .push
            } //zagrada za null proveru
          }); //zagrade za forEach
          session
            .run(
              "OPTIONAL MATCH (m1: Museum) - [je_udaljen: IS_AWAY_FROM]-> (m2:Museum) WHERE m1.id= $idParam AND toInteger(je_udaljen.distance)<1000 return m2",
              { idParam: id }
            )
            .then(function (result3) {
              var nizBliskihMuzeja = [];
              result3.records.forEach(function (record) {
                if (record._fields[0] != null) {
                  nizBliskihMuzeja.push({
                    //id: record._fields[0].identity.low,
                    id: record._fields[0].properties.id,
                    name: record._fields[0].properties.name,
                  }); //zagrade za .push
                } //zagrada za null proveru
              });
              session
            .run(
              "OPTIONAL MATCH (m: Museum) WHERE m.ticketPrice<10 return m",
              { idParam: id }
            )
            .then(function (result4) {
              var nizJeftinihMuzeja = [];
              result4.records.forEach(function (record) {
                if (record._fields[0] != null) {
                  nizJeftinihMuzeja.push({
                    //id: record._fields[0].identity.low,
                    id: record._fields[0].properties.id,
                    name: record._fields[0].properties.name,
                  }); //zagrade za .push
                } //zagrada za null proveru
              });
              res.render("museum", {
                id: id,
                name: name,
                type: type,
                webLocation: webLocation,
                workingHours: workingHours,
                ticketPrice: ticketPrice,
                image: image,
                address: address,
                nizDela: nizDelaUMuzeju,
                nizBliskih: nizBliskihMuzeja,
              }); //zagrade za render
            }); //zagrade za then sa result3
        }) //zagrade za then sa result2
        .catch(function (error) {
          console.log(error);
        });
    }); //zagrade za then sa result1
});
});
//delete museum

//dodavanje dela
app.post("/piece/add", function (req, res) {

  //var id=req.body.id;
  var name = req.body.name;
  console.log(name);
  var type = req.body.type;
  var author = req.body.author;
  var description = req.body.description;
  var link = req.body.link;
  var image = req.body.image;
  var id= uuid.v4();
  session
    .run(
      "CREATE (n:Piece { id: $idParam, name: $nameParam, type: $typeParam, author: $authorParam, description: $descriptionParam, link: $linkParam, image: $linkImage}) RETURN n",
      {
        idParam: id,
        nameParam: name,
        typeParam: type,
        authorParam: author,
        descriptionParam: description,
        linkParam: link,
        linkImage: image,
      }
    )
    .then(function (result) {
      res.redirect("/");
      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
});
//vraca delo
app.get("/piece/:id", function (req, res) {
  var id = req.params.id;
  console.log("id: ", id);
  session
    .run(
      "MATCH (p:Piece)  WHERE p.id= $idParam RETURN p.name as name, p.type as type, p.author as author, p.description as desription, p.link as link, p.image as image",
      { idParam: id }
    )
    .then(function (result) {
      var name = result.records[0].get("name");
      console.log(name);
      var type = result.records[0].get("type");
      console.log(type);
      var author = result.records[0].get("author");
      console.log(author);
      var description = result.records[0].get("desription");
      console.log(description);
      var link = result.records[0].get("link");
      console.log(link);
      var image = result.records[0].get("image");
      //var name = req.body.name;
      //var name = req.body.name;
      res.render("piece", {
        id: id,
        name: name,
        type: type,
        author: author,
        description: description,
        link: link,
        image: image,
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});
//edit dela
app.post("/piece/edit", function (req, res) {

  var id=req.body.id;
  var name = req.body.name;
  console.log(name);
  var type = req.body.type;
  console.log(type);
  var author = req.body.author;
  var description = req.body.description;
  var link = req.body.link;
  var image = req.body.image;
  session
    .run(
      "MATCH (p:Piece) WHERE p.id=$idParam SET p.name= $nameParam, p.type= $typeParam, p.author=$authorParam, p.description=$descriptionParam, p.link=$linkParam, p.image=$imageParam ",
      {
        idParam: id,
        nameParam: name,
        typeParam: type,
        authorParam: author,
        descriptionParam: description,
        linkParam: link,
        imageParam: image,
      }
    )
    .then(function (result) {

      res.redirect("/");
      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
});
//delete dela
app.delete("/piece/:id", function(req,res){
  
   console.log("delete..........");
   var id=req.params.id;
   console.log("id: ",id);
   session
    .run(
      "MATCH (p:Piece) WHERE p.id= $idParam DELETE p",
      {
        idParam:id,
      }
    )
    .then(function (result) {
     
      res.redirect("/");
      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
  
});
//dodavanje izlozbe
app.post("/exhibit/add", function (req, res) {

  var id = req.params.id;
  console.log(id);
  var name = req.body.name;
  console.log(name);
  var duration = req.body.duration;
  var description = req.body.description;
  var image= req.body.image;
  session
    .run(
      "CREATE (e:Exhibit {name: $nameParam, duration: $durationParam, description: $descriptionParam, image: $imageParam}) RETURN e",
      {
        nameParam: name,
        durationParam:duration,
        descriptionParam: description,
        imageParam: image,
      }
    )
    .then(function (result) {
      
      res.redirect("/");
      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
});

//povezivanje muzeja i dela
app.post("/museumpiece/connect", function (req, res) {
  var nameM = req.body.nameM;
  var nameP = req.body.nameP;
  var id = req.body.id;

  session
    .run(
      "MATCH (m: Museum {name: $nameParam1}), (p: Piece {name: $nameParam2}) MERGE (p)-[pripada: IS_LOCATED_IN]->(m) RETURN m,p",
      {
        nameParam1: nameM,
        nameParam2: nameP,
      }
    )
    .then(function (result) {
      if (id && id != null) {
        res.redirect("/museum/" + id);
      } else {
        res.redirect("/");
      }

      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
});
//povezivanje muzeja i izlozbe
app.post("/museumexhibit/connect", function (req, res) {
  var nameM = req.body.nameM;
  var nameE = req.body.nameE;
  var id = req.body.id;

  session
    .run(
      "MATCH (m: Museum {name: $nameParam1}), (e: Exhibit {name: $nameParam2}) MERGE (e)-[je_izlozena: IS_CURRENTLY_DISPLAYED_IN]->(m) RETURN m,e",
      {
        nameParam1: nameM,
        nameParam2: nameE,
      }
    )
    .then(function (result) {
      if (id && id != null) {
        res.redirect("/museum/" + id);
      } else {
        res.redirect("/");
      }

      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
});
//povezivanje dva muzeja
app.post("/museumtomuseum/connectmuseums", function (req, res) {
  var name1 = req.body.name1;
  var name2 = req.body.name2;
  var distance = req.body.distance;

  session
    .run(
      "MATCH (m1: Museum {name: $name1}), (m2: Museum {name: $name2}) MERGE (m1)-[daljina: IS_AWAY_FROM {distance: $distance}]-(m2)  RETURN m1,m2",
      {
        name1: name1,
        name2: name2,
        distance: distance,
      }
    )
    .then(function (result) {
      res.redirect("/");
      //session.close();
    })
    .catch(function (error) {
      console.log(error);
    });
});


//vraca izlozbu
app.get("/exhibit/:id", function (req, res) {
  var id = req.params.id;
  session
    .run(
      "MATCH (e:Exhibit) WHERE id(e)=toInteger($idParam) RETURN e.name as name, e.duration as duration, e.description as description, e.image as image",
      { idParam: id }
    )
    .then(function (result) {
      //console.log(result);
      var name = result.records[0].get("name");
      var duration = result.records[0].get("duration");
      var description = result.records[0].get("description");
      var image= result.records[0].get("image");
      res.render("exhibit", {
        id: id,
        name: name,
        duration: duration,
        description: description,
        image: image
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.listen(8080); //kazemo na kojem portu cemo da slusamo
console.log("Server pokrenut na portu 8080");
module.exports = app;
