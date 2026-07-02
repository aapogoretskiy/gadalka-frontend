<template>
  <div class="onb-wrap">

    <!-- ══════════ Welcome: вход без барьера ══════════
         Новичок сначала получает опыт (карта дня → подарочный расклад),
         анкета — потом и пропускаемая. Согласие с офертой — click-wrap
         на этом экране (фиксируется через /api/me/accept-terms). -->
    <div v-if="step === 'welcome'" class="onb-screen welcome-screen">
      <div class="welcome-hero">
        <div class="liora-orb"><span class="liora-orb-inner">🔮</span></div>
        <h1 class="serif welcome-title">Liora</h1>
        <p class="onb-sub">Карты уже перемешаны для вас</p>
      </div>
      <div class="onb-form welcome-form">
        <button class="onb-btn haptic" :disabled="isLoading" @click="startJourney">
          {{ isLoading ? 'Тасуем колоду...' : '✨ Получить первую карту дня' }}
        </button>
        <p class="welcome-terms">
          Продолжая, вы соглашаетесь с
          <button class="terms-link" type="button" @click="agreementOpen = true">Пользовательским соглашением</button>
          и
          <button class="terms-link" type="button" @click="privacyOpen = true">Политикой конфиденциальности</button>
        </p>
        <p v-if="errorMsg" class="onb-error">{{ errorMsg }}</p>
      </div>
    </div>

    <!-- ══════════ Карта дня — первый вау-момент ══════════ -->
    <div v-if="step === 'daily'" class="onb-screen">
      <div class="onb-hero onb-hero--safe">
        <h2 style="font-size:26px;margin-bottom:4px">Ваша карта дня</h2>
        <p class="onb-sub">{{ todayLabel }}</p>
      </div>
      <div class="onb-form">
        <div class="onb-daily-card glass">
          <img v-if="dailyCard?.imageUrl" :src="dailyCard.imageUrl" :alt="dailyCard?.name" class="onb-daily-img" />
          <div class="onb-daily-name serif">{{ dailyCard?.name }}</div>
          <p class="onb-daily-meaning">{{ dailyCard?.meaning }}</p>
          <p v-if="dailyCard?.advice" class="onb-daily-advice">✦ {{ dailyCard?.advice }}</p>
        </div>
        <button class="onb-btn haptic" @click="goToQuestions">🃏 Сделать первый расклад — в подарок</button>
        <button class="onb-skip" @click="finishLater">Позже — на главную</button>
      </div>
    </div>

    <!-- ══════════ Выбор вопроса для подарочного расклада ══════════ -->
    <div v-if="step === 'question'" class="onb-screen">
      <div class="onb-hero onb-hero--safe">
        <h2 style="font-size:26px;margin-bottom:4px">О чём спросить карты?</h2>
        <p class="onb-sub">Первый расклад — наш подарок</p>
      </div>
      <div class="onb-form">
        <div v-if="isLoading" class="onb-shuffle">
          <div class="liora-orb"><span class="liora-orb-inner">🃏</span></div>
          <p class="onb-sub">Готовим вопросы...</p>
        </div>
        <template v-else>
          <button
            v-for="q in questions" :key="q"
            class="onb-question haptic"
            @click="askQuestion(q)"
          >{{ q }}</button>
          <button v-if="questions.length === 0" class="onb-skip" @click="finishLater">Продолжить без расклада</button>
        </template>
        <p v-if="errorMsg" class="onb-error">{{ errorMsg }}</p>
      </div>
    </div>

    <!-- ══════════ «Магия» перед раскладом: ритуальный экран расчёта ══════════
         Расклад приходит из предгенерированного пула мгновенно — но мгновенный
         ответ обесценивает ощущение работы карт. Держим пользователя ~3 секунды
         на анимации с меняющимися фразами. -->
    <div v-if="step === 'shuffling'" class="onb-screen">
      <div class="onb-form onb-shuffle-screen">
        <div class="liora-orb"><span class="liora-orb-inner">🔮</span></div>
        <p class="onb-shuffle-phrase serif">{{ shufflePhrase }}</p>
      </div>
    </div>

    <!-- ══════════ Результат подарочного расклада ══════════ -->
    <div v-if="step === 'spread'" class="onb-screen">
      <div class="onb-hero onb-hero--safe">
        <h2 style="font-size:20px;margin-bottom:4px">{{ fortune?.question }}</h2>
        <p class="onb-sub">Расклад «Три карты»</p>
      </div>
      <div class="onb-form">
        <div v-for="c in fortune?.cards" :key="c.id" class="onb-spread-card glass">
          <div class="onb-spread-pos">{{ positionLabel(c.cardPosition) }}</div>
          <div class="onb-spread-head">
            <img v-if="c.imageUrl" :src="c.imageUrl" :alt="c.name" class="onb-spread-img" />
            <div class="onb-spread-name serif">{{ c.name }}</div>
          </div>
          <p class="onb-spread-text">{{ c.interpretation }}</p>
        </div>
        <div class="onb-spread-card glass">
          <div class="onb-spread-pos">Общее послание</div>
          <p class="onb-spread-text">{{ fortune?.interpretation }}</p>
        </div>
        <button class="onb-btn haptic" @click="step = 1">Продолжить ✨</button>
      </div>
    </div>

    <!-- Step 1: Дата рождения (отложенная регистрация — пропускаемая) -->
    <div v-if="step === 1" class="onb-screen">
      <div class="onb-hero">
        <div class="onb-icon">🔮</div>
        <h1>Расскажите о себе</h1>
        <p class="onb-sub">Откроем персональный гороскоп и нумерологию · +1 знак в подарок</p>
        <div class="progress-dots">
          <div class="dot" :class="{ active: stepNum >= 1 }"></div>
          <div class="dot" :class="{ active: stepNum >= 2 }"></div>
          <div class="dot" :class="{ active: stepNum >= 3 }"></div>
          <div class="dot" :class="{ active: stepNum >= 4 }"></div>
        </div>
      </div>

      <div class="onb-form">
        <!-- Объяснение зачем нужны данные -->
        <div class="data-reason-card">
          <div class="data-reason-header">
            <span class="data-reason-icon">✦</span>
            <span class="data-reason-title">Зачем нам эти данные?</span>
          </div>
          <p class="data-reason-body">
            Дата, время и город рождения — основа ваших персональных расчётов. На их основе мы строим расклады Таро, нумерологический профиль и расчёт совместимости. Чем точнее данные — тем точнее результат.
          </p>
        </div>

        <div class="form-row">
          <label class="input-label">Дата рождения <span class="req">*</span></label>
          <input
            type="date"
            :value="form.birthDate"
            @input="form.birthDate = ($event.target as HTMLInputElement).value"
            @change="form.birthDate = ($event.target as HTMLInputElement).value"
            class="onb-input input-date"
          />
        </div>
        <div class="form-row">
          <label class="input-label">Время рождения <span class="req">*</span></label>
          <input
            type="time"
            :value="form.birthTime"
            @input="form.birthTime = ($event.target as HTMLInputElement).value"
            @change="form.birthTime = ($event.target as HTMLInputElement).value"
            class="onb-input input-date"
          />
        </div>
        <div class="form-row">
          <label class="input-label">Город рождения <span class="req">*</span></label>
          <input v-model="form.birthCity" type="text" placeholder="Например: Москва" class="onb-input" />
        </div>
        <button
          class="onb-btn haptic"
          :disabled="!form.birthDate || !form.birthTime || !form.birthCity.trim()"
          @click="step = 2"
        >
          Далее →
        </button>
        <button class="onb-skip" @click="finishLater">Заполню позже</button>
      </div>
    </div>

    <!-- Модальное окно: Пользовательское соглашение -->
    <Teleport to="body">
      <div v-if="agreementOpen" class="terms-modal-overlay" @click.self="agreementOpen = false">
        <div class="terms-modal">
          <div class="terms-modal-header">
            <div class="terms-modal-title serif">Пользовательское соглашение</div>
            <button class="terms-modal-close haptic" @click="agreementOpen = false">✕</button>
          </div>
          <div class="terms-modal-body">
            <p class="terms-doc-meta">Публичная оферта · Редакция: 1.0 &nbsp;·&nbsp; Дата вступления в силу: 26 апреля 2026 г.</p>

            <h3>1. Общие положения и термины</h3>
            <p>Настоящий документ является публичной офертой (ст. 435, 437 ГК РФ) и содержит все существенные условия договора возмездного оказания услуг (ст. 779 ГК РФ) между Оператором и Пользователем.</p>
            <p><strong>Основные термины:</strong> «Оператор» — самозанятый, реквизиты в разделе 16; «Пользователь» — физическое лицо, акцептовавшее Оферту; «Сервис» — Telegram Mini App «Мистика»; «Контент» — расклады, расчёты, прогнозы и иные материалы Сервиса; «Платная функция» — функция или Контент на возмездной основе.</p>

            <h3>2. Стороны и акцепт Оферты</h3>
            <p>Пользователем может быть дееспособное физическое лицо, достигшее 18 лет. Акцептом Оферты (ст. 438 ГК РФ) является любое из следующих действий: запуск Mini App «Мистика»; использование любых функций Сервиса; совершение оплаты Платной функции.</p>
            <p>С момента первого из указанных действий договор считается заключённым. Если Пользователь не согласен с условиями — он обязан прекратить использование Сервиса.</p>

            <h3>3. Предмет Соглашения</h3>
            <p>Оператор предоставляет Пользователю доступ к функционалу Сервиса: расклады Таро, нумерологические расчёты, расчёт совместимости, персональные прогнозы и рекомендации, а также иные функции интерфейса. Часть функций — бесплатная, часть — платная (информация о стоимости отображается до оплаты). Пользователю предоставляется ограниченное непередаваемое право использования Сервиса для личных некоммерческих целей.</p>

            <h3>4. Характер услуг</h3>
            <p>Сервис носит исключительно <strong>информационно-развлекательный характер</strong>. Контент не является и не должен расцениваться как медицинская, психологическая, финансовая, юридическая или иная профессиональная консультация. Пользователь принимает любые решения самостоятельно и под свою ответственность. Результат Сервиса носит субъективный, интерпретационный характер и не является объективно проверяемой информацией.</p>

            <h3>5. Доступ к Сервису</h3>
            <p>Доступ предоставляется через Telegram. Пользователь самостоятельно обеспечивает работоспособность устройства и доступ к интернету. Пользователь предоставляет данные (дата, время и город рождения, интересы) добровольно и подтверждает их достоверность. Оператор не несёт ответственности за результаты при предоставлении недостоверных данных.</p>

            <h3>6. Стоимость и порядок оплаты</h3>
            <p>Платные функции оплачиваются на условиях 100% предоплаты. Стоимость отображается в интерфейсе до момента оплаты и может изменяться Оператором в одностороннем порядке (без распространения на уже оплаченные услуги).</p>
            <p>Оплата производится через Telegram Payments, Telegram Stars и/или сторонних платёжных провайдеров. Оператор не собирает и не хранит платёжные реквизиты (номера карт, CVV и т.п.) — они вводятся исключительно на стороне платёжной системы.</p>
            <p>Услуга считается оказанной с момента отображения результата Платной функции в интерфейсе Сервиса. Оплачивая Платную функцию, Пользователь выражает согласие на немедленное начало оказания услуги и подтверждает, что с момента предоставления результата договор исполнен Оператором в полном объёме. В связи с этим основания для возврата средств за предоставленный Контент отсутствуют, за исключением случаев технической ошибки (повторное списание) или непредоставления результата после подтверждённой оплаты.</p>
            <p>Для обращения по вопросам возврата направьте запрос на email Оператора (раздел 16) с указанием Telegram ID/username, даты оплаты, суммы и идентификатора транзакции. Срок рассмотрения — до 30 календарных дней.</p>

            <h3>7. Права и обязанности Пользователя</h3>
            <p><strong>Пользователь обязан:</strong> предоставлять достоверные данные; использовать Сервис добросовестно и в соответствии с законодательством РФ; не нарушать работоспособность Сервиса.</p>
            <p><strong>Пользователю запрещается:</strong> использовать Сервис в противоправных целях; применять автоматизированные средства (боты, скрипты, парсеры); копировать Контент в нарушение условий раздела 9; обходить технические ограничения и механизмы платного доступа; декомпилировать программный код Сервиса; совершать DDoS-атаки и эксплуатировать уязвимости.</p>

            <h3>8. Права и обязанности Оператора</h3>
            <p>Оператор обязан предоставлять доступ к функционалу Сервиса, предоставлять оплаченные Платные функции и обеспечивать защиту персональных данных. Оператор вправе в одностороннем порядке изменять функционал и стоимость услуг, ограничивать доступ нарушителей, приостанавливать работу Сервиса для технических работ.</p>

            <h3>9. Интеллектуальная собственность</h3>
            <p>Все исключительные права на Сервис, дизайн, программный код, тексты, расклады, толкования и иной Контент принадлежат Оператору и охраняются законодательством РФ. Пользователю предоставляется ограниченное неисключительное право использования Контента исключительно для личных некоммерческих целей. Копирование, распространение, коммерческое использование Контента без письменного согласия Оператора запрещено.</p>

            <h3>10. Ограничение ответственности</h3>
            <p>Сервис предоставляется «как есть» (as is). Оператор не гарантирует точность Контента, бесперебойную работу Сервиса и его соответствие ожиданиям Пользователя. Оператор не несёт ответственности за решения Пользователя на основе Контента, убытки от использования/невозможности использования Сервиса, действия Telegram и платёжных провайдеров, форс-мажорные обстоятельства.</p>
            <p>Положения об ограничении ответственности применяются в максимальной степени, допускаемой законодательством РФ, и не ограничивают права Пользователя-потребителя по Закону РФ № 2300-1 «О защите прав потребителей».</p>

            <h3>11. Персональные данные</h3>
            <p>Обработка персональных данных Пользователя осуществляется в соответствии с Политикой конфиденциальности, размещённой в Сервисе. Используя Сервис, Пользователь подтверждает ознакомление с Политикой и согласие с её условиями.</p>

            <h3>12. Срок действия и расторжение</h3>
            <p>Соглашение действует бессрочно с момента акцепта. Пользователь вправе расторгнуть его в любой момент, прекратив использование Сервиса. Оператор вправе расторгнуть Соглашение при нарушении Пользователем его условий или прекращении работы Сервиса.</p>

            <h3>13. Изменение условий</h3>
            <p>Оператор вправе в одностороннем порядке вносить изменения в Соглашение. Актуальная редакция публикуется в Сервисе. Продолжение использования Сервиса после публикации новой редакции означает согласие с изменениями.</p>

            <h3>14. Применимое право и споры</h3>
            <p>Применяется право Российской Федерации. Споры рассматриваются в претензионном порядке (срок ответа — 30 календарных дней), при невозможности — в суде по законодательству РФ.</p>

            <h3>15. Заключительные положения</h3>
            <p>Недействительность отдельных положений не влечёт недействительности Соглашения в целом. Настоящее Соглашение, Политика конфиденциальности и иные документы Сервиса в совокупности составляют единый комплекс договорных отношений.</p>

            <h3>16. Контакты Оператора</h3>
            <p>Альмурадов Сергей Андреевич, самозанятый, ИНН: 526214029501<br>E-mail: <strong>magicliora@gmail.com</strong></p>

            <p class="terms-updated">Редакция 1.0 · Вступила в силу 26 апреля 2026 г.</p>
          </div>
          <button class="terms-modal-accept haptic" @click="agreementOpen = false">
            Принимаю соглашение ✓
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Модальное окно: Политика конфиденциальности -->
    <Teleport to="body">
      <div v-if="privacyOpen" class="terms-modal-overlay" @click.self="privacyOpen = false">
        <div class="terms-modal">
          <div class="terms-modal-header">
            <div class="terms-modal-title serif">Политика конфиденциальности</div>
            <button class="terms-modal-close haptic" @click="privacyOpen = false">✕</button>
          </div>
          <div class="terms-modal-body">
            <p class="terms-doc-meta">Редакция: 1.0 &nbsp;·&nbsp; Дата вступления в силу: 26 апреля 2026 г.</p>

            <h3>1. Общие положения</h3>
            <p>Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, обработки, хранения и защиты персональных данных пользователей Telegram Mini App «Мистика» (далее — «Сервис»).</p>
            <p>Политика разработана в соответствии с законодательством Российской Федерации, в том числе ФЗ-152 «О персональных данных», ФЗ-149 «Об информации», требованиями Роскомнадзора и иными нормативными актами РФ.</p>
            <p>Запуская Сервис и/или используя его функции, Пользователь подтверждает, что ознакомился с настоящей Политикой и согласен с её условиями. Если Пользователь не согласен — он обязан прекратить использование Сервиса.</p>

            <h3>2. Оператор персональных данных</h3>
            <p>Оператором персональных данных является самозанятый: Альмурадов Сергей Андреевич, ИНН: 526214029501.</p>
            <p>E-mail для обращений по вопросам персональных данных: <strong>magicliora@gmail.com</strong></p>

            <h3>3. Описание Сервиса</h3>
            <p>Сервис предоставляет информационно-развлекательный контент: расклады Таро, нумерологические расчёты, расчёт совместимости, персональные прогнозы и рекомендации. В Сервисе доступны платные функции через механизмы Telegram и сторонних платёжных провайдеров.</p>

            <h3>4. Перечень обрабатываемых персональных данных</h3>
            <p><strong>Данные от Telegram:</strong> Telegram ID, username, имя/ник, язык интерфейса, ссылка на фотографию профиля (если публична).</p>
            <p><strong>Данные, предоставляемые пользователем:</strong> дата рождения, время рождения, город рождения, выбранные интересы, e-mail (при добровольном указании).</p>
            <p><strong>Технические данные:</strong> IP-адрес, логи действий в Сервисе, идентификаторы сессии, сведения об устройстве в объёме, передаваемом платформой.</p>
            <p>Оператор не запрашивает и не обрабатывает специальные категории персональных данных (расовая принадлежность, здоровье, биометрия и т.п.).</p>

            <h3>5. Цели обработки персональных данных</h3>
            <p>Предоставление функционала Сервиса и персонализация результатов; проведение расчётов (Таро, нумерология, совместимость); связь с Пользователем; обеспечение безопасности и стабильности Сервиса; аналитика; исполнение договора и требований законодательства РФ.</p>

            <h3>6. Правовые основания обработки</h3>
            <p>Согласие Пользователя (п. 1 ч. 1 ст. 6 ФЗ-152); исполнение договора (п. 5 ч. 1 ст. 6 ФЗ-152); законные интересы Оператора (п. 7 ч. 1 ст. 6 ФЗ-152); исполнение обязанностей, возложенных законодательством РФ (п. 2 ч. 1 ст. 6 ФЗ-152).</p>

            <h3>7. Платежи</h3>
            <p>Оператор не собирает и не хранит платёжные реквизиты (номера карт, CVV и т.п.). Все платежи обрабатываются встроенными механизмами Telegram или сторонними провайдерами. Оператор получает только статус платежа, идентификатор транзакции, сумму и идентификатор услуги.</p>

            <h3>8. Передача данных третьим лицам</h3>
            <p>Оператор не продаёт данные и не передаёт их в рекламных целях. Передача возможна только хостинг-провайдерам (РФ), платёжным провайдерам, сервисам email-рассылок (при наличии e-mail), а также государственным органам в случаях, предусмотренных законодательством.</p>

            <h3>9. Локализация данных на территории РФ</h3>
            <p>В соответствии с ч. 5 ст. 18 ФЗ-152 первичная запись и хранение персональных данных граждан РФ осуществляется на серверах, расположенных на территории Российской Федерации.</p>

            <h3>10. Трансграничная передача данных</h3>
            <p>Оператор самостоятельно не осуществляет трансграничную передачу данных. Telegram как платформа расположен за пределами РФ и обрабатывает данные Пользователя в соответствии со своей политикой конфиденциальности — Оператор эту обработку не контролирует.</p>

            <h3>11. Сроки хранения</h3>
            <p>Данные обрабатываются в течение всего срока использования Сервиса. После прекращения использования хранение не превышает 1 года, за исключением данных, необходимых для исполнения обязательств и требований законодательства. По запросу данные удаляются в течение 30 календарных дней.</p>

            <h3>12. Защита персональных данных</h3>
            <p>Оператор применяет правовые, организационные и технические меры: ограничение доступа к данным, защищённые каналы (HTTPS/TLS), контроль доступа, резервное копирование, оперативное реагирование на инциденты.</p>

            <h3>13. Права Пользователя</h3>
            <p>Пользователь вправе: получать сведения об обработке своих данных; требовать уточнения или удаления данных; отозвать согласие; обжаловать действия Оператора в Роскомнадзор и/или суд. Обращения направляются на email Оператора. Срок рассмотрения — до 30 календарных дней.</p>
            <p>Отзыв согласия или удаление данных может повлечь невозможность дальнейшего использования Сервиса.</p>

            <h3>14. Cookies и аналогичные технологии</h3>
            <p>В рамках Telegram Mini App классические cookies не используются. Применяются идентификаторы сессии, localStorage/sessionStorage для сохранения настроек интерфейса и технические токены авторизации Telegram — исключительно в технических целях, без рекламного трекинга.</p>

            <h3>15. Изменение Политики</h3>
            <p>Оператор вправе вносить изменения в Политику в одностороннем порядке. Актуальная редакция публикуется в Сервисе. Продолжение использования Сервиса после публикации новой редакции означает согласие с изменениями.</p>

            <h3>16. Контакты Оператора</h3>
            <p>Альмурадов Сергей Андреевич, ИНН: 526214029501<br>E-mail: <strong>magicliora@gmail.com</strong></p>

            <p class="terms-updated">Редакция 1.0 · Вступила в силу 26 апреля 2026 г.</p>
          </div>
          <button class="terms-modal-accept haptic" @click="privacyOpen = false">
            Принимаю политику ✓
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Step 2: Цели -->
    <div v-if="step === 2" class="onb-screen">
      <div class="onb-hero" style="padding-top:40px">
        <h2 style="font-size:28px;margin-bottom:8px">Ваши интересы</h2>
        <p class="onb-sub">Выберите, что важно для вас</p>
        <div class="progress-dots">
          <div class="dot active"></div>
          <div class="dot" :class="{ active: stepNum >= 2 }"></div>
          <div class="dot" :class="{ active: stepNum >= 3 }"></div>
          <div class="dot" :class="{ active: stepNum >= 4 }"></div>
        </div>
      </div>

      <div class="onb-form">
        <div class="goal-grid">
          <button
            v-for="g in goalOptions" :key="g.value"
            class="goal-card haptic"
            :class="{ selected: form.goals.includes(g.value) }"
            @click="toggleGoal(g.value)"
          >
            <span class="goal-icon">{{ g.emoji }}</span>
            <span class="goal-label">{{ g.label }}</span>
          </button>
        </div>
        <button class="onb-btn haptic" @click="step = 3">
          Далее →
        </button>
        <button class="onb-skip" @click="step = 3">Пропустить</button>
      </div>
    </div>

    <!-- Step 3: Уведомления -->
    <div v-if="step === 3" class="onb-screen">
      <div class="onb-hero" style="padding-top:40px">
        <div class="onb-notif-icon">🔔</div>
        <h2 style="font-size:28px;margin-bottom:8px">Уведомления</h2>
        <p class="onb-sub">Карты любят напоминать о себе</p>
        <div class="progress-dots">
          <div class="dot active"></div>
          <div class="dot active"></div>
          <div class="dot" :class="{ active: stepNum >= 3 }"></div>
          <div class="dot" :class="{ active: stepNum >= 4 }"></div>
        </div>
      </div>

      <div class="onb-form">
        <div class="data-reason-card" style="margin-bottom:20px">
          <div class="data-reason-header">
            <span class="data-reason-icon">✦</span>
            <span class="data-reason-title">Зачем это нужно?</span>
          </div>
          <p class="data-reason-body">
            Мы будем присылать вам напоминание раз в день — чтобы карты всегда были рядом. Вы можете изменить это в любой момент в профиле.
          </p>
        </div>

        <div class="notif-options">
          <button
            class="notif-option haptic"
            :class="{ selected: form.notificationTime === 'MORNING' }"
            @click="form.notificationTime = 'MORNING'"
          >
            <span class="notif-option-icon">☀️</span>
            <div class="notif-option-text">
              <div class="notif-option-title">Утром</div>
              <div class="notif-option-sub">около 9:00</div>
            </div>
            <div class="notif-option-check" v-if="form.notificationTime === 'MORNING'">✓</div>
          </button>

          <button
            class="notif-option haptic"
            :class="{ selected: form.notificationTime === 'EVENING' }"
            @click="form.notificationTime = 'EVENING'"
          >
            <span class="notif-option-icon">🌙</span>
            <div class="notif-option-text">
              <div class="notif-option-title">Вечером</div>
              <div class="notif-option-sub">около 20:00</div>
            </div>
            <div class="notif-option-check" v-if="form.notificationTime === 'EVENING'">✓</div>
          </button>

          <button
            class="notif-option haptic"
            :class="{ selected: form.notificationTime === 'DISABLED' }"
            @click="form.notificationTime = 'DISABLED'"
          >
            <span class="notif-option-icon">🔕</span>
            <div class="notif-option-text">
              <div class="notif-option-title">Не получать</div>
              <div class="notif-option-sub">можно включить позже</div>
            </div>
            <div class="notif-option-check" v-if="form.notificationTime === 'DISABLED'">✓</div>
          </button>
        </div>

        <button class="onb-btn haptic" @click="step = 4">
          Далее →
        </button>
      </div>
    </div>

    <!-- Step 4: Готово -->
    <div v-if="step === 4" class="onb-screen">
      <div class="onb-hero" style="padding-top:32px">
        <div class="celebrate-icon">✨</div>
        <h2 style="font-size:32px;margin-bottom:8px">Всё готово!</h2>
        <p class="onb-sub">Ваш путь начинается</p>
        <div class="progress-dots">
          <div class="dot active"></div>
          <div class="dot active"></div>
          <div class="dot active"></div>
          <div class="dot active"></div>
        </div>
      </div>

      <div class="onb-form">
        <!-- Day code card -->
        <div class="day-code-card gradient-card" style="padding:20px;text-align:center;margin-bottom:20px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.6);margin-bottom:8px">Ваш код дня</div>
          <div class="day-code-number">{{ lifeNumber }}</div>
          <div class="serif" style="font-size:18px;font-style:italic;margin-top:4px">{{ lifeNumberTitle }}</div>
        </div>
        <!-- Unlocked features -->
        <div class="unlock-list">
          <div class="unlock-item"><span class="check">✓</span> Карта дня и расклады</div>
          <div class="unlock-item"><span class="check">✓</span> Нумерология судьбы</div>
          <div class="unlock-item"><span class="check">✓</span> Расчёт совместимости</div>
        </div>
        <button class="onb-btn haptic" :disabled="isLoading" @click="handleFinish">
          {{ isLoading ? 'Сохраняем...' : 'Начать ✨' }}
        </button>
        <p v-if="errorMsg" class="onb-error">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { useUser } from '@/composables/useUser'
