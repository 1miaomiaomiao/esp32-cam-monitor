class ESP32CamPlayer {
    constructor() {
        this.videoElement = document.getElementById('videoStream');
        this.statusElement = document.getElementById('status');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.pollingInterval = null;
        this.isStreaming = false;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startStream());
        this.stopBtn.addEventListener('click', () => this.stopStream());
    }
    
    async startStream() {
        try {
            this.updateStatus('正在连接...', 'blue');
            this.isStreaming = true;
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            
            // 开始轮询
            this.pollingInterval = setInterval(() => this.fetchFrame(), 200); // 5 FPS
            
            this.updateStatus('已连接 - 接收视频流', 'green');
            
        } catch (error) {
            console.error('启动流失败:', error);
            this.updateStatus('启动失败: ' + error.message, 'red');
            this.stopStream();
        }
    }
    
    async fetchFrame() {
        if (!this.isStreaming) return;
        
        try {
            const response = await fetch('/api/frame');
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.frame) {
                    this.displayVideoFrame(data.frame);
                    this.updateStatus('视频流传输中...', 'green');
                } else {
                    this.updateStatus('等待视频流...', 'blue');
                }
            } else {
                this.updateStatus('连接中断', 'red');
            }
        } catch (error) {
            console.error('获取帧失败:', error);
            this.updateStatus('网络错误', 'red');
        }
    }
    
    displayVideoFrame(base64Frame) {
        this.videoElement.src = 'data:image/jpeg;base64,' + base64Frame;
    }
    
    stopStream() {
        this.isStreaming = false;
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.videoElement.src = '';
        this.updateStatus('已停止', 'gray');
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
    }
    
    updateStatus(message, color) {
        this.statusElement.textContent = message;
        this.statusElement.style.color = color;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ESP32CamPlayer();
});