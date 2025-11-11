import { app } from 'electron'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import * as cheerio from 'cheerio'
import TurndownService from 'turndown'

interface ScraperOptions {
  maxPages?: number
  days?: number
  limit?: number
  includeContent?: boolean
}

interface LogCallback {
  (type: 'info' | 'success' | 'warning' | 'error', message: string): void
}

interface ProgressCallback {
  (current: number, total: number): void
}

interface ArticleData {
  title: string
  url: string
  publishTime: Date
  digest: string
}

interface ScrapeResult {
  name: string
  success: boolean
  error?: string
  articleCount?: number
}

// 获取数据库路径
function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'data')
  const dbPath = path.join(dbDir, 'wechat.db')

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  return dbPath
}

// Prisma Client 实例
let prismaInstance: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    const dbPath = getDbPath()
    prismaInstance = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    })
  }
  return prismaInstance
}

// Turndown 服务实例 - HTML 转 Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

// 自定义图片规则 - 处理微信的 data-src
turndownService.addRule('wechatImage', {
  filter: 'img',
  replacement: (_content, node: HTMLElement) => {
    const alt = node.getAttribute('alt') || ''
    const src = node.getAttribute('data-src') || node.getAttribute('src') || ''
    const title = node.getAttribute('title') || ''
    const titlePart = title ? ` "${title}"` : ''
    return `\n![${alt}](${src}${titlePart})\n`
  }
})

interface SearchAccountItem {
  nickname: string
  fakeid: string
}

/**
 * 微信公众号 API - 搜索公众号
 */
async function searchAccount(
  token: string,
  cookie: string,
  query: string
): Promise<Array<{ wpub_name: string; wpub_fakid: string }>> {
  const url = 'https://mp.weixin.qq.com/cgi-bin/searchbiz'

  try {
    console.log('[API] searchAccount 请求:', { url, query, hasToken: !!token, hasCookie: !!cookie })

    const response = await axios.get(url, {
      headers: { cookie },
      params: {
        action: 'search_biz',
        scene: 1,
        begin: 0,
        count: 10,
        query,
        token,
        lang: 'zh_CN',
        f: 'json',
        ajax: 1
      }
    })

    const data = response.data
    console.log('[API] searchAccount 响应状态:', response.status)
    console.log('[API] searchAccount 响应数据:', JSON.stringify(data).slice(0, 200))

    if (!data.list || data.list.length === 0) {
      console.warn('[API] 未找到公众号:', query)
      return []
    }

    const accounts = (data.list as SearchAccountItem[]).map((item) => ({
      wpub_name: item.nickname,
      wpub_fakid: item.fakeid
    }))
    console.log('[API] searchAccount 返回:', accounts.length, '个公众号')
    return accounts
  } catch (error) {
    console.error('[API] searchAccount 失败:', error)
    if (axios.isAxiosError(error)) {
      console.error('[API] HTTP 状态:', error.response?.status)
      console.error('[API] 响应数据:', JSON.stringify(error.response?.data).slice(0, 500))
    }
    return []
  }
}

/**
 * 微信公众号 API - 获取文章列表
 */
interface ArticleListItem {
  title: string
  link: string
  update_time: number
  digest?: string
}

async function getArticlesList(
  token: string,
  cookie: string,
  fakeid: string,
  begin: number
): Promise<ArticleListItem[]> {
  const url = 'https://mp.weixin.qq.com/cgi-bin/appmsg'

  try {
    console.log(`[API] getArticlesList 请求: fakeid=${fakeid}, begin=${begin}`)

    const response = await axios.get(url, {
      headers: { cookie },
      params: {
        action: 'list_ex',
        begin,
        count: 5,
        fakeid,
        type: 9,
        query: '',
        token,
        lang: 'zh_CN',
        f: 'json',
        ajax: 1
      }
    })

    const data = response.data

    console.log(`[API] getArticlesList 响应状态: ${response.status}`)
    console.log(`[API] 响应数据结构:`, Object.keys(data))

    // 检查错误信息
    if (data.base_resp) {
      console.log('[API] base_resp:', data.base_resp)
      if (data.base_resp.ret !== 0) {
        console.error(
          `[API] 微信 API 返回错误: ret=${data.base_resp.ret}, err_msg=${data.base_resp.err_msg}`
        )
        return []
      }
    }

    if (!data.app_msg_list) {
      console.warn('[API] 响应中没有 app_msg_list 字段')
      console.log('[API] 完整响应:', JSON.stringify(data).slice(0, 500))
      return []
    }

    console.log(`[API] getArticlesList 成功获取 ${data.app_msg_list.length} 篇文章`)
    return data.app_msg_list
  } catch (error) {
    console.error('[API] getArticlesList 失败:', error)
    if (axios.isAxiosError(error)) {
      console.error(`[API] HTTP 状态: ${error.response?.status} ${error.response?.statusText}`)
      console.error('[API] 响应数据:', JSON.stringify(error.response?.data).slice(0, 500))
    }
    return []
  }
}

