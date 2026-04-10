const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("UPDATE samples SET supplier_name = 'FIRST PRIORITY' WHERE supplier_name = 'ABtex' OR supplier_name = 'Abtex';", function(err) {
    if (err) {
      console.error('Error updating database:', err.message);
    } else {
      console.log(`Updated ${this.changes} records from ABtex to FIRST PRIORITY.`);
    }
    db.close();
  });
});
