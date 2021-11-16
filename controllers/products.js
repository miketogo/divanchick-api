const moment = require('moment-timezone');



const Product = require('../models/product');
const Category = require('../models/category');
const Sub_category = require('../models/sub_category');

const ConflictError = require('../errors/сonflict-err');
const InvalidDataError = require('../errors/invalid-data-err');
const NotFoundError = require('../errors/not-found-err')
const AuthError = require('../errors/auth-err')



const opts = {
  new: true,
  runValidators: true,
};

function translit(word) {
  var answer = '';
  var converter = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sch', 'ь': '', 'ы': 'y', 'ъ': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',

    'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd',
    'Е': 'e', 'Ё': 'e', 'Ж': 'zh', 'З': 'z', 'И': 'i',
    'Й': 'y', 'К': 'k', 'Л': 'l', 'М': 'm', 'Н': 'n',
    'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't',
    'У': 'u', 'Ф': 'f', 'Х': 'h', 'Ц': 'c', 'Ч': 'ch',
    'Ш': 'sh', 'Щ': 'sch', 'Ь': '', 'Ы': 'y', 'Ъ': '',
    'Э': 'e', 'Ю': 'yu', 'Я': 'ya', '-': '_', ' ': '_'
  };

  for (var i = 0; i < word.length; ++i) {
    if (converter[word[i]] === undefined) {
      answer += word[i].toLowerCase();
    } else {
      answer += converter[word[i]];
    }
  }

  return answer;
}

function productCreate({
  article,
  name,
  manufacturer,
  category_id,
  sub_category_id,
  description,
  specifications,
  photos,
  res,
  next,
}) {
  let photosArray
  if (photos.length === 0) photosArray = []
  else photosArray = photos
  Product.create({
    article,
    name: name.trim(),
    link: translit(name.trim().toLowerCase()),
    key_words: name.trim().split(/\s/im),
    manufacturer: manufacturer.trim(),
    category: category_id,
    sub_category: sub_category_id,
    description: description.trim(),
    specifications,
    photos: photosArray,
    variations: [],
  })
    .then((product) => {
      res.status(200).send({ product })
    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
    })
    .catch(next)
}