import { api, type Goal, type NotificationTime, type DailyCardResponse, type FortuneResponse, type CardPosition } from '@/utils/api'

const navigate = inject<(r: string) => void>('navigate')
const { createProfile, authWithTelegram, termsAccepted: termsAlreadyAccepted } = useUser()

// Версия юридических документов — обновлять при выпуске новой редакции
const TERMS_VERSION = '2025-04-28'

// Шаги: welcome → daily → question → shuffling → spread (опыт) → 1..4 (отложенная анкета)
const step = ref<'welcome' | 'daily' | 'question' | 'shuffling' | 'spread' | 1 | 2 | 3 | 4>('welcome')
// Числовой шаг для progress-dots анкеты (строковые шаги = 0)
const stepNum = computed(() => (typeof step.value === 'number' ? step.value : 0))
const isLoading = ref(false)
const errorMsg = ref('')
const agreementOpen = ref(false)
const privacyOpen = ref(false)

// ── Состояние welcome-пути ───────────────────────────────────────────────────
const dailyCard = ref<DailyCardResponse | null>(null)
const questions = ref<string[]>([])
const fortune = ref<FortuneResponse | null>(null)

const todayLabel = computed(() =>
  new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
)

onMounted(() => {
  // Пользователь, уже принявший оферту, попадает сюда только чтобы донастроить
  // профиль (из «замков» гороскопа/нумерологии или CTA) — сразу анкета, без welcome
  if (termsAlreadyAccepted.value) {
    step.value = 1
  }
})

