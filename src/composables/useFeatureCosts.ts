import { ref } from 'vue'
import { api, type FeatureCostsResponse } from '@/utils/api'

// Синглтон — стоимость платных функций едина для всего приложения.
// По аналогии с useBalance: данные живут в одном месте, а экраны лишь читают их.
//
// Зачем вообще composable, а не хардкод на экранах: цены настраиваются админом
// через админ-панель и пишутся в БД. Экраны раскладов/совместимости/нумерологии
// недели должны показывать ИМЕННО ту цену, которую реально спишет бэкенд, иначе
// пользователь видит одно, а списывается другое (и это ещё и расхождение с офертой).

// Дефолтные значения — мгновенный fallback до ответа сервера и страховка на случай
// сетевой ошибки. Совпадают с прежними захардкоженными ценами, чтобы UI никогда
// не показывал 0/пусто. Реальные цены приедут с /api/feature-costs и перезапишут их.
const DEFAULT_COSTS: FeatureCostsResponse = {
  threeCard: 3,
  horseshoe: 6,
  celticCross: 9,
  compatibilityUnlock: 3,
  numerologyWeek: 3,
  numerologyMonth: 10,
  dream: 3,
}

// Общий реактивный стейт на всё приложение
const featureCosts = ref<FeatureCostsResponse>({ ...DEFAULT_COSTS })
// Загружали ли мы цены хотя бы раз за текущую сессию (чтобы не дёргать сеть зря в особых сценариях)
const loaded = ref(false)

export function useFeatureCosts() {
  /**
   * Подтягивает актуальные цены с бэкенда.
   * Вызывается в onMounted каждого экрана с платным контентом, чтобы цена всегда
   * была свежей на момент открытия экрана. Пока ответ не пришёл, экран показывает
   * кешированные/дефолтные значения — без «мигания» нулями.
   */
  const loadFeatureCosts = async () => {
    try {
      const res = await api.getFeatureCosts()
      featureCosts.value = res.data
      loaded.value = true
    } catch {
      // Молча игнорируем — остаются прежние (кеш или дефолт). Лучше показать
      // последнюю известную цену, чем сломать экран из-за сетевой ошибки.
    }
  }

  return { featureCosts, loaded, loadFeatureCosts }
}
