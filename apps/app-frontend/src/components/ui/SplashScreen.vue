<template>
    <Transition name="splash-fade" @after-leave="onAfterLeave">
        <div v-if="!doneLoading" class="ep-splash" :class="`ph-${phase}`" data-tauri-drag-region>
            <!-- 纸张底：翻开后铺满整个窗口 -->
            <div class="paper-fill"></div>

            <!-- 开卷剪影（照快捷方式图标：顶上凹、底出尖、四角圆） -->
            <svg class="clip-defs" width="0" height="0" aria-hidden="true">
                <defs>
                    <clipPath id="epBookClip" clipPathUnits="objectBoundingBox">
                        <path d="M0.012 0.048 Q0.012 0.006 0.052 0.010 L0.5 0.078 L0.948 0.010 Q0.988 0.006 0.988 0.048 L0.988 0.922 Q0.988 0.966 0.948 0.958 L0.5 0.998 L0.052 0.958 Q0.012 0.966 0.012 0.922 Z" />
                    </clipPath>
                </defs>
            </svg>

            <!-- 图标形态：深蓝封皮 + 米白书页 + 右页苦力怕 -->
            <div class="spread">
                <div class="spread-pages">
                    <div class="gutter spread-gutter"></div>
                    <div class="creeper spread-creeper">
                        <i v-for="c in creeperCells" :key="c.k" class="px" :style="c.style"></i>
                    </div>
                </div>
            </div>

            <div class="book" data-tauri-drag-region>
                <!-- 书页 -->
                <div class="page page-left"></div>
                <div class="page page-right">
                    <div class="creeper">
                        <i
                            v-for="c in creeperCells"
                            :key="c.k"
                            class="px"
                            :style="c.style"
                        ></i>
                    </div>
                </div>
                <div class="gutter"></div>

                <!-- 封面：绕左侧书脊翻开，翻过来是米白环衬 -->
                <div class="cover">
                    <div class="face face-front">
                        <div class="emboss">
                            <i v-for="c in creeperCells" :key="c.k" class="epx" :style="c.style"></i>
                        </div>
                        <div class="title">
                            <span class="title-main">EndPaper</span>
                            <span class="title-sub">LAUNCHER</span>
                        </div>
                    </div>
                    <div class="face face-back"></div>
                </div>
            </div>

            <!-- 黄条：先是夹在书里的书签，之后加宽成左侧导航栏（放在书外面，避免被 3D 封面的层级压住） -->
            <div class="rail">
                <div class="rail-grip"></div>
                <i v-for="n in 6" :key="n" class="nav-dot" :style="{ transitionDelay: `${(n - 1) * 55}ms` }"></i>
            </div>

            <div v-if="slow" class="slow-hint">加载中…</div>
        </div>
    </Transition>
</template>

<script setup>
import { defineMessages, injectLoadingState, useVIntl } from '@modrinth/ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { loading_listener } from '@/helpers/events.js'

const doneLoading = ref(false)
const loadingProgress = ref(0)
const phase = ref(0)
const slow = ref(false)
const animationDone = ref(false)

// 0 合书亮相 / 1 翻开 / 2 书页与苦力怕 / 3 苦力怕淡出、黄条加宽 / 4 导航浮出
const PHASES = [0, 520, 1020, 1300, 1560]
const TOTAL_MS = 1800

const loading = injectLoadingState()
const { formatMessage } = useVIntl()

const messages = defineMessages({
    updatingAppDirectory: {
        id: 'app.splash.updating-app-directory',
        defaultMessage: 'Updating app directory...',
    },
})

const timers = []
let fallbackTimer
let slowTimer
let animStarted = false

function clearTimers() {
    while (timers.length) {
        clearTimeout(timers.pop())
    }
}

function runAnimation() {
    clearTimers()
    PHASES.forEach((delay, index) => {
        if (index === 0) {
            return
        }
        timers.push(
            setTimeout(() => {
                phase.value = index
            }, delay),
        )
    })
    timers.push(
        setTimeout(() => {
            phase.value = 4
            animationDone.value = true
        }, TOTAL_MS),
    )
    slowTimer = setTimeout(() => {
        slow.value = true
    }, 6000)
}

