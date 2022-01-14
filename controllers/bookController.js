var Book = require("../models/book");
var Author = require("../models/author");
var BookInstance = require("../models/bookinstance");
var Genre = require("../models/genre");

var async = require('async');
const { body,validationResult } = require("express-validator");

exports.index = function (req, res) {

  async.parallel({

    book_count: function(callback){

      Book.countDocuments({},callback);

    },
    book_instance_count: function(callback){

      BookInstance.countDocuments({}, callback);
    },

    book_instance_available_count:function(callback){

      BookInstance.countDocuments({status: 'Available'}, callback);
    },

    author_count:function(callback){

      Author.countDocuments({}, callback);
    },

    genre_count:function(callback){

      Genre.countDocuments({}, callback);
    }  
  }, function(err, results){

    res.render('index', {title: 'Local Librery Home', error: err, data:results});

  });
};

//Mostramos todos los book

exports.book_list = function (req, res, next) {

  Book.find({}, 'title author')
    .sort({title: 1})
    .populate('author')
    .exec(function(err, list_books){
      if (err) {return next(err);}

      res.render('book_list',{title: 'Book List', book_list: list_books});

    });

};

//Mostrar detalles de un book especifico en una pagina

exports.book_detail = function (req, res) {
  
  async.parallel({

    book: function(callback){

      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },

    book_instance: function(callback){

      BookInstance.find({'book': req.params.id})
        .exec(callback);

    },
  }, function(err, results){

    if (err) {return next(err)}
    if (results.book==null) {

      var err = new Error('Book not found');
      err.status = 404;
      return next(err);

    }

    res.render('book_detail', {title: 'Book Detail', book: results.book, book_instances: results.book_instance});

  });

};

//Formulario para crear bookes con GET (DISPLAY)

exports.book_create_get = function (req, res) {
    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
      authors: function(callback) {
          Author.find(callback);
      },
      genres: function(callback) {
          Genre.find(callback);
      },
  }, function(err, results) {
      if (err) { return next(err); }
      res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres });
  });
};

//Manejador de create book con POST

exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
      if(!(req.body.genre instanceof Array)){
          if(typeof req.body.genre==='undefined')
          req.body.genre=[];
          else
          req.body.genre=new Array(req.body.genre);
      }
      next();
  },

  // Validate and sanitize fields.
  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
      

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped and trimmed data.
      var book = new Book(
        { title: req.body.title,
          author: req.body.author,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: req.body.genre
         });

      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.

          // Get all authors and genres for form.
          async.parallel({
              authors: function(callback) {
                  Author.find(callback);
              },
              genres: function(callback) {
                  Genre.find(callback);
              },
          }, function(err, results) {
              if (err) { return next(err); }

              // Mark our selected genres as checked.
              for (let i = 0; i < results.genres.length; i++) {
                  if (book.genre.indexOf(results.genres[i]._id) > -1) {
                      results.genres[i].checked='true';
                  }
              }
              res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
          });
          return;
      }
      else {
          // Data from form is valid. Save book.
          book.save(function (err) {
              if (err) { return next(err); }
                 // Successful - redirect to new book record.
                 res.redirect(book.url);
              });
      }
  }
];

//Formulario de delete para book GET (DISPLAY)

exports.book_delete_get = function(req, res, next) {

  async.parallel({
      book: function(callback) {
          Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
      },
      book_bookinstances: function(callback) {
          BookInstance.find({ 'book': req.params.id }).exec(callback);
      },
  }, function(err, results) {
      if (err) { return next(err); }
      if (results.book==null) { // No results.
          res.redirect('/catalog/books');
      }
      // Successful, so render.
      res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_bookinstances } );
  });

};

//Manejador de delete book con POST

exports.book_delete_post = function(req, res, next) {

  // Assume the post has valid id (ie no validation/sanitization).

  async.parallel({
      book: function(callback) {
          Book.findById(req.body.id).populate('author').populate('genre').exec(callback);
      },
      book_bookinstances: function(callback) {
          BookInstance.find({ 'book': req.body.id }).exec(callback);
      },
  }, function(err, results) {
      if (err) { return next(err); }
      // Success
      if (results.book_bookinstances.length > 0) {
          // Book has book_instances. Render in same way as for GET route.
          res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_bookinstances } );
          return;
      }
      else {
          // Book has no BookInstance objects. Delete object and redirect to the list of books.
          Book.findByIdAndRemove(req.body.id, function deleteBook(err) {
              if (err) { return next(err); }
              // Success - got to books list.
              res.redirect('/catalog/books');
          });

      }
  });

};

//Formulario de update para book GET (DISPLAY)

exports.book_update_get = function (req, res) {

  async.parallel({

    book: function(callback){
      Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
    },

    authors: function(callback){
      Author.find(callback);
    },

    genres: function(callback){
      Genre.find(callback);
    },
  }, function(err, results){
    if (err) {return next(err);}

    if (results.book ==null) {
      var err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }

    for (var all_gen = 0; all_gen < results.genres.length; all_gen++){
      for (var book_gen = 0; book_gen < results.book.genre.length;book_gen++){

        if (results.genres[all_gen]._id.toString()===results.book.genre[book_gen]._id.toString()){

          results.genres[all_gen].checked='true';

        }
      }
    }
    res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book});
  });
};

//Manejador de update book con POST

exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
      if(!(req.body.genre instanceof Array)){
          if(typeof req.body.genre==='undefined')
          req.body.genre=[];
          else
          req.body.genre=new Array(req.body.genre);
      }
      next();
  },

  // Validate and sanitize fields.
  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
      

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped and trimmed data.
      var book = new Book(
        { title: req.body.title,
          author: req.body.author,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
          _id: req.params.id
         });

      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.

          // Get all authors and genres for form.
          async.parallel({
              authors: function(callback) {
                  Author.find(callback);
              },
              genres: function(callback) {
                  Genre.find(callback);
              },
          }, function(err, results) {
              if (err) { return next(err); }

              // Mark our selected genres as checked.
              for (let i = 0; i < results.genres.length; i++) {
                  if (book.genre.indexOf(results.genres[i]._id) > -1) {
                      results.genres[i].checked='true';
                  }
              }
              res.render('book_form', { title: 'Update Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
          });
          return;
      }
      else {
          // Data from form is valid. Save book.
          Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
              if (err) { return next(err); }
                 // Successful - redirect to new book record.
                 res.redirect(thebook.url);
              });
      }
  }
];