module.exports.create = (req, res, next) => {
  const {
    article,
    name,
    manufacturer,
    category,
    sub_category,
    description,
    specifications,
    photos,
  } = req.body;
  let categoryLink = translit(category.trim().toLowerCase())
  let sub_categoryLink = translit(sub_category.trim().toLowerCase())
  let filteredSubCategories
  let filteredCategories

  Category.find()
    .then((categories) => {
      filteredCategories = categories.filter((item) => {
        if (item.name.trim().toLowerCase() === category.trim().toLowerCase()) return true
        else return false
      })
      if (filteredCategories.length === 0) {
        Category.create({
          name: category.trim(),
          link: categoryLink,
        }).then((new_category) => {
          filteredCategories = new_category

          Sub_category.find()
            .then((sub_categories) => {
              filteredSubCategories = sub_categories.filter((item) => {
                if (item.name.trim().toLowerCase() === sub_category.trim().toLowerCase()) return true
                else return false
              })

              if (filteredSubCategories.length === 0) {
                Sub_category.create({
                  name: sub_category.trim(),
                  link: sub_categoryLink,
                }).then((new_sub_category) => {

                  filteredSubCategories = new_sub_category
                  let sub_categories = [{
                    sub_category_id: new_sub_category._id
                  }]
                  Category.findByIdAndUpdate(new_category._id, { sub_catigories: sub_categories }, opts)
                    .then((upd_category) => {
                      productCreate({
                        article: article,
                        name: name,
                        manufacturer: manufacturer,
                        category_id: upd_category._id,
                        sub_category_id: new_sub_category._id,
                        description: description,
                        specifications: specifications,
                        photos: photos,
                        res,
                        next,
                      })
                    })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                    .catch((err) => {
                      if (err.message === 'NotFound') {
                        throw new NotFoundError('Нет пользователя с таким id');
                      }
                      if (err.name === 'ValidationError' || err.name === 'CastError') {
                        throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                      }
                    })
                    .catch(next);



                }).catch((err) => {
                  console.log(err)
                  if (err.code === 11000) {
                    throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                  }
                  if (err.name === 'ValidationError') {
                    throw new InvalidDataError('Переданы некорректные данные при создании товара');
                  }
                })
                  .catch(next)
              }
              else {

                filteredSubCategories = filteredSubCategories[0]
                console.log(filteredCategories.sub_categories)
                let prewSubCategories = filteredCategories.sub_catigories
                let sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: filteredSubCategories._id
                }]
                Category.findByIdAndUpdate(new_category._id, { sub_catigories: sub_categories }, opts)
                  .then((upd_category) => {
                    productCreate({
                      article: article,
                      name: name,
                      manufacturer: manufacturer,
                      category_id: upd_category._id,
                      sub_category_id: filteredSubCategories._id,
                      description: description,
                      specifications: specifications,
                      photos: photos,
                      res,
                      next,
                    })
                  })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                  .catch((err) => {
                    if (err.message === 'NotFound') {
                      throw new NotFoundError('Нет пользователя с таким id');
                    }
                    if (err.name === 'ValidationError' || err.name === 'CastError') {
                      throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                    }
                  })
                  .catch(next);

              }
            })
            .catch((err) => {
              console.log(err)
              if (err.code === 11000) {
                throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
              }
              if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
            })
            .catch(next)

        }).catch((err) => {
          console.log(err)
          if (err.code === 11000) {
            throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
          }
          if (err.name === 'ValidationError') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
        })
          .catch(next)
      } else {
        filteredCategories = filteredCategories[0]
        Sub_category.find()
          .then((sub_categories) => {
            filteredSubCategories = sub_categories.filter((item) => {
              if (item.name.trim().toLowerCase() === sub_category.trim().toLowerCase()) return true
              else return false
            })

            if (filteredSubCategories.length === 0) {
              Sub_category.create({
                name: sub_category.trim(),
                link: sub_categoryLink,
              }).then((new_sub_category) => {

                filteredSubCategories = new_sub_category
                let prewSubCategories = filteredCategories.sub_catigories

                let sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: new_sub_category._id
                }]

                Category.findByIdAndUpdate(filteredCategories._id, { sub_catigories: sub_categories }, opts)
                  .then((upd_category) => {
                    productCreate({
                      article: article,
                      name: name,
                      manufacturer: manufacturer,
                      category_id: upd_category._id,
                      sub_category_id: new_sub_category._id,
                      description: description,
                      specifications: specifications,
                      photos: photos,
                      res,
                      next,
                    })
                  })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                  .catch((err) => {
                    if (err.message === 'NotFound') {
                      throw new NotFoundError('Нет пользователя с таким id');
                    }
                    if (err.name === 'ValidationError' || err.name === 'CastError') {
                      throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                    }
                  })
                  .catch(next);


              }).catch((err) => {
                console.log(err)
                if (err.code === 11000) {
                  throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                }
                if (err.name === 'ValidationError') {
                  throw new InvalidDataError('Переданы некорректные данные при создании товара');
                }
              })
                .catch(next)
            }
            else {

              filteredSubCategories = filteredSubCategories[0]
              console.log('filteredSubCategories')
              console.log(filteredSubCategories._id.toString())
              console.log('filteredCategories.sub_catigories')
              console.log(filteredCategories.sub_catigories)
              let sub_categories
              let prewSubCategories = filteredCategories.sub_catigories
              if (prewSubCategories.filter((item) => {
                if (item.sub_category_id.toString() === filteredSubCategories._id.toString()) return true
                else return false
              }).length === 0) {
                sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: filteredSubCategories._id
                }]
              } else {
                sub_categories = [...prewSubCategories]

              }


              Category.findByIdAndUpdate(filteredCategories._id, { sub_catigories: sub_categories }, opts)
                .then((upd_category) => {
                  console.log("filteredCategories")
                  console.log(filteredCategories)
                  console.log("filteredSubCategories")
                  console.log(filteredSubCategories)
                  productCreate({
                    article: article,
                    name: name,
                    manufacturer: manufacturer,
                    category_id: upd_category._id,
                    sub_category_id: filteredSubCategories._id,
                    description: description,
                    specifications: specifications,
                    photos: photos,
                    res,
                    next,
                  })
                })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                .catch((err) => {
                  if (err.message === 'NotFound') {
                    throw new NotFoundError('Нет пользователя с таким id');
                  }
                  if (err.name === 'ValidationError' || err.name === 'CastError') {
                    throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                  }
                })
                .catch(next);

            }

          })
          .catch((err) => {
            console.log(err)
            if (err.code === 11000) {
              throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
            }
            if (err.name === 'ValidationError') {
              throw new InvalidDataError('Переданы некорректные данные при создании товара');
            }
          })
          .catch(next)
      }



    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
    })
    .catch(next)

};