// Welcome → фиксируем согласие и показываем карту дня
const startJourney = async () => {
  if (isLoading.value) return
  isLoading.value = true
  errorMsg.value = ''
  try {
    if (!localStorage.getItem('jwt_token')) {
      const ok = await authWithTelegram()
      if (!ok) {
        errorMsg.value = 'Не удалось авторизоваться. Попробуйте перезапустить приложение.'
        return
      }
    }
    // Click-wrap согласие: юридическая фиксация ДО первого действия
    await api.acceptTerms(TERMS_VERSION)
    const res = await api.getDailyCard()
    dailyCard.value = res.data
    step.value = 'daily'
  } catch {
    errorMsg.value = 'Карты задумались... Попробуйте ещё раз.'
  } finally {
    isLoading.value = false
  }
}

const goToQuestions = async () => {
  step.value = 'question'
  if (questions.value.length > 0) return
  isLoading.value = true
  try {
    questions.value = (await api.getOnboardingQuestions()).data
  } catch {
    questions.value = []
  } finally {
    isLoading.value = false
  }
}

// ── «Ритуальный» экран расчёта перед раскладом ───────────────────────────────
// Расклад из пула приходит мгновенно, но мгновенный ответ обесценивает магию.
// Держим минимум ~3 секунды на анимации с меняющимися фразами.
const SHUFFLE_PHRASES = [
  'Тасуем колоду...',
  'Раскладываем карты...',
  'Слушаем, что говорят карты...',
]
const SHUFFLE_MIN_MS = 3000
const shufflePhrase = ref(SHUFFLE_PHRASES[0])

