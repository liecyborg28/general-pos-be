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
  create: async (req) => {
    try {
      const { details, status } = req.body;
      let dateISOString = new Date().toISOString();
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
            if (
              !dbComponent ||
              dbComponent.qty.current < component.qty * productDetail.qty
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
          const updatedComponent = await Component.findByIdAndUpdate(
            component.componentId,
            {
              $inc: {
                "qty.current": skipValidation
                  ? component.qty * productDetail.qty
                  : -component.qty * productDetail.qty,
              },
            },
            { new: true }
          );

          // Update status berdasarkan stok terkini
          const newStatus =
            updatedComponent.qty.current <= 0
              ? "outOfStock"
              : updatedComponent.qty.current <= updatedComponent.qty.min
              ? "almostOut"
              : "available";

          await Component.findByIdAndUpdate(
            component.componentId,
            { "qty.status": newStatus },
            { new: true }
          );
        }

        // Update stok produk utama (jika countable)
        const product = await Product.findById(productDetail.productId);
        if (product.countable) {
          await Product.updateOne(
            { _id: product._id, "variants._id": productDetail.variantId },
            {
              $inc: {
                "variants.$.qty": skipValidation
                  ? productDetail.qty
                  : -productDetail.qty,
              },
            }
          );
        }

        // Update stok additionals
        for (const additional of productDetail.additionals) {
          for (const component of additional.components) {
            const updatedAdditionalComponent =
              await Component.findByIdAndUpdate(
                component.componentId,
                {
                  $inc: {
                    "qty.current": skipValidation
                      ? component.qty * additional.qty
                      : -component.qty * additional.qty,
                  },
                },
                { new: true }
              );

            // Update status berdasarkan stok terkini
            const newAdditionalStatus =
              updatedAdditionalComponent.qty.current <= 0
                ? "outOfStock"
                : updatedAdditionalComponent.qty.current <=
                  updatedAdditionalComponent.qty.min
                ? "almostOut"
                : "available";

            await Component.findByIdAndUpdate(
              component.componentId,
              { "qty.status": newAdditionalStatus },
              { new: true }
            );
          }

          // Update stok varian produk tambahan (jika countable)
          const additionalProduct = await Product.findById(
            additional.productId
          );
          if (additionalProduct.countable) {
            await Product.updateOne(
              {
                _id: additionalProduct._id,
                "variants._id": additional.variantId,
              },
              {
                $inc: {
                  "variants.$.qty": skipValidation
                    ? additional.qty
                    : -additional.qty,
                },
              }
            );
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
        $gte: req.query.from
          ? formatController.convertToLocaleISOString(req.query.from, "start")
          : defaultFrom,
        $lte: req.query.to
          ? formatController.convertToLocaleISOStringNextDay(
              req.query.to,
              "end"
            )
          : defaultTo,
      },
    };

    if (req.query.businessId) {
      pipeline.businessId = req.query.businessId;
    }

    if (req.query.outletId) {
      pipeline.outletId = req.query.outletId;
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
        for (const detail of transaction.details) {
          // 1. Update stok produk utama dengan mempertimbangkan varian
          const product = await Product.findById(detail.productId);
          if (product && product.countable) {
            if (detail.variantId) {
              // Temukan varian yang sesuai dan update qty-nya
              const variantIndex = product.variants.findIndex(
                (v) => v._id.toString() === detail.variantId
              );
              if (variantIndex !== -1) {
                product.variants[variantIndex].qty += detail.qty;
              }
            } else {
              // Jika tidak ada varian, update qty produk langsung
              product.qty += detail.qty;
            }
            await product.save();
          }

          // 2. Update stok komponen utama dan tambahan
          for (const componentDetail of [
            ...detail.components,
            ...detail.additionals.flatMap(
              (additional) => additional.components
            ),
          ]) {
            const component = await Component.findById(
              componentDetail.componentId
            );
            if (component) {
              // Tambahkan kembali qty.current dari komponen
              component.qty.current += componentDetail.qty * detail.qty;

              // Tentukan qty.status berdasarkan kondisi qty.current dan qty.min
              if (component.qty.current <= 0) {
                component.qty.status = "outOfStock";
              } else if (component.qty.current <= component.qty.min) {
                component.qty.status = "almostOut";
              } else {
                component.qty.status = "available";
              }

              await component.save();
            }
          }

          // 3. Update stok produk tambahan (additionals) dengan mempertimbangkan varian
          for (const additional of detail.additionals) {
            const additionalProduct = await Product.findById(
              additional.productId
            );
            if (additionalProduct && additionalProduct.countable) {
              if (additional.variantId) {
                // Update qty pada varian tambahan jika ada
                const variantIndex = additionalProduct.variants.findIndex(
                  (v) => v._id.toString() === additional.variantId
                );
                if (variantIndex !== -1) {
                  additionalProduct.variants[variantIndex].qty +=
                    additional.qty;
                }
              } else {
                // Jika tidak ada varian, update qty produk langsung
                additionalProduct.qty += additional.qty;
              }
              await additionalProduct.save();
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