function variationChildCreate({
  article,
  name,
  manufacturer,
  category_id,
  sub_category_id,
  description,
  specifications,
  photos,
  variation_parent_article,
  res,
  next,
}) {
  let photosArray
  if (photos.length === 0) photosArray = []
  else photosArray = photos
  // console.log({
  //   article,
  //   name: name.trim(),
  //   link: translit(name.trim().toLowerCase()),
  //   key_words: name.trim().split(/\s/im),
  //   manufacturer: manufacturer.trim(),
  //   category: category_id,
  //   sub_category: sub_category_id,
  //   description: description.trim(),
  //   specifications,
  //   photos: photosArray,
  //   variations: [],
  //   isVariationChild: true,
  //   variation_parent_article,
  // })
  Product.find().orFail(() => new Error('NoParentVariation'))
    .then((products) => {
      let parent_products = products.filter((product) => {
        if (product.article === variation_parent_article) return true
        else return false
      })
      if (parent_products.length === 0) throw new Error('NoParentVariation')
      if (parent_products.length > 1) throw new Error('MoreParentVariation')
      let parent_product = parent_products[0]
      console.log(parent_product)
      Product.create({
        article,
        name: name.trim(),
        link: translit(name.trim().toLowerCase()),
        key_words: name.trim().split(/\s/im),
        manufacturer: manufacturer.trim(),
        category: category_id,
        sub_category: sub_category_id,
        description: description.trim(),
        specifications,
        photos: photosArray,
        variations: [],
        isVariationChild: true,
      })
        .then((child_product) => {
          let childProducts
          if (parent_product.variations.length === 0) {
            childProducts = [{
              product_id: child_product._id
            }]
          } else {
            let prewChildProducts = parent_product.variations
            childProducts = [...prewChildProducts
              , {
              product_id: child_product._id
            }]
          }

          Product.findByIdAndUpdate(parent_product._id, { variations: childProducts, isVariationParent: true }, opts)
            .then((product) => {
              res.status(200).send({ child_product })
            })
            .catch((err) => {
              console.log(err)
              if (err.code === 11000) {
                throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
              }
              if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
              if (err.message === 'NoParentVariation') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
            })
            .catch(next)
        })
        .catch((err) => {
          console.log(err)
          if (err.code === 11000) {
            throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
          }
          if (err.name === 'ValidationError') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
          if (err.message === 'NoParentVariation') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
        })
        .catch(next)
    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
      if (err.message === 'NoParentVariation') {
        throw new InvalidDataError('Отсутствует родитель в базе');
      }
      if (err.message === 'MoreParentVariation') {
        throw new InvalidDataError('ошибка в базе');
      }
    })
    .catch(next)


}

