var BookInstance = require("../models/bookinstance");
var Book = require('../models/book');
var Genre = require("../models/genre");
var Author = require("../models/author");

var async = require('async');

const {body, validationResult} = require('express-validator');

//Mostramos todos los bookinstance

exports.bookinstance_list = function (req, res) {

  BookInstance.find()
  .populate('book')
  .exec(function(err, list_bookinstances){
    
    if (err) {return next(err);}
    res.render('bookinstance_list',{title: 'Book Instance List', bookinstance_list: list_bookinstances});

  });

};

//Mostrar detalles de un bookinstance especifico en una pagina

exports.bookinstance_detail = function (req, res) {
  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function(err, bookinstance){
    
    if (err) {return next(err);}
    if (bookinstance==null){
      var err = new Error('Book copy not found');
      err.status = 404;
      return next(err);
    }

    res.render('bookinstance_detail',{title: 'Copy:'+ bookinstance.book.title, bookinstance: bookinstance});

  });
};

//Formulario para crear bookinstancees con GET (DISPLAY)

exports.bookinstance_create_get = function (req, res) {
  Book.find({}, 'title')
  .exec(function(err, books){

    if (err) {return next(err);}

    res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
  })
};

//Manejador de create bookinstance con POST

exports.bookinstance_create_post = [
  body('book', 'Book must be specified.').trim().isLength({min: 1}).escape(),
  body('imprint', 'Imprint must be specified.').trim().isLength({min: 1}).escape(),
  body('status', 'Book must be specified.').escape(),
  body('due_back', 'Invalid date.').optional({checkFalsy: true}).isISO8601().toDate(),

  (req, res, next)=>{
    const errors = validationResult(req);

    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {

      Book.find({}, 'title')
      .exec(function(err, books){
        if (err) {return next(err);}

        res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, selected_books: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
      });
      return;
    }else{

      bookinstance.save(function(err){
        if (err) {return next(err);}

        res.redirect(bookinstance.url);
      });
    }

  }
  
];

//Formulario de delete para bookinstance GET (DISPLAY)

exports.bookinstance_delete_get = function(req, res, next) {

  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          res.redirect('/catalog/bookinstances');
      }
      // Successful, so render.
      res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance:  bookinstance});
  })

};
//Manejador de delete bookinstance con POST

exports.bookinstance_delete_post = function(req, res, next) {
    
  // Assume valid BookInstance id in field.
  BookInstance.findByIdAndRemove(req.body.id, function deleteBookInstance(err) {
      if (err) { return next(err); }
      // Success, so redirect to list of BookInstance items.
      res.redirect('/catalog/bookinstances');
      });

};

//Formulario de update para bookinstance GET (DISPLAY)

exports.bookinstance_update_get = function(req, res, next) {

  // Get book, authors and genres for form.
  async.parallel({
      bookinstance: function(callback) {
          BookInstance.findById(req.params.id).populate('book').exec(callback)
      },
      books: function(callback) {
          Book.find(callback)
      },

      }, function(err, results) {
          if (err) { return next(err); }
          if (results.bookinstance==null) { // No results.
              var err = new Error('Book copy not found');
              err.status = 404;
              return next(err);
          }
          // Success.
          res.render('bookinstance_form', { title: 'Update  BookInstance', book_list : results.books, selected_book : results.bookinstance.book._id, bookinstance:results.bookinstance });
      });

};

//Manejador de update bookinstance con POST

exports.bookinstance_update_post = [

  // Validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),
  
  
  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a BookInstance object with escaped/trimmed data and current id.
      var bookinstance = new BookInstance(
        { book: req.body.book,
          imprint: req.body.imprint,
          status: req.body.status,
          due_back: req.body.due_back,
          _id: req.params.id
         });

      if (!errors.isEmpty()) {
          // There are errors so render the form again, passing sanitized values and errors.
          Book.find({},'title')
              .exec(function (err, books) {
                  if (err) { return next(err); }
                  // Successful, so render.
                  res.render('bookinstance_form', { title: 'Update BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
          });
          return;
      }
      else {
          // Data from form is valid.
          BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,thebookinstance) {
              if (err) { return next(err); }
                 // Successful - redirect to detail page.
                 res.redirect(thebookinstance.url);
              });
      }
  }
]