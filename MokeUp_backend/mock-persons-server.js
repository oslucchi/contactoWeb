const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3001;

// MySQL connection config
const dbConfig = {
  host: 'localhost',
  user: 'orderMngr',
  password: 'Omh1nppa',
  database: 'contacto'
};

app.use(cors());
app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log(`Mokeup API server running at http://localhost:${PORT}`);
});

// GET all persons
app.get('/api/persons', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Persons');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one person
app.get('/api/persons/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Persons WHERE idPerson = ?', [req.params.id]);
    await connection.end();
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ error: 'Person not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE person
app.post('/api/persons', async (req, res) => {
  try {
    const person = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO Persons (idCustomer, familyName, firstName, role, mobile, office, email, street, zip, city, region, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        person.idCustomer,
        person.familyName,
        person.firstName,
        person.role,
        person.mobile,
        person.office,
        person.email,
        person.street,
        person.zip,
        person.city,
        person.region,
        person.country
      ]
    );
    await connection.end();
    res.status(201).json({ ...person, idPerson: person.idPerson });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE person
app.put('/api/persons/:id', async (req, res) => {
  try {
    const person = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `UPDATE Persons SET idCustomer=?, familyName=?, firstName=?, role=?, mobile=?, office=?, email=?, street=?, zip=?, city=?, region=?, country=?
       WHERE idPerson=?`,
      [
        person.idCustomer,
        person.familyName,
        person.firstName,
        person.role,
        person.mobile,
        person.office,
        person.email,
        person.street,
        person.zip,
        person.city,
        person.region,
        person.country,
        req.params.id
      ]
    );
    await connection.end();
    if (result.affectedRows > 0) res.json({ ...person, idPerson: req.params.id });
    else res.status(404).json({ error: 'Person not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE person
app.delete('/api/persons/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM Persons WHERE idPerson = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows > 0) res.status(204).end();
    else res.status(404).json({ error: 'Person not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMPANIES ---
// GET all companies
app.get('/api/companies', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Companies');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one company
app.get('/api/companies/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Companies WHERE idCompany = ?', [req.params.id]);
    await connection.end();
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ error: 'Company not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE company
app.post('/api/companies', async (req, res) => {
  try {
    const company = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO Companies (idSegment, description, status, type)
       VALUES (?, ?, ?, ?)`,
      [
        company.idSegment,
        company.description,
        company.status,
        company.type
      ]
    );
    await connection.end();
    res.status(201).json({ ...company, idCompany: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE company
app.put('/api/companies/:id', async (req, res) => {
  try {
    const company = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `UPDATE Companies SET idSegment=?, description=?, status=?, type=?
       WHERE idCompany=?`,
      [
        company.idSegment,
        company.description,
        company.status,
        company.type,
        req.params.id
      ]
    );
    await connection.end();
    if (result.affectedRows > 0) res.json({ ...company, idCompany: req.params.id });
    else res.status(404).json({ error: 'Company not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE company
app.delete('/api/companies/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM Companies WHERE idCompany = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows > 0) res.status(204).end();
    else res.status(404).json({ error: 'Company not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BRANCHES ---
// GET all branches
app.get('/api/branches', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Branches');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one branch
app.get('/api/branches/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Branches WHERE idBranch = ?', [req.params.id]);
    await connection.end();
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ error: 'Branch not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE branch
app.post('/api/branches', async (req, res) => {
  try {
    const branch = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO Branches (idOrganization, name1, name2, email, street1, street2, zip, city, region, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch.idOrganization,
        branch.name1,
        branch.name2,
        branch.email,
        branch.street1,
        branch.street2,
        branch.zip,
        branch.city,
        branch.region,
        branch.country
      ]
    );
    await connection.end();
    res.status(201).json({ ...branch, idBranch: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE branch
app.put('/api/branches/:id', async (req, res) => {
  try {
    const branch = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `UPDATE Branches SET idOrganization=?, name1=?, name2=?, email=?, street1=?, street2=?, zip=?, city=?, region=?, country=?
       WHERE idBranch=?`,
      [
        branch.idOrganization,
        branch.name1,
        branch.name2,
        branch.email,
        branch.street1,
        branch.street2,
        branch.zip,
        branch.city,
        branch.region,
        branch.country,
        req.params.id
      ]
    );
    await connection.end();
    if (result.affectedRows > 0) res.json({ ...branch, idBranch: req.params.id });
    else res.status(404).json({ error: 'Branch not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE branch
app.delete('/api/branches/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM Branches WHERE idBranch = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows > 0) res.status(204).end();
    else res.status(404).json({ error: 'Branch not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ORGANIZATION ---
// GET all organizations
app.get('/api/organization', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Organization');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one organization
app.get('/api/organization/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Organization WHERE idOrganization = ?', [req.params.id]);
    await connection.end();
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ error: 'Organization not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE organization
app.post('/api/organization', async (req, res) => {
  try {
    const organization = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO Organization (name1, name2, email, street1, street2, zip, city, region, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organization.name1,
        organization.name2,
        organization.email,
        organization.street1,
        organization.street2,
        organization.zip,
        organization.city,
        organization.region,
        organization.country
      ]
    );
    await connection.end();
    res.status(201).json({ ...organization, idOrganization: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE organization
app.put('/api/organization/:id', async (req, res) => {
  try {
    const organization = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `UPDATE Organization SET name1=?, name2=?, email=?, street1=?, street2=?, zip=?, city=?, region=?, country=?
       WHERE idOrganization=?`,
      [
        organization.name1,
        organization.name2,
        organization.email,
        organization.street1,
        organization.street2,
        organization.zip,
        organization.city,
        organization.region,
        organization.country,
        req.params.id
      ]
    );
    await connection.end();
    if (result.affectedRows > 0) res.json({ ...organization, idOrganization: req.params.id });
    else res.status(404).json({ error: 'Organization not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE organization
app.delete('/api/organization/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM Organization WHERE idOrganization = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows > 0) res.status(204).end();
    else res.status(404).json({ error: 'Organization not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMPLOYEES ---
// GET all employees
app.get('/api/employees', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Employees');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one employee
app.get('/api/employees/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM Employees WHERE idEmployee = ?', [req.params.id]);
    await connection.end();
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ error: 'Employee not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE employee
app.post('/api/employees', async (req, res) => {
  try {
    const employee = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO Employees (idBranch, familyName, firstName, email, mobile)
       VALUES (?, ?, ?, ?, ?)`,
      [
        employee.idBranch,
        employee.familyName,
        employee.firstName,
        employee.email,
        employee.mobile
      ]
    );
    await connection.end();
    res.status(201).json({ ...employee, idEmployee: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const employee = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `UPDATE Employees SET idBranch=?, familyName=?, firstName=?, email=?, mobile=?
       WHERE idEmployee=?`,
      [
        employee.idBranch,
        employee.familyName,
        employee.firstName,
        employee.email,
        employee.mobile,
        req.params.id
      ]
    );
    await connection.end();
    if (result.affectedRows > 0) res.json({ ...employee, idEmployee: req.params.id });
    else res.status(404).json({ error: 'Employee not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM Employees WHERE idEmployee = ?', [req.params.id]);
    await connection.end();
    if (result.affectedRows > 0) res.status(204).end();
    else res.status(404).json({ error: 'Employee not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