/**
 * 微信公众号 API - 获取文章内容
 */
async function getArticleContent(url: string, cookie: string): Promise<string> {
  try {
    console.log('[API] getArticleContent 请求:', url.slice(0, 100))

    const response = await axios.get(url, {
      headers: {
        cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    console.log(
      `[API] getArticleContent 响应状态: ${response.status}, 内容长度: ${response.data?.length || 0}`
    )
    return response.data
  } catch (error) {
    console.error('[API] getArticleContent 失败:', error)
    if (axios.isAxiosError(error)) {
      console.error(`[API] HTTP 状态: ${error.response?.status} ${error.response?.statusText}`)
    }
    return ''
  }
}

/**
 * HTML 解析器 - 解析文章内容
 */
function parseArticleContent(html: string): {
  content: string
  markdown: string
  images: string[]
  videos: string[]
} {
  const $ = cheerio.load(html)

  // 提取正文内容
  const contentEle = $('.rich_media_content')

  let htmlContent = ''
  let markdown = ''
  const images: string[] = []
  const videos: string[] = []

  if (contentEle.length > 0) {
    htmlContent = contentEle.html() || ''

    // 提取图片链接
    contentEle.find('img').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src')
      if (src && !images.includes(src)) {
        images.push(src)
      }
    })

    // 提取视频链接
    contentEle.find('iframe, video').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src')
      if (src && !videos.includes(src)) {
        videos.push(src)
      }
    })

    // 转换为 Markdown
    try {
      markdown = turndownService.turndown(htmlContent)
    } catch (error) {
      console.error(`Markdown 转换失败: ${error}`)
      markdown = htmlContent
    }
  }

  return {
    content: htmlContent,
    markdown,
    images,
    videos
  }
}

export class ScraperService {
  private shouldStop = false

  /**
   * 停止爬取
   */
  stop(): void {
    console.log('[ScraperService] 收到停止信号,设置 shouldStop=true')
    this.shouldStop = true
  }

  /**
   * 重置停止标志
   */
  private resetStopFlag(): void {
    this.shouldStop = false
  }

