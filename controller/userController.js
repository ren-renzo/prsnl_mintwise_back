// SQL

const connection = require ('../config/db.js');

//get all list
exports.getAllCategory = (req,res)=>{
    connection.query('SELECT * FROM category ORDER BY cat_name ASC', (err,rows,fields) => {
        if (err) throw err;
            res.json(rows);
    });
};

//get all items by category id
exports.getCategoryItems = (req,res) => {
    const cat_id = req.params.categoryId;
    connection.query('SELECT * FROM parts WHERE cat_id=? ORDER BY item_name ASC', [cat_id], (err, rows, fields) => {
        if (err) throw err;
        res.json(rows);
    });
};

//get category name by category id
exports.getCategoryName = (req,res) => {
    const cat_id = req.params.categoryId;
    connection.query('SELECT cat_name FROM category WHERE cat_id=?', [cat_id], (err, rows, fields) => {
        if (err) throw err;
        res.json(rows);
    });
}

//get low stock items
exports.getLowStockItems = (req,res) => {
    connection.query('SELECT * FROM parts WHERE stocks < 5', (err, rows, fields) => {
        if (err) throw err;
        res.json(rows);
    }); 
};

//get the item details by item id
exports.getItemById = (req,res) => {
    const parts_id = req.params.itemId;  
    connection.query('SELECT * FROM parts WHERE parts_id=?', [parts_id], (err, rows, fields) => {
        if (err) throw err;
        res.json(rows);
    });
};

//update the item details by item id
exports.updateItemById = (req, res) => {
    const parts_id = req.params.parts_id;
    const { item_name, brand, compatibility, capital, price, stocks } = req.body;
    connection.query(
        'UPDATE parts SET item_name=?, brand=?, compatibility=?, capital=?, price=?, stocks=? WHERE parts_id=?',
        [item_name, brand, compatibility, capital, price, stocks, parts_id], // ← capital added
        (err, result) => {
            if (err) throw err;
            if (result.affectedRows > 0)
                res.json({ message: 'Item Updated Successfully' });
            else
                res.status(404).json({ message: 'Item not found' });
        }
    );
};

//delete the item by item id
exports.deleteItemById = (req,res) => {
    const parts_id = req.params.parts_id;
    connection.query('DELETE FROM parts WHERE parts_id=?', [parts_id], (err, result) => {
        if (err) throw err;   
        if(result.affectedRows>0)
            res.json({message:'Item Deleted Successfully'});
        else
            res.status(404).json({message:'Item not found'});
    });
};

//add new item
exports.addItem = (req, res) => {
    const { item_name, brand, compatibility, capital, price, stocks, cat_id } = req.body;
    connection.query(
        'INSERT INTO parts (item_name, brand, compatibility, capital, price, stocks, cat_id) VALUES (?,?,?,?,?,?,?)',
        [item_name, brand, compatibility, capital, price, stocks, cat_id], // ← capital added
        (err, result) => {
            if (err) throw err;
            res.json({ message: 'Item Added Successfully', itemId: result.insertId });
        }
    );
};
//add new category
exports.addCategory = (req,res) => {
    const {cat_name} = req.body;
    connection.query('INSERT INTO category (cat_name) VALUES (?)', [cat_name], (err,result) => {
        if (err) throw err;
        res.json({message:'Category Added Successfully', categoryId: result.insertId});
    });
}

//edit category name by category id
exports.updateCategoryById = (req,res) => {
    const cat_id = req.params.cat_id;
    const {cat_name} = req.body;
    connection.query('UPDATE category SET cat_name=? WHERE cat_id=?', [cat_name, cat_id], (err, result) => {
        if (err) throw err;
        if(result.affectedRows>0)
            res.json({message:'Category Updated Successfully'});
        else
            res.status(404).json({message:'Category not found'});
    });
}

//delete category by category id
exports.deleteCategoryById = (req, res) => {
  const cat_id = req.params.cat_id;
  connection.query('DELETE FROM category WHERE cat_id=?', [cat_id], (err, result) => {
    if (err) throw err;
    if (result.affectedRows > 0)
      res.json({ message: 'Category Deleted Successfully' });
    else
      res.status(404).json({ message: 'Category not found' });
  });
};