const askQuestion = async (q: string) => {
  if (step.value === 'shuffling') return
  errorMsg.value = ''
  step.value = 'shuffling'

  // Крутим фразы, пока «считаем»
  let phraseIdx = 0
  shufflePhrase.value = SHUFFLE_PHRASES[0]
  const phraseTimer = setInterval(() => {
    phraseIdx = (phraseIdx + 1) % SHUFFLE_PHRASES.length
    shufflePhrase.value = SHUFFLE_PHRASES[phraseIdx]
  }, 1100)

  try {
    // Запрос и минимальная пауза идут параллельно: ждём оба
    const [res] = await Promise.all([
      api.createOnboardingFortune(q),
      new Promise(resolve => setTimeout(resolve, SHUFFLE_MIN_MS)),
    ])
    fortune.value = res.data
    step.value = 'spread'
  } catch {
    errorMsg.value = 'Не получилось разложить карты. Попробуйте другой вопрос.'
    step.value = 'question'
  } finally {
    clearInterval(phraseTimer)
  }
}

const positionLabel = (p: CardPosition) =>
  ({ PAST: 'Прошлое', PRESENT: 'Настоящее', FUTURE: 'Будущее' } as Record<string, string>)[p] ?? ''

// «Заполню позже» / «Позже — на главную»: анкету пропускаем, юзер уже в продукте
const finishLater = () => {
  navigate?.('home')
}

