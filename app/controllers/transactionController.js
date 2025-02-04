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

  const reversedValueCode = parseInt(
    valueCode.toString().split("").reverse().join("")
  );

  return { status: "initial", viewCode, valueCode: reversedValueCode };
}

module.exports = {
  create: async (req) => {
    try {
      const { details } = req.body;

      let dateISOString = new Date().toISOString();

      // Step 1: Cek semua komponen dan varian dari setiap produk
      for (const productDetail of details) {
        // Validasi komponen utama
        for (const component of productDetail.components) {
          const dbComponent = await Component.findById(component.componentId);

          if (!dbComponent || dbComponent.qty.current < component.qty) {
            return Promise.reject({
              error: true,
              message: {
                en: `${dbComponent.name} is insufficient.`,
                id: `Bahan baku ${dbComponent.name} tidak mencukupi.`,
              },
            });
          }
        }

        // Validasi stok varian produk (jika countable = true)
        const product = await Product.findById(productDetail.productId);
        if (product.countable) {
          const variant = product.variants.find(
            (v) => v._id.toString() === productDetail.variantId
          );
          if (!variant || variant.qty < productDetail.qty) {
            return Promise.reject({
              error: true,
              message: {
                en: `The stock of the product variant ${
                  variant?.name || "unknown"
                } is insufficient.`,
                id: `Stok varian produk ${
                  variant?.name || "tidak diketahui"
                } tidak mencukupi.`,
              },
            });
          }
        }

        // Validasi komponen pada additionals
        if (productDetail.additionals) {
          for (const additional of productDetail.additionals) {
            for (const component of additional.components) {
              const dbComponent = await Component.findById(
                component.componentId
              );

              if (!dbComponent || dbComponent.qty.current < component.qty) {
                return Promise.reject({
                  error: true,
                  message: {
                    en: `The stock of raw materials for ${component.name} in additionals is insufficient.`,
                    id: `Bahan baku untuk ${component.name} di bagian tambahan tidak mencukupi.`,
                  },
                });
              }
            }

            // Validasi stok varian produk pada additionals (jika countable = true)
            const additionalProduct = await Product.findById(
              additional.productId
            );
            if (additionalProduct.countable) {
              const additionalVariant = additionalProduct.variants.find(
                (v) => v._id.toString() === additional.variantId
              );
              if (
                !additionalVariant ||
                additionalVariant.qty < productDetail.qty
              ) {
                return Promise.reject({
                  error: true,
                  message: {
                    en: `The stock of the product variant ${
                      additionalVariant?.name || "unknown"
                    } in additionals is insufficient.`,
                    id: `Stok varian produk ${
                      additionalVariant?.name || "tidak diketahui"
                    } di bagian tambahan tidak mencukupi.`,
                  },
                });
              }
            }
          }
        }
      }

      // Step 2: Update qty setelah semua cukup
      for (const productDetail of details) {
        // Update stok komponen utama
        for (const component of productDetail.components) {
          // Langkah 1: Kurangi qty.current dengan $inc dan dapatkan dokumen terbaru
          const updatedComponent = await Component.findByIdAndUpdate(
            component.componentId,
            { $inc: { "qty.current": -component.qty } },
            { new: true } // Pastikan mendapatkan dokumen terbaru setelah update
          );

          // Langkah 2: Tentukan status berdasarkan nilai updatedComponent.qty.current
          const newStatus =
            updatedComponent.qty.current <= 0
              ? "outOfStock"
              : updatedComponent.qty.current <= updatedComponent.qty.min
              ? "almostOut"
              : "available";

          // Langkah 3: Perbarui qty.status menggunakan nilai terbaru
          await Component.findByIdAndUpdate(
            component.componentId,
            { "qty.status": newStatus },
            { new: true }
          );
        }

        // Update stok varian produk (jika countable = true)
        const product = await Product.findById(productDetail.productId);
        if (product.countable) {
          await Product.updateOne(
            { _id: product._id, "variants._id": productDetail.variantId },
            {
              $inc: { "variants.$.qty": -productDetail.qty },
            }
          );
        }

        // Update stok komponen pada additionals
        if (productDetail.additionals) {
          for (const additional of productDetail.additionals) {
            for (const component of additional.components) {
              await Component.findByIdAndUpdate(
                component.componentId,
                {
                  $inc: { "qty.current": -component.qty },
                },
                { new: true }
              );
            }

            // Update stok varian produk pada additionals (jika countable = true)
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
                  $inc: { "variants.$.qty": -productDetail.qty },
                }
              );
            }
          }
        }
      }

      let payload = {
        ...req.body,
        createdAt: dateISOString,
        updatedAt: dateISOString,
      };

      // Step 3: Simpan transaksi
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

      // Jika status order adalah "canceled"
      if (data.status.payment === "canceled") {
        // Loop setiap detail produk untuk mengembalikan qty setiap komponen terkait
        for (const detail of transaction.details) {
          // Temukan produk
          const product = await Product.findById(detail.productId);

          if (product && product.countable) {
            // Tambahkan kembali qty produk
            product.qty += detail.qty;
            await product.save();
          }

          // Loop komponen utama dan tambahan
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

              // Simpan perubahan pada komponen
              await component.save();
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
