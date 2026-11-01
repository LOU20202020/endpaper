const trimTrailingSlash = (url: string) => url.replace(/\/$/, '')

/**
 * Endpaper 品牌配置（从 Endpaper 源码改出来的本地版本）。
 * 改这里就够了：产品名、仓库、群号、深链、UA 都在这一处。
 */
export const AxolotlBrandConfig = Object.freeze({
    productName: 'Endpaper',
    shortProductName: 'Endpaper',
    website: 'https://github.com/LOU20202020/endpaper',
    repositoryUrl: 'https://github.com/LOU20202020/endpaper',
    supportUrl: 'https://github.com/LOU20202020/endpaper/issues',
    qqGroupNumber: '1128458494',
    qqChannelUrl: '',
    sponsorUrl: '',
    bundleIdentifier: 'com.lou0122.endpaper',
    deepLinkScheme: 'endpaper',
    userAgent: (version: string, os: string) => `Endpaper/${version} (${os})`,
    capabilities: Object.freeze({
        publicModrinthApi: true,
        privateModrinthServices: false,
        ghsTelemetry: false,
    }),
})

const siteUrl = trimTrailingSlash(import.meta.env.MODRINTH_URL || 'https://modrinth.com')
const officialLabrinthBaseUrl = trimTrailingSlash(
    import.meta.env.MODRINTH_API_BASE_URL || 'https://api.modrinth.com',
)
type DownloadSourceMode = 'auto' | 'official_only' | 'mirror_preferred' | 'official_preferred'

// The Modrinth API always uses the official source; Modrinth download mirror
// routing is handled by the Rust download layer.
export function setModrinthSourceMode(_sourceMode: DownloadSourceMode) {}

export function setModrinthMirrorEnabled(_enabled: boolean) {}

export function getOfficialLabrinthBaseUrl() {
    return officialLabrinthBaseUrl
}

export function getLabrinthBaseUrl() {
    return officialLabrinthBaseUrl
}

export const config = {
    siteUrl,
    labrinthBaseUrl: getLabrinthBaseUrl,
}
