import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

// Endpaper 的品牌守卫。本仓库是 Axolotl Launcher 的改皮分支，所以这里锁的是
// 我们自己的品牌值，同时禁止上游身份（Theseus、Modrinth 官方服务、官方遥测
// 密钥等）偷偷混回来。
const roots = ['apps/app', 'apps/app-frontend', 'packages/app-lib']
const ignoredNames = new Set(['LICENSE', 'COPYING.md'])
const ignoredDirectories = new Set(['dist', 'build', 'node_modules', 'target', '.gradle', '.sqlx', 'bin'])
const forbiddenPatterns = [
    ['upstream API identity', /modrinth\/theseus/gi],
    ['upstream support identity', /support@modrinth\.com/gi],
    ['upstream deep link', /modrinth:\/\//gi],
    [
        'upstream telemetry',
        /phc_9Iqi6lFs9sr5BSqh9RRNRSJ0mATS9PSgirDiX3iOYJ|posthog\.modrinth\.com|ingest\.us\.sentry\.io/gi,
    ],
    ['advertising bridge', /plugin:ads|api::ads|Aditude/gi],
    ['upstream update feed', /launcher-files\.modrinth\.com\/updates\.json/gi],
    ['upstream signing service', /DIGICERT_ONE_SIGNER_CREDENTIALS/gi],
]

// Keep in sync with apps/app-frontend/src/config.ts.
const brand = {
    productName: 'Endpaper',
    bundleIdentifier: 'com.lou0122.endpaper',
    userAgentSnippet: 'Endpaper/${version} (${os})',
    // 旧链接仍用 axolotl:// 打开，改名时保留了这个 scheme，以免已安装的
    // 快捷方式失效；换成 endpaper:// 属于兼容性决策，不在守卫里强制。
    legacyDeepLinkScheme: 'axolotl',
}

async function* files(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (ignoredDirectories.has(entry.name)) continue
        const entryPath = path.join(directory, entry.name)
        if (entry.isDirectory()) yield* files(entryPath)
        else if (!ignoredNames.has(entry.name)) yield entryPath
    }
}

const failures = []
for (const root of roots) {
    for await (const file of files(root)) {
        let contents
        try {
            contents = await readFile(file, 'utf8')
        } catch {
            continue
        }

        for (const [label, pattern] of forbiddenPatterns) {
            pattern.lastIndex = 0
            if (pattern.test(contents)) failures.push(`${file}: ${label}`)
        }
    }
}

const tauriConfig = JSON.parse(await readFile('apps/app/tauri.conf.json', 'utf8'))
const frontendConfig = await readFile('apps/app-frontend/src/config.ts', 'utf8')
const requiredInvariants = [
    ['product name', tauriConfig.productName === brand.productName],
    ['main binary name', tauriConfig.mainBinaryName === brand.productName],
    ['bundle identifier', tauriConfig.identifier === brand.bundleIdentifier],
    [
        'deep-link scheme',
        tauriConfig.plugins?.['deep-link']?.desktop?.schemes?.includes(brand.legacyDeepLinkScheme) ===
            true,
    ],
    ['User-Agent format', frontendConfig.includes(brand.userAgentSnippet)],
    ['private Modrinth services disabled', frontendConfig.includes('privateModrinthServices: false')],
    ['telemetry disabled', frontendConfig.includes('ghsTelemetry: false')],
]
for (const [label, valid] of requiredInvariants) {
    if (!valid) failures.push(`configuration: missing ${label}`)
}

if (failures.length > 0) {
    console.error(`Endpaper brand guard failed:\n${failures.join('\n')}`)
    process.exit(1)
}

console.log('Endpaper brand guard passed.')
