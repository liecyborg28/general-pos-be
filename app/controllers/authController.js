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
              imageUrl: "assets/demo/images/logo/logo-berlin-pool-bistro.png",
              name: "Berlin Pool & Bistro",
              note: "Berlin Pool & Bistro adalah destinasi sempurna bagi pecinta hiburan, makanan lezat, dan suasana santai. Menggabungkan konsep bistro modern dengan area billiard eksklusif, Berlin Pool & Bistro menawarkan pengalaman unik bagi pelanggan yang ingin bersantai setelah hari yang panjang atau bersenang-senang bersama teman-teman.",
              createdAt: dateISOString,
              updatedAt: dateISOString,
            },
            {
              status: "active",
              imageUrl: "assets/demo/images/logo/logo-anak-bawang.png",
              name: "Anak Bawang",
              note: "Anak Bawang hadir sebagai destinasi kuliner unik bagi pecinta makanan berbumbu kaya dan penuh aroma bawang yang menggoda. Dengan menu andalan seperti Ayam Bawang, Nasi Goreng Bawang, Mie Bawang Pedas, hingga Tahu Crispy Bawang, setiap hidangan kami diracik dengan resep spesial yang menghadirkan cita rasa gurih, renyah, dan menggugah selera.",
              createdAt: dateISOString,
              updatedAt: dateISOString,
            },
          ];

          Business.insertMany(businessesPayload, { ordered: true })
            .then((businesses) => {
              const outletsPayload = [
                {
                  address:
                    "Jl. S. Parman No. 27, Kel. Grand Sentosa, Kec. Central District Kota Metropolis, 12345 Negara Arcadia",
                  businessId: businesses[0]._id.toString(),
                  name: "S. Parman",
                  note: "Instagram: @berlinpoolbistro\nFacebook: Berlin Pool & Bistro\nTikTok: @berlinpoolbistro\nNama WiFi: BerlinPoolBistro\nPassword: GreatShots2025",
                  status: "active",
                  // timestamp
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                },
                {
                  address:
                    "Jl. Harmoni No. 40, Kel. Kepala Gading, Kec. Central District Kota Metropolis, 12345 Negara Arcadia",
                  businessId: businesses[0]._id.toString(),
                  name: "Harmoni",
                  note: "Instagram: @berlinpoolbistro\nFacebook: Berlin Pool & Bistro\nTikTok: @berlinpoolbistro\nNama WiFi: BerlinPoolBistro\nPassword: GreatShots2025",
                  status: "active",
                  // timestamp
                  createdAt: dateISOString,
                  updatedAt: dateISOString,
                },
                {
                  address:
                    "Jl. Merdeka No. 9, Kel. Grand Sentosa, Kec. Central District Kota Metropolis, 12345 Negara Arcadia",
                  businessId: businesses[1]._id.toString(),
                  name: "Merdeka",
                  note: "Instagram: @anak_bawang\nFacebook: Anak Bawang\nTikTok: @anak_bawang\nNama WiFi: anakbawang\nPassword: BawangEnakGurih",
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
                      default: true,
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
                              "/transactions/pos",
                              "/transactions/pos/return",
                              "/transactions/pos/history",
                              "/transactions/purchase",
                              "/transactions/purchase/return",
                              "/transactions/purchase/history",
                              // reports
                              "/reports/dashboard",
                              "/reports/charts",
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
                              "/settings/appearance",
                              "/settings/device",
                              "/settings/account",
                            ],
                            businessId: businesses[0]._id.toString(),
                            name: "administrator",
                            status: "active",
                            createdAt: dateISOString,
                            updatedAt: dateISOString,
                          },
                          {
                            access: [
                              "/transactions/pos",
                              "/transactions/pos/return",
                              "/transactions/pos/history",
                              "/transactions/purchase",
                              "/transactions/purchase/return",
                              "/transactions/purchase/history",
                              // settings
                              "/settings/appearance",
                              "/settings/device",
                              "/settings/account",
                            ],
                            businessId: businesses[0]._id.toString(),
                            name: "cashier",
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
                                imageUrl:
                                  "assets/demo/images/avatar/ivanmagalhaes.png",
                                name: "Super Admin",
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
                                imageUrl:
                                  "assets/demo/images/avatar/ionibowcher.png",
                                name: "Kasir 01",
                                password: "12345678",
                                phone: null,
                                roleId: roles[1]._id.toString(),
                                settings: {
                                  theme: "light",
                                  language: "id",
                                },
                                status: "active",
                                username: "kasir",
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
                                    name: "Makanan",
                                    status: "active",
                                    createdAt: dateISOString,
                                    updatedAt: dateISOString,
                                  },
                                  {
                                    businessId: businesses[0]._id.toString(),
                                    name: "Minuman",
                                    status: "active",
                                    createdAt: dateISOString,
                                    updatedAt: dateISOString,
                                  },
                                  {
                                    businessId: businesses[0]._id.toString(),
                                    name: "Coffee",
                                    status: "active",
                                    createdAt: dateISOString,
                                    updatedAt: dateISOString,
                                  },
                                  {
                                    businessId: businesses[0]._id.toString(),
                                    name: "Non Coffee",
                                    status: "active",
                                    createdAt: dateISOString,
                                    updatedAt: dateISOString,
                                  },
                                  {
                                    businessId: businesses[0]._id.toString(),
                                    name: "Tambahan",
                                    status: "active",
                                    createdAt: dateISOString,
                                    updatedAt: dateISOString,
                                  },
                                  {
                                    businessId: businesses[0]._id.toString(),
                                    name: "Paketan",
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
                                                  imageUrl:
                                                    "assets/demo/images/component/daging_sapi.jpg",
                                                  name: "Daging Sapi",
                                                  status: "active",
                                                  unitId:
                                                    units[0]._id.toString(),
                                                  qty: {
                                                    current: 10,
                                                    max: 100,
                                                    min: 5,
                                                    status: "available",
                                                  },
                                                  createdAt: dateISOString,
                                                  updatedAt: dateISOString,
                                                },
                                                {
                                                  businessId:
                                                    businesses[0]._id.toString(),
                                                  categoryId:
                                                    categories[0]._id.toString(),
                                                  changedBy:
                                                    users[0]._id.toString(),
                                                  imageUrl:
                                                    "assets/demo/images/component/daging_ayam.jpg",
                                                  name: "Daging Ayam",
                                                  status: "active",
                                                  unitId:
                                                    units[0]._id.toString(),
                                                  qty: {
                                                    current: 10,
                                                    max: 100,
                                                    min: 5,
                                                    status: "available",
                                                  },
                                                  createdAt: dateISOString,
                                                  updatedAt: dateISOString,
                                                },
                                                {
                                                  businessId:
                                                    businesses[0]._id.toString(),
                                                  categoryId:
                                                    categories[0]._id.toString(),
                                                  changedBy:
                                                    users[0]._id.toString(),
                                                  imageUrl:
                                                    "assets/demo/images/component/nasi_putih.jpg",
                                                  name: "Nasi Putih",
                                                  status: "active",
                                                  unitId:
                                                    units[0]._id.toString(),
                                                  qty: {
                                                    current: 10,
                                                    max: 100,
                                                    min: 5,
                                                    status: "available",
                                                  },
                                                  createdAt: dateISOString,
                                                  updatedAt: dateISOString,
                                                },
                                                {
                                                  businessId:
                                                    businesses[0]._id.toString(),
                                                  categoryId:
                                                    categories[0]._id.toString(),
                                                  changedBy:
                                                    users[0]._id.toString(),
                                                  imageUrl:
                                                    "assets/demo/images/component/ikan_asin.JPG",
                                                  name: "Ikan Asin",
                                                  status: "active",
                                                  unitId:
                                                    units[0]._id.toString(),
                                                  qty: {
                                                    current: 10,
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
                                                    // makanan
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[0]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "bihungoreng",
                                                        qr: "bihungoreng",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Bihun Goreng",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[1]._id.toString(),
                                                              qty: 1,
                                                            },
                                                          ],
                                                          cost: 7000,
                                                          description:
                                                            "Deskripsi untuk bihun goreng ayam.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/bihun_goreng.JPG",
                                                          name: "Ayam",
                                                          price: 15000,
                                                          qty: 10,
                                                        },
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[0]._id.toString(),
                                                              qty: 1,
                                                            },
                                                          ],
                                                          cost: 9000,
                                                          description:
                                                            "Deskripsi untuk bihun goreng sapi.",
                                                          default: false,
                                                          imageUrl:
                                                            "assets/demo/images/product/bihun_goreng.JPG",
                                                          name: "Sapi",
                                                          price: 18000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[0]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "chickencrispyladoijo",
                                                        qr: "chickencrispyladoijo",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Chicken Crispy Lado Ijo",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[1]._id.toString(),
                                                              qty: 3,
                                                            },
                                                          ],
                                                          cost: 10000,
                                                          description:
                                                            "Deskripsi untuk chicken crispy lado ijo original.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/chicken_crispy_lado_ijo.JPG",
                                                          name: "Original",
                                                          price: 25000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[0]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "nasiayamcabehijau",
                                                        qr: "nasiayamcabehijau",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Nasi Ayam Cabe Hijau",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[1]._id.toString(),
                                                              qty: 3,
                                                            },
                                                          ],
                                                          cost: 11000,
                                                          description:
                                                            "Deskripsi untuk nasi ayam cabe hijau original.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/nasi_ayam_cabe_hijau.JPG",
                                                          name: "Original",
                                                          price: 26000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[0]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "goldenkariayam",
                                                        qr: "goldenkariayam",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Golden Kari Ayam",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[1]._id.toString(),
                                                              qty: 3,
                                                            },
                                                          ],
                                                          cost: 14000,
                                                          description:
                                                            "Deskripsi untuk golden kari ayam original.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/golden_kari_ayam.JPG",
                                                          name: "Original",
                                                          price: 28000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },

                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[0]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "nasigoreng",
                                                        qr: "nasigoreng",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Nasi Goreng",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[2]._id.toString(),
                                                              qty: 2,
                                                            },
                                                            {
                                                              componentId:
                                                                components[1]._id.toString(),
                                                              qty: 1,
                                                            },
                                                          ],
                                                          cost: 7000,
                                                          description:
                                                            "Deskripsi untuk nasi goreng ayam.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/nasi_goreng_ayam.JPG",
                                                          name: "Ayam",
                                                          price: 15000,
                                                          qty: 10,
                                                        },
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[2]._id.toString(),
                                                              qty: 2,
                                                            },
                                                            {
                                                              componentId:
                                                                components[0]._id.toString(),
                                                              qty: 1,
                                                            },
                                                          ],
                                                          cost: 9000,
                                                          description:
                                                            "Deskripsi untuk nasi goreng sapi.",
                                                          default: false,
                                                          imageUrl:
                                                            "assets/demo/images/product/nasi_goreng_beef.JPG",
                                                          name: "Sapi",
                                                          price: 18000,
                                                          qty: 10,
                                                        },
                                                        {
                                                          components: [
                                                            {
                                                              componentId:
                                                                components[2]._id.toString(),
                                                              qty: 2,
                                                            },
                                                            {
                                                              componentId:
                                                                components[3]._id.toString(),
                                                              qty: 1,
                                                            },
                                                          ],
                                                          cost: 8000,
                                                          description:
                                                            "Deskripsi untuk nasi goreng ikan asin.",
                                                          default: false,
                                                          imageUrl:
                                                            "assets/demo/images/product/nasi_goreng_ikan_asin.JPG",
                                                          name: "Ikan Asin",
                                                          price: 16000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },
                                                    // minuman
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[1]._id.toString(),
                                                        categories[2]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "brownsugarcoffeemilk",
                                                        qr: "brownsugarcoffeemilk",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Brown Sugar Coffee Milk",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [],
                                                          cost: 6000,
                                                          description:
                                                            "Deskripsi untuk brown sugar coffee milk ice.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/brown_sugar_coffee_milk.JPG",
                                                          name: "Ice",
                                                          price: 12000,
                                                          qty: 10,
                                                        },
                                                        {
                                                          components: [],
                                                          cost: 5000,
                                                          description:
                                                            "Deskripsi untuk brown sugar coffee milk hot.",
                                                          default: false,
                                                          imageUrl:
                                                            "assets/demo/images/product/brown_sugar_coffee_milk.JPG",
                                                          name: "Hot",
                                                          price: 11000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },
                                                    // minuman
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[1]._id.toString(),
                                                        categories[2]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "cappucino",
                                                        qr: "cappucino",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Cappucino",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [],
                                                          cost: 6000,
                                                          description:
                                                            "Deskripsi untuk brown sugar cappucino hot.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/cappucino_hot.JPG",
                                                          name: "Hot",
                                                          price: 12000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },
                                                    // minuman
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[1]._id.toString(),
                                                        categories[3]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "matcha",
                                                        qr: "matcha",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Matcha",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [],
                                                          cost: 6000,
                                                          description:
                                                            "Deskripsi untuk matcha ice.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/matcha.JPG",
                                                          name: "Ice",
                                                          price: 12000,
                                                          qty: 10,
                                                        },
                                                        {
                                                          components: [],
                                                          cost: 5000,
                                                          description:
                                                            "Deskripsi untuk brown sugar matcha hot.",
                                                          default: false,
                                                          imageUrl:
                                                            "assets/demo/images/product/matcha.JPG",
                                                          name: "Hot",
                                                          price: 11000,
                                                          qty: 10,
                                                        },
                                                      ],
                                                      createdAt: dateISOString,
                                                      updatedAt: dateISOString,
                                                    },
                                                    // minuman
                                                    {
                                                      businessId:
                                                        businesses[0]._id.toString(),
                                                      categoryIds: [
                                                        categories[1]._id.toString(),
                                                        categories[3]._id.toString(),
                                                      ],
                                                      changedBy:
                                                        users[0]._id.toString(),
                                                      code: {
                                                        bar: "redvelvet",
                                                        qr: "redvelvet",
                                                      },
                                                      countable: true,
                                                      charged: false,
                                                      name: "Redvelvet",
                                                      status: "active",
                                                      unitId:
                                                        units[0]._id.toString(),
                                                      variants: [
                                                        {
                                                          components: [],
                                                          cost: 6000,
                                                          description:
                                                            "Deskripsi untuk redvelvet ice.",
                                                          default: true,
                                                          imageUrl:
                                                            "assets/demo/images/product/redvelvet.JPG",
                                                          name: "Ice",
                                                          price: 12000,
                                                          qty: 10,
                                                        },
                                                        {
                                                          components: [],
                                                          cost: 5000,
                                                          description:
                                                            "Deskripsi untuk redvelvet hot.",
                                                          default: false,
                                                          imageUrl:
                                                            "assets/demo/images/product/redvelvet.JPG",
                                                          name: "Hot",
                                                          price: 11000,
                                                          qty: 10,
                                                        },
                                                      ],
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
                                                              amount: 0.11,
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
                                                                            null,
                                                                          imageUrl:
                                                                            null,
                                                                          name: "Meja 01",
                                                                          phone:
                                                                            null,
                                                                          point: 0,
                                                                          status:
                                                                            "active",
                                                                          // timestamp
                                                                          createdAt:
                                                                            dateISOString,
                                                                          updatedAt:
                                                                            dateISOString,
                                                                        },
                                                                        {
                                                                          balance: 0,
                                                                          businessId:
                                                                            businesses[0]._id.toString(),
                                                                          email:
                                                                            null,
                                                                          imageUrl:
                                                                            null,
                                                                          name: "Meja 02",
                                                                          phone:
                                                                            null,
                                                                          point: 0,
                                                                          status:
                                                                            "active",
                                                                          // timestamp
                                                                          createdAt:
                                                                            dateISOString,
                                                                          updatedAt:
                                                                            dateISOString,
                                                                        },
                                                                        {
                                                                          balance: 0,
                                                                          businessId:
                                                                            businesses[0]._id.toString(),
                                                                          email:
                                                                            null,
                                                                          imageUrl:
                                                                            null,
                                                                          name: "Meja 03",
                                                                          phone:
                                                                            null,
                                                                          point: 0,
                                                                          status:
                                                                            "active",
                                                                          // timestamp
                                                                          createdAt:
                                                                            dateISOString,
                                                                          updatedAt:
                                                                            dateISOString,
                                                                        },
                                                                        {
                                                                          balance: 0,
                                                                          businessId:
                                                                            businesses[0]._id.toString(),
                                                                          email:
                                                                            null,
                                                                          imageUrl:
                                                                            null,
                                                                          name: "Meja 04",
                                                                          phone:
                                                                            null,
                                                                          point: 0,
                                                                          status:
                                                                            "active",
                                                                          // timestamp
                                                                          createdAt:
                                                                            dateISOString,
                                                                          updatedAt:
                                                                            dateISOString,
                                                                        },
                                                                        {
                                                                          balance: 0,
                                                                          businessId:
                                                                            businesses[0]._id.toString(),
                                                                          email:
                                                                            null,
                                                                          imageUrl:
                                                                            null,
                                                                          name: "Meja 05",
                                                                          phone:
                                                                            null,
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
                User.populate([user], { path: "roleId businessId" })
                  .then((userPopulate) => {
                    Currency.find({
                      businessId: userPopulate[0].businessId?._id,
                    }).then((currencies) => {
                      resolve({
                        error: false,
                        data: {
                          user: userPopulate[0],
                          currency: currencies[0],
                          // businesses,
                        },
                      });
                    });
                  })
                  //     .catch((err) => {
                  //       reject({ error: true, message: err });
                  //     });
                  // })
                  .catch((err) => {
                    reject({ error: true, message: err });
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
              error: false,
              message: errorMessages.LOGIN_FAILED,
            });
          }
        });
    });
  },
};
