// utils
const authUtils = require("../utility/authUtils");

// models
const Business = require("../models/businessModel");
const Category = require("../models/categoryModel");
const Charge = require("../models/chargeModel");
const Component = require("../models/componentModel");
const Customer = require("../models/customerModel");
const Currency = require("../models/currencyModel");
const Outlet = require("../models/outletModel");
const PaymentMethod = require("../models/paymentMethodModel");
const Product = require("../models/productModel");
const Promotion = require("../models/promotionModel");
const Role = require("../models/roleModel");
const ServiceMethod = require("../models/serviceMethodModel");
const Supplier = require("../models/supplierModel");
const Tax = require("../models/taxModel");
const Unit = require("../models/unitModel");
const User = require("../models/userModel");

// controllers
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  checkAccess: (req) => {
    return new Promise((resolve, reject) => {
      const bearerHeader = req.headers["authorization"];

      if (typeof bearerHeader !== "undefined") {
        const bearerToken = bearerHeader.split(" ")[1];
        User.find({
          "auth.accessToken": bearerToken,
        }).then((data) => {
          data.length > 0
            ? resolve({ error: false, message: successMessages.AUTHORIZED })
            : reject({
                error: true,
                message: errorMessages.SESSION_ENDED,
              });
        });
      } else {
        reject({
          error: true,
          message: errorMessages.UNAUTHORIZED,
        });
      }
    });
  },

  createAccess: (req) => {
    return new Promise(async (resolve, reject) => {
      const body = req.body;

      const key = "PhantomLyoko28%";

      if (body.key) {
        if (body.key === key) {
          const dateISOString = new Date().toISOString();

          const businessesPayload = [
            {
              status: "active",
              imageUrl: null,
              name: "Business Name",
              note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
              createdAt: dateISOString,
              updatedAt: dateISOString,
            },
          ];

          Business.insertMany(businessesPayload, { ordered: true })
            .then((businesses) => {
              const outletsPayload = [
                {
                  address:
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                  businessId: businesses[0]._id.toString(),
                  name: "Outlet Name",
                  note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                  status: "active",
                  // timestamp
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                },
              ];

              const paymentMethodsPayload = [
                {
                  businessId: businesses[0]._id.toString(),
                  name: "Tunai",
                  default: true,
                  status: "active",
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                },
                {
                  businessId: businesses[0]._id.toString(),
                  name: "Kartu Debit",
                  default: false,
                  status: "active",
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                },
                {
                  businessId: businesses[0]._id.toString(),
                  name: "QRIS",
                  default: false,
                  status: "active",
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                },
                {
                  businessId: businesses[0]._id.toString(),
                  name: "Transfer Bank",
                  default: false,
                  status: "active",
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                },
                {
                  businessId: businesses[0]._id.toString(),
                  name: "Mesin EDC",
                  default: false,
                  status: "active",
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                },
              ];

              PaymentMethod.insertMany(paymentMethodsPayload, {
                ordered: true,
              })
                .then((paymentMethods) => {
                  const serviceMethodsPayload = [
                    {
                      businessId: businesses[0]._id.toString(),
                      name: "Dine In",
                      default: false,
                      status: "active",
                      createdAt: dateISOString,
                      updatedAt: dateISOString,
                    },
                    {
                      businessId: businesses[0]._id.toString(),
                      name: "Take Away",
                      default: false,
                      status: "active",
                      createdAt: dateISOString,
                      updatedAt: dateISOString,
                    },
                    {
                      businessId: businesses[0]._id.toString(),
                      name: "Drive Thru",
                      default: false,
                      status: "active",
                      createdAt: dateISOString,
                      updatedAt: dateISOString,
                    },
                  ];

                  ServiceMethod.insertMany(serviceMethodsPayload, {
                    ordered: true,
                  }).then((serviceMethods) => {
                    Outlet.insertMany(outletsPayload, { ordered: true }).then(
                      (outlets) => {
                        const rolesPayload = [
                          {
                            access: [
                              // businesses
                              "/management/businesses",
                              "/management/business/add",
                              "/management/business/edit",
                              // outlets
                              "/management/outlets",
                              "/management/outlet/add",
                              "/management/outlet/edit",
                              // charges
                              "/management/charges",
                              "/management/charge/add",
                              "/management/charge/edit",
                              // promotions
                              "/management/promotions",
                              "/management/promotion/add",
                              "/management/promotion/edit",
                              // taxes
                              "/management/taxes",
                              "/management/tax/add",
                              "/management/tax/edit",
                              // serviceMethods
                              "/management/service/methods",
                              "/management/service/method/add",
                              "/management/service/method/edit",
                              // paymentMethods
                              "/management/payment/methods",
                              "/management/payment/method/add",
                              "/management/payment/method/edit",
                              // currencies
                              "/management/currencies",
                              "/management/currency/add",
                              "/management/currency/edit",
                              // suppliers
                              "/management/suppliers",
                              "/management/supplier/add",
                              "/management/supplier/edit",
                              // customers
                              "/management/customers",
                              "/management/customer/add",
                              "/management/customer/edit",
                              // roles
                              "/management/roles",
                              "/management/role/add",
                              "/management/role/edit",
                              // categories
                              "/management/categories",
                              "/management/category/add",
                              "/management/category/edit",
                              // components
                              "/management/components",
                              "/management/component/add",
                              "/management/component/edit",
                              // products
                              "/management/products",
                              "/management/product/add",
                              "/management/product/edit",
                              // units
                              "/management/units",
                              "/management/unit/add",
                              "/management/unit/edit",
                              // users
                              "/management/users",
                              "/management/user/add",
                              "/management/user/edit",
                              // settings
                              "/settings/device",
                              "/settings/account",
                            ],
                            businessId: businesses[0]._id.toString(),
                            name: "administrator",
                            status: "active",
                            createdAt: dateISOString,
                            updatedAt: dateISOString,
                          },
                        ];

                        Role.insertMany(rolesPayload, { ordered: true })
                          .then((roles) => {
                            const usersPayload = [
                              {
                                auth: {
                                  accessToken: authUtils.generateAccessToken(),
                                  expiredAt:
                                    authUtils.generateExpirationDate(7),
                                },
                                businessId: businesses[0]._id.toString(),
                                email: null,
                                gender: "male",
                                imageUrl: null,
                                name: "User Name",
                                password: "12345678",
                                phone: null,
                                roleId: roles[0]._id.toString(),
                                settings: {
                                  theme: "light",
                                  language: "id",
                                },
                                status: "active",
                                username: "admin",
                                // timestamp
                                createdAt: dateISOString,
                                updatedAt: dateISOString,
                              },
                              {
                                auth: {
                                  accessToken: authUtils.generateAccessToken(),
                                  expiredAt:
                                    authUtils.generateExpirationDate(7),
                                },
                                businessId: businesses[0]._id.toString(),
                                email: null,
                                gender: "female",
                                imageUrl: null,
                                name: "User Name 2",
                                password: "12345678",
                                phone: null,
                                roleId: roles[0]._id.toString(),
                                settings: {
                                  theme: "light",
                                  language: "id",
                                },
                                status: "active",
                                username: "admin2",
                                // timestamp
                                createdAt: dateISOString,
                                updatedAt: dateISOString,
                              },
                            ];

                            User.insertMany(usersPayload, { ordered: true })
                              .then((users) => {
                                const categoriesPayload = [
                                  {
                                    businessId: businesses[0]._id.toString(),
                                    name: "Category Name",
                                    status: "active",
                                    createdAt: dateISOString,
                                    updatedAt: dateISOString,
                                  },
                                ];

                                Category.insertMany(categoriesPayload, {
                                  ordered: true,
                                })
                                  .then((categories) => {
                                    const unitsPayload = [
                                      {
                                        businessId:
                                          businesses[0]._id.toString(),
                                        name: "Gram",
                                        status: "active",
                                        symbol: "gr",
                                        createdAt: dateISOString,
                                        updatedAt: dateISOString,
                                      },
                                      {
                                        businessId:
                                          businesses[0]._id.toString(),
                                        name: "Kilogram",
                                        status: "active",
                                        symbol: "kg",
                                        createdAt: dateISOString,
                                        updatedAt: dateISOString,
                                      },
                                      {
                                        businessId:
                                          businesses[0]._id.toString(),
                                        name: "Liter",
                                        status: "active",
                                        symbol: "L",
                                        createdAt: dateISOString,
                                        updatedAt: dateISOString,
                                      },
                                      {
                                        businessId:
                                          businesses[0]._id.toString(),
                                        name: "Lusin",
                                        status: "active",
                                        symbol: "lusin",
                                        createdAt: dateISOString,
                                        updatedAt: dateISOString,
                                      },
                                      {
                                        businessId:
                                          businesses[0]._id.toString(),
                                        name: "Ons",
                                        status: "active",
                                        symbol: "ons",
                                        createdAt: dateISOString,
                                        updatedAt: dateISOString,
                                      },
                                      {
                                        businessId:
                                          businesses[0]._id.toString(),
                                        name: "Pieces",
                                        status: "active",
                                        symbol: "pcs",
                                        createdAt: dateISOString,
                                        updatedAt: dateISOString,
                                      },
                                    ];

                                    Unit.insertMany(unitsPayload, {
                                      ordered: true,
                                    })
                                      .then((units) => {
                                        const currenciesPayload = [
                                          {
                                            businessId:
                                              businesses[0]._id.toString(),
                                            decimal: ",",
                                            name: "Rupiah",
                                            separator: ".",
                                            status: "active",
                                            symbol: "Rp",
                                            totalDecimal: 2,
                                            createdAt: dateISOString,
                                            updatedAt: dateISOString,
                                          },
                                          {
                                            businessId:
                                              businesses[0]._id.toString(),
                                            decimal: ".",
                                            name: "Dollar",
                                            separator: ",",
                                            status: "active",
                                            symbol: "$",
                                            totalDecimal: 2,
                                            createdAt: dateISOString,
                                            updatedAt: dateISOString,
                                          },
                                        ];

                                        Currency.insertMany(currenciesPayload, {
                                          ordered: true,
                                        }).then((currencies) => {
                                          const suppliersPayload = [
                                            {
                                              businessId:
                                                businesses[0]._id.toString(),
                                              email: null,
                                              imageUrl: null,
                                              name: "Supplier Name",
                                              phone: "+62852123456799",
                                              status: "active",
                                              // timestamp
                                              createdAt: dateISOString,
                                              updatedAt: dateISOString,
                                            },
                                          ];

                                          Supplier.insertMany(
                                            suppliersPayload,
                                            { ordered: true }
                                          )
                                            .then((suppliers) => {
                                              const componentsPayload = [
                                                {
                                                  businessId:
                                                    businesses[0]._id.toString(),
                                                  categoryId:
                                                    categories[0]._id.toString(),
                                                  changedBy:
                                                    users[0]._id.toString(),
                                                  imageUrl: null,
                                                  name: "Component Name",
                                                  status: "active",
                                                  unitId:
                                                    units[0]._id.toString(),
                                                  qty: {
                                                    current: 20,
                                                    max: 100,
                                                    min: 5,
                                                    status: "available",
                                                  },
                                                  createdAt: dateISOString,
                                                  updatedAt: dateISOString,
                                                },
                                              ];

                                              Component.insertMany(
                                                componentsPayload,
                                                {
                                                  ordered: true,
                                                }
                                              )
                                                .then((components) => {
                                                  const productsPayload = [
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[0]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: null,
                                                        qr: null,
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Product Name",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[0]._id.toString(),
                                                              qty: 1,
                                                            },
                                                          ],
                                                          cost: 5000,
                                                          description:
                                                            "Description For Variant 1",
                                                          default: true,
                                                          imageUrl: null,
                                                          name: "Variant 1",
                                                          price: 10000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      qty: 0,
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },
                                                  ];

                                                  Product.insertMany(
                                                    productsPayload,
                                                    {
                                                      ordered: true,
                                                    }
                                                  )
                                                    .then((products) => {
                                                      const chargesPayload = [
                                                        {
                                                          amount: 0.15,
                                                          businessId:
                                                            businesses[0]._id.toString(),
                                                          changedBy:
                                                            users[0]._id.toString(),
                                                          default: false,
                                                          name: "Percentage Charge",
                                                          type: "percentage",
                                                          status: "active",
                                                          createdAt:
                                                            dateISOString,
                                                          updatedAt:
                                                            dateISOString,
                                                        },
                                                        {
                                                          amount: 7000,
                                                          businessId:
                                                            businesses[0]._id.toString(),
                                                          changedBy:
                                                            users[0]._id.toString(),
                                                          default: false,
                                                          name: "Fixed Charge",
                                                          type: "fixed",
                                                          status: "active",
                                                          createdAt:
                                                            dateISOString,
                                                          updatedAt:
                                                            dateISOString,
                                                        },
                                                      ];

                                                      Charge.insertMany(
                                                        chargesPayload,
                                                        {
                                                          ordered: true,
                                                        }
                                                      )
                                                        .then((charges) => {
                                                          const promotionsPayload =
                                                            [
                                                              {
                                                                amount: 0.1,
                                                                businessId:
                                                                  businesses[0]._id.toString(),
                                                                changedBy:
                                                                  users[0]._id.toString(),
                                                                default: false,
                                                                name: "Percentage Promotion",
                                                                type: "percentage",
                                                                status:
                                                                  "active",
                                                                createdAt:
                                                                  dateISOString,
                                                                updatedAt:
                                                                  dateISOString,
                                                              },
                                                              {
                                                                amount: 7000,
                                                                businessId:
                                                                  businesses[0]._id.toString(),
                                                                changedBy:
                                                                  users[0]._id.toString(),
                                                                default: false,
                                                                name: "Fixed Promotion",
                                                                type: "fixed",
                                                                status:
                                                                  "active",
                                                                createdAt:
                                                                  dateISOString,
                                                                updatedAt:
                                                                  dateISOString,
                                                              },
                                                            ];

                                                          const taxesPayload = [
                                                            {
                                                              amount: 0.1,
                                                              businessId:
                                                                businesses[0]._id.toString(),
                                                              changedBy:
                                                                users[0]._id.toString(),
                                                              default: false,
                                                              name: "Percentage Tax",
                                                              type: "percentage",
                                                              status: "active",
                                                              createdAt:
                                                                dateISOString,
                                                              updatedAt:
                                                                dateISOString,
                                                            },
                                                            {
                                                              amount: 5000,
                                                              businessId:
                                                                businesses[0]._id.toString(),
                                                              changedBy:
                                                                users[0]._id.toString(),
                                                              default: false,
                                                              name: "Fixed Tax",
                                                              type: "fixed",
                                                              status: "active",
                                                              createdAt:
                                                                dateISOString,
                                                              updatedAt:
                                                                dateISOString,
                                                            },
                                                          ];

                                                          Tax.insertMany(
                                                            taxesPayload
                                                          )
                                                            .then((taxes) => {
                                                              Promotion.insertMany(
                                                                promotionsPayload,
                                                                {
                                                                  ordered: true,
                                                                }
                                                              )
                                                                .then(
                                                                  (
                                                                    promotions
                                                                  ) => {
                                                                    const customersPayload =
                                                                      [
                                                                        {
                                                                          balance: 0,
                                                                          businessId:
                                                                            businesses[0]._id.toString(),
                                                                          email:
                                                                            "example@gmail.com",
                                                                          imageUrl:
                                                                            null,
                                                                          name: "Customer Name",
                                                                          phone:
                                                                            "+62852123456789",
                                                                          point: 0,
                                                                          status:
                                                                            "active",
                                                                          // timestamp
                                                                          createdAt:
                                                                            dateISOString,
                                                                          updatedAt:
                                                                            dateISOString,
                                                                        },
                                                                      ];

                                                                    Customer.insertMany(
                                                                      customersPayload,
                                                                      {
                                                                        ordered: true,
                                                                      }
                                                                    )
                                                                      .then(
                                                                        (
                                                                          customers
                                                                        ) => {
                                                                          const purchaseOrders =
                                                                            [
                                                                              {
                                                                                amount: 25000,
                                                                                businessId:
                                                                                  businesses[0]._id.toString(),
                                                                                details:
                                                                                  [
                                                                                    {
                                                                                      componentId:
                                                                                        components[0]._id.toString(),
                                                                                      price: 2000,
                                                                                      qty: 2,
                                                                                    },
                                                                                  ],
                                                                                note: "Note untuk order pembelian",
                                                                                outletId:
                                                                                  outlets[0]._id.toString(),
                                                                                paymentMethodId:
                                                                                  paymentMethods[0]._id.toString(),
                                                                                status:
                                                                                  {
                                                                                    order:
                                                                                      "completed",
                                                                                    payment:
                                                                                      "completed",
                                                                                  },
                                                                                taxes:
                                                                                  [
                                                                                    {
                                                                                      amount: 0.1,
                                                                                      taxId:
                                                                                        taxes[0]._id.toString(),
                                                                                      type: "percentage",
                                                                                    },
                                                                                  ],
                                                                                userId:
                                                                                  users[0]._id.toString(),
                                                                              },
                                                                            ];
                                                                          const transactions =
                                                                            [
                                                                              {
                                                                                amount: 25000,
                                                                                businessId:
                                                                                  businesses[0]._id.toString(),
                                                                                customerId:
                                                                                  customers[0]._id.toString(),
                                                                                charges:
                                                                                  [
                                                                                    {
                                                                                      amount: 0.15,
                                                                                      chargeId:
                                                                                        charges[0]._id.toString(),
                                                                                      type: "percentage",
                                                                                    },
                                                                                  ],
                                                                                details:
                                                                                  [
                                                                                    {
                                                                                      additionals:
                                                                                        [
                                                                                          {
                                                                                            components:
                                                                                              [
                                                                                                {
                                                                                                  componentId:
                                                                                                    components[0]._id.toString(),
                                                                                                  qty: 2,
                                                                                                },
                                                                                              ],
                                                                                            cost: 3000,
                                                                                            price: 4000,
                                                                                            productId:
                                                                                              products[0]._id.toString(),
                                                                                            qty: 1,
                                                                                          },
                                                                                        ],
                                                                                      components:
                                                                                        [
                                                                                          {
                                                                                            componentId:
                                                                                              components[0]._id.toString(),
                                                                                            qty: 2,
                                                                                          },
                                                                                        ],
                                                                                      cost: 8000,
                                                                                      note: "Note Untuk Produk",
                                                                                      price: 22000,
                                                                                      productId:
                                                                                        products[0]._id.toString(),
                                                                                      qty: 2,
                                                                                    },
                                                                                  ],
                                                                                note: "Note untuk transaksi",
                                                                                outletId:
                                                                                  outlets[0]._id.toString(),
                                                                                paymentMethodId:
                                                                                  paymentMethods[0]._id.toString(),
                                                                                promotions:
                                                                                  [
                                                                                    {
                                                                                      amount: 0.1,
                                                                                      promotionId:
                                                                                        promotions[0]._id.toString(),
                                                                                      type: "percentage",
                                                                                    },
                                                                                  ],
                                                                                status:
                                                                                  {
                                                                                    order:
                                                                                      "queued",
                                                                                    payment:
                                                                                      "completed",
                                                                                  },
                                                                                serviceMethodId:
                                                                                  serviceMethods[0]._id.toString(),
                                                                                taxes:
                                                                                  [
                                                                                    {
                                                                                      amount: 0.1,
                                                                                      taxId:
                                                                                        taxes[0]._id.toString(),
                                                                                      type: "percentage",
                                                                                    },
                                                                                  ],
                                                                                tips: [
                                                                                  {
                                                                                    amount: 15000,
                                                                                    name: "Tip Service",
                                                                                    note: "Untuk pelayan baju merah servicenya oke banget!",
                                                                                  },
                                                                                ],
                                                                                userId:
                                                                                  users[0]._id.toString(),
                                                                              },
                                                                            ];

                                                                          resolve(
                                                                            {
                                                                              error: false,
                                                                              data: {
                                                                                businesses,
                                                                                outlets,
                                                                                roles,
                                                                                users,
                                                                                categories,
                                                                                units,
                                                                                currencies,
                                                                                components,
                                                                                products,
                                                                                charges,
                                                                                taxes,
                                                                                promotions,
                                                                                customers,
                                                                                paymentMethods,
                                                                                serviceMethods,
                                                                                suppliers,
                                                                                transactions,
                                                                                purchaseOrders,
                                                                              },
                                                                              message:
                                                                                successMessages.ACCESS_CREATED_SUCCESS,
                                                                            }
                                                                          );
                                                                        }
                                                                      )
                                                                      .catch(
                                                                        (
                                                                          err
                                                                        ) => {
                                                                          reject(
                                                                            {
                                                                              error: true,
                                                                              message:
                                                                                err,
                                                                            }
                                                                          );
                                                                        }
                                                                      );
                                                                  }
                                                                )
                                                                .catch(
                                                                  (err) => {
                                                                    reject({
                                                                      error: true,
                                                                      message:
                                                                        err,
                                                                    });
                                                                  }
                                                                );
                                                            })
                                                            .catch((err) => {
                                                              reject({
                                                                error: true,
                                                                message: err,
                                                              });
                                                            });
                                                        })
                                                        .catch((err) => {
                                                          reject({
                                                            error: true,
                                                            message: err,
                                                          });
                                                        });
                                                    })
                                                    .catch((err) => {
                                                      reject({
                                                        error: true,
                                                        message: err,
                                                      });
                                                    });
                                                })
                                                .catch((err) => {
                                                  reject({
                                                    error: true,
                                                    message: err,
                                                  });
                                                });
                                            })
                                            .catch((err) => {
                                              reject({
                                                error: true,
                                                message: err,
                                              });
                                            });
                                        });
                                      })
                                      .catch((err) => {
                                        reject({ error: true, message: err });
                                      });
                                  })
                                  .catch((err) => {
                                    reject({ error: true, message: err });
                                  });
                              })
                              .catch((err) => {
                                reject({ error: true, message: err });
                              });
                          })
                          .catch((err) => {
                            reject({ error: true, message: err });
                          });
                      }
                    );
                  });
                })
                .catch((err) => {
                  reject({ error: true, message: err });
                });
            })
            .catch((err) => {
              reject({ error: true, message: err });
            });
        } else {
          reject({
            error: true,
            message: errorMessages.KEY_FAILED,
          });
        }
      } else {
        reject({
          error: true,
          message: errorMessages.INVALID_DATA,
        });
      }
    });
  },
  generateAuth: () => {
    return {
      accessToken: authUtils.generateAccessToken(),
      expiredAt: authUtils.generateExpirationDate(7),
    };
  },
  login: (req) => {
    return new Promise((resolve, reject) => {
      User.findOne({
        status: { $ne: "deleted" },
        $or: [{ username: req.body.username, password: req.body.password }],
      })
        .catch((err) => {
          return Promise.reject({ error: true, message: err });
        })
        .then((result) => {
          if (result) {
            if (result.status === "inactive") {
              reject({
                error: true,
                message: errorMessages.ACCOUNT_INACTIVE,
              });
            }

            // generate new access token
            const auth = {
              accessToken: authUtils.generateAccessToken(),
              expiredAt: authUtils.generateExpirationDate(7),
            };

            User.findByIdAndUpdate(result._id.toString(), {
              auth,
            })
              .then((user) => {
                // update new token
                user.auth = auth;
                // pageController
                //   .paginate(1, null, { status: { $ne: "deleted" } }, Business)
                //   .then((businesses) => {
                User.populate([user], { path: "roleId" })
                  .then((userPopulate) => {
                    resolve({
                      error: false,
                      data: {
                        user: userPopulate[0],
                        // businesses,
                      },
                    });
                  })
                  //     .catch((err) => {
                  //       reject({ error: true, message: err });
                  //     });
                  // })
                  .catch((err) => {
                    reject({ error: true, message: err });
                  });
              })
              .catch((err) => {
                reject({ error: true, message: err });
              });
          } else {
            reject({
              error: false,
              message: errorMessages.LOGIN_FAILED,
            });
          }
        });
    });
  },
};