const form = ref({
  birthDate: '',
  birthTime: '',
  birthCity: '',
  goals: [] as Goal[],
  notificationTime: 'EVENING' as NotificationTime,
})

const goalOptions: { value: Goal; label: string; emoji: string }[] = [
  { value: 'LOVE',            label: 'Отношения',  emoji: '💕' },
  { value: 'MONEY',           label: 'Деньги',     emoji: '💰' },
  { value: 'CAREER',          label: 'Карьера',    emoji: '🚀' },
  { value: 'HEALTH',          label: 'Энергия',    emoji: '✨' },
  { value: 'SELF_CONFIDENCE', label: 'Самооценка', emoji: '🌟' },
]

const toggleGoal = (g: Goal) => {
  const i = form.value.goals.indexOf(g)
  i === -1 ? form.value.goals.push(g) : form.value.goals.splice(i, 1)
}

function calcLifeNumber(d: string) {
  const digits = d.replace(/-/g, '').split('').map(Number)
  let s = digits.reduce((a, b) => a + b, 0)
  while (s > 9 && s !== 11 && s !== 22 && s !== 33)
    s = String(s).split('').map(Number).reduce((a, b) => a + b, 0)
  return s
}

const lifeNumber = computed(() => form.value.birthDate ? calcLifeNumber(form.value.birthDate) : '?')
const lifeNumberTitle = computed(() => {
  const m: Record<number, string> = {
    1:'Лидер и первопроходец', 2:'Дипломат и миротворец',
    3:'Творец и оптимист',     4:'Строитель и практик',
    5:'Искатель приключений',  6:'Хранитель гармонии',
    7:'Мудрец и аналитик',    8:'Властитель успеха',
    9:'Гуманист и мечтатель', 11:'Мастер интуиции',
    22:'Мастер великих дел',  33:'Духовный учитель',
  }
  return m[lifeNumber.value as number] || ''
})

