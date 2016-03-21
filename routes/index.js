var express = require('express');
var router = express.Router();
var csv = require('fast-csv');
var validator = require('validator');

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
            console.log("Value " + k + " missing");
            err.push(form_validators[k][0]);
        } else {
            req.body[k] = form_validators[k][1](req.body[k]);
            console.log("Sanitized value " + k + " to '" + req.body[k] + "'");
            if (!form_validators[k][2](req.body[k])) {
                console.log("It then did not pass validation");
                err.push(form_validators[k][0]);
            } else {
                console.log("It then passed validation");
            }
        }
    }
    
    // Find correct delimiter
    var delimiter = ',';
    if (req.body['mode'] === 'excel') {
        delimiter = ';';
    } else if (req.body['mode'] !== 'normal') {
        err.push("Mode " + req.body['mode'] + " inconnu");
    }
    
    // Write CSV using form parameters
    if (err.length == 0) {
        res.setHeader('content-type', 'text/csv');
        res.setHeader('content-disposition', 'attachment; filename="inscription.csv"');
        
        // Fixed data
        var data = [
            ['Nom complet', req.body['first-name'] + ' ' + req.body['last-name'].toUpperCase()],
            ['Age', req.body['age']]];
        
        // Append prefered meal data
        for (var m in form_options.meals) {
            // The actual item m
            m = form_options.meals[m];
            // Find the id of the corresponding input
            var id = 'meal-' + m.id;
            // Get the full string for this value
            data.push([m.name, m.options[req.body[id]]]);
        }
        
        // Write output CSV
        csv.write(data, { headers: true, delimiter: delimiter }).pipe(res);
    } else {
        // Render error page
        res.render('register_error', { title: 'Test Node.js', errors: err });
    }
});

module.exports = router;