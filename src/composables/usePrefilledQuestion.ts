import { ref } from 'vue'

// Передача предзаполненного вопроса между экранами (у нас нет vue-router
// с параметрами маршрута — экраны переключаются через provide('navigate')).
//
// Сценарий: кнопка «Спросить карты об этом» на экране результата Сонника
// кладёт сюда oracleQuestion и ведёт на экран Оракула (FortuneScreen),
// который в onMounted забирает вопрос через consumePrefilledQuestion().
//
// consume-семантика (прочитал → очистил) намеренная: вопрос должен
// подставиться один раз, а не «прилипать» ко всем следующим заходам в Оракул.
const prefilledQuestion = ref<string | null>(null)

export function usePrefilledQuestion() {
  const setPrefilledQuestion = (question: string) => {
    prefilledQuestion.value = question
  }

  const consumePrefilledQuestion = (): string | null => {
    const q = prefilledQuestion.value
    prefilledQuestion.value = null
    return q
  }

  return { setPrefilledQuestion, consumePrefilledQuestion }
}
