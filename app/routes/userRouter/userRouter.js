const router = require("express").Router();

const authController = require("../../controllers/authController");
const userController = require("../../controllers/userController");

// sementara
const multer = require("multer");
const ExcelJS = require("exceljs");
const errorMessages = require("../../repository/messages/errorMessages");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function convertExcelToObjects(worksheet) {
  const data = [];

  // Mendefinisikan kolom yang ingin Anda ambil (kolom 2 hingga kolom 9)
  const startColumn = 2; // Kolom 2
  const endColumn = 9; // Kolom 9

  let currentRow = 3; // Mulai dari baris ke-3

  // Loop untuk mengambil data dari baris 3 hingga akhir, berhenti saat menemukan baris kosong
  while (true) {
    const rowData = {};
    let isEmpty = true;

    for (let colNumber = startColumn; colNumber <= endColumn; colNumber++) {
      const cellValue = worksheet.getRow(currentRow).getCell(colNumber).value;
      const columnHeader = worksheet
        .getRow(2)
        .getCell(colNumber)
        .value.toLowerCase()
        .trim();

      if (cellValue !== null && cellValue !== undefined) {
        rowData[columnHeader] = cellValue;
        isEmpty = false;
      }
    }

    if (isEmpty) {
      // Baris kosong ditemukan, berhenti loop
      break;
    }

    data.push(rowData);
    currentRow++;
  }

  return data;
}

router.post("/users/bulk", upload.single("file"), (req, res) => {
  authController
    .checkAccessToken(req)
    .then(() => {
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.xlsx.load(req.file.buffer).then(() => {
          const worksheet = workbook.getWorksheet(1); // Mengambil worksheet pertama

          const data = convertExcelToObjects(worksheet);

          let transformedData = data.map((e) => {
            return {
              name: e["nama lengkap (wajib)"],
              phonenumber: e["nomor hp (wajib)"],
              gender: e["jenis kelamin (pria / wanita) (wajib)"],
              type: e["tipe akun (admin/member) (wajib)"],
              username: e["username (wajib)"],
              password: e["password (wajib)"],
              email: e["email"],
              imageUrl: e["url gambar"]["text"],
            };
          });

          res.status(200).send({
            error: false,
            data: transformedData,
          });
        });
      } catch (error) {
        res.status(500).send({
          error: true,
          message: errorMessages.EXCEL_UPLOAD_ERROR,
        });
      }
      // userController
      //   .createBulkUser(req)
      //   .then((value) => {
      //     res.status(200).send(value);
      //   })
      //   .catch((err) => {
      //     res.status(500).send(err);
      //   });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router
  .route("/users")
  .get((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        userController
          .getUsers(req)
          .then((value) => {
            res.status(200).send(value);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  })
  .post((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        userController
          .createUser(req.body)
          .then((value) => {
            res.status(200).send(value);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  })
  .patch((req, res) => {
    authController
      .checkAccessToken(req)
      .then(() => {
        userController
          .updateUser(req.body)
          .then((value) => {
            res.status(200).send(value);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

module.exports = router;
