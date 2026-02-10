## General information

In order to populate Database you have two options:

- Import data from the `quotes.csv` file and then remove rare categories (see detailed steps below)
- (Better) Import all DB data from the dump file `db-without-rare-categories.sql.gz` directly to the database without importQuotes.js script

## Run docker containers for the PostgreSQL and Adminer

1. Change directory to the `server` folder
1. Run DB containers using `docker compose up -d`

## Import quotes from the CSV

1. Change directory to the `src/database/seed` folder
1. Run `importQuotes.js` to import quotes from the CSV file to the database and wait for about 2-3 hours
   ```javascript
   node importQuotes.js
   ```
   NOTE: If import process crashes decrease `BATCH_SIZE` and increase `BATCH_TIMEOUT`

## Remove rare categories

1. Run `removeRareCategories.js` to delete categories which appear in one or two quotes.
   ```javascript
   node removeRareCategories.js
   ```
1. This script will also remove quotes which will be left without categories

## Final DB structure:

- Categories (42,438 rows)
- Quotes (418,388 rows)
- QuoteCategories (2,115,370 rows)
