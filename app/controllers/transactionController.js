// models
const Business = require("../models/businessModel");
const Component = require("../models/componentModel");
const Charge = require("../models/chargeModel");
const Customer = require("../models/customerModel");
const Outlet = require("../models/outletModel");
const PaymentMethod = require("../models/paymentMethodModel");
const Product = require("../models/productModel");
const Promotion = require("../models/promotionModel");
const ServiceMethod = require("../models/serviceMethodModel");
const Tax = require("../models/taxModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const Warehouse = require("../models/warehouseModel");

// controllers
const dataController = require("./utils/dataController");
const formatController = require("./utils/formatController");
const pageController = require("./utils/pageController");

// messages
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

function generateRequestCodes() {
  const viewCode = Math.floor(100000 + Math.random() * 900000);

  let valueCode = viewCode + 123456;
  valueCode = valueCode % 1000000;

  let reversedValueCode = valueCode.toString().split("").reverse().join("");

  // Ganti angka '0' di awal dengan '8'
  reversedValueCode = reversedValueCode.replace(/^0+/, (match) =>
    "8".repeat(match.length)
  );

  return {
    status: "initial",
    viewCode,
    valueCode: parseInt(reversedValueCode),
  };
}

module.exports = {
  createOrder: async (req) => {
    try {
      const { details, status, customerId, userId, businessId, outletId } =
        req.body;

      if (!businessId) {
        return Promise.reject({
          error: true,
          message: {
            en: `Business ID not found! Please check the link you used.`,
            id: `Business ID tidak ditemukan! mohon periksa kembali tautan yang Anda gunakan.`,
          },
        });
      }

      if (!outletId) {
        return Promise.reject({
          error: true,
          message: {
            en: `Outlet ID not found! Please check the link you used.`,
            id: `Outlet ID tidak ditemukan! mohon periksa kembali tautan yang Anda gunakan.`,
          },
        });
      }

      if (!customerId) {
        return Promise.reject({
          error: true,
          message: {
            en: `Customer ID not found! Please check the link you used.`,
            id: `Customer ID tidak ditemukan! mohon periksa kembali tautan yang Anda gunakan.`,
          },
        });
      }

      if (!userId) {
        return Promise.reject({
          error: true,
          message: {
            en: `User ID not found! Please check the link you used.`,
            id: `User ID tidak ditemukan! mohon periksa kembali tautan yang Anda gunakan.`,
          },
        });
      }

      let dateISOString = new Date().toISOString();
      let warehouse = await Warehouse.findById(req.body.warehouseId);
      const skipValidation = status?.payment === "returned";

      // Deklarasikan groupedDetails di luar blok validasi agar bisa digunakan di semua kondisi
      let groupedDetails = {};
      for (const productDetail of details) {
        let key = `${productDetail.productId}-${
          productDetail.variantId || "default"
        }`;

        if (!groupedDetails[key]) {
          groupedDetails[key] = { ...productDetail, qty: 0, additionals: [] };
        }
        groupedDetails[key].qty += productDetail.qty;
        groupedDetails[key].additionals.push(
          ...(productDetail.additionals || [])
        );
      }

      // Gabungkan additionals yang sama
      for (const key in groupedDetails) {
        let groupedAdditionals = {};
        for (const additional of groupedDetails[key].additionals) {
          let addKey = `${additional.productId}-${
            additional.variantId || "default"
          }`;

          if (!groupedAdditionals[addKey]) {
            groupedAdditionals[addKey] = { ...additional, qty: 0 };
          }
          groupedAdditionals[addKey].qty += additional.qty;
        }
        groupedDetails[key].additionals = Object.values(groupedAdditionals);
      }

      if (!skipValidation) {
        // Step 1: Validasi stok
        for (const key in groupedDetails) {
          const productDetail = groupedDetails[key];

          // Validasi komponen utama
          for (const component of productDetail.components) {
            const dbComponent = await Component.findById(component.componentId);
            const dbComponentWarehouse = warehouse.components.find(
              (e) => e.componentId.toString() === component.componentId
            );

            if (
              !dbComponent ||
              dbComponentWarehouse.qty.current <
                component.qty * productDetail.qty
            ) {
              return Promise.reject({
                error: true,
                message: {
                  en: `${dbComponent?.name || "Component"} is insufficient.`,
                  id: `Bahan baku ${
                    dbComponent?.name || "Component"
                  } tidak mencukupi.`,
                },
              });
            }
          }
        }
      }

      // Step 2: Update stok setelah validasi sukses atau jika payment === 'returned'
      for (const key in groupedDetails) {
        const productDetail = groupedDetails[key];

        // Update stok komponen utama
        for (const component of productDetail.components) {
          let dbComponentWarehouse = warehouse.components.find(
            (e) => e.componentId.toString() === component.componentId
          );

          let dbComponentWarehouseFindIndex = warehouse.components.findIndex(
            (e) => e.componentId.toString() === component.componentId
          );

          dbComponentWarehouse.qty.current += skipValidation
            ? component.qty * productDetail.qty
            : -component.qty * productDetail.qty;

          // Update status berdasarkan stok terkini
          const newStatus =
            dbComponentWarehouse.qty.current <= 0
              ? "outOfStock"
              : dbComponentWarehouse.qty.current <= dbComponentWarehouse.qty.min
              ? "almostOut"
              : "available";

          dbComponentWarehouse.qty.status = newStatus;

          warehouse.components[dbComponentWarehouseFindIndex] =
            dbComponentWarehouse;

          await Warehouse.findByIdAndUpdate(req.body.warehouseId, warehouse, {
            new: true,
          });
        }

        // Update stok produk utama (jika countable)
        warehouse = await Warehouse.findById(req.body.warehouseId);
        const product = await Product.findById(productDetail.productId);
        if (product.countable) {
          let dbProductWarehouse = warehouse.products.find(
            (e) => e.productId.toString() === productDetail.productId
          );

          let dbProductWarehouseFindIndex = warehouse.products.findIndex(
            (e) => e.productId.toString() === productDetail.productId
          );

          let dbProductVariantWarehouseFindIndex =
            dbProductWarehouse.variants.findIndex(
              (e) => e.variantId.toString() === productDetail.variantId
            );

          dbProductWarehouse.variants[dbProductVariantWarehouseFindIndex].qty +=
            skipValidation ? productDetail.qty : -productDetail.qty;

          warehouse.products[dbProductWarehouseFindIndex] = dbProductWarehouse;

          await Warehouse.findByIdAndUpdate(req.body.warehouseId, warehouse, {
            new: true,
          });
        }

        warehouse = await Warehouse.findById(req.body.warehouseId);
        // Update stok additionals
        for (const additional of productDetail.additionals) {
          for (const component of additional.components) {
            let dbAdditionalComponentWarehouse = warehouse.components.find(
              (e) => e.componentId.toString() === component.componentId
            );

            let dbAdditionalComponentWarehouseFindIndex =
              warehouse.components.findIndex(
                (e) => e.componentId.toString() === component.componentId
              );

            dbAdditionalComponentWarehouse.qty.current += skipValidation
              ? component.qty * additional.qty
              : -component.qty * additional.qty;

            dbAdditionalComponentWarehouse.qty.status = newAdditionalStatus;

            warehouse.components[dbAdditionalComponentWarehouseFindIndex] =
              dbAdditionalComponentWarehouse;

            await Warehouse.findByIdAndUpdate(req.body.warehouseId, warehouse, {
              new: true,
            });
          }

          // Update stok varian produk tambahan (jika countable)
          const additionalProduct = await Product.findById(
            additional.productId
          );
          if (additionalProduct.countable) {
            warehouse = await Warehouse.findById(req.body.warehouseId);

            let dbAdditionalProductWarehouse = warehouse.products.find(
              (e) => e.productId.toString() === additional.productId
            );

            let dbAdditionalProductWarehouseFindIndex =
              warehouse.products.findIndex(
                (e) => e.productId.toString() === additional.productId
              );

            dbAdditionalProductWarehouse.qty += skipValidation
              ? additional.qty
              : -additional.qty;

            warehouse.products[dbAdditionalProductWarehouseFindIndex] =
              dbAdditionalProductWarehouse;

            await Warehouse.findByIdAndUpdate(req.body.warehouseId, warehouse, {
              new: true,
            });
          }
        }
      }

      // Step 3: Simpan transaksi
      let payload = {
        ...req.body,
        request: generateRequestCodes(),
        createdAt: dateISOString,
        updatedAt: dateISOString,
      };

      const transaction = new Transaction(payload);
      await transaction.save();
      const fixData = await Transaction.populate([transaction], {
        path: "businessId outletId warehouseId paymentMethodId serviceMethodId userId customerId",
      });

      return Promise.resolve({
        error: false,
        message: successMessages.TRANSACTION_CREATED_SUCCESS_ORDER,
        data: fixData[0],
      });
    } catch (error) {
      console.error(error);
      return Promise.reject({
        error: true,
        message: {
          en: "There was an error processing the transaction.",
          id: "Terjadi kesalahan saat memproses transaksi.",
        },
      });
    }
  },

  create: async (req) => {
    try {
      const { details, status } = req.body;
      let dateISOString = new Date().toISOString();
      let warehouse = await Warehouse.findById(req.body.warehouseId);
      const skipValidation = status?.payment === "returned";

      // Deklarasikan groupedDetails di luar blok validasi agar bisa digunakan di semua kondisi
      let groupedDetails = {};
      for (const productDetail of details) {
        let key = `${productDetail.productId}-${
          productDetail.variantId || "default"
        }`;

        if (!groupedDetails[key]) {
          groupedDetails[key] = { ...productDetail, qty: 0, additionals: [] };
        }
        groupedDetails[key].qty += productDetail.qty;
        groupedDetails[key].additionals.push(
          ...(productDetail.additionals || [])
        );
      }

      // Gabungkan additionals yang sama
      for (const key in groupedDetails) {
        let groupedAdditionals = {};
        for (const additional of groupedDetails[key].additionals) {
          let addKey = `${additional.productId}-${
            additional.variantId || "default"
          }`;

          if (!groupedAdditionals[addKey]) {
            groupedAdditionals[addKey] = { ...additional, qty: 0 };
          }
          groupedAdditionals[addKey].qty += additional.qty;
        }
        groupedDetails[key].additionals = Object.values(groupedAdditionals);
      }

      if (!skipValidation) {
        // Step 1: Validasi stok
        for (const key in groupedDetails) {
          const productDetail = groupedDetails[key];

          // Validasi komponen utama
          for (const component of productDetail.components) {
            const dbComponent = await Component.findById(component.componentId);
            const dbComponentWarehouse = warehouse.components.find(
              (e) => e.componentId.toString() === component.componentId
            );

            if (
              !dbComponent ||
              dbComponentWarehouse.qty.current <
                component.qty * productDetail.qty
            ) {
              return Promise.reject({
                error: true,
                message: {
                  en: `${dbComponent?.name || "Component"} is insufficient.`,
                  id: `Bahan baku ${
                    dbComponent?.name || "Component"
                  } tidak mencukupi.`,
                },
              });
            }
          }
        }
      }

      // Step 2: Update stok setelah validasi sukses atau jika payment === 'returned'
      for (const key in groupedDetails) {
        const productDetail = groupedDetails[key];

        // Update stok komponen utama
        for (const component of productDetail.components) {
          let dbComponentWarehouse = warehouse.components.find(
            (e) => e.componentId.toString() === component.componentId
          );

          let dbComponentWarehouseFindIndex = warehouse.components.findIndex(
            (e) => e.componentId.toString() === component.componentId
          );

          dbComponentWarehouse.qty.current += skipValidation
            ? component.qty * productDetail.qty
            : -component.qty * productDetail.qty;

          // Update status berdasarkan stok terkini
          const newStatus =
            dbComponentWarehouse.qty.current <= 0
              ? "outOfStock"
              : dbComponentWarehouse.qty.current <= dbComponentWarehouse.qty.min
              ? "almostOut"
              : "available";

          dbComponentWarehouse.qty.status = newStatus;

          warehouse.components[dbComponentWarehouseFindIndex] =
            dbComponentWarehouse;

          await Warehouse.findByIdAndUpdate(req.body.warehouseId, warehouse, {
            new: true,
          });
        }

        // Update stok produk utama (jika countable)
        warehouse = await Warehouse.findById(req.body.warehouseId);
        const product = await Product.findById(productDetail.productId);
        if (product.countable) {
          let dbProductWarehouse = warehouse.products.find(
            (e) => e.productId.toString() === productDetail.productId
          );

          let dbProductWarehouseFindIndex = warehouse.products.findIndex(
            (e) => e.productId.toString() === productDetail.productId
          );

          let dbProductVariantWarehouseFindIndex =
            dbProductWarehouse.variants.findIndex(
              (e) => e.variantId.toString() === productDetail.variantId
            );

          dbProductWarehouse.variants[dbProductVariantWarehouseFindIndex].qty +=
            skipValidation ? productDetail.qty : -productDetail.qty;

          warehouse.products[dbProductWarehouseFindIndex] = dbProductWarehouse;

          await Warehouse.findByIdAndUpdate(req.body.warehouseId, warehouse, {
            new: true,
          });
        }

        warehouse = await Warehouse.findById(req.body.warehouseId);
        // Update stok additionals
        for (const additional of productDetail.additionals) {
          for (const component of additional.components) {
            let dbAdditionalComponentWarehouse = warehouse.components.find(
              (e) => e.componentId.toString() === req.body.warehouseId
            );

            let dbAdditionalComponentWarehouseFindIndex =
              warehouse.components.findIndex(
                (e) => e.componentId.toString() === req.body.warehouseId
              );

            dbAdditionalComponentWarehouse.qty.current += skipValidation
              ? component.qty * additional.qty
              : -component.qty * additional.qty;

            dbAdditionalComponentWarehouse.qty.status = newAdditionalStatus;

            warehouse.components[dbAdditionalComponentWarehouseFindIndex] =
              dbAdditionalComponentWarehouse;

            await Warehouse.findByIdAndUpdate(req.body.warehouseId, warehouse, {
              new: true,
            });
          }

          // Update stok varian produk tambahan (jika countable)
          const additionalProduct = await Product.findById(
            additional.productId
          );
          if (additionalProduct.countable) {
            warehouse = await Warehouse.findById(req.body.warehouseId);

            let dbAdditionalProductWarehouse = warehouse.products.find(
              (e) => e.productId.toString() === additional.productId
            );

            let dbAdditionalProductWarehouseFindIndex =
              warehouse.products.findIndex(
                (e) => e.productId.toString() === additional.productId
              );

            dbAdditionalProductWarehouse.qty += skipValidation
              ? additional.qty
              : -additional.qty;

            warehouse.products[dbAdditionalProductWarehouseFindIndex] =
              dbAdditionalProductWarehouse;

            await Warehouse.findByIdAndUpdate(req.body.warehouseId, warehouse, {
              new: true,
            });
          }
        }
      }

      // Step 3: Simpan transaksi
      let payload = {
        ...req.body,
        request: generateRequestCodes(),
        createdAt: dateISOString,
        updatedAt: dateISOString,
      };

      const transaction = new Transaction(payload);
      await transaction.save();

      return Promise.resolve({
        error: false,
        data: transaction,
        message: successMessages.TRANSACTION_CREATED_SUCCESS,
      });
    } catch (error) {
      console.error(error);
      return Promise.reject({
        error: true,
        message: {
          en: "There was an error processing the transaction.",
          id: "Terjadi kesalahan saat memproses transaksi.",
        },
      });
    }
  },

  get: async (req) => {
    let { businessId, outletId, from, to } = req.query;
    let dateISOString = new Date().toISOString();
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    let defaultFrom = formatController.convertToLocaleISOString(
      dateISOString,
      "start"
    );
    let defaultTo = formatController.convertToLocaleISOString(
      dateISOString,
      "end"
    );

    // Membuat pipeline dengan logika yang lebih sederhana
    let pipeline = {
      createdAt: {
        $gte: from
          ? formatController.convertToLocaleISOString(from, "start")
          : defaultFrom,
        $lte: to
          ? formatController.convertToLocaleISOStringNextDay(to, "end")
          : defaultTo,
      },
    };

    if (businessId) {
      pipeline.businessId = businessId;
    }

    if (outletId) {
      pipeline.outletId = outletId;
    }

    try {
      // Fetch data transaksi berdasarkan periode
      const transactions = await pageController.paginate(
        pageKey,
        pageSize,
        pipeline,
        Transaction,
        -1
      );

      // Populate secara paralel menggunakan Promise.all
      await Promise.all(
        transactions.data.map(async (transaction) => {
          transaction.businessId = await dataController.populateFieldById(
            Business,
            transaction.businessId
          );
          transaction.userId = await dataController.populateFieldById(
            User,
            transaction.userId
          );
          transaction.customerId = transaction.customerId
            ? await dataController.populateFieldById(
                Customer,
                transaction.customerId
              )
            : null;
          transaction.outletId = await dataController.populateFieldById(
            Outlet,
            transaction.outletId
          );
          transaction.serviceMethodId = await dataController.populateFieldById(
            ServiceMethod,
            transaction.serviceMethodId
          );
          transaction.paymentMethodId = await dataController.populateFieldById(
            PaymentMethod,
            transaction.paymentMethodId
          );
          req.body.warehouseId = await dataController.populateFieldById(
            Warehouse,
            req.body.warehouseId
          );

          // Populate charges, promotions, dan taxes secara paralel
          await Promise.all(
            transaction.charges.map(async (charge) => {
              charge.chargeId = await dataController.populateFieldById(
                Charge,
                charge.chargeId
              );
            })
          );

          await Promise.all(
            transaction.promotions.map(async (promotion) => {
              promotion.promotionId = await dataController.populateFieldById(
                Promotion,
                promotion.promotionId
              );
            })
          );

          await Promise.all(
            transaction.taxes.map(async (tax) => {
              tax.taxId = await dataController.populateFieldById(
                Tax,
                tax.taxId
              );
            })
          );

          // Populate details dan additionals secara paralel
          await Promise.all(
            transaction.details.map(async (detail) => {
              await Promise.all(
                detail.components.map(async (component) => {
                  component.componentId =
                    await dataController.populateFieldById(
                      Component,
                      component.componentId
                    );
                })
              );

              await Promise.all(
                (detail.additionals || []).map(async (additional) => {
                  await Promise.all(
                    additional.components.map(async (component) => {
                      component.componentId =
                        await dataController.populateFieldById(
                          Component,
                          component.componentId
                        );
                    })
                  );
                })
              );
            })
          );
        })
      );

      return {
        error: false,
        data: transactions.data,
        count: transactions.count,
      };
    } catch (err) {
      console.error("Error:", err); // Tambahkan logging
      return {
        error: true,
        message: err.message || {
          en: "Unknown error!",
          id: "Terjadi Kesalahan yang Tidak Dikenali!",
        },
      };
    }
  },

  update: async (req) => {
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    const { transactionId, data } = req.body;
    if (!transactionId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    data["changedBy"] = userByToken._id;
    data["updatedAt"] = dateISOString;

    try {
      // Dapatkan transaksi yang akan diupdate
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return { error: true, message: errorMessages.TRANSACTION_NOT_FOUND };
      }

      // Jika status payment adalah "canceled"
      if (data.status.payment === "canceled") {
        // Loop setiap detail produk untuk mengembalikan qty setiap komponen terkait
        let warehouse = await Warehouse.findById(transaction.warehouseId);

        for (const detail of transaction.details) {
          // 1. Update stok produk utama dengan mempertimbangkan varian
          const product = await Product.findById(detail.productId);

          if (product && product.countable) {
            let dbProductWarehouse = warehouse.products.find(
              (e) => e.productId.toString() === detail.productId
            );

            let dbProductWarehouseFindIndex = warehouse.products.findIndex(
              (e) => e.productId.toString() === detail.productId
            );

            let dbProductVariantWarehouseFindIndex =
              dbProductWarehouse.variants.findIndex(
                (e) => e.variantId.toString() === detail.productId
              );
            if (detail.variantId) {
              // Temukan varian yang sesuai dan update qty-nya

              if (dbProductVariantWarehouseFindIndex !== -1) {
                dbProductWarehouse.variants[
                  dbProductVariantWarehouseFindIndex
                ].qty += detail.qty;
              }
            } else {
              // Jika tidak ada varian, update qty produk langsung
              dbProductWarehouse.qty += detail.qty;
            }

            warehouse.products[dbProductWarehouseFindIndex] =
              dbProductWarehouse;

            await Warehouse.findByIdAndUpdate(
              transaction.warehouseId,
              warehouse,
              {
                new: true,
              }
            );
          }

          warehouse = await Warehouse.findById(transaction.warehouseId);

          // 2. Update stok komponen utama dan tambahan
          for (const componentDetail of [
            ...detail.components,
            ...detail.additionals.flatMap(
              (additional) => additional.components
            ),
          ]) {
            // const component = await Component.findById(
            //   componentDetail.componentId
            // );

            let dbComponentWarehouse = warehouse.components.find(
              (e) => e.componentId.toString() === componentDetail.componentId
            );

            let dbComponentWarehouseFindIndex = warehouse.components.findIndex(
              (e) => e.componentId.toString() === componentDetail.componentId
            );

            if (dbComponentWarehouse) {
              // Tambahkan kembali qty.current dari komponen
              dbComponentWarehouse.qty.current +=
                componentDetail.qty * detail.qty;

              // Tentukan qty.status berdasarkan kondisi qty.current dan qty.min
              if (dbComponentWarehouse.qty.current <= 0) {
                dbComponentWarehouse.qty.status = "outOfStock";
              } else if (
                dbComponentWarehouse.qty.current <= dbComponentWarehouse.qty.min
              ) {
                dbComponentWarehouse.qty.status = "almostOut";
              } else {
                dbComponentWarehouse.qty.status = "available";
              }

              warehouse.components[dbComponentWarehouseFindIndex] =
                dbComponentWarehouse;

              await Warehouse.findByIdAndUpdate(
                transaction.warehouseId,
                warehouse,
                {
                  new: true,
                }
              );
            }
          }

          warehouse = await Warehouse.findById(transaction.warehouseId);
          // 3. Update stok produk tambahan (additionals) dengan mempertimbangkan varian
          for (const additional of detail.additionals) {
            const additionalProduct = await Product.findById(
              additional.productId
            );

            if (additionalProduct && additionalProduct.countable) {
              let dbAdditionalProductWarehouse = warehouse.products.find(
                (e) => e.productId.toString() === additional.productId
              );

              let dbAdditionalProductWarehouseFindIndex =
                warehouse.products.findIndex(
                  (e) => e.productId.toString() === additional.productId
                );

              let dbAdditionalProductVariantWarehouseFindIndex =
                dbAdditionalProductWarehouse.variants.find(
                  (e) => e.variantId.toString() === additional.variantId
                );
              if (additional.variantId) {
                if (dbAdditionalProductVariantWarehouseFindIndex !== -1) {
                  dbAdditionalProductWarehouse.variants[
                    dbAdditionalProductVariantWarehouseFindIndex
                  ].qty += additional.qty;
                }
              } else {
                // Jika tidak ada varian, update qty produk langsung
                dbAdditionalProductWarehouse.qty += additional.qty;
              }

              warehouse.products[dbAdditionalProductWarehouseFindIndex] =
                dbAdditionalProductWarehouse;

              await Warehouse.findByIdAndUpdate(
                transaction.warehouseId,
                warehouse,
                {
                  new: true,
                }
              );
            }
          }
        }
      }

      // Update transaksi dengan data baru
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        transactionId,
        data,
        { new: true }
      );

      return {
        error: false,
        data: updatedTransaction,
        message: successMessages.DATA_SUCCESS_UPDATED,
      };
    } catch (err) {
      return { error: true, message: err.message || "Unknown error" };
    }
  },
};