module.exports.createVariationChild = (req, res, next) => {
  const {
    article,
    name,
    manufacturer,
    category,
    sub_category,
    description,
    specifications,
    photos,
    variation_parent_article,
  } = req.body;
  let categoryLink = translit(category.trim().toLowerCase())
  let sub_categoryLink = translit(sub_category.trim().toLowerCase())
  let filteredSubCategories
  let filteredCategories

  Category.find()
    .then((categories) => {
      filteredCategories = categories.filter((item) => {
        if (item.name.trim().toLowerCase() === category.trim().toLowerCase()) return true
        else return false
      })
      if (filteredCategories.length === 0) {
        Category.create({
          name: category.trim(),
          link: categoryLink,
        }).then((new_category) => {
          filteredCategories = new_category

          Sub_category.find()
            .then((sub_categories) => {
              filteredSubCategories = sub_categories.filter((item) => {
                if (item.name.trim().toLowerCase() === sub_category.trim().toLowerCase()) return true
                else return false
              })

              if (filteredSubCategories.length === 0) {
                Sub_category.create({
                  name: sub_category.trim(),
                  link: sub_categoryLink,
                }).then((new_sub_category) => {

                  filteredSubCategories = new_sub_category
                  let sub_categories = [{
                    sub_category_id: new_sub_category._id
                  }]
                  Category.findByIdAndUpdate(new_category._id, { sub_catigories: sub_categories }, opts)
                    .then((upd_category) => {
                      variationChildCreate({
                        article: article,
                        name: name,
                        manufacturer: manufacturer,
                        category_id: upd_category._id,
                        sub_category_id: new_sub_category._id,
                        description: description,
                        specifications: specifications,
                        photos: photos,
                        variation_parent_article,
                        res,
                        next,
                      })
                    })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                    .catch((err) => {
                      if (err.message === 'NotFound') {
                        throw new NotFoundError('Нет пользователя с таким id');
                      }
                      if (err.name === 'ValidationError' || err.name === 'CastError') {
                        throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                      }
                    })
                    .catch(next);



                }).catch((err) => {
                  console.log(err)
                  if (err.code === 11000) {
                    throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                  }
                  if (err.name === 'ValidationError') {
                    throw new InvalidDataError('Переданы некорректные данные при создании товара');
                  }
                })
                  .catch(next)
              }
              else {

                filteredSubCategories = filteredSubCategories[0]
                console.log(filteredCategories.sub_categories)
                let prewSubCategories = filteredCategories.sub_catigories
                let sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: filteredSubCategories._id
                }]
                Category.findByIdAndUpdate(new_category._id, { sub_catigories: sub_categories }, opts)
                  .then((upd_category) => {
                    variationChildCreate({
                      article: article,
                      name: name,
                      manufacturer: manufacturer,
                      category_id: upd_category._id,
                      sub_category_id: filteredSubCategories._id,
                      description: description,
                      specifications: specifications,
                      photos: photos,
                      variation_parent_article,
                      res,
                      next,
                    })
                  })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                  .catch((err) => {
                    if (err.message === 'NotFound') {
                      throw new NotFoundError('Нет пользователя с таким id');
                    }
                    if (err.name === 'ValidationError' || err.name === 'CastError') {
                      throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                    }
                  })
                  .catch(next);

              }
            })
            .catch((err) => {
              console.log(err)
              if (err.code === 11000) {
                throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
              }
              if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
            })
            .catch(next)

        }).catch((err) => {
          console.log(err)
          if (err.code === 11000) {
            throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
          }
          if (err.name === 'ValidationError') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
        })
          .catch(next)
      } else {
        filteredCategories = filteredCategories[0]
        Sub_category.find()
          .then((sub_categories) => {
            filteredSubCategories = sub_categories.filter((item) => {
              if (item.name.trim().toLowerCase() === sub_category.trim().toLowerCase()) return true
              else return false
            })

            if (filteredSubCategories.length === 0) {
              Sub_category.create({
                name: sub_category.trim(),
                link: sub_categoryLink,
              }).then((new_sub_category) => {

                filteredSubCategories = new_sub_category
                let prewSubCategories = filteredCategories.sub_catigories

                let sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: new_sub_category._id
                }]

                Category.findByIdAndUpdate(filteredCategories._id, { sub_catigories: sub_categories }, opts)
                  .then((upd_category) => {
                    variationChildCreate({
                      article: article,
                      name: name,
                      manufacturer: manufacturer,
                      category_id: upd_category._id,
                      sub_category_id: new_sub_category._id,
                      description: description,
                      specifications: specifications,
                      photos: photos,
                      variation_parent_article,
                      res,
                      next,
                    })
                  })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                  .catch((err) => {
                    if (err.message === 'NotFound') {
                      throw new NotFoundError('Нет пользователя с таким id');
                    }
                    if (err.name === 'ValidationError' || err.name === 'CastError') {
                      throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                    }
                  })
                  .catch(next);


              }).catch((err) => {
                console.log(err)
                if (err.code === 11000) {
                  throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                }
                if (err.name === 'ValidationError') {
                  throw new InvalidDataError('Переданы некорректные данные при создании товара');
                }
              })
                .catch(next)
            }
            else {

              filteredSubCategories = filteredSubCategories[0]
              console.log('filteredSubCategories2')
              console.log(filteredSubCategories._id.toString())
              console.log('filteredCategories.sub_catigories')
              console.log(filteredCategories.sub_catigories)
              let sub_categories
              let prewSubCategories = filteredCategories.sub_catigories
              if (prewSubCategories.filter((item) => {
                if (item.sub_category_id.toString() === filteredSubCategories._id.toString()) return true
                else return false
              }).length === 0) {
                sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: filteredSubCategories._id
                }]
              } else {
                sub_categories = [...prewSubCategories]

              }


              Category.findByIdAndUpdate(filteredCategories._id, { sub_catigories: sub_categories }, opts)
                .then((upd_category) => {
                  console.log("filteredCategories")
                  console.log(filteredCategories)
                  console.log("filteredSubCategories")
                  console.log(filteredSubCategories)
                  variationChildCreate({
                    article: article,
                    name: name,
                    manufacturer: manufacturer,
                    category_id: upd_category._id,
                    sub_category_id: filteredSubCategories._id,
                    description: description,
                    specifications: specifications,
                    photos: photos,
                    variation_parent_article,
                    res,
                    next,
                  })
                })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                .catch((err) => {
                  if (err.message === 'NotFound') {
                    throw new NotFoundError('Нет пользователя с таким id');
                  }
                  if (err.name === 'ValidationError' || err.name === 'CastError') {
                    throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                  }
                })
                .catch(next);

            }

          })
          .catch((err) => {
            console.log(err)
            if (err.code === 11000) {
              throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
            }
            if (err.name === 'ValidationError') {
              throw new InvalidDataError('Переданы некорректные данные при создании товара');
            }
          })
          .catch(next)
      }



    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
    })
    .catch(next)

};



function moduleChildCreate({
  article,
  name,
  manufacturer,
  category_id,
  sub_category_id,
  description,
  specifications,
  photos,
  module_parent_article,
  res,
  next,
}) {
  let photosArray
  if (photos.length === 0) photosArray = []
  else photosArray = photos
  // console.log({
  //   article,
  //   name: name.trim(),
  //   link: translit(name.trim().toLowerCase()),
  //   key_words: name.trim().split(/\s/im),
  //   manufacturer: manufacturer.trim(),
  //   category: category_id,
  //   sub_category: sub_category_id,
  //   description: description.trim(),
  //   specifications,
  //   photos: photosArray,
  //   variations: [],
  //   isVariationChild: true,
  //   variation_parent_article,
  // })
  Product.find().orFail(() => new Error('NoParentVariation'))
    .then((products) => {
      let parent_products = products.filter((product) => {
        if (product.article === module_parent_article) return true
        else return false
      })
      if (parent_products.length === 0) throw new Error('NoParentVariation')
      if (parent_products.length > 1) throw new Error('MoreParentVariation')
      let parent_product = parent_products[0]
      console.log(parent_product)
      Product.create({
        article,
        name: name.trim(),
        link: translit(name.trim().toLowerCase()),
        key_words: name.trim().split(/\s/im),
        manufacturer: manufacturer.trim(),
        category: category_id,
        sub_category: sub_category_id,
        description: description.trim(),
        specifications,
        photos: photosArray,
        variations: [],
        isModuleChild: true,
      })
        .then((child_product) => {
          let childProducts
          if (parent_product.moduleItems.length === 0) {
            childProducts = [{
              product_id: child_product._id
            }]
          } else {
            let prewChildProducts = parent_product.moduleItems
            childProducts = [...prewChildProducts
              , {
              product_id: child_product._id
            }]
          }

          Product.findByIdAndUpdate(parent_product._id, { moduleItems: childProducts, isModuleParent: true }, opts)
            .then((product) => {
              res.status(200).send({ child_product })
            })
            .catch((err) => {
              console.log(err)
              if (err.code === 11000) {
                throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
              }
              if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
              if (err.message === 'NoParentVariation') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
            })
            .catch(next)
        })
        .catch((err) => {
          console.log(err)
          if (err.code === 11000) {
            throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
          }
          if (err.name === 'ValidationError') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
          if (err.message === 'NoParentVariation') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
        })
        .catch(next)
    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
      if (err.message === 'NoParentVariation') {
        throw new InvalidDataError('Отсутствует родитель в базе');
      }
      if (err.message === 'MoreParentVariation') {
        throw new InvalidDataError('ошибка в базе');
      }
    })
    .catch(next)


}

