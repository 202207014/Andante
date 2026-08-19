const oracledb = require('oracledb');

// 오라클 DB 클라이언트 자동 초기화 (Node.js oracledb v6+ 에서는 Thin 모드 기본 활성화)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; // 쿼리 결과를 JSON 객체 형태로 받기 위함
oracledb.fetchAsString = [oracledb.CLOB]; // CLOB 데이터(Base64)를 스트리밍 객체가 아닌 기본 String으로 자동 변환

async function getConnection() {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/xe'
        });
        console.log('✅ Oracle DB 연결 성공!');
        return connection;
    } catch (err) {
        console.error("❌ Oracle DB 연결 오류:", err.message);
        throw err;
    }
}

module.exports = { getConnection };