const handleFinish = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    if (!localStorage.getItem('jwt_token')) {
      const ok = await authWithTelegram()
      if (!ok) {
        errorMsg.value = 'Не удалось авторизоваться. Попробуйте перезапустить приложение.'
        return
      }
    }
    await createProfile({
      birthDate: form.value.birthDate || undefined,
      birthTime: form.value.birthTime ? form.value.birthTime + ':00' : undefined,
      birthCity: form.value.birthCity || undefined,
      goals: form.value.goals.length ? form.value.goals : undefined,
      termsVersion: TERMS_VERSION,
      notificationTime: form.value.notificationTime,
    })
    navigate?.('home')
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Ошибка. Попробуйте снова.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.onb-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  display: flex;
  align-items: stretch;
}
.onb-screen {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 24px 40px;
}

/* Hero */
.onb-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 60px;
  margin-bottom: 32px;
}
.onb-icon {
  width: 110px; height: 110px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffc857 0%, #e94aa8 70%, transparent 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 52px;
  margin-bottom: 24px;
  animation: glow-pulse 3s ease-in-out infinite;
}
.onb-notif-icon {
  width: 110px; height: 110px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90e9, #7b54ff);
  display: flex; align-items: center; justify-content: center;
  font-size: 52px;
  margin-bottom: 24px;
  box-shadow: 0 0 60px rgba(74,144,233,0.4);
}
.celebrate-icon {
  width: 110px; height: 110px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  display: flex; align-items: center; justify-content: center;
  font-size: 52px;
  margin-bottom: 24px;
  box-shadow: 0 0 60px rgba(182,84,255,0.5);
}
.onb-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  margin-top: 6px;
  margin-bottom: 20px;
}

