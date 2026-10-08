// utils/simpleLogger.js
const chalk = require('chalk');

// Simple logger - only shows user actions
const logger = {
    // User authentication
    userLogin: (username) => {
        console.log(`${chalk.green('→')} ${chalk.cyan(username)} ${chalk.gray('logged in')}`);
    },
    
    userLogout: (username) => {
        console.log(`${chalk.yellow('←')} ${chalk.cyan(username)} ${chalk.gray('logged out')}`);
    },
    
    userRegister: (username) => {
        console.log(`${chalk.green('+')} ${chalk.cyan(username)} ${chalk.gray('registered')}`);
    },

    // Item actions
    itemCreate: (username, itemTitle) => {
        console.log(`${chalk.green('+')} ${chalk.cyan(username)} ${chalk.gray('added')} "${chalk.white(itemTitle)}"`);
    },
    
    itemUpdate: (username, itemTitle) => {
        console.log(`${chalk.blue('~')} ${chalk.cyan(username)} ${chalk.gray('updated')} "${chalk.white(itemTitle)}"`);
    },
    
    itemDelete: (username, itemTitle) => {
        console.log(`${chalk.red('-')} ${chalk.cyan(username)} ${chalk.gray('deleted')} "${chalk.white(itemTitle)}"`);
    },
    
    itemStatusChange: (username, itemTitle, status) => {
        console.log(`${chalk.magenta('↻')} ${chalk.cyan(username)} ${chalk.gray('changed')} "${chalk.white(itemTitle)}" ${chalk.gray('to')} ${chalk.magenta(status)}`);
    },

    // Server status
    serverStart: (port) => {
        console.log(`${chalk.green('▶')} ${chalk.gray('Server started on port')} ${chalk.yellow(port)}`);
    },
    
    dbConnected: () => {
        console.log(`${chalk.green('✔')} ${chalk.gray('Database connected')}`);
    },
    
    error: (msg) => {
        console.log(`${chalk.red('✗')} ${chalk.gray(msg)}`);
    }
};

module.exports = logger;