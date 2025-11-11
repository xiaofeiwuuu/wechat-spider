import AutoLaunch from 'auto-launch'
import { app } from 'electron'

/**
 * 开机自启动服务
 */
export class AutoLaunchService {
  private autoLauncher: AutoLaunch

  constructor() {
    this.autoLauncher = new AutoLaunch({
      name: 'WeChat Spider UI',
      path: app.getPath('exe')
    })
  }

  /**
   * 启用开机自启动
   */
  async enable(): Promise<void> {
    try {
      const isEnabled = await this.autoLauncher.isEnabled()
      if (!isEnabled) {
        await this.autoLauncher.enable()
        console.log('[AutoLaunch] 开机自启动已启用')
      }
    } catch (error) {
      console.error(`[AutoLaunch] 启用开机自启动失败: ${error}`)
      throw error
    }
  }

  /**
   * 禁用开机自启动
   */
  async disable(): Promise<void> {
    try {
      const isEnabled = await this.autoLauncher.isEnabled()
      if (isEnabled) {
        await this.autoLauncher.disable()
        console.log('[AutoLaunch] 开机自启动已禁用')
      }
    } catch (error) {
      console.error(`[AutoLaunch] 禁用开机自启动失败: ${error}`)
      throw error
    }
  }

  /**
   * 检查是否已启用开机自启动
   */
  async isEnabled(): Promise<boolean> {
    try {
      return await this.autoLauncher.isEnabled()
    } catch (error) {
      console.error(`[AutoLaunch] 检查开机自启动状态失败: ${error}`)
      return false
    }
  }
}
