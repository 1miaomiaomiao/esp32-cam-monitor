// 简单的内存存储（生产环境应该使用数据库）
let latestFrame = null;
let lastUpdate = null;

module.exports = async (req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'POST') {
        try {
            const { frame, timestamp } = req.body;
            
            if (!frame) {
                return res.status(400).json({ error: '缺少帧数据' });
            }
            
            // 存储最新帧
            latestFrame = frame;
            lastUpdate = Date.now();
            
            console.log('收到帧，时间戳:', timestamp);
            
            res.status(200).json({ 
                status: 'success',
                message: '帧接收成功'
            });
            
        } catch (error) {
            console.error('处理帧时出错:', error);
            res.status(500).json({ error: '服务器内部错误' });
        }
    } else if (req.method === 'GET') {
        // 客户端轮询获取最新帧
        if (!latestFrame) {
            return res.status(404).json({ error: '暂无视频流' });
        }
        
        // 检查帧是否过期（超过5秒）
        if (Date.now() - lastUpdate > 5000) {
            latestFrame = null;
            return res.status(404).json({ error: '视频流已断开' });
        }
        
        res.status(200).json({
            frame: latestFrame,
            timestamp: lastUpdate
        });
    } else {
        res.status(405).json({ error: '方法不允许' });
    }
};