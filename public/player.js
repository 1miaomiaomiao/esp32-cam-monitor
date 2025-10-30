class ESP32CamPlayer {
    constructor() {
        this.videoElement = document.getElementById('videoStream');
        this.statusElement = document.getElementById('status');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.ws = null;
        this.isConnected = false;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startStream());
        this.stopBtn.addEventListener('click', () => this.stopStream());
    }
    
    async startStream() {
        try {
            this.updateStatus('正在连接...', 'blue');
            
            // 获取当前部署的域名
            const baseUrl = window.location.origin;
            this.ws = new WebSocket(`wss://${baseUrl.replace('https://', '')}/api/webrtc`);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.updateStatus('已连接 - 等待视频流', 'green');
                this.startBtn.disabled = true;
                this.stopBtn.disabled = false;
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'offer') {
                    // 处理 WebRTC offer
                    this.handleOffer(data.offer);
                } else if (data.type === 'ice-candidate') {
                    // 处理 ICE candidate
                    this.handleIceCandidate(data.candidate);
                } else if (data.type === 'video-frame') {
                    // 直接显示视频帧（备选方案）
                    this.displayVideoFrame(data.frame);
                }
            };
            
            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateStatus('连接断开', 'red');
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket 错误:', error);
                this.updateStatus('连接错误', 'red');
            };
            
        } catch (error) {
            console.error('启动流失败:', error);
            this.updateStatus('启动失败: ' + error.message, 'red');
        }
    }
    
    async handleOffer(offer) {
        try {
            // 创建 RTCPeerConnection
            this.pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            
            // 处理远程流
            this.pc.ontrack = (event) => {
                console.log('收到远程流');
                if (event.streams && event.streams[0]) {
                    this.videoElement.srcObject = event.streams[0];
                    this.updateStatus('视频流已开始', 'green');
                }
            };
            
            // 处理 ICE candidate
            this.pc.onicecandidate = (event) => {
                if (event.candidate) {
                    this.ws.send(JSON.stringify({
                        type: 'ice-candidate',
                        candidate: event.candidate
                    }));
                }
            };
            
            // 设置远程描述
            await this.pc.setRemoteDescription(offer);
            
            // 创建并设置本地答案
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            
            // 发送答案
            this.ws.send(JSON.stringify({
                type: 'answer',
                answer: answer
            }));
            
        } catch (error) {
            console.error('处理 offer 失败:', error);
        }
    }
    
    handleIceCandidate(candidate) {
        if (this.pc && candidate) {
            this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
    
    displayVideoFrame(base64Frame) {
        // 备选方案：直接显示 Base64 编码的帧
        this.videoElement.src = 'data:image/jpeg;base64,' + base64Frame;
    }
    
    stopStream() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this.videoElement.srcObject = null;
        this.isConnected = false;
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