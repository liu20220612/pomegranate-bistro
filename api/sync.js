// 简单的内存存储（在Serverless中会重置，但足够演示）
let menuData = {};

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📝 同步数据 from:', data.deviceId);
        
        // 存储菜单数据
        menuData[data.deviceId] = {
          menu: data.menu,
          timestamp: data.timestamp,
          lastUpdate: Date.now()
        };
        
        // 清理过期的数据（5分钟）
        const now = Date.now();
        for (const deviceId in menuData) {
          if (now - menuData[deviceId].lastUpdate > 5 * 60 * 1000) {
            delete menuData[deviceId];
          }
        }
        
        // 返回其他设备的菜单数据
        const otherMenus = {};
        for (const [deviceId, deviceData] of Object.entries(menuData)) {
          if (deviceId !== data.deviceId) {
            otherMenus[deviceId] = deviceData.menu;
          }
        }
        
        res.status(200).json({
          status: 'success',
          message: '同步成功',
          otherMenus: otherMenus,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('处理同步数据错误:', error);
        res.status(200).json({
          status: 'error',
          message: '处理失败'
        });
      }
    });
    return;
  }

  // GET请求返回状态
  res.status(200).json({
    status: 'ready',
    connectedDevices: Object.keys(menuData).length,
    timestamp: Date.now()
  });
}
