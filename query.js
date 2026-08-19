require('dotenv').config();
const { getConnection } = require('./connect');

async function runQuery() {
    const sql = process.argv[2] || "SELECT * FROM USERS";
    let connection;
    try {
        connection = await getConnection();
        console.log(`\n🔍 실행할 쿼리: ${sql}`);
        const result = await connection.execute(sql);
        
        console.log(`\n✅ 조회된 데이터 (총 ${result.rows.length}건):`);
        console.table(result.rows);
    } catch (err) {
        console.error("❌ 쿼리 실행 오류:", err.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

runQuery();
