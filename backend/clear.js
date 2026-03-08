import db from './src/database/connection.js';

console.log('Clearing all samples, collections and related data...');

db.exec('DELETE FROM audit_trail');
db.exec('DELETE FROM supplier_comm_attachments');
db.exec('DELETE FROM supplier_communications');
db.exec('DELETE FROM quality_review_comments');
db.exec('DELETE FROM quality_review_photos');
db.exec('DELETE FROM quality_reviews');
db.exec('DELETE FROM samples');
db.exec('DELETE FROM collections');

console.log('Done! All data except users is cleared.');
