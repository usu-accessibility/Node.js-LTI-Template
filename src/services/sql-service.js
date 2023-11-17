var mysql = require('mysql');

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function connectToDatabase(){
  connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
}

async function queryFirstRow(query, values){
  connection.query(query, values, (error, results, fields) => {
    if (error) {
      return console.error(error.message);
    }
    console.log(results);
  });
}

// CREATE operation
async function createData(table_name, rows) {
  var column_key = "";
  var column_value = "";

  for (const [key, value] of Object.entries(rows)) {
    column_key += `${key} `;
    column_value += `${value} `;
  }

  const sql = `INSERT INTO ${table_name} (${column_key}) VALUES (${column_value})`;

  connection.query(sql, (err, results) => {
    if (err) throw err;
    console.log('Data inserted successfully.');
  });
}

// READ operation
async function readData(table_name, ...columns) {
  const column_values = columns.join(" ");
  const sql = `SELECT ${column_values} FROM ${table_name}`;

  connection.query(sql, (err, results) => {
    if (err){
      return err;
    }
    console.log('Data retrieved successfully:', results);
    return results;
  });
}

// READ on condition operation
async function readDataOnCondition(table_name, id, id_value, ...columns) {
  const column_values = columns.join(" ");
  const sql = `SELECT ${column_values} FROM ${table_name} WHERE ${id} = ${id_value}`;

  connection.query(sql, (err, results) => {
    if (err){
      return err;
    }
    console.log('Data retrieved successfully:', results);
    return results;
  });
}

// UPDATE operation
async function updateData(table_name, id, id_value, values) {
  var column_values = "";

  for (const [key, value] of Object.entries(values)) {
    column_values += `${key}=${value} `;
  } 

  if(id_value === "None"){
    var sql = `UPDATE ${table_name} SET ${column_values}`;
  }
  else {
    var sql = `UPDATE ${table_name} SET ${column_values} WHERE ${id} = ${id_value}`;
  }

  connection.query(sql, (err, results) => {
    if (err){
      return err;
    }
    console.log('Data updated successfully.');
    return results;
  });
}

// DELETE operation
async function deleteData(table_name, id, id_value) {
  const sql =  `DELETE FROM ${table_name} WHERE ${id} = ${id_value}`;

  connection.query(sql, [id], (err, results) => {
    if (err){
      return err;
    }
    console.log('Data deleted successfully.');
    return results;
  });
}

module.exports = {
  createData,
  readData,
  updateData,
  deleteData,
  connectToDatabase
}