/* Progress dots */
.progress-dots { display: flex; gap: 6px; }
.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transition: all 0.3s;
}
.dot.active {
  width: 24px;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  border-radius: 3px;
}

/* Form */
.onb-form { display: flex; flex-direction: column; gap: 0; }
.form-row { margin-bottom: 14px; }
.input-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: .08em;
}
.req  { color: #e94aa8; }


/* Блок с объяснением данных */
.data-reason-card {
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(182,84,255,0.1), rgba(233,74,168,0.06));
  border: 1px solid rgba(182,84,255,0.25);
}
.data-reason-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.data-reason-icon {
  font-size: 13px;
  color: #b654ff;
  flex-shrink: 0;
}
.data-reason-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #d89fff;
}
.data-reason-body {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255,255,255,0.6);
  margin: 0;
}

.onb-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: #F5ECFF;
  font-size: 15px;
  font-family: 'Manrope', sans-serif;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  min-height: 52px;
}
.onb-input:focus { border-color: rgba(182,84,255,0.5); }
.onb-input::placeholder { color: rgba(255,255,255,0.4); }

/* Goals */
.goal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}
.goal-card {
  padding: 18px 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  color: #F5ECFF;
}
.goal-card.selected {
  background: linear-gradient(135deg, rgba(182,84,255,0.25), rgba(233,74,168,0.15));
  border-color: rgba(182,84,255,0.5);
  box-shadow: 0 4px 20px rgba(182,84,255,0.2);
}
.goal-icon { font-size: 26px; }
.goal-label { font-size: 13px; font-weight: 500; }

