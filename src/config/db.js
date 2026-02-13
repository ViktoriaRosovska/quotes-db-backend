const { Sequelize } = require("sequelize");

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else {
  sequelize = new Sequelize(DB.NAME, DB.USER, DB.PASSWORD, {
    dialect: DB.DIALECT,
    host: DB.HOST,
    port: DB.PORT,
    logging: false,
  });
}

module.exports = sequelize;
