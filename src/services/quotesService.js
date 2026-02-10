const { Op, where } = require('sequelize');
const sequelize = require('../config/db');
const Quote = require('../models/Quote');
const Category = require('../models/Category');

const attributes = { exclude: ['createdAt', 'updatedAt'] };
const includeCategoryConfig = {
  model: Category,
  as: 'Categories',
  attributes: ['name'],
  through: { attributes: [] },
};

const findQuotes = async ({ limit, offset, author, text, category }) => {

 const idsResult = await Quote.findAll({
  attributes: ['id'],
  where: {
    ...(author && { author: { [Op.iLike]: `%${author}%` } }),
    ...(text && { text: { [Op.iLike]: `%${text}%` } }),
  },
  include: category
    ? [{
        model: Category,
         as: 'Categories',
        attributes: [],
        where: { name: category },
        required: true,
        through: { attributes: [] },
      }]
    : [],
  order: [['id', 'ASC']],
  limit,
  offset,
  subQuery: false,
}); 

const total = await Quote.count({
  where: {
    ...(author && { author: { [Op.iLike]: `%${author}%` } }),
    ...(text && { text: { [Op.iLike]: `%${text}%` } }),
  },
  include: category
    ? [{
        model: Category,
        as: 'Categories',
        where: { name: category },
        required: true,
        through: { attributes: [] },
      }]
    : [],
  distinct: true,
});
  
 const quotes = await Quote.findAll({
  attributes,
  where: { id: idsResult.map(i => i.id) },
  order: [['id', 'ASC']],
  include: [{
    model: Category,
    as: 'Categories',
    attributes: ['name'],
    through: { attributes: [] },
  }],
});
  console.log("quotes: ", quotes);
  // TODO: Try to find the way to filter by category name and find
  // names of all categories for the quote in one DB request
  // if (!category) {
  //   return { quotes, total };
  // } else {
  //   const quotesIds = quotes.map((quote) => quote.id);
  //   const quotesByIds = await Quote.findAll({
  //     attributes,
  //     order: [['id', 'ASC']],
  //     include: includeCategoryConfig,
  //     where: { id: quotesIds },
  //   });
  //   return { quotesByIds, total };
  // }
  return { quotes, total };
};

const findRandomQuotes = async (limit) =>
  await Quote.findAll({
    attributes,
    limit,
    order: sequelize.random(),
    include: includeCategoryConfig,
  });

const findSingleQuote = async (id) =>
  await Quote.findByPk(id, {
    attributes,
    include: includeCategoryConfig,
  });

const deleteSingleQuote = async (id) => {
  const count = await Quote.destroy({ where: { id } });
  if (count) return id;
};

const findOrCreateCategories = async (categoryNames, transaction) =>
  await Promise.all(
    categoryNames.map((name) =>
      Category.findOrCreate({
        where: { name },
        transaction,
      }).then(([category]) => category)
    )
  );

const createQuote = async ({ text, author, categories }) => {
  const createdQuoteId = await sequelize.transaction(async (t) => {
    const quote = await Quote.create({ text, author }, { transaction: t });
    const categoryInstances = await findOrCreateCategories(categories, t);
    await quote.setCategories(categoryInstances, { transaction: t });

    return quote.id;
  });

  return await findSingleQuote(createdQuoteId);
};

const modifySingleQuote = async (id, { text, author, categories }) => {
  const modifiedQuoteId = await sequelize.transaction(async (t) => {
    const quote = await Quote.findByPk(id, { transaction: t });

    if (!quote) {
      return null;
    }

    if (text) quote.text = text;
    if (author) quote.author = author;

    await quote.save({ transaction: t });

    if (categories) {
      const categoryInstances = await findOrCreateCategories(categories, t);
      await quote.setCategories(categoryInstances, { transaction: t });
    }

    return quote.id;
  });

  return await findSingleQuote(modifiedQuoteId);
};

module.exports = {
  findQuotes,
  findRandomQuotes,
  findSingleQuote,
  createQuote,
  deleteSingleQuote,
  modifySingleQuote,
};
