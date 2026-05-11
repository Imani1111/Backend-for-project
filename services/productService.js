const db = require('../config/db');

const updateProduct = async (id, data) => {
    const { name, description, price, image } = data;

    const sql = `
        UPDATE products
        SET name = ?, description = ?, price = ?, image = ?
        WHERE id = ?
    `;

    const [result] = await db.execute(sql, [name, description, price, image, id]);
    return result;
};

const patchProduct = async (id, data) => {
    const fields = [];
    const values = [];

    for (let key in data) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
    }

    if (fields.length === 0) return null;

    const sql = `
        UPDATE products
        SET ${fields.join(', ')}
        WHERE id = ?
    `;
    values.push(id);

    const [result] = await db.execute(sql, values);
    return result;
};

const deleteProduct = async (id) => {
    const [result] = await db.execute(
        `DELETE FROM products WHERE id = ?`,
        [id]
    );
    return result;
};

module.exports = { deleteProduct, updateProduct, patchProduct };