module.exports.createModuleChild = (req, res, next) => {
  const {
    article,
    name,
    manufacturer,
    category,
    sub_category,
    description,
    specifications,
    photos,
    module_parent_article,
  } = req.body;
  let categoryLink = translit(category.trim().toLowerCase())
  let sub_categoryLink = translit(sub_category.trim().toLowerCase())
  let filteredSubCategories
  let filteredCategories

  Category.find()
    .then((categories) => {
      filteredCategories = categories.filter((item) => {
        if (item.name.trim().toLowerCase() === category.trim().toLowerCase()) return true
        else return false
      })
      if (filteredCategories.length === 0) {
        Category.create({
          name: category.trim(),
          link: categoryLink,
        }).then((new_category) => {
          filteredCategories = new_category

          Sub_category.find()
            .then((sub_categories) => {
              filteredSubCategories = sub_categories.filter((item) => {
                if (item.name.trim().toLowerCase() === sub_category.trim().toLowerCase()) return true
                else return false
              })

              if (filteredSubCategories.length === 0) {
                Sub_category.create({
                  name: sub_category.trim(),
                  link: sub_categoryLink,
                }).then((new_sub_category) => {

                  filteredSubCategories = new_sub_category
                  let sub_categories = [{
                    sub_category_id: new_sub_category._id
                  }]
                  Category.findByIdAndUpdate(new_category._id, { sub_catigories: sub_categories }, opts)
                    .then((upd_category) => {
                      moduleChildCreate({
                        article: article,
                        name: name,
                        manufacturer: manufacturer,
                        category_id: upd_category._id,
                        sub_category_id: new_sub_category._id,
                        description: description,
                        specifications: specifications,
                        photos: photos,
                        module_parent_article,
                        res,
                        next,
                      })
                    })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                    .catch((err) => {
                      if (err.message === 'NotFound') {
                        throw new NotFoundError('Нет пользователя с таким id');
                      }
                      if (err.name === 'ValidationError' || err.name === 'CastError') {
                        throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                      }
                    })
                    .catch(next);



                }).catch((err) => {
                  console.log(err)
                  if (err.code === 11000) {
                    throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                  }
                  if (err.name === 'ValidationError') {
                    throw new InvalidDataError('Переданы некорректные данные при создании товара');
                  }
                })
                  .catch(next)
              }
              else {

                filteredSubCategories = filteredSubCategories[0]
                console.log(filteredCategories.sub_categories)
                let prewSubCategories = filteredCategories.sub_catigories
                let sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: filteredSubCategories._id
                }]
                Category.findByIdAndUpdate(new_category._id, { sub_catigories: sub_categories }, opts)
                  .then((upd_category) => {
                    moduleChildCreate({
                      article: article,
                      name: name,
                      manufacturer: manufacturer,
                      category_id: upd_category._id,
                      sub_category_id: filteredSubCategories._id,
                      description: description,
                      specifications: specifications,
                      photos: photos,
                      module_parent_article,
                      res,
                      next,
                    })
                  })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                  .catch((err) => {
                    if (err.message === 'NotFound') {
                      throw new NotFoundError('Нет пользователя с таким id');
                    }
                    if (err.name === 'ValidationError' || err.name === 'CastError') {
                      throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                    }
                  })
                  .catch(next);

              }
            })
            .catch((err) => {
              console.log(err)
              if (err.code === 11000) {
                throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
              }
              if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
            })
            .catch(next)

        }).catch((err) => {
          console.log(err)
          if (err.code === 11000) {
            throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
          }
          if (err.name === 'ValidationError') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
        })
          .catch(next)
      } else {
        filteredCategories = filteredCategories[0]
        Sub_category.find()
          .then((sub_categories) => {
            filteredSubCategories = sub_categories.filter((item) => {
              if (item.name.trim().toLowerCase() === sub_category.trim().toLowerCase()) return true
              else return false
            })

            if (filteredSubCategories.length === 0) {
              Sub_category.create({
                name: sub_category.trim(),
                link: sub_categoryLink,
              }).then((new_sub_category) => {

                filteredSubCategories = new_sub_category
                let prewSubCategories = filteredCategories.sub_catigories

                let sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: new_sub_category._id
                }]

                Category.findByIdAndUpdate(filteredCategories._id, { sub_catigories: sub_categories }, opts)
                  .then((upd_category) => {
                    moduleChildCreate({
                      article: article,
                      name: name,
                      manufacturer: manufacturer,
                      category_id: upd_category._id,
                      sub_category_id: new_sub_category._id,
                      description: description,
                      specifications: specifications,
                      photos: photos,
                      module_parent_article,
                      res,
                      next,
                    })
                  })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                  .catch((err) => {
                    if (err.message === 'NotFound') {
                      throw new NotFoundError('Нет пользователя с таким id');
                    }
                    if (err.name === 'ValidationError' || err.name === 'CastError') {
                      throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                    }
                  })
                  .catch(next);


              }).catch((err) => {
                console.log(err)
                if (err.code === 11000) {
                  throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                }
                if (err.name === 'ValidationError') {
                  throw new InvalidDataError('Переданы некорректные данные при создании товара');
                }
              })
                .catch(next)
            }
            else {

              filteredSubCategories = filteredSubCategories[0]
              console.log('filteredSubCategories2')
              console.log(filteredSubCategories._id.toString())
              console.log('filteredCategories.sub_catigories')
              console.log(filteredCategories.sub_catigories)
              let sub_categories
              let prewSubCategories = filteredCategories.sub_catigories
              if (prewSubCategories.filter((item) => {
                if (item.sub_category_id.toString() === filteredSubCategories._id.toString()) return true
                else return false
              }).length === 0) {
                sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: filteredSubCategories._id
                }]
              } else {
                sub_categories = [...prewSubCategories]

              }


              Category.findByIdAndUpdate(filteredCategories._id, { sub_catigories: sub_categories }, opts)
                .then((upd_category) => {
                  console.log("filteredCategories")
                  console.log(filteredCategories)
                  console.log("filteredSubCategories")
                  console.log(filteredSubCategories)
                  moduleChildCreate({
                    article: article,
                    name: name,
                    manufacturer: manufacturer,
                    category_id: upd_category._id,
                    sub_category_id: filteredSubCategories._id,
                    description: description,
                    specifications: specifications,
                    photos: photos,
                    module_parent_article,
                    res,
                    next,
                  })
                })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                .catch((err) => {
                  if (err.message === 'NotFound') {
                    throw new NotFoundError('Нет пользователя с таким id');
                  }
                  if (err.name === 'ValidationError' || err.name === 'CastError') {
                    throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                  }
                })
                .catch(next);

            }

          })
          .catch((err) => {
            console.log(err)
            if (err.code === 11000) {
              throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
            }
            if (err.name === 'ValidationError') {
              throw new InvalidDataError('Переданы некорректные данные при создании товара');
            }
          })
          .catch(next)
      }



    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
    })
    .catch(next)

};




