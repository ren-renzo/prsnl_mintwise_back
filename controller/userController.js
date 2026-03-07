const connection = require('../config/db')
const bcrypt = require('bcrypt');

//get all users
exports.getAllUsers = (req,res) => {
    connection.query('SELECT * FROM authentication',(err,rows,fields)=> {
        if(err) {
            console.error('Error fetching users:', err.message);
            return res.status(500).json({ message: 'Database error occurred' });
        }
            res.json(rows);

    })
}

// route for create user account ===================================================


exports.createUsers = async (req,res) => {
    const {name, email, password} = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    connection.query('INSERT INTO authentication (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err, result) => {
        if(err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Email already exists!' });
            }
                return res.status(500).json({ message: 'Database error occurred' });
        }
        return res.json({message: "Account Created Successfully"})
    })
}

// route for log in users

exports.getUsers = (req, res) => {
    const { email, password } = req.body;
    connection.query('SELECT * FROM authentication WHERE email = ?', [email], async (err, result) => {
        if (err) {
        console.error("DATABASE ERROR:", err.message); // This will show the real error in your terminal
        return res.status(500).json({ error: err.message });
    }
    if (result.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = result[0];

        try {
            //compare password to hasedpassword
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            //remove password before sending to frontend
            delete user.password; 
            res.status(200).json({ message: "Login successful", user: user });

        } catch (bcryptErr) {
            res.status(500).json({ error: "Error verifying password" });
        }
    });
};


// DEPOSIT MONEY
exports.depositMoney = async (req, res) => {
    const { user_id, amount } = req.body; 

    connection.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Transaction Error' });

        // 1. I-insert ang record sa bankTansaction (user_id is the FK)
        const sqlInsert = 'INSERT INTO banktransaction (user_id, transaction_type, amount) VALUES (?, ?, ?)';
        connection.query(sqlInsert, [user_id, 'deposit', amount], (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    res.status(500).json({ message: 'Error: User ID might not exist or Database error' });
                });
            }

            // 2. I-update ang balance sa authentication table
            const sqlUpdate = 'UPDATE authentication SET balance = balance + ? WHERE id = ?';
            connection.query(sqlUpdate, [amount, user_id], (err, updateResult) => {
                if (err) {
                    return connection.rollback(() => {
                        res.status(500).json({ message: 'Failed to update balance' });
                    });
                }

                connection.commit((err) => {
                    if (err) return connection.rollback(() => res.status(500).json({ message: 'Commit Error' }));
                    return res.json({ message: "Deposit Successful" });
                });
            });
        });
    });
};

//get all deposit
exports.getAllDeposit = (req,res) => {
    connection.query('SELECT * FROM banktransaction',(err,rows,fields)=> {
        if(err) {
            console.error('Error fetching users:', err.message);
            return res.status(500).json({ message: 'Database error occurred' });
        }
            res.json(rows);

    })
}

// WITHDRAW MONEY
exports.withdrawMoney = async (req, res) => {
    const { user_id, amount } = req.body;

    connection.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Transaction Error' });

        // 1. Check muna kung sapat ang balance bago bawasan
        const sqlCheck = 'SELECT balance FROM authentication WHERE id = ?';
        connection.query(sqlCheck, [user_id], (err, results) => {
            if (err || results.length === 0) {
                return connection.rollback(() => res.status(500).json({ message: 'User not found' }));
            }

            const currentBalance = results[0].balance;
            if (currentBalance < amount) {
                return connection.rollback(() => res.status(400).json({ message: 'Insufficient Balance' }));
            }

            // 2. Insert withdrawal record
            const sqlInsert = 'INSERT INTO banktransaction (user_id, transaction_type, amount) VALUES (?, ?, ?)';
            connection.query(sqlInsert, [user_id, 'withdraw', amount], (err, result) => {
                if (err) return connection.rollback(() => res.status(500).json({ message: 'Withdrawal failed' }));

                // 3. Bawasan ang balance
                const sqlUpdate = 'UPDATE authentication SET balance = balance - ? WHERE id = ?';
                connection.query(sqlUpdate, [amount, user_id], (err, updateResult) => {
                    if (err) return connection.rollback(() => res.status(500).json({ message: 'Balance update failed' }));

                    connection.commit((err) => {
                        if (err) return connection.rollback(() => res.status(500).json({ message: 'Commit Error' }));
                        return res.json({ message: "Withdrawal Successful" });
                    });
                });
            });
        });
    });
};

// view transaction transaction history
exports.transactionHistory = (req,res)=>{
    const { user_id } = req.query; // Kunin ang user_id mula sa URL params

    const sql = 'SELECT * FROM banktransaction WHERE user_id = ? ORDER BY transaction_date DESC';

    connection.query(sql, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        return res.json(results);
    });
};

// view deposit history
exports.depositHistory = (req,res)=>{
    const { user_id } = req.query; // Kunin ang user_id mula sa URL params

    const sql = 'SELECT * FROM banktransaction WHERE user_id = ? AND transaction_type = "deposit" ORDER BY transaction_date DESC';

    connection.query(sql, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        return res.json(results);
    });
};

// view withdraw history
exports.withdrawHistory = (req,res)=>{
    const { user_id } = req.query; // Kunin ang user_id mula sa URL params

    const sql = 'SELECT * FROM banktransaction WHERE user_id = ? AND transaction_type = "withdraw" ORDER BY transaction_date DESC';

    connection.query(sql, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        return res.json(results);
    });
};

// get user balance
exports.getUserBalance = (req,res)=>{
    const { id } = req.query; // Kunin ang user_id mula sa URL params

    const sql = 'SELECT balance FROM authentication WHERE id = ?';

    connection.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        if (results.length > 0) {
            // Ibalik ang results[0] para maging { balance: 100 } ang response
            return res.json(results[0]); 
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    });
};

// get monthly total
exports.monthlyTotal = (req,res)=>{
    const { user_id } = req.query;

    const sql = `
        SELECT 
            DATE_FORMAT(transaction_date, '%M %Y') AS Month_Year, 
            SUM(CASE 
                WHEN transaction_type = 'deposit' THEN amount 
                WHEN transaction_type = 'withdraw' THEN -amount 
                ELSE 0 
            END) AS Monthly
        FROM 
            banktransaction
        WHERE 
            user_id = ?
        GROUP BY 
            YEAR(transaction_date), 
            MONTH(transaction_date)
        ORDER BY 
            YEAR(transaction_date) DESC, 
            MONTH(transaction_date) DESC
    `;

    connection.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
};