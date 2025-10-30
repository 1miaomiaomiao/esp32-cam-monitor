const WebSocket = require('ws');

module.exports = (req, res) => {
    // 这个函数将由 Vercel 在服务器端调用
    // 实际的 WebSocket 处理需要在 serverless 环境中特殊处理
    // 由于 Vercel 的 Serverless 环境对 WebSocket 支持有限，我们使用备选方案
    
    res.status(200).json({ 
        status: 'WebRTC signaling API',
        message: '请使用备选的 HTTP 轮询方案'
    });
};