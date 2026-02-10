const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Quote = require('../../models/Quote');
const Category = require('../../models/Category');
const sequelize = require('../../config/db');
const {
  CSV_IMPORT_BATCH_SIZE,
  CSV_IMPORT_BATCH_TIMEOUT,
} = require('../../config/config');

const CSV_FILENAME = path.resolve(__dirname, '../data/quotes.csv');

function validateAndSplitCategories(categoriesStr) {
  const categories = categoriesStr.split(', ');
  // if any category contains space or has upper case letter it is considered invalid and we don't process such row
  return categories.some(
    (category) => category.includes(' ') || /[A-Z]/.test(category)
  )
    ? []
    : categories;
}

function pauseStream(stream, time) {
  stream.pause();
  setTimeout(() => {
    stream.resume();
  }, time);
}

async function importQuotes() {
  try {
    // Synchronize models with the database
    await sequelize.sync({ force: true }); // Set force: true to drop existing tables and re-create them

    let rowIndex = 0;

    const stream = fs
      .createReadStream(CSV_FILENAME)
      .pipe(csv())
      .on('data', async (row) => {
        // 0. Batch processing. Pause stream after specific amount of rows
        rowIndex += 1;
        if (rowIndex % CSV_IMPORT_BATCH_SIZE === 0) {
          console.log('Paused', rowIndex);
          pauseStream(stream, CSV_IMPORT_BATCH_TIMEOUT);
        }

        // 1. Validate row. If not valid -> End
        const categories = validateAndSplitCategories(row.category);
        if (categories.length === 0) {
          return;
        }

        // 2. If row valid -> add quote to the Quotes table
        const quote = await Quote.create({
          text: row.quote,
          author: row.author.split(',')[0].slice(0, 255),
        });

        // 3. Add categories of the quote to the Categories table IF absent
        for (let category of categories) {
          await Category.findOrCreate({ where: { name: category } });
        }

        // 4. Find all categories of the quote in the Categories table
        const categoryInstances = await Category.findAll({
          where: { name: categories },
        });

        // 5. Map quote to the found quote categories
        await quote.addCategories(categoryInstances);
      })
      .on('end', () =>
        console.log('Processing of the CSV file with quotes finished')
      )
      .on('error', (error) =>
        console.error('Error during CSV file parsing', error)
      );
  } catch (error) {
    console.error('Error importing quotes:', error);
  }
}

importQuotes();
