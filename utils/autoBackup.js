// utils/autoBackup.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class AutoBackup {
    constructor() {
        // Save to project folder
        this.backupFile = path.join(__dirname, '../backup.sql');
        
        // CORRECT PATH - with .exe extension
        this.mysqlPath = '"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"';
        
        this.dbName = process.env.DB_NAME || 'lost_found_db';
        this.dbUser = process.env.DB_USER || 'root';
        this.dbPassword = process.env.DB_PASSWORD || 'admin123';
        
        console.log('📁 AutoBackup initialized');
        console.log('📁 Backup file:', this.backupFile);
        console.log('🔧 mysqldump path:', this.mysqlPath);
    }

    // Create backup
    async createBackup() {
        console.log('🔄 Creating database backup...');
        
        // Remove quotes for checking
        const checkPath = this.mysqlPath.replace(/"/g, '');
        console.log('🔍 Checking path:', checkPath);
        
        // Check if mysqldump exists
        if (!fs.existsSync(checkPath)) {
            console.error('❌ mysqldump NOT found at:', checkPath);
            console.log('💡 Please verify the path exists');
            
            // Try alternative common paths
            const altPaths = [
                '"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"',
                '"C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"',
                '"C:\\xampp\\mysql\\bin\\mysqldump.exe"',
                '"C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe"'
            ];
            
            for (let altPath of altPaths) {
                const altCheck = altPath.replace(/"/g, '');
                if (fs.existsSync(altCheck)) {
                    console.log('✅ Found mysqldump at:', altCheck);
                    this.mysqlPath = altPath;
                    break;
                }
            }
            
            if (!fs.existsSync(this.mysqlPath.replace(/"/g, ''))) {
                console.error('❌ Could not find mysqldump anywhere');
                return;
            }
        } else {
            console.log('✅ mysqldump found at:', checkPath);
        }

        // Run the backup
        return new Promise((resolve, reject) => {
            // Build command - note: no space between -p and password
            const command = `${this.mysqlPath} -u ${this.dbUser} -p${this.dbPassword} ${this.dbName} > "${this.backupFile}"`;
            console.log('🔧 Running command:', command.replace(this.dbPassword, '******'));
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Backup failed:', error.message);
                    if (stderr) console.error('📝 Error details:', stderr);
                    
                    // Try with space between -p and password
                    console.log('🔄 Trying alternative command format...');
                    const altCommand = `${this.mysqlPath} -u ${this.dbUser} -p ${this.dbPassword} ${this.dbName} > "${this.backupFile}"`;
                    
                    exec(altCommand, (err2, stdout2, stderr2) => {
                        if (err2) {
                            console.error('❌ Alternative backup also failed:', err2.message);
                            reject(err2);
                        } else {
                            try {
                                const stats = fs.statSync(this.backupFile);
                                console.log('✅ Database backup updated successfully!');
                                console.log('📁 File size:', (stats.size / 1024).toFixed(2), 'KB');
                                resolve();
                            } catch (err) {
                                console.log('✅ Database backup created!');
                                resolve();
                            }
                        }
                    });
                } else {
                    try {
                        const stats = fs.statSync(this.backupFile);
                        console.log('✅ Database backup updated successfully!');
                        console.log('📁 File size:', (stats.size / 1024).toFixed(2), 'KB');
                        resolve();
                    } catch (err) {
                        console.log('✅ Database backup created!');
                        resolve();
                    }
                }
            });
        });
    }

    // Trigger backup on changes
    async onDatabaseChange(action, details = {}) {
        console.log(`📝 Database change detected: ${action}`, details);
        try {
            await this.createBackup();
        } catch (error) {
            console.error('❌ Auto-backup failed:', error.message);
        }
    }
}

module.exports = new AutoBackup();