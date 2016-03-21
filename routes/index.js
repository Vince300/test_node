var express = require('express');
var router = express.Router();

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
            id: 'breakfast',
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
    console.log(req.body);
    res.send('not yet implemented');
});

module.exports = router;