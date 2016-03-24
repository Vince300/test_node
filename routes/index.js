var express = require('express');
var router = express.Router();
var xlsx = require('xlsx-stream');
var validator = require('validator');

// In-memory sqlite3
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('data.db');

// List of options for the register form fields
var form_options = {
    age_ranges: ['18-25', '25-35', '35-60', '60+'],
    meals: [
        {
            id: 'breakfast',
            name: 'Petit-déjeuner',
            options: ['Croissants', 'Pains au chocolat']
        },
        {
            id: 'lunch',
            name: 'Déjeuner',
            options: ['Viande', 'Poisson']
        },
        {
            id: 'supper',
            name: 'Dîner',
            options: ['Fondue', 'Raclette']
        }
    ]
};

// Create the database with the right schema

// The INSERT request string and prepared statement
var insertRqString = "INSERT INTO users VALUES(?, ?, ?", insertRq;

// The list of headers for the export
var exportHeaders = ['Nom', 'Prénom', 'Age'];

var st = "CREATE TABLE IF NOT EXISTS users (first_name VARCHAR(60), last_name VARCHAR(60), age VARCHAR(16)";
for (var mi in form_options.meals) {
    var m = form_options.meals[mi];
    st += ", pref_" + m.id + " VARCHAR(60)";
    insertRqString += ", ?";
    exportHeaders.push(m.name + " préféré");
}
st += ")";
insertRqString += ")";

db.run(st, function (err, data) {
    if (err !== null) {
        console.log("SQLite error: " + err);
    } else {
        insertRq = db.prepare(insertRqString);
    }
});


// Form validation data structure, based on form_options
// This is a list of fields that must pass some validation function, and that are required
//  - element 0 is an error message
//  - element 1 is a sanitizer function
//  - element 2 is a validation function that returns true if the value is valid
var form_validators = {
    'first-name': ['Vous devez entrer un prénom.', function (x) { return validator.trim(x); }, function (x) { return x !== null && x !== ""; }],
    'last-name': ['Vous devez entrer un nom.', function (x) { return validator.trim(x); }, function (x) { return x !== null && x !== ""; }],
    'age': ['Votre age doit être dans la liste de tranches d\'age.', function (x) { return x; }, function (x) { return validator.isIn(x, form_options.age_ranges); }]
};

// Build validation parameters for the meals
for (var i in form_options.meals) {
    var m = form_options.meals[i];
    
    // Build the validator
    form_validators['meal-' + m.id] = [
        'Vous devez spécifier votre ' + m.name.toLowerCase() + ' préféré.',
        parseInt,
        function (x) {
            return x !== NaN && x >= 0 && x < m.options.length;
        }
    ];
}

/* GET home page. */
router.get('/', function (req, res) {
    // Page-specific options
    var options = { title: 'Test Node.js' };
    // Extend with the form data
    for (var k in form_options) options[k] = form_options[k];
    // Render the correct template
    res.render('index', options);
});

/* POST register. */
router.post('/register', function (req, res) {
    // The list of error messages
    var err = [];
    
    // Execute the validation process described above
    for (var k in form_validators) {
        if (req.body[k] === null) {
            err.push(form_validators[k][0]);
        } else {
            req.body[k] = form_validators[k][1](req.body[k]);
            if (!form_validators[k][2](req.body[k])) {
                err.push(form_validators[k][0]);
            }
        }
    }
    
    // Insert into database and redirect
    if (err.length == 0) {
        // Fixed data
        var data = [req.body['first-name'], req.body['last-name'], req.body['age']];
        
        // Append prefered meal data
        for (var m in form_options.meals) {
            // The actual item m
            m = form_options.meals[m];
            // Find the id of the corresponding input
            var id = 'meal-' + m.id;
            // Get the full string for this value
            data.push(m.options[req.body[id]]);
        }
        
        // Insert into database, redirect on success or failure
        insertRq.run(data, function(err, ra) {
            if (err === null) {
                res.redirect('/export');
            } else {
                res.render('register_error', { title: 'Test Node.js', errors: err });
            }
        });
    } else {
        // Render error page
        res.render('register_error', { title: 'Test Node.js', errors: err });
    }
});

/* GET export */
router.get('/export', function (req, res) {
    // Create XLSX document
    var wb = xlsx();
        
    // Redirect workbook data to the response stream
    res.setHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('content-disposition', 'attachment; filename="inscription.xlsx"');
    res.setHeader('content-transfer-encoding', 'binary');
    wb.pipe(res);
    
    // Fetch data from the users table
    db.all('SELECT * FROM users', function(err, rows) {
        if (err) {
            // On error output a XLSX with the error message
            wb.write(['Erreur', err]);
        } else {
            // Write headers
            wb.write(exportHeaders);
            
            // Output all the rows
            for (var i = 0; i < rows.length; ++i) {
                console.log(rows[i]);
                var dr = [];

                for (var k in rows[i])
                    dr.push(rows[i][k]);

                wb.write(dr);
            }
        }

        wb.end();
    });
});

module.exports = router;