// 8x8 苦力怕脸（X = 亮起的像素）
const CREEPER = [
    '........',
    '.XX..XX.',
    '.XX..XX.',
    '...XX...',
    '..XXXX..',
    '..XXXX..',
    '..X..X..',
    '........',
]

const creeperCells = computed(() => {
    const cells = []
    CREEPER.forEach((row, y) => {
        Array.from(row).forEach((ch, x) => {
            if (ch !== 'X') {
                return
            }
            cells.push({
                k: `${x}-${y}`,
                style: {
                    left: `${x * 12.5}%`,
                    top: `${y * 12.5}%`,
                    transitionDelay: `${cells.length * 14}ms`,
                },
            })
        })
    })
    return cells
})

function onAfterLeave() {
    document.documentElement.classList.remove('ep-splashing')
    // 启动画面上就是纸；退场后主界面也落在同一张纸上，视觉不断裂
    document.documentElement.classList.add('ep-paper')
    loading.setEnabled(true)
}

watch(
    [loading.barEnabled, loading.pending, animationDone],
    ([barEnabled, pending, animated]) => {
        if (barEnabled) {
            return
        }
        if (pending) {
            loadingProgress.value = 0
            return
        }
        // 动画没放完就等着，放完才关启动画面
        if (!animated) {
            return
        }
        setTimeout(() => {
            if (loading.pending.value) {
                return
            }
            // 先把主界面放出来（它还盖在书下面），再让书淡出，中间不会露出桌面
            document.documentElement.classList.remove('ep-splashing')
            document.documentElement.classList.add('ep-paper')
            setTimeout(() => {
                doneLoading.value = true
            }, 30)
        }, 120)
    },
    { immediate: true },
)

loading_listener((e) => {
    if (e.event.type === 'directory_move' || e.event.type === 'checking_for_updates') {
        loadingProgress.value = 100 * (e.fraction ?? 1)
        if (e.event.type === 'directory_move') {
            formatMessage(messages.updatingAppDirectory)
        }
    }
})

function startAnimation() {
    if (animStarted) {
        return
    }
    animStarted = true
    runAnimation()
}

onMounted(() => {
    document.documentElement.classList.add('ep-splashing')
    // 窗口是 visible:false，App.vue 调 show_window 之后才算真正可见
    window.addEventListener('endpaper:window-shown', startAnimation, { once: true })
    fallbackTimer = setTimeout(startAnimation, 900)
})

onBeforeUnmount(() => {
    document.documentElement.classList.remove('ep-splashing')
    window.removeEventListener('endpaper:window-shown', startAnimation)
    if (fallbackTimer) {
        clearTimeout(fallbackTimer)
    }
    if (slowTimer) {
        clearTimeout(slowTimer)
    }
    clearTimers()
})
</script>

<style scoped lang="scss">
$ink: #16233d;
$paper: #f6f0dd;
$ochre: #b06a3b;
$shadow: 0 2.4rem 5rem rgba(6, 12, 24, 0.45);

.splash-fade-leave-active {
    transition: opacity 0.22s ease;
}
.splash-fade-leave-to {
    opacity: 0;
}

.ep-splash {
    position: fixed;
    inset: 0;
    background: transparent;
    overflow: hidden;
    user-select: none;
}

