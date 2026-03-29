require('dotenv').config();
const authType = (process.env.DB_AUTH_TYPE || 'sql').toLowerCase();

// Use msnodesqlv8 only when Windows Authentication is requested.
const sql = authType === 'windows' ? require('mssql/msnodesqlv8') : require('mssql');

const toBool = (value, defaultValue = false) => {
    if (value === undefined) return defaultValue;
    return String(value).toLowerCase() === 'true';
};

const dbServer = process.env.DB_SERVER || 'localhost';
const dbName = process.env.DB_NAME || process.env.DB_DATABASE || 'JobPortalDB';
const trustServerCertificate = toBool(process.env.DB_TRUST_SERVER_CERTIFICATE, true);
const encrypt = toBool(process.env.DB_ENCRYPT, false);

let config;
let windowsAuthCandidates = [];

if (authType === 'windows') {
    const explicitConnectionString = process.env.DB_CONNECTION_STRING;
    if (explicitConnectionString) {
        windowsAuthCandidates = [
            {
                connectionString: explicitConnectionString,
                options: {
                    trustedConnection: true,
                    trustServerCertificate,
                    encrypt,
                    enableArithAbort: true
                },
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            }
        ];
    } else {
        windowsAuthCandidates = [
            {
                server: dbServer,
                database: dbName,
                options: {
                    trustedConnection: true,
                    trustServerCertificate,
                    encrypt,
                    enableArithAbort: true
                },
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            },
            {
                connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${dbServer};Database=${dbName};Trusted_Connection=Yes;Encrypt=${encrypt ? 'Yes' : 'No'};TrustServerCertificate=${trustServerCertificate ? 'Yes' : 'No'};`,
                options: {
                    trustedConnection: true,
                    trustServerCertificate,
                    encrypt,
                    enableArithAbort: true
                },
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            },
            {
                connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${dbServer};Database=${dbName};Trusted_Connection=Yes;Encrypt=${encrypt ? 'Yes' : 'No'};TrustServerCertificate=${trustServerCertificate ? 'Yes' : 'No'};`,
                options: {
                    trustedConnection: true,
                    trustServerCertificate,
                    encrypt,
                    enableArithAbort: true
                },
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            },
            {
                connectionString: `Driver={SQL Server};Server=${dbServer};Database=${dbName};Trusted_Connection=Yes;`,
                options: {
                    trustedConnection: true,
                    trustServerCertificate,
                    encrypt,
                    enableArithAbort: true
                },
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            }
        ];
    }

    config = windowsAuthCandidates[0];
} else {
    config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: dbServer,
        database: dbName,
        options: {
            encrypt,
            trustServerCertificate,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };
}

let pool = null;

const getPool = async () => {
    try {
        if (!pool) {
            console.log('Creating new database connection pool...');
            if (authType === 'windows') {
                console.log(`Connecting to SQL Server with Windows Authentication (${dbServer} / ${dbName})`);
                let lastError;
                for (let i = 0; i < windowsAuthCandidates.length; i += 1) {
                    try {
                        pool = await sql.connect(windowsAuthCandidates[i]);
                        console.log(`✓ Database pool created successfully (Windows auth strategy ${i + 1})`);
                        break;
                    } catch (error) {
                        lastError = error;
                    }
                }

                if (!pool) {
                    throw lastError || new Error('All Windows authentication connection attempts failed');
                }
            } else {
                console.log(`Connecting to: ${config.server}\\${config.database} as ${config.user}`);
                pool = await sql.connect(config);
                console.log('✓ Database pool created successfully');
            }
        }
        return pool;
    } catch (error) {
        console.error('✗ Database connection error:', error?.message || error);
        throw error;
    }
};

const closePool = async () => {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('✓ Database pool closed');
        }
    } catch (error) {
        console.error('Error closing database pool:', error);
        throw error;
    }
};

module.exports = {
    config,
    getPool,
    closePool,
    sql
};