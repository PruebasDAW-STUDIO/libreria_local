var Author = require("../models/author");
var Book = require("../models/book")
var async = require("async")
const {body, validationResult} = require('express-validator');

//Mostramos todos los autores

exports.author_list = function (req, res, next) {

  Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function(err, list_authors){

      if (err) {return next(err);}

      res.render('author_list', {title: 'Author List', author_list: list_authors});
    })
};

//Mostrar detalles de un autor especifico en una pagina

exports.author_detail = function (req, res) {
  async.parallel({

    author: function(callback){

      Author.findById(req.params.id)
        .exec(callback);
    },

    authors_books: function(callback){

      Book.find({'author': req.params.id}, 'title summary')
        .exec(callback);

    },
  }, function(err, results){

    if (err) {return next(err)}
    if (results.author==null) {

      var err = new Error('Author not found');
      err.status = 404;
      return next(err);

    }

    res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.authors_books});

  });
};

//Formulario para crear autores con GET (DISPLAY)

exports.author_create_get = function (req, res, next) {

  res.render('author_form', {title: 'Create Author'});
  
};

//Manejador de create Autor con POST

exports.author_create_post = [

  // VALIDACIÓN Y SANEAMIENTO DE LOS DATOS
  //Podemos conectar validadores en cadena, utilizando para especificar el mensaje de error que se mostrará si el método de validación anterior falla
  body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
      .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
      .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),

  /*Podemos utilizar la función para ejecutar una validación posterior solo si se ha introducido un campo (esto nos permite validar campos opcionales). Por ejemplo, a continuación comprobamos que la fecha de nacimiento opcional es una fecha compatible con ISO8601 (el indicador significa que aceptaremos una cadena vacía o como un valor vacío). optional()checkFalsynull
  Los parámetros se reciben de la solicitud como cadenas. Podemos usar (o ) para convertirlos a los tipos de JavaScript adecuados (como se muestra al final de la cadena de validadores anterior).toDate()
  */
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

  // PROCESAMOS LA PETICION DESPUES DE VALIDAR Y LIMPIAR LOS DATOS
  (req, res, next) => {

      // EXTRAEMOS LOS ERRORES DE VALIDACION DE LA PETICION
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
          // HAY ERRORES. RENDERIZAMOS LA VISTA DE NUEVO CON LOS ERRORES REMARCADOS
          res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
          return;
      }
      else {
          // LO DATOS DEL FORMULARIO SON VALIDOS.
          //EN ESTE CASO N COMPROBAMOS SI EXISTE EL AUTHOR COMO HICIMOS CON EL GENRE

          // CREAMOS EL AUTHOR CON LOS DATOS VALIDADOS Y SANEADOS
          var author = new Author(
              {
                  first_name: req.body.first_name,
                  family_name: req.body.family_name,
                  date_of_birth: req.body.date_of_birth,
                  date_of_death: req.body.date_of_death
              });
          author.save(function (err) {
              if (err) { return next(err); }
              // SUCCESSFUL - REDIRECCIONAMOS A LA PAGINA DEL NUEVO AUTHOR CREADO
              res.redirect(author.url);
          });
      }
  }
];

//Formulario de delete para autor GET (DISPLAY)

exports.author_delete_get = function (req, res) {

  async.parallel({

    author: function(callback){
      Author.findById(req.params.id).exec(callback);
    },

    author_books: function(callback){
      Book.find({'author': req.params.id}).exec(callback);
    }
  }, function(err, results){

    if (err) {return next(err);}
    if (results == null) {
      res.redirect('catalog/authors');
    }
    
    res.render('author_delete', {title: 'Delete author', author: results.author, author_books: results.author_books});

  });
};

//Manejador de delete Autor con POST

exports.author_delete_post = function (req, res, next) {
  async.parallel({

    author: function(callback){
      Author.findById(req.body.authorid).exec(callback);
    },

    author_books: function(callback){
      Book.find({'author': req.body.authorid}).exec(callback);
    }
  }, function(err, results){
    if (err) {return next(err);}
    //SI EL AUTHOR TIENE LIBROS NO LO PODEMOS BORRAR
    if (results.author_books.length > 0){
      res.render('author_delete', {title: 'Delete author', author: results.author, author_books: results.author_books});
      return;
    }else{
      //NO TIENE LIBROS LO PODEMOS BORRAR SIN  NINGÚN PROBLEMA
      Author.findByIdAndDelete(req.body.authorid, function deleteAuthor(err){
        if (err) {return next(err);}

        res.redirect('/catalog/authors');
      })
    }
  });
};

//Formulario de update para autor GET (DISPLAY)

exports.author_update_get = function (req, res, next) {

  Author.findById(req.params.id, function (err, author) {
      if (err) { return next(err); }
      if (author == null) { // No results.
          var err = new Error('Author not found');
          err.status = 404;
          return next(err);
      }
      // Success.
      res.render('author_form', { title: 'Update Author', author: author });

  });
};

//Manejador de update Autor con POST

exports.author_update_post = [

  // Validate and santize fields.
  body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
      .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
      .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),


  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create Author object with escaped and trimmed data (and the old id!)
      var author = new Author(
          {
              first_name: req.body.first_name,
              family_name: req.body.family_name,
              date_of_birth: req.body.date_of_birth,
              date_of_death: req.body.date_of_death,
              _id: req.params.id
          }
      );

      if (!errors.isEmpty()) {
          // There are errors. Render the form again with sanitized values and error messages.
          res.render('author_form', { title: 'Update Author', author: author, errors: errors.array() });
          return;
      }
      else {
          // Data from form is valid. Update the record.
          Author.findByIdAndUpdate(req.params.id, author, {}, function (err, theauthor) {
              if (err) { return next(err); }
              // Successful - redirect to genre detail page.
              res.redirect(theauthor.url);
          });
      }
  }
];