function moduleAndVariationChildCreate({
  article,
  name,
  manufacturer,
  category_id,
  sub_category_id,
  description,
  specifications,
  photos,
  module_parent_article,
  variation_parent_article,
  res,
  next,
}) {
  let photosArray
  if (photos.length === 0) photosArray = []
  else photosArray = photos
  // console.log({
  //   article,
  //   name: name.trim(),
  //   link: translit(name.trim().toLowerCase()),
  //   key_words: name.trim().split(/\s/im),
  //   manufacturer: manufacturer.trim(),
  //   category: category_id,
  //   sub_category: sub_category_id,
  //   description: description.trim(),
  //   specifications,
  //   photos: photosArray,
  //   variations: [],
  //   isVariationChild: true,
  //   variation_parent_article,
  // })
  Product.find().orFail(() => new Error('NoParentVariation'))
    .then((products) => {
      let parent_products = products.filter((product) => {
        if (product.article === module_parent_article) return true
        else return false
      })
      if (parent_products.length === 0) throw new Error('NoParentVariation')
      if (parent_products.length > 1) throw new Error('MoreParentVariation')
      let module_parent_product = parent_products[0]

      let var_parent_products = products.filter((product) => {
        if (product.article === variation_parent_article) return true
        else return false
      })
      if (var_parent_products.length === 0) throw new Error('NoParentVariation')
      if (var_parent_products.length > 1) throw new Error('MoreParentVariation')
      let var_parent_product = var_parent_products[0]

      console.log(module_parent_product)
      Product.create({
        article,
        name: name.trim(),
        link: translit(name.trim().toLowerCase()),
        key_words: name.trim().split(/\s/im),
        manufacturer: manufacturer.trim(),
        category: category_id,
        sub_category: sub_category_id,
        description: description.trim(),
        specifications,
        photos: photosArray,
        variations: [],
        isModuleChild: true,
        isVariationChild: true,
      })
        .then((child_product) => {
          let module_childProducts
          if (module_parent_product.moduleItems.length === 0) {
            module_childProducts = [{
              product_id: child_product._id
            }]
          } else {
            let prewChildProducts = module_parent_product.moduleItems
            module_childProducts = [...prewChildProducts
              , {
              product_id: child_product._id
            }]
          }

          Product.findByIdAndUpdate(module_parent_product._id, { moduleItems: module_childProducts, isModuleParent: true }, opts)
            .then((parentModProduct) => {
              let var_childProducts
              if (var_parent_product.variations.length === 0) {
                var_childProducts = [{
                  product_id: child_product._id
                }]
              } else {
                let prewChildProducts = var_parent_product.variations
                var_childProducts = [...prewChildProducts
                  , {
                  product_id: child_product._id
                }]
              }

              Product.findByIdAndUpdate(var_parent_product._id, { variations: var_childProducts, isVariationParent: true }, opts)
                .then((var_product) => {
                  res.status(200).send({ child_product })
                })
                .catch((err) => {
                  console.log(err)
                  if (err.code === 11000) {
                    throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                  }
                  if (err.name === 'ValidationError') {
                    throw new InvalidDataError('Переданы некорректные данные при создании товара');
                  }
                  if (err.message === 'NoParentVariation') {
                    throw new InvalidDataError('Переданы некорректные данные при создании товара');
                  }
                })
                .catch(next)
            })
            .catch((err) => {
              console.log(err)
              if (err.code === 11000) {
                throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
              }
              if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
              if (err.message === 'NoParentVariation') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
            })
            .catch(next)
        })
        .catch((err) => {
          console.log(err)
          if (err.code === 11000) {
            throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
          }
          if (err.name === 'ValidationError') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
          if (err.message === 'NoParentVariation') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
        })
        .catch(next)
    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
      if (err.message === 'NoParentVariation') {
        throw new InvalidDataError('Отсутствует родитель в базе');
      }
      if (err.message === 'MoreParentVariation') {
        throw new InvalidDataError('ошибка в базе');
      }
    })
    .catch(next)


}

