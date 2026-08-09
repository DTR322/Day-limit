<template>
  <!-- Баннер с кнопкой -->
  <div v-if="showBanner" class="install-banner">
    <div class="install-text">
      <div class="install-title">Установить приложение?</div>
      <div class="install-sub">Работает офлайн, как обычное приложение</div>
    </div>
    <button class="install-btn" @click="install">Создать ярлык</button>
    <button class="install-close" @click="dismiss">×</button>
  </div>

  <!-- Инструкция для iOS -->
  <div v-if="showIosModal" class="ios-modal" @click="showIosModal = false">
    <div class="ios-card" @click.stop>
      <h3>Установка на iPhone</h3>
      <ol>
        <li>Нажми <b>«Поделиться»</b> — квадрат со стрелкой вверх внизу экрана</li>
        <li>Пролистай и выбери <b>«На экран “Домой”»</b></li>
        <li>Нажми <b>«Добавить»</b></li>
      </ol>
      <button class="install-btn wide" @click="showIosModal = false">Понятно</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const deferredPrompt = ref(null)
const showBanner = ref(false)
const showIosModal = ref(false)

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
const dismissed = localStorage.getItem('install-dismissed') === '1'

function onBeforeInstallPrompt(e) {
  // Сохраняем событие, чтобы вызвать диалог по кнопке, а не автоматически
  e.preventDefault()
  deferredPrompt.value = e
  if (!dismissed && !isStandalone) showBanner.value = true
}

function onAppInstalled() {
  showBanner.value = false
}

onMounted(() => {
  // На iOS beforeinstallprompt не существует — показываем баннер сразу
  if (isIOS && !isStandalone && !dismissed) showBanner.value = true
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})

async function install() {
  if (deferredPrompt.value) {
    // Android / Chrome: системный диалог установки
    deferredPrompt.value.prompt()
    const choice = await deferredPrompt.value.userChoice
    if (choice.outcome === 'accepted') showBanner.value = false
    deferredPrompt.value = null
  } else {
    // iOS и прочие: показываем инструкцию
    showIosModal.value = true
  }
}

function dismiss() {
  showBanner.value = false
  localStorage.setItem('install-dismissed', '1')
}
</script>

<style scoped>
.install-banner {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1f2937;
  color: white;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: bannerIn 0.3s ease;
}

@keyframes bannerIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.install-text {
  flex: 1;
  min-width: 0;
}

.install-title {
  font-size: 15px;
  font-weight: 700;
}

.install-sub {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

.install-btn {
  flex-shrink: 0;
  padding: 12px 18px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.install-btn.wide {
  width: 100%;
  margin-top: 16px;
}

.install-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.ios-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.ios-card {
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 20px;
  padding: 24px;
}

.ios-card h3 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.ios-card ol {
  margin: 0;
  padding-left: 20px;
  color: #374151;
  font-size: 15px;
  line-height: 1.7;
}
</style>