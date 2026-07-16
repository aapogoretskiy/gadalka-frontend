<template>
  <div class="liora-loader" :class="`liora-loader--${size}`">
    <!-- Маскот: фигура Лиоры + пульсирующее свечение + искры -->
    <div class="ll-fig-wrap">
      <div class="ll-glow"></div>
      <img :src="figureSrc" alt="Лиора" class="ll-figure" draggable="false" />
      <span class="ll-particle" style="left:-6px; top:60%; animation-delay:0s">✦</span>
      <span class="ll-particle" style="left:96%; top:50%; animation-delay:1.1s">✧</span>
      <span class="ll-particle" style="left:20%; top:24%; animation-delay:2.2s">✦</span>
      <span class="ll-particle" style="left:78%; top:18%; animation-delay:0.6s">✧</span>
    </div>

    <!-- Меняющиеся фразы (ротацию делает сам компонент) -->
    <h2 v-if="phrases.length" class="serif ll-phrase">{{ phrases[phraseIdx] }}</h2>

    <p v-if="subtitle" class="ll-subtitle">{{ subtitle }}</p>

    <!-- Прогресс-бар — только если передан progress -->
    <div v-if="progress !== undefined" class="ll-progress-wrap">
      <div class="ll-progress-fill" :style="`width:${progress}%`"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Единый лоадер приложения: маскот Лиора со свечением и искрами.
// Используется на экранах ожидания (расклады, сны, нумерология, онбординг)
// вместо ранее продублированного в каждом экране блока ai-orb.
import { ref, onMounted, onUnmounted } from 'vue'
import figureSrc from '@/assets/liora-figure.png'

const props = withDefaults(defineProps<{
  /** Фразы, сменяющие друг друга под маскотом */
  phrases?: string[]
  /** Статичный подзаголовок под фразой */
  subtitle?: string
  /** 0–100; если не передан — прогресс-бар скрыт */
  progress?: number
  /** md — полноэкранные «ритуальные» лоадеры, sm — компактные (нумерология) */
  size?: 'md' | 'sm'
  /** Интервал смены фраз, мс */
  phraseIntervalMs?: number
}>(), {
  phrases: () => [],
  size: 'md',
  phraseIntervalMs: 1800,
})

const phraseIdx = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (props.phrases.length > 1) {
    timer = setInterval(() => {
      phraseIdx.value = (phraseIdx.value + 1) % props.phrases.length
    }, props.phraseIntervalMs)
  }
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.liora-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* ── Маскот ── */
.ll-fig-wrap {
  position: relative;
  animation: ll-float 3.6s ease-in-out infinite;
}
.ll-glow {
  position: absolute;
  left: 50%; top: 54%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(182,84,255,.5) 0%, rgba(94,23,168,.22) 55%, transparent 75%);
  animation: ll-glow 2.8s ease-in-out infinite;
}
.liora-loader--md .ll-glow { width: 200px; height: 200px; }
.liora-loader--sm .ll-glow { width: 135px; height: 135px; }
.ll-figure {
  position: relative;
  display: block;
  image-rendering: pixelated;   /* чёткие пиксели при масштабировании */
  filter: drop-shadow(0 10px 24px rgba(0,0,0,.6));
  user-select: none;
  -webkit-user-drag: none;
}
.liora-loader--md .ll-figure { height: 210px; }
.liora-loader--sm .ll-figure { height: 140px; }

/* Искры вокруг фигуры */
.ll-particle {
  position: absolute;
  font-size: 14px;
  color: #ffc857;
  opacity: 0;
  pointer-events: none;
  animation: ll-particle 3.2s ease-in-out infinite;
}

/* ── Текст ── */
.ll-phrase {
  font-size: 22px;
  font-style: italic;
  color: rgba(255,255,255,.85);
  margin: 26px 16px 8px;
  min-height: 56px;
  animation: ll-phrase-fade 1.4s ease-in-out infinite;
}
.liora-loader--sm .ll-phrase {
  font-size: 16px;
  min-height: 0;
  margin: 18px 12px 4px;
}
.ll-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,.55);
  margin: 0 0 28px;
}
.liora-loader--sm .ll-subtitle { margin-bottom: 0; }

/* ── Прогресс ── */
.ll-progress-wrap {
  width: 190px; height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,.1);
  overflow: hidden;
}
.ll-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  transition: width .6s;
}

/* ── Анимации ── */
@keyframes ll-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes ll-glow {
  0%, 100% { opacity: .7; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: 1;  transform: translate(-50%,-50%) scale(1.12); }
}
@keyframes ll-particle {
  0%   { opacity: 0; transform: translateY(8px) scale(.7); }
  30%  { opacity: .9; }
  100% { opacity: 0; transform: translateY(-46px) scale(1.15); }
}
@keyframes ll-phrase-fade {
  0%, 100% { opacity: .55; }
  50%      { opacity: 1; }
}
</style>
