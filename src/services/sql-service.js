var mysql = require('mysql');

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


async function connectToDatabase(){
  return new Promise((resolve, reject) => {
    connection.connect(function(err, results) {
      if (err){
        reject(err);
        return;
      }
      console.log('Connected to mysql');
      resolve(results);
    });
  })
}

async function queryFirstRow(query, values){
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results, fields) => {
      if (err){
        reject(err);
        return;
      }

      resolve(results);
    });
  })
}

// CREATE operation
async function createData(table_name, rows) {
    var column_key = "";
    var column_value = "";

    for (const [key, value] of Object.entries(rows)) {
      column_key += `${key}, `;
      column_value += `${value}, `;
    }

    column_key = column_key.slice(0, column_key.length - 2);
    column_value = column_value.slice(0, column_value.length - 2);

    const sql = `INSERT INTO ${table_name} (${column_key}) VALUES (${column_value})`;

    return new Promise((resolve, reject) => {
      connection.query(sql, (err, results) => {
        if (err){
          reject(err);
          return;
        }

        resolve(results);
      });
      });
}

// READ operation
async function readData(table_name, ...columns) {
  const column_values = columns.join(" ");
  const sql = `SELECT ${column_values} FROM ${table_name}`;

  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err){
        reject(err);
        return;
      }
      
      resolve(results);
    });
  })
}

// READ on condition operation
async function readDataOnCondition(table_name, id, id_value, ...columns) {
  const column_values = columns.join(" ");
  const sql = `SELECT ${column_values} FROM ${table_name} WHERE ${id} = ${id_value}`;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err){
        reject(err);
        return;
      }
      
      resolve(results);
    });
  })
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
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err){
        reject(err);
        return;
      }
      
      resolve(results);
    });
  })
}

// DELETE operation
async function deleteData(table_name, id, id_value) {
  const sql =  `DELETE FROM ${table_name} WHERE ${id} = ${id_value}`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err){
        reject(err);
        return;
      }
      
      resolve(results);
    });
  })
}

module.exports = {
  createData,
  readData,
  updateData,
  deleteData,
  connectToDatabase,
  queryFirstRow,
  readDataOnCondition
}