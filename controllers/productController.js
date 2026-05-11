const db = require("../config/db");
const productService = require("../services/productService");
const cloudinary = require("../config/cloudinary");

const addProduct = async (req, res) => {
  const io = req.app.get("io"); // get Socket.IO
  try {
    const { name, description, price, category } = req.body;

    if (!name || !description || !price)
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });

    if (isNaN(Number(price)))
      return res
        .status(400)
        .json({ success: false, message: "Price must be a number" });

    // ✅ CLOUDINARY UPLOAD (memory buffer)
    let image = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.buffer, {
        folder: "products",
      });

      image = result.secure_url;
    }

    const [result] = await db.execute(
      "INSERT INTO products(name, description, price, image, category) VALUES(?, ?, ?, ?, ?)",
      [name, description, price, image, category || "General"],
    );

    const newProduct = {
      id: result.insertId,
      name,
      description,
      price,
      image,
      category: category || "General",
    };

    io.emit("productAdded", newProduct); // ⚡ emit event

    return res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    let image;

    if (price && isNaN(Number(price))) {
      return res
        .status(400)
        .json({ success: false, message: "Price must be a number" });
    }

    // CLOUDINARY UPDATE
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.buffer, {
        folder: "products",
      });
      image = result.secure_url;
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = Number(price);
    if (category) updateData.category = category;
    if (image) updateData.image = image;

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields to update" });
    }

    // Use service for safe dynamic updates
    const result = await productService.patchProduct(req.params.id, updateData);

    if (!result || result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Fetch updated product to emit via Socket.IO
    const [updatedRows] = await db.execute("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    const updatedProduct = updatedRows[0];

    io.emit("productUpdated", updatedProduct);

    return res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    console.error("Error updating product:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  const io = req.app.get("io");
  try {
    const id = req.params.id;
    const result = await productService.deleteProduct(id);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });

    io.emit("productDeleted", { id: parseInt(id) }); // ⚡ emit event

    return res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const [products] = await db.execute("SELECT * FROM products");
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
};

const getProductbyId = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });

    const [product] = await db.execute("SELECT * FROM products WHERE id = ?", [
      id,
    ]);

    if (product.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product Not Found" });

    return res.status(200).json({ success: true, product: product[0] });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch product" });
  }
};

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductbyId,
};
