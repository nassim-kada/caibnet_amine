const mongoose = require('mongoose');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const mongoUriLine = env.split('\n').find(line => line.startsWith('MONGODB_URI='));
if (!mongoUriLine) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}
const MONGODB_URI = mongoUriLine.split('=')[1].trim();

mongoose.connect(MONGODB_URI);

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const defaultCategories = [
  { name: 'Épaule' },
  { name: 'Coude' },
  { name: 'Poignet' },
  { name: 'Hanche' },
  { name: 'Genou' },
  { name: 'Cheville' },
  { name: 'Cervicale' },
  { name: 'Lombaire' },
  { name: 'Pubis' },
  { name: 'Adducteur' },
  { name: 'Fractures' }
];

async function seed() {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(defaultCategories);
    console.log('Categories seeded!');
  } else {
    console.log('Categories already exist.');
  }
  process.exit();
}
seed();
