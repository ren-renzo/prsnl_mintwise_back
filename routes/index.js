const express = require('express');
router = express.Router();
const userController = require('../controller/userController')

//route to get all user
router.get('/users', userController.getAllUsers);
//route to create new users // sign up
router.post('/users/register', userController.createUsers);
//route to get users // login
router.post('/users/login', userController.getUsers);

//route to deposit money
router.post('/deposit', userController.depositMoney);

//route to withdraw money
router.post('/withdraw', userController.withdrawMoney);

// route user balance
router.get('/getBalance', userController.getUserBalance);

//route to get all deposit
router.get('/getDeposit', userController.getAllDeposit);

// route for transaction history deposit
router.get('/history', userController.transactionHistory);

// route for deposit history deposit
router.get('/depositHistory', userController.depositHistory);

// route for withdraw history deposit
router.get('/withdrawHistory', userController.withdrawHistory);

// route for monthly total deposit
router.get('/monthly', userController.monthlyTotal);

module.exports=router;