  /**
   * 爬取单个公众号
   */
  async scrapeAccount(
    accountName: string,
    options: ScraperOptions = {},
    onLog?: LogCallback,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; error?: string; articleCount?: number }> {
    try {
      const prisma = getPrisma()

      // 默认配置
      const maxPages = options.maxPages || 20
      const days = options.days
      const limit = options.limit
      const includeContent = options.includeContent ?? true

      onLog?.('info', `开始爬取公众号: ${accountName}`)

      // 1. 获取当前激活用户的登录信息
      const activeUser = await prisma.user.findFirst({
        where: { isActive: true }
      })

      if (!activeUser) {
        onLog?.('error', '未找到登录信息,请先登录')
        return { success: false, error: '未找到登录信息' }
      }

      // 检查登录是否过期
      const now = new Date()
      if (now > activeUser.expiresAt) {
        onLog?.('error', '登录信息已过期,请重新登录')
        return { success: false, error: '登录信息已过期' }
      }

      const { token, cookie } = activeUser

      // 2. 搜索公众号
      onLog?.('info', '搜索公众号...')
      console.log('[ScraperService] 调用 searchAccount API:', {
        accountName,
        hasToken: !!token,
        hasCookie: !!cookie
      })

      const accounts = await searchAccount(token, cookie, accountName)
      console.log('[ScraperService] searchAccount 返回结果:', accounts.length, '个公众号')

      if (accounts.length === 0) {
        console.error('[ScraperService] 未找到公众号:', accountName)
        onLog?.('error', `未找到公众号: ${accountName}`)
        return { success: false, error: `未找到公众号: ${accountName}` }
      }

      const account = accounts[0]
      console.log('[ScraperService] 找到公众号:', account.wpub_name, 'fakeid:', account.wpub_fakid)
      onLog?.('success', `✓ 找到公众号: ${account.wpub_name}`)

      // 3. 保存公众号到数据库(如果不存在)
      let dbAccount = await prisma.account.findUnique({
        where: {
          name_platform: {
            name: account.wpub_name,
            platform: 'wechat'
          }
        }
      })

      if (!dbAccount) {
        dbAccount = await prisma.account.create({
          data: {
            name: account.wpub_name,
            platform: 'wechat'
          }
        })
        onLog?.('info', '公众号已保存到数据库')
      }

      // 4. 计算日期范围
      let startTime = 0
      let enableDateFilter = false

      if (days && days > 0) {
        startTime = Date.now() / 1000 - days * 24 * 60 * 60
        enableDateFilter = true
        onLog?.('info', `获取最近 ${days} 天的文章`)
      }

      if (limit) {
        onLog?.('info', `限制数量: ${limit} 篇`)
      }

      // 5. 获取文章列表
      onLog?.('info', `开始获取文章列表 (最多 ${maxPages} 页)...`)

      const articles: ArticleData[] = []
      let shouldStop = false

      for (let page = 0; page < maxPages; page++) {
        // 检查是否需要停止
        if (this.shouldStop) {
          console.log('[ScraperService] 用户已停止爬取,shouldStop=true')
          onLog?.('warning', '用户已停止爬取')
          break
        }

        const begin = page * 5
        console.log(
          `[ScraperService] 请求第 ${page + 1} 页文章列表, begin=${begin}, fakeid=${account.wpub_fakid}`
        )

        const articleList = await getArticlesList(token, cookie, account.wpub_fakid, begin)
        console.log(`[ScraperService] 第 ${page + 1} 页返回:`, articleList.length, '篇文章')

        if (articleList.length === 0) {
          if (page === 0) {
            console.warn('[ScraperService] 第一页就没有文章,可能是 token 过期或被限流')
            onLog?.('error', '当前公众号未获取到文章数据')
            onLog?.(
              'warning',
              '可能原因: 1) 该公众号未发布过文章  2) 登录状态已过期  3) 接口被限流'
            )
            onLog?.('info', '建议: 请重新登录后重试。若仍未获取到数据,请稍后(一小时后)再试。')
          } else {
            console.log('[ScraperService] 没有更多文章了')
            onLog?.('info', '没有更多文章了')
          }
          break
        }

        onLog?.('info', `第 ${page + 1}/${maxPages} 页: 获取到 ${articleList.length} 篇文章`)

        for (const item of articleList) {
          // 日期过滤
          if (enableDateFilter && item.update_time < startTime) {
            onLog?.('info', `文章超出日期范围,停止爬取`)
            shouldStop = true
            break
          }

          // 检查文章是否已存在
          const existingArticle = await prisma.article.findUnique({
            where: { url: item.link }
          })

          if (existingArticle) {
            onLog?.('info', `文章已存在,跳过: ${item.title}`)
            continue
          }

          articles.push({
            title: item.title,
            url: item.link,
            publishTime: new Date(item.update_time * 1000),
            digest: item.digest || ''
          })

          // 数量限制
          if (limit && articles.length >= limit) {
            onLog?.('info', `已达到限制数量 ${limit} 篇,停止爬取`)
            shouldStop = true
            break
          }
        }

        if (shouldStop || (limit && articles.length >= limit)) {
          break
        }

        // 请求间隔 - 支持中途停止
        if (page < maxPages - 1 && articleList.length > 0) {
          onLog?.('info', '等待 2 秒...')
          const waitTime = 2000
          const checkInterval = 100
          const iterations = waitTime / checkInterval

          for (let j = 0; j < iterations; j++) {
            if (this.shouldStop) {
              break
            }
            await new Promise((resolve) => setTimeout(resolve, checkInterval))
          }
        }
      }

      onLog?.('success', `✓ 共获取 ${articles.length} 篇新文章`)

      if (articles.length === 0) {
        return { success: true, articleCount: 0 }
      }

      // 6. 获取文章内容并保存
      if (includeContent) {
        onLog?.('info', '开始获取文章内容并保存到数据库...')

        for (let i = 0; i < articles.length; i++) {
          // 检查是否需要停止
          if (this.shouldStop) {
            onLog?.('warning', '用户已停止爬取')
            break
          }

          const article = articles[i]
          onProgress?.(i + 1, articles.length)
          onLog?.('info', `[${i + 1}/${articles.length}] ${article.title}`)

          try {
            console.log(`[ScraperService] 获取文章内容: ${article.title}`)
            const html = await getArticleContent(article.url, cookie)

            if (!html) {
              console.error('[ScraperService] getArticleContent 返回空内容')
              onLog?.('error', `获取文章内容失败: 返回空内容`)
              continue
            }

            const parsed = parseArticleContent(html)
            console.log(`[ScraperService] 解析完成,内容长度: ${parsed.markdown.length} 字符`)

            // 保存到数据库
            await prisma.article.create({
              data: {
                accountId: dbAccount.id,
                title: article.title,
                url: article.url,
                content: parsed.markdown,
                publishTime: article.publishTime
              }
            })
            console.log(`[ScraperService] 文章已保存到数据库: ${article.title}`)

            onLog?.('success', `✓ 保存成功`)

            // 请求间隔 - 支持中途停止
            if (i < articles.length - 1) {
              const waitTime = 3000
              const checkInterval = 100
              const iterations = waitTime / checkInterval

              for (let j = 0; j < iterations; j++) {
                if (this.shouldStop) {
                  console.log('[ScraperService] 等待期间收到停止信号')
                  break
                }
                await new Promise((resolve) => setTimeout(resolve, checkInterval))
              }
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.error(`[ScraperService] 获取文章内容异常:`, error)
            onLog?.('error', `获取文章内容失败: ${errorMsg}`)
          }
        }
      } else {
        // 不获取内容,直接保存基本信息
        onLog?.('info', '保存文章基本信息到数据库...')

        for (const article of articles) {
          await prisma.article.create({
            data: {
              accountId: dbAccount.id,
              title: article.title,
              url: article.url,
              content: '',
              publishTime: article.publishTime
            }
          })
        }
      }

      onLog?.('success', `✓ 爬取完成,共保存 ${articles.length} 篇文章`)
      return { success: true, articleCount: articles.length }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('[ScraperService] scrapeAccount 捕获到错误:', error)
      console.error(
        '[ScraperService] 错误堆栈:',
        error instanceof Error ? error.stack : '无堆栈信息'
      )
      onLog?.('error', `爬取失败: ${errorMsg}`)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * 批量爬取多个公众号
   */
  async scrapeMultipleAccounts(
    accountNames: string[],
    options: ScraperOptions = {},
    onLog?: LogCallback,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; results: ScrapeResult[] }> {
    // 在批量爬取开始时重置停止标志
    console.log('[ScraperService] 开始批量爬取,公众号数量:', accountNames.length)
    console.log('[ScraperService] 爬取选项:', options)
    this.resetStopFlag()

    const results: ScrapeResult[] = []

    for (let i = 0; i < accountNames.length; i++) {
      // 检查是否需要停止
      if (this.shouldStop) {
        console.log('[ScraperService] 批量爬取被停止,shouldStop=true')
        onLog?.('warning', '用户已停止批量爬取')
        break
      }

      const name = accountNames[i]
      console.log(`[ScraperService] 开始爬取第 ${i + 1}/${accountNames.length} 个公众号: ${name}`)
      onProgress?.(i, accountNames.length)

      const result = await this.scrapeAccount(name, options, onLog, onProgress)
      console.log(`[ScraperService] 公众号 ${name} 爬取完成:`, result)
      results.push({
        name,
        success: result.success,
        error: result.error,
        articleCount: result.articleCount
      })

      onProgress?.(i + 1, accountNames.length)
    }

    console.log('[ScraperService] 批量爬取全部完成,结果:', results)
    return { success: true, results }
  }
}