/* 翻开之后整窗变纸 */
.paper-fill {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(circle at 50% 40%, #fbf6e7 0%, $paper 55%, #efe6cd 100%);
    opacity: 0;
    transition: opacity 0.42s ease;
}

.ph-2 .paper-fill,
.ph-3 .paper-fill,
.ph-4 .paper-fill {
    opacity: 1;
}

/* 开卷剪影形态：翻开的最后落点就是这个样子 */
.spread {
    position: absolute;
    inset: 0;
    background: linear-gradient(152deg, #26395f 0%, $ink 44%, #0d1526 100%);
    clip-path: url(#epBookClip);
    opacity: 0;
    transition: opacity 0.13s ease;
}

.ph-2 .spread,
.ph-3 .spread,
.ph-4 .spread {
    opacity: 1;
}

.spread-pages {
    position: absolute;
    inset: 6.2% 2% 7.6% 2.6%;
    background:
        radial-gradient(circle at 46% 38%, #fbf6e7 0%, $paper 60%, #f0e7cf 100%);
    border-radius: 0.45rem;
    overflow: hidden;
    box-shadow: inset 0 0 2.4rem -1rem rgba(120, 96, 60, 0.35);
}

.spread-gutter {
    width: 3.6rem;
}

.spread .spread-creeper {
    left: 75%;
    top: 46%;
    width: 21vw;
}

/* 翻开那一刻，3D 书让位给剪影形态 */
.ph-2 .book,
.ph-3 .book,
.ph-4 .book {
    opacity: 0;
    transition:
        left 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        right 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        top 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        bottom 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        filter 0.4s ease,
        opacity 0.14s ease 0.09s;
}

/* 书本体 */
.book {
    position: absolute;
    left: 33.5%;
    right: 33.5%;
    top: 9%;
    bottom: 9%;
    perspective: 2400px;
    transform-style: preserve-3d;
    filter: drop-shadow(0 1.6rem 3rem rgba(6, 12, 24, 0.5));
    transition:
        left 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        right 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        top 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        bottom 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        filter 0.4s ease;
}

.ph-1 .book,
.ph-2 .book,
.ph-3 .book,
.ph-4 .book {
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
}

.ph-2 .book,
.ph-3 .book,
.ph-4 .book {
    filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
}


/* 书的底板：翻开过程中封面转到 90° 是零宽度，这一层保证任何角度都不漏白 */
.book::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(152deg, #26395f 0%, $ink 46%, #0d1526 100%);
    border-radius: 0.9rem;
    box-shadow: inset 0 0 0 1px rgba(246, 240, 221, 0.18);
}

/* 书页 */
.page {
    position: absolute;
    top: 0;
    bottom: 0;
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0.02) 40%, rgba(0, 0, 0, 0.05));
    background-color: $paper;
    opacity: 0;
    transition: opacity 0.4s ease;
}

.page-left {
    left: 0;
    width: 50%;
    border-radius: 0.9rem 0 0 0.9rem;
}

.page-right {
    left: 50%;
    right: 0;
    border-radius: 0 0.9rem 0.9rem 0;
}

.ph-1 .page,
.ph-2 .page,
.ph-3 .page,
.ph-4 .page {
    opacity: 1;
}

/* 书脊折痕 */
.gutter {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 3.2rem;
    transform: translateX(-50%);
    background: linear-gradient(
        90deg,
        rgba(120, 96, 60, 0) 0%,
        rgba(120, 96, 60, 0.16) 42%,
        rgba(90, 70, 40, 0.3) 50%,
        rgba(120, 96, 60, 0.16) 58%,
        rgba(120, 96, 60, 0) 100%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
}

.ph-2 .gutter,
.ph-3 .gutter,
.ph-4 .gutter {
    opacity: 1;
}

/* 苦力怕脸 */
.creeper {
    position: absolute;
    left: 50%;
    top: 47%;
    width: 34%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    transition: opacity 0.42s ease;
}

.px {
    position: absolute;
    width: 12.5%;
    height: 12.5%;
    background: $ink;
    opacity: 0;
    transform: scale(0.55);
    transition:
        opacity 0.14s ease-out,
        transform 0.14s ease-out;
}

.ph-2 .px {
    opacity: 0.9;
    transform: scale(1);
}

.ph-3 .px,
.ph-4 .px {
    opacity: 0;
    transform: scale(0.9);
}

/* 黄条 → 侧栏 */
.rail {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(50% - 0.42rem);
    width: 0.84rem;
    background: linear-gradient(180deg, #c07a45 0%, $ochre 50%, #96552c 100%);
    border-radius: 0 0 0.2rem 0.2rem;
    box-shadow: 0 0.3rem 0.9rem rgba(0, 0, 0, 0.25);
    z-index: 8;
    opacity: 0;
    transition:
        opacity 0.3s ease,
        left 0.42s cubic-bezier(0.22, 0.61, 0.36, 1),
        width 0.42s cubic-bezier(0.22, 0.61, 0.36, 1),
        border-radius 0.3s ease;
}

.ph-2 .rail,
.ph-3 .rail,
.ph-4 .rail {
    opacity: 1;
}

.ph-2 .rail {
    left: 2.05rem;
    width: 0.5rem;
}

.ph-3 .rail,
.ph-4 .rail {
    left: 0;
    width: 5.6rem;
    border-radius: 0 1rem 1rem 0;
}

/* 黄条下端的 V 形剪口（只在书签阶段有） */
.rail-grip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -0.42rem;
    height: 0.42rem;
    background: #96552c;
    clip-path: polygon(0 0, 100% 0, 50% 100%);
    transition: opacity 0.25s ease;
}

.ph-3 .rail-grip,
.ph-4 .rail-grip {
    opacity: 0;
}

/* 导航图标：从黄条里长出来 */
.nav-dot {
    position: absolute;
    left: 50%;
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 0.45rem;
    background: rgba(22, 35, 61, 0.82);
    transform: translate(-50%, 0) scale(0.3);
    opacity: 0;
    transition:
        opacity 0.26s ease,
        transform 0.26s cubic-bezier(0.34, 1.4, 0.5, 1);
}

.nav-dot:nth-child(2) {
    top: 14%;
}
.nav-dot:nth-child(3) {
    top: 26%;
}
.nav-dot:nth-child(4) {
    top: 38%;
}
.nav-dot:nth-child(5) {
    top: 50%;
}
.nav-dot:nth-child(6) {
    top: 72%;
    height: 3.4rem;
}
.nav-dot:nth-child(7) {
    top: 92%;
}

.ph-4 .nav-dot {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
}

/* 封面 */
.cover {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    transform-origin: left center;
    transform-style: preserve-3d;
    transform: rotateY(0deg);
    transition:
        width 0.55s cubic-bezier(0.22, 0.61, 0.36, 1),
        transform 0.62s cubic-bezier(0.4, 0.1, 0.3, 1);
}

.ph-1 .cover,
.ph-2 .cover,
.ph-3 .cover,
.ph-4 .cover {
    width: 50%;
    transform: rotateY(-180deg);
}

.face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    border-radius: 0 0.9rem 0.9rem 0;
}

.face-front {
    background:
        linear-gradient(155deg, #22345a 0%, $ink 42%, #101a2e 100%);
    box-shadow:
        inset 0 0 0 1px rgba(246, 240, 221, 0.35),
        inset 0.9rem 0 1.6rem -0.6rem rgba(0, 0, 0, 0.55);
    display: grid;
    place-items: center;
    overflow: hidden;
}

/* 书脊：封面左边缘的一条赭石 */
.face-front::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0.62rem;
    background: linear-gradient(90deg, #8d4f2a 0%, $ochre 55%, #c2804c 100%);
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.35);
}

/* 书口：右边缘露出的纸芯 */
.face-front::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0.28rem;
    bottom: 0.28rem;
    width: 0.3rem;
    border-radius: 0 0.5rem 0.5rem 0;
    background: repeating-linear-gradient(
        180deg,
        rgba(246, 240, 221, 0.92) 0 2px,
        rgba(214, 202, 172, 0.92) 2px 3px
    );
}

.face-back {
    transform: rotateY(180deg);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(0, 0, 0, 0.03) 45%, rgba(0, 0, 0, 0.06)),
        $paper;
    border-radius: 0.9rem 0 0 0.9rem;
    box-shadow: inset 0 0 0 1px rgba(120, 96, 60, 0.18);
}

/* 封面上的苦力怕浮雕（低对比度） */
.emboss {
    position: absolute;
    left: 50%;
    top: 64%;
    width: 46%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    opacity: 0.085;
    filter: blur(0.5px);
}

.epx {
    position: absolute;
    width: 12.5%;
    height: 12.5%;
    background: $paper;
}

/* 封面书名 */
.title {
    position: absolute;
    left: 50%;
    top: 34%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
    padding: 1rem;
    text-align: center;
}

.title-main {
    font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
    font-size: clamp(1.6rem, 3.4vw, 3rem);
    letter-spacing: 0.06em;
    color: $paper;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
}

.title-sub {
    font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
    font-size: clamp(0.62rem, 1vw, 0.86rem);
    letter-spacing: 0.42em;
    text-indent: 0.42em;
    color: rgba(246, 240, 221, 0.6);
}

.slow-hint {
    position: absolute;
    left: 50%;
    bottom: 4.5rem;
    transform: translateX(-50%);
    font-size: 0.82rem;
    letter-spacing: 0.2em;
    color: rgba(22, 35, 61, 0.55);
}
</style>