module.exports.createModuleAndVariationChild = (req, res, next) => {
  const {
    article,
    name,
    manufacturer,
    category,
    sub_category,
    description,
    specifications,
    photos,
    module_parent_article,
    variation_parent_article,
  } = req.body;
  let categoryLink = translit(category.trim().toLowerCase())
  let sub_categoryLink = translit(sub_category.trim().toLowerCase())
  let filteredSubCategories
  let filteredCategories

  Category.find()
    .then((categories) => {
      filteredCategories = categories.filter((item) => {
        if (item.name.trim().toLowerCase() === category.trim().toLowerCase()) return true
        else return false
      })
      if (filteredCategories.length === 0) {
        Category.create({
          name: category.trim(),
          link: categoryLink,
        }).then((new_category) => {
          filteredCategories = new_category

          Sub_category.find()
            .then((sub_categories) => {
              filteredSubCategories = sub_categories.filter((item) => {
                if (item.name.trim().toLowerCase() === sub_category.trim().toLowerCase()) return true
                else return false
              })

              if (filteredSubCategories.length === 0) {
                Sub_category.create({
                  name: sub_category.trim(),
                  link: sub_categoryLink,
                }).then((new_sub_category) => {

                  filteredSubCategories = new_sub_category
                  let sub_categories = [{
                    sub_category_id: new_sub_category._id
                  }]
                  Category.findByIdAndUpdate(new_category._id, { sub_catigories: sub_categories }, opts)
                    .then((upd_category) => {
                      moduleAndVariationChildCreate({
                        article: article,
                        name: name,
                        manufacturer: manufacturer,
                        category_id: upd_category._id,
                        sub_category_id: new_sub_category._id,
                        description: description,
                        specifications: specifications,
                        photos: photos,
                        module_parent_article,
                        variation_parent_article,
                        res,
                        next,
                      })
                    })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                    .catch((err) => {
                      if (err.message === 'NotFound') {
                        throw new NotFoundError('Нет пользователя с таким id');
                      }
                      if (err.name === 'ValidationError' || err.name === 'CastError') {
                        throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                      }
                    })
                    .catch(next);



                }).catch((err) => {
                  console.log(err)
                  if (err.code === 11000) {
                    throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                  }
                  if (err.name === 'ValidationError') {
                    throw new InvalidDataError('Переданы некорректные данные при создании товара');
                  }
                })
                  .catch(next)
              }
              else {

                filteredSubCategories = filteredSubCategories[0]
                console.log(filteredCategories.sub_categories)
                let prewSubCategories = filteredCategories.sub_catigories
                let sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: filteredSubCategories._id
                }]
                Category.findByIdAndUpdate(new_category._id, { sub_catigories: sub_categories }, opts)
                  .then((upd_category) => {
                    moduleAndVariationChildCreate({
                      article: article,
                      name: name,
                      manufacturer: manufacturer,
                      category_id: upd_category._id,
                      sub_category_id: filteredSubCategories._id,
                      description: description,
                      specifications: specifications,
                      photos: photos,
                      module_parent_article,
                      variation_parent_article,
                      res,
                      next,
                    })
                  })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                  .catch((err) => {
                    if (err.message === 'NotFound') {
                      throw new NotFoundError('Нет пользователя с таким id');
                    }
                    if (err.name === 'ValidationError' || err.name === 'CastError') {
                      throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                    }
                  })
                  .catch(next);

              }
            })
            .catch((err) => {
              console.log(err)
              if (err.code === 11000) {
                throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
              }
              if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании товара');
              }
            })
            .catch(next)

        }).catch((err) => {
          console.log(err)
          if (err.code === 11000) {
            throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
          }
          if (err.name === 'ValidationError') {
            throw new InvalidDataError('Переданы некорректные данные при создании товара');
          }
        })
          .catch(next)
      } else {
        filteredCategories = filteredCategories[0]
        Sub_category.find()
          .then((sub_categories) => {
            filteredSubCategories = sub_categories.filter((item) => {
              if (item.name.trim().toLowerCase() === sub_category.trim().toLowerCase()) return true
              else return false
            })

            if (filteredSubCategories.length === 0) {
              Sub_category.create({
                name: sub_category.trim(),
                link: sub_categoryLink,
              }).then((new_sub_category) => {

                filteredSubCategories = new_sub_category
                let prewSubCategories = filteredCategories.sub_catigories

                let sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: new_sub_category._id
                }]

                Category.findByIdAndUpdate(filteredCategories._id, { sub_catigories: sub_categories }, opts)
                  .then((upd_category) => {
                    moduleAndVariationChildCreate({
                      article: article,
                      name: name,
                      manufacturer: manufacturer,
                      category_id: upd_category._id,
                      sub_category_id: new_sub_category._id,
                      description: description,
                      specifications: specifications,
                      photos: photos,
                      module_parent_article,
                      variation_parent_article,
                      res,
                      next,
                    })
                  })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                  .catch((err) => {
                    if (err.message === 'NotFound') {
                      throw new NotFoundError('Нет пользователя с таким id');
                    }
                    if (err.name === 'ValidationError' || err.name === 'CastError') {
                      throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                    }
                  })
                  .catch(next);


              }).catch((err) => {
                console.log(err)
                if (err.code === 11000) {
                  throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
                }
                if (err.name === 'ValidationError') {
                  throw new InvalidDataError('Переданы некорректные данные при создании товара');
                }
              })
                .catch(next)
            }
            else {

              filteredSubCategories = filteredSubCategories[0]
              console.log('filteredSubCategories2')
              console.log(filteredSubCategories._id.toString())
              console.log('filteredCategories.sub_catigories')
              console.log(filteredCategories.sub_catigories)
              let sub_categories
              let prewSubCategories = filteredCategories.sub_catigories
              if (prewSubCategories.filter((item) => {
                if (item.sub_category_id.toString() === filteredSubCategories._id.toString()) return true
                else return false
              }).length === 0) {
                sub_categories = [...prewSubCategories
                  , {
                  sub_category_id: filteredSubCategories._id
                }]
              } else {
                sub_categories = [...prewSubCategories]

              }


              Category.findByIdAndUpdate(filteredCategories._id, { sub_catigories: sub_categories }, opts)
                .then((upd_category) => {
                  console.log("filteredCategories")
                  console.log(filteredCategories)
                  console.log("filteredSubCategories")
                  console.log(filteredSubCategories)
                  moduleAndVariationChildCreate({
                    article: article,
                    name: name,
                    manufacturer: manufacturer,
                    category_id: upd_category._id,
                    sub_category_id: filteredSubCategories._id,
                    description: description,
                    specifications: specifications,
                    photos: photos,
                    module_parent_article,
                    variation_parent_article,
                    res,
                    next,
                  })
                })    //!! СДЕЛАТЬ ПЕРЕАДРЕАЦИЮ
                .catch((err) => {
                  if (err.message === 'NotFound') {
                    throw new NotFoundError('Нет пользователя с таким id');
                  }
                  if (err.name === 'ValidationError' || err.name === 'CastError') {
                    throw new InvalidDataError('Переданы некорректные данные при поиске пользователя по id');
                  }
                })
                .catch(next);

            }

          })
          .catch((err) => {
            console.log(err)
            if (err.code === 11000) {
              throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
            }
            if (err.name === 'ValidationError') {
              throw new InvalidDataError('Переданы некорректные данные при создании товара');
            }
          })
          .catch(next)
      }



    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
    })
    .catch(next)

};


module.exports.getProducts = (req, res, next) => {
  const {

  } = req.body;


  Product.find()
  .populate(['category', 'sub_category', 'variations.product_id', 'moduleItems.product_id'])
    .then((products) => {
      res.status(200).send({ products })
    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
    })
    .catch(next)

};