//delete all items (and their sales history) by category id
exports.deleteItemsByCategoryId = (req, res) => {
  const cat_id = req.params.cat_id;

  // Step 1: Get all parts_ids in this category
  connection.query('SELECT parts_id FROM parts WHERE cat_id=?', [cat_id], (err, rows) => {
    if (err) throw err;

    // If no parts exist, skip straight to success
    if (rows.length === 0) {
      return res.json({ message: 'No items found, nothing to delete' });
    }

    const partIds = rows.map(row => row.parts_id);

    // Step 2: Delete saleshistory records for those parts first
    connection.query('DELETE FROM saleshistory WHERE parts_id IN (?)', [partIds], (err) => {
      if (err) throw err;

      // Step 3: Now safely delete the parts
      connection.query('DELETE FROM parts WHERE cat_id=?', [cat_id], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Items and related sales history deleted successfully' });
      });
    });
  });
};

//add stock by item id
exports.addStockByItemId = (req,res) => {
    const parts_id = req.params.parts_id;
    const {additional_stock} = req.body;
    connection.query('UPDATE parts SET stocks = stocks + ? WHERE parts_id=?', [additional_stock, parts_id], (err, result) => {
        if (err) throw err; 
        if(result.affectedRows>0)
            res.json({message:'Stock Added Successfully'});
        else
            res.status(404).json({message:'Item not found'});
    });
};

//reduce stock by item id
exports.reduceStockByItemId = (req,res) => {
    const parts_id = req.params.parts_id;
    const {reduced_stock} = req.body;
    connection.query('UPDATE parts SET stocks = stocks - ? WHERE parts_id=?', [reduced_stock, parts_id], (err, result) => {
        if (err) throw err;
        if(result.affectedRows>0)
            res.json({message:'Stock Reduced Successfully'});
        else
            res.status(404).json({message:'Item not found'});
    }
);
};

//display all items alphabetically
exports.getAllItemsAlphabetically = (req,res) => {
    connection.query('SELECT * FROM parts ORDER BY item_name ASC', (err, rows, fields) => {
        if (err) throw err;
        res.json(rows);
    });
};

//search items by name
exports.searchItemsByName = (req,res) => {
    const {name} = req.query;
    connection.query('SELECT * FROM parts WHERE item_name LIKE ?', [`%${name}%`], (err, rows, fields) => {
        if (err) throw err;
        res.json(rows);
    });
};

//get the amount of sales in a day by the reduced stock
exports.getDailySales = (req, res) => {
    connection.query(
        `SELECT DATE(sh.date) AS date,
         SUM(p.price) AS daily_sales
         FROM saleshistory sh
         JOIN parts p ON sh.parts_id = p.parts_id
         GROUP BY DATE(sh.date)
         ORDER BY DATE(sh.date) DESC`,
        (err, rows) => {
            if (err) throw err;
            res.json(rows);
        }
    );
};

//route to add new sales record
exports.addSalesRecord = (req, res) => {
    const {parts_id, quantity} = req.body;
    connection.query('INSERT INTO saleshistory (parts_id, quantity) VALUES (?, ?)', [parts_id, quantity], (err, result) => {
        if (err) throw err;
        res.json({message: 'Sales record added successfully', salesRecordId: result.insertId});
    });
};

