const sql = require('../services/sql-service');
const canvas_service = require('../services/canvas-service');
const ADVANCED_TYPES = require('../constants/advanced_types');

const { DateTime } = require('luxon'); // Use a library like luxon for handling dates
const axios = require('axios');
const { CoPresentOutlined } = require('@mui/icons-material');

async function getDatabaseTables(table) {
    let table_name, columns;
  
    switch (table) {
      case 'at_image':
        table_name = 'at_image';
        columns = '*';
        return await sql.readData(table_name, columns);
  
      case 'at_user':
        table_name = 'at_user';
        columns = '*';
        return await sql.readData(table_name, columns);
  
      case 'at_course':
        table_name = 'at_course';
        columns = '*';
        return await sql.readData(table_name, columns);
  
      case 'at_alt_text':
        table_name = 'at_alt_text';
        columns = '*';
        return await sql.readData(table_name, columns);
  
      default:
        throw new Error('Invalid table name');
    }
}

async function getAssignmentPage(courseId) {
    const table_name = 'at_image';
    const columns = 'assignment_url';
  
    return await sql.readDataOnCondition(table_name, 'lms_id', courseId, columns);
}

async function getTopicPage(courseId) {
    const table_name = 'at_image';
    const columns = 'topic_url';
  
    return await sql.readDataOnCondition(table_name, 'lms_id', courseId, columns);
}
  
async function updateEditorId(userId, id, lockStatus) {
    const table_name = 'at_image';
  
    const values = {
      editor: lockStatus !== "false" ? userId : 0
    };
  
    return await sql.updateData(table_name, 'id', id, values);
}


module.exports = {
  getDatabaseTables,
  getAssignmentPage,
  getTopicPage,
  updateEditorId
}