/* Notification options */
.notif-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.notif-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  text-align: left;
  color: #F5ECFF;
  transition: all 0.2s;
  width: 100%;
}
.notif-option.selected {
  background: linear-gradient(135deg, rgba(182,84,255,0.2), rgba(233,74,168,0.12));
  border-color: rgba(182,84,255,0.5);
  box-shadow: 0 4px 20px rgba(182,84,255,0.15);
}
.notif-option-icon { font-size: 28px; flex-shrink: 0; }
.notif-option-text { flex: 1; }
.notif-option-title { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.notif-option-sub { font-size: 12px; color: rgba(255,255,255,0.45); }
.notif-option-check {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #fff; font-weight: 700;
  flex-shrink: 0;
}

/* Buttons */
.onb-btn {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #b654ff 0%, #e94aa8 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Manrope', sans-serif;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,0.4);
  margin-top: 8px;
}
.onb-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.onb-skip {
  background: none; border: none; color: rgba(255,255,255,0.45);
  font-size: 13px; cursor: pointer; margin-top: 12px; font-family: 'Manrope', sans-serif;
}
.onb-error { color: #ff6b6b; font-size: 13px; text-align: center; margin-top: 8px; }

/* Terms checkbox */
.terms-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 8px;
  margin-bottom: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}
.terms-checkbox {
  flex-shrink: 0;
  width: 22px; height: 22px;
  border-radius: 6px;
  border: 1.5px solid rgba(182,84,255,0.5);
  background: rgba(182,84,255,0.08);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0; transition: all 0.2s;
  margin-top: 1px;
}
.terms-checkbox.checked {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(182,84,255,0.4);
}
.terms-text {
  font-size: 11px;
  line-height: 1.6;
  color: rgba(255,255,255,0.55);
  flex: 1;
}
.terms-link {
  background: none; border: none; padding: 0;
  color: #d89fff;
  font-size: 11px;
  font-family: 'Manrope', sans-serif;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(216,159,255,0.4);
  line-height: inherit;
}

/* Terms modal */
.terms-modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-end;
}
.terms-modal {
  width: 100%; max-height: 88vh;
  background: #130a28;
  border-radius: 24px 24px 0 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.terms-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 0;
  flex-shrink: 0;
}
.terms-modal-title { font-size: 20px; color: #F5ECFF; }
.terms-modal-close {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(255,255,255,0.08); border: none;
  color: rgba(255,255,255,0.6); font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Manrope', sans-serif;
}
.terms-modal-body {
  flex: 1; overflow-y: auto;
  padding: 16px 20px;
  color: rgba(255,255,255,0.7);
  font-size: 13px; line-height: 1.7;
}
.terms-modal-body h3 {
  font-size: 14px; font-weight: 700;
  color: #ffc857;
  margin: 18px 0 8px;
}
.terms-modal-body h3:first-child { margin-top: 0; }
.terms-modal-body p { margin: 0 0 10px; }
.terms-updated { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 20px; }
.terms-placeholder { color: rgba(255,255,255,0.35); font-style: italic; text-align: center; padding: 40px 0; }
.terms-doc-meta { font-size: 11px; color: rgba(255,255,255,0.35); margin-bottom: 16px; margin-top: 0; }
.terms-modal-accept {
  margin: 0 20px 32px;
  flex-shrink: 0;
  padding: 15px; border-radius: 16px;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff; font-size: 15px; font-weight: 600;
  font-family: 'Manrope', sans-serif; border: none; cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,0.4);
}

/* Day code */
.day-code-number {
  font-family: 'Cormorant Garamond', serif;
  font-size: 72px;
  font-weight: 500;
  line-height: 1;
  background: linear-gradient(135deg, #ffc857 0%, #e94aa8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.unlock-list { margin-bottom: 20px; }
.unlock-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.check {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #70e0a8, #47b896);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  color: #0a3a2a;
  font-weight: 700;
  flex-shrink: 0;
}

/* ── Welcome-экран (вход без барьера) ─────────────────────────────────── */
.welcome-screen { justify-content: space-between; }
.welcome-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 48px;
}
.welcome-title { font-size: 42px; letter-spacing: .04em; margin: 8px 0 0; }
.welcome-form { padding-bottom: 24px; }
.welcome-terms {
  margin-top: 14px;
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
  color: rgba(255,255,255,.45);
}

/* Анимированный шар Лиоры: мягкое парение + пульс свечения */
.liora-orb {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 35% 30%, rgba(182,84,255,.45), rgba(94,23,168,.25) 60%, transparent);
  box-shadow: 0 0 42px rgba(182,84,255,.35);
  animation: orb-float 3.6s ease-in-out infinite, orb-glow 2.8s ease-in-out infinite;
}
.liora-orb-inner { font-size: 44px; }
@keyframes orb-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes orb-glow {
  0%, 100% { box-shadow: 0 0 32px rgba(182,84,255,.28); }
  50%      { box-shadow: 0 0 56px rgba(233,74,168,.42); }
}

/* Заголовки экранов онбординга под служебными кнопками Telegram
   (Закрыть / свернуть / меню) — отступ на высоту safe-area, как на HomeScreen */
.onb-hero--safe {
  padding-top: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 56px);
}

/* Карта дня в онбординге */
.onb-daily-card {
  padding: 22px 18px;
  border-radius: 20px;
  text-align: center;
  margin-bottom: 20px;
}
.onb-daily-img {
  display: block;           /* иначе inline-картинка липнет влево независимо от text-align */
  width: 120px;
  border-radius: 12px;
  margin: 0 auto 12px;
}
.onb-daily-name { font-size: 24px; margin-bottom: 8px; }
.onb-daily-meaning { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,.75); }
.onb-daily-advice { margin-top: 12px; font-size: 13px; font-style: italic; color: #d89fff; }

/* Выбор вопроса */
.onb-question {
  display: block;
  width: 100%;
  padding: 16px 18px;
  margin-bottom: 10px;
  border-radius: 16px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(182,84,255,.3);
  color: #F5ECFF;
  font-size: 14px;
  line-height: 1.45;
  text-align: left;
  font-family: 'Manrope', sans-serif;
  cursor: pointer;
  transition: border-color .2s, background .2s;
}
.onb-question:active { background: rgba(182,84,255,.16); }
.onb-shuffle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 0;
}

/* Полноэкранный «ритуальный» экран расчёта расклада */
.onb-shuffle-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}
.onb-shuffle-phrase {
  font-size: 19px;
  font-style: italic;
  color: rgba(255,255,255,.75);
  text-align: center;
  animation: phrase-fade 1.1s ease-in-out infinite;
}
@keyframes phrase-fade {
  0%, 100% { opacity: .55; }
  50%      { opacity: 1; }
}

/* Результат подарочного расклада */
.onb-spread-card { padding: 16px; border-radius: 18px; margin-bottom: 12px; }
.onb-spread-pos {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: #d89fff;
  font-weight: 700;
  margin-bottom: 8px;
}
.onb-spread-head { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.onb-spread-img { width: 44px; border-radius: 8px; flex-shrink: 0; }
.onb-spread-name { font-size: 18px; }
.onb-spread-text { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.75); margin: 0; }
</style>