exports.getDailySalesDetail = (req, res) => {
  const { date } = req.params;
  connection.query(
    `SELECT p.item_name, sh.quantity, p.price
     FROM saleshistory sh
     JOIN parts p ON sh.parts_id = p.parts_id
     WHERE DATE(sh.date) = ?`,
    [date],
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
};

//get the name of te item, quantity and price for a specific date
exports.getSalesDetailByDate = (req, res) => {
  const { date } = req.params;
  connection.query(
    `SELECT p.item_name, SUM(sh.quantity) AS quantity, p.price
     FROM saleshistory sh
     JOIN parts p ON sh.parts_id = p.parts_id
     WHERE DATE(sh.date) = ?
     GROUP BY sh.parts_id, p.item_name, p.price`,
    [date],
    (err, rows) => {
      if (err) throw err;
      res.json(rows);
    }
  );
};

//route to get the total sale amount for a week
exports.getWeeklySales = (req, res) => {
    connection.query(
        `SELECT YEARWEEK(sh.date, 1) AS week,
         SUM(p.price * sh.quantity) AS weekly_sales
         FROM saleshistory sh
            JOIN parts p ON sh.parts_id = p.parts_id
            GROUP BY YEARWEEK(sh.date, 1)
            ORDER BY YEARWEEK(sh.date, 1) DESC`,
        (err, rows) => {
            if (err) throw err;
            res.json(rows);
        }
    );
};

//route to get the total sale amount for a month
exports.getMonthlySales = (req, res) => {
    connection.query(
        `SELECT DATE_FORMAT(sh.date, '%Y-%m') AS month,
            SUM(p.price * sh.quantity) AS monthly_sales
            FROM saleshistory sh
            JOIN parts p ON sh.parts_id = p.parts_id
            GROUP BY DATE_FORMAT(sh.date, '%Y-%m')
            ORDER BY DATE_FORMAT(sh.date, '%Y-%m') DESC`,
        (err, rows) => {
            if (err) throw err;
            res.json(rows);
        }
    );
};

//route to get the total sale amount for a year
exports.getYearlySales = (req, res) => {
    connection.query(
        `SELECT YEAR(sh.date) AS year,
            SUM(p.price * sh.quantity) AS yearly_sales
            FROM saleshistory sh
            JOIN parts p ON sh.parts_id = p.parts_id
            GROUP BY YEAR(sh.date)
            ORDER BY YEAR(sh.date) DESC`,
        (err, rows) => {
            if (err) throw err;
            res.json(rows);
        }
    );
};

//search category by name
exports.searchCategoryByName = (req,res) => {
    const {name} = req.query;
    connection.query('SELECT * FROM category WHERE cat_name LIKE ?', [`%${name}%`], (err, rows, fields) => {
        if (err) throw err;
        res.json(rows);
    });
};

// //Search a user by Id
// exports.getEventById=(req,res)=> {
//     const id=req.params.id;
//     connection.query('SELECT * FROM eventmanagement WHERE id=?', [id], (err, rows,fields)=> {
//         if(err) throw err;
//         if(rows.length>0)
//             res.json(rows);
//         else
//             res.status(404).json
//             ({message:'User not found'});
//     });
// }


// //Add new Event
// //crud - create
// exports.addEvent=(req,res)=> {
//     const {event_name, date_time, address, reservation_name} = req.body;
//     connection.query('INSERT INTO eventmanagement (event_name, date_time, address, reservation_name) VALUES (?,?,?,?)',[event_name, date_time, address, reservation_name], (err,result)=> {
//         if(err) throw err;
//         res.json({message:'Event Added Successfully', userId:
//         result.insertId});
//     })
// }

// //Update Event
// //crud -update
// exports.updateEvent=(req,res)=>{
//     const {id, event_name, date_time, address, reservation_name} = req.body;
//     connection.query('UPDATE eventmanagement SET event_name=?, date_time=?, address=?, reservation_name=? WHERE id=?', [event_name, date_time, address, reservation_name, id], (err,result) => {
//         if (err) throw err;
//         if(result.affectedRows>0)
//             res.json({message:'Event Update Succesfully'});
//         else
//             res.status(404).json({message:'Event not found'});
//     });
// };

// //delete Event
// //crud-delete
// exports.deleteEvent=(req,res)=>{
//     const {id}  = req.body;
    
//     connection.query('DELETE FROM eventmanagement WHERE id=?', [id], (err,result) => {
//         if (err) throw err;
//         if(result.affectedRows>0)
//             res.json({message:'Event Deleted Succesfully'});
//         else
//             res.status(404).json({message:'User not found'});
//     });
// };
