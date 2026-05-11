const express = require("express");
const router = express.Router();

const upload = require("../middlewares/uploads.js");
const productController = require("../controllers/productController.js");
const { verifyAdminToken } = require("../controllers/adminAuthController");

router.post(
    "/addproduct",
    verifyAdminToken,
    upload.single("image"),
    productController.addProduct
);

router.put(
    "/update/:id",
    verifyAdminToken,
    upload.single("image"),
    productController.updateProduct
);

router.delete(
    "/delete/:id",
    verifyAdminToken,
    productController.deleteProduct
);

router.get("/getproducts", productController.getAllProducts);
router.get("/product/:id", productController.getProductbyId);

module.exports = router;