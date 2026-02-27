import { sendEvent } from './utils'

// 硬编码的LittleSkin账号信息
const LITTLESKIN_EMAIL = '2489083744@qq.com'
const LITTLESKIN_PASSWORD = 'hcsdDKRkADmmJmrakvcA'
const LITTLESKIN_API_URL = 'https://littleskin.cn/api/yggdrasil'

export async function littleSkinAuth(client, options) {
  try {
    // 1. 首先获取认证服务器信息
    const authServerInfo = await fetch(LITTLESKIN_API_URL)
    const authServerJson = await authServerInfo.json()
    
    if (!authServerJson.meta) {
      return sendEvent('LittleSkin', 'chat', '无法获取认证服务器信息')
    }

    // 2. 构建认证请求
    const authOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: LITTLESKIN_EMAIL,
        password: LITTLESKIN_PASSWORD,
        requestUser: true,
        agent: {
          name: "Minecraft",
          version: 1
        }
      })
    }

    // 3. 发送认证请求
    // 注意：Yggdrasil API的认证端点是 /authserver/authenticate
    const authUrl = LITTLESKIN_API_URL + '/authserver/authenticate'
    const response = await fetch(authUrl, authOptions)
    const responseJson = await response.json()

    // 4. 检查错误
    if (responseJson.error) {
      const errorMessage = responseJson.errorMessage || responseJson.error
      return sendEvent('LittleSkin', 'chat', `认证失败: ${errorMessage}`)
    }

    if (!responseJson.accessToken || !responseJson.selectedProfile) {
      return sendEvent('LittleSkin', 'chat', '认证响应格式错误')
    }

    // 5. 构建session对象
    const session = {
      accessToken: responseJson.accessToken,
      clientToken: responseJson.clientToken,
      selectedProfile: {
        name: responseJson.selectedProfile.name,
        id: responseJson.selectedProfile.id
      }
    }

    // 如果有user信息，也可以保存
    if (responseJson.user) {
      session.user = responseJson.user
    }

    // 6. 设置客户端信息
    options.haveCredentials = true
    client.session = session
    client.username = session.selectedProfile.name
    options.accessToken = session.accessToken
    options.clientToken = session.clientToken
    
    // 7. 触发session事件
    client.emit('session', session)
    
    // 8. 发送成功消息
    sendEvent('LittleSkin', 'chat', `§a成功以 ${session.selectedProfile.name} 身份登录`)

  } catch (error) {
    sendEvent('LittleSkin', 'chat', `认证过程出错: ${error.message}`)
    return client.emit('error', error.message)
  }
  
  // 9. 连接到服务器
  options.connect(client)
}