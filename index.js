const express = require('express');
const mysql = require('mysql2/promise');
const hbs = require('hbs');
const wax = require('wax-on');
const { date, eq } = require('handlebars-helpers')();
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set up view engine and layout
app.set('view engine', 'hbs');
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

// Register handlebars helpers
hbs.registerHelper('date', date);
hbs.registerHelper('eq', eq);

// Database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Handle database connection pool errors
pool.on('error', (err) => {
    console.error('Database connection pool error:', err);
});

// Function to validate age
function isValidAge(age) {
    const numAge = parseInt(age);
    return !isNaN(numAge) && numAge > 0;
}

// Reading and displaying all data records
app.get('/', async (req, res) => {
    try {
        const [pets] = await pool.execute('SELECT pets.pet_id, pets.pet_name, pets.age, owners.first_name, owners.last_name, pet_types.type_name FROM pets JOIN owners ON pets.owner_id = owners.owner_id JOIN pet_types ON pets.type_id = pet_types.type_id');
        res.render('index', { pets });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Search for data records given search terms
app.get('/search', async (req, res) => {
    const { pet_name, type_name } = req.query;
    try {
        let query = 'SELECT pets.pet_id, pets.pet_name, pets.age, owners.first_name, owners.last_name, pet_types.type_name FROM pets JOIN owners ON pets.owner_id = owners.owner_id JOIN pet_types ON pets.type_id = pet_types.type_id WHERE 1=1';
        const values = [];
        if (pet_name) {
            query += ' AND pets.pet_name LIKE ?';
            values.push(`%${pet_name}%`);
        }
        if (type_name) {
            query += ' AND pet_types.type_name LIKE ?';
            values.push(`%${type_name}%`);
        }
        const [pets] = await pool.execute(query, values);
        res.render('index', { pets });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Displaying a form to create a new data record
app.get('/create', async (req, res) => {
    try {
        const [pet_types] = await pool.execute('SELECT * FROM pet_types');
        res.render('create', { pet_types });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Process the create form to add a new data record
app.post('/create', async (req, res) => {
    const { pet_name, age, owner_name, type_id } = req.body;

    // Input validation
    if (!pet_name || !isValidAge(age) || !owner_name || !type_id) {
        return res.status(400).send('Invalid input data');
    }

    try {
        // Split owner name into first and last names
        const nameParts = owner_name.trim().split(' ');

        // Handle case where the owner name only contains one part (first name)
        const first_name = nameParts[0];
        const last_name = nameParts.length > 1 ? nameParts[1] : '';

        // Check if owner already exists
        const [existingOwner] = await pool.execute('SELECT * FROM owners WHERE first_name = ? AND last_name = ?', [first_name, last_name]);

        let owner_id;
        if (existingOwner.length === 0) {
            // Create new owner if not exists
            const [result] = await pool.execute('INSERT INTO owners (first_name, last_name) VALUES (?, ?)', [first_name, last_name]);
            owner_id = result.insertId;
        } else {
            owner_id = existingOwner[0].owner_id;
        }

        // Insert pet with the owner ID
        await pool.execute('INSERT INTO pets (pet_name, age, owner_id, type_id) VALUES (?,?,?,?)', [pet_name, age, owner_id, type_id]);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Display a form to modify an existing data
app.get('/edit/:id', async (req, res) => {
    const pet_id = req.params.id;
    try {
        const [pets] = await pool.execute('SELECT * FROM pets WHERE pet_id =?', [pet_id]);
        if (pets.length === 0) {
            return res.status(404).send('Pet not found');
        }
        const [owners] = await pool.execute('SELECT * FROM owners');
        const [pet_types] = await pool.execute('SELECT * FROM pet_types');
        res.render('edit', { pet: pets[0], owners, pet_types });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Process the modify form to update an existing data record
app.post('/edit/:id', async (req, res) => {
    const pet_id = req.params.id;
    const { pet_name, age, owner_name, type_id } = req.body;

    // Input validation
    if (!pet_name || !isValidAge(age) || !owner_name || !type_id) {
        return res.status(400).send('Invalid input data');
    }

    try {
        // Split owner name into first and last names
        const nameParts = owner_name.trim().split(' ');

        const first_name = nameParts[0];
        const last_name = nameParts.length > 1 ? nameParts[1] : '';

        // Check if the owner exists
        const [existingOwner] = await pool.execute('SELECT * FROM owners WHERE first_name = ? AND last_name = ?', [first_name, last_name]);

        let owner_id;
        if (existingOwner.length === 0) {
            // Create new owner if not exists
            const [result] = await pool.execute('INSERT INTO owners (first_name, last_name) VALUES (?, ?)', [first_name, last_name]);
            owner_id = result.insertId;
        } else {
            owner_id = existingOwner[0].owner_id;
        }

        // Update pet with the new owner
        await pool.execute('UPDATE pets SET pet_name =?, age =?, owner_id =?, type_id =? WHERE pet_id =?', [pet_name, age, owner_id, type_id, pet_id]);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Display a confirmation before deleting a record
app.get('/delete/:id', async (req, res) => {
    const pet_id = req.params.id;
    try {
        const [pets] = await pool.execute('SELECT * FROM pets WHERE pet_id =?', [pet_id]);
        if (pets.length === 0) {
            return res.status(404).send('Pet not found');
        }
        res.render('delete', { pet: pets[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Deleting an existing record
app.post('/delete/:id', async (req, res) => {
    const pet_id = req.params.id;
    try {
        await pool.execute('DELETE FROM pets WHERE pet_id =?', [pet_id]);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
