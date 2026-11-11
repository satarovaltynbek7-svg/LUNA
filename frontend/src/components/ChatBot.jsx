import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react'

const FAQ = {
  ru: [
    {
      q: '🕐 Режим работы?',
      a: 'LUNA Café открыт:\nПн–Пт: 08:00 – 20:00\nСб–Вс: 09:00 – 21:00\nМы ждём вас каждый день! ☕',
    },
    {
      q: '📍 Где вы находитесь?',
      a: 'Мы находимся по адресу: 18 Willow Lane, Brooklyn.\nОриентир: рядом с центральным парком.\nМожно добраться на метро или такси. 🗺️',
    },
    {
      q: '🍽️ Как сделать заказ?',
      a: 'Заказ можно оформить прямо на сайте:\n1. Перейдите в раздел "Меню"\n2. Добавьте блюда в корзину\n3. Нажмите "Оформить заказ"\nМы доставим или подготовим для вас! 🛒',
    },
    {
      q: '🪑 Как забронировать столик?',
      a: 'Забронировать столик очень просто:\n1. Перейдите в "Контакты"\n2. Заполните форму бронирования\n3. Укажите дату, время и количество гостей\nМы подтвердим вашу бронь! 📅',
    },
    {
      q: '💳 Способы оплаты?',
      a: 'Мы принимаем:\n• Наличные\n• Карты (Visa, MasterCard)\n• Мобильные переводы\nОплата при получении или в кафе. 💰',
    },
  ],
  ky: [
    {
      q: '🕐 Иш убактысы?',
      a: 'LUNA Café ачык:\nДүй–Жум: 08:00 – 20:00\nИш–Жек: 09:00 – 21:00\nКүн сайын күтөбүз! ☕',
    },
    {
      q: '📍 Кайда жайгашкан?',
      a: 'Биз: 18 Willow Lane, Brooklyn дарегинде жайгашкабыз.\nЦентралдык паркка жакын.\nМетро же такси менен жетсе болот. 🗺️',
    },
    {
      q: '🍽️ Кантип заказ кылса болот?',
      a: 'Заказды сайттан жасаса болот:\n1. "Меню" бөлүмүнө өтүңүз\n2. Тамактарды корзинага кошуңуз\n3. "Заказ жаса" баскычын басыңыз\nБиз даярдап жеткиребиз! 🛒',
    },
    {
      q: '🪑 Стол кантип брондосо болот?',
      a: 'Стол брондоо оңой:\n1. "Байланыш" бетине өтүңүз\n2. Бронь формасын толтуруңуз\n3. Дата, убакыт жана конок санын жазыңыз\nБиз тастыктайбыз! 📅',
    },
    {
      q: '💳 Төлөм ыкмалары?',
      a: 'Биз кабыл алабыз:\n• Нак акча\n• Карта (Visa, MasterCard)\n• Мобилдик которуу\nКафеде же алууда төлөнөт. 💰',
    },
  ],
  en: [
    {
      q: '🕐 Working hours?',
      a: 'LUNA Café is open:\nMon–Fri: 08:00 – 20:00\nSat–Sun: 09:00 – 21:00\nWe look forward to seeing you! ☕',
    },
    {
      q: '📍 Where are you located?',
      a: 'We are at: 18 Willow Lane, Brooklyn.\nNear the central park.\nEasily accessible by metro or taxi. 🗺️',
    },
    {
      q: '🍽️ How to place an order?',
      a: 'You can order directly on the website:\n1. Go to "Menu"\n2. Add items to your cart\n3. Click "Place Order"\nWe\'ll prepare it for you! 🛒',
    },
    {
      q: '🪑 How to book a table?',
      a: 'Booking a table is easy:\n1. Go to "Contact"\n2. Fill in the reservation form\n3. Choose date, time and guest count\nWe\'ll confirm your booking! 📅',
    },
    {
      q: '💳 Payment methods?',
      a: 'We accept:\n• Cash\n• Cards (Visa, MasterCard)\n• Mobile transfers\nPay on delivery or at the café. 💰',
    },
  ],
}

const GREET = {
  ru: 'Привет! 👋 Я бот LUNA Café. Выберите вопрос или напишите свой:',
  ky: 'Салам! 👋 Мен LUNA Café боту. Суроо тандаңыз же өзүңүз жазыңыз:',
  en: 'Hello! 👋 I\'m the LUNA Café bot. Choose a question or type your own:',
}

const FALLBACK = {
  ru: 'Я не смог найти ответ на ваш вопрос. Пожалуйста, свяжитесь с нами напрямую:\n📞 +1 (718) 555-0184\n📍 18 Willow Lane, Brooklyn',
  ky: 'Суроңузга жооп таба алган жокмун. Түздөн-түз байланышыңыз:\n📞 +1 (718) 555-0184\n📍 18 Willow Lane, Brooklyn',
  en: 'I couldn\'t find an answer. Please contact us directly:\n📞 +1 (718) 555-0184\n📍 18 Willow Lane, Brooklyn',
}

function getBotReply(text, lang) {
  const q = text.toLowerCase().trim()
  const faqs = FAQ[lang] || FAQ.ru

  // Check FAQ questions
  for (const item of faqs) {
    if (q === item.q.replace(/^[^\s]+\s/, '').toLowerCase()) return item.a
  }

  // Keyword matching
  if (/час|уба|работ|open|iш|врем/.test(q)) return faqs[0].a
  if (/адрес|где|кайда|where|location|жайгаш/.test(q)) return faqs[1].a
  if (/заказ|order|тамак|меню|menu/.test(q)) return faqs[2].a
  if (/брон|стол|table|book|резерв/.test(q)) return faqs[3].a
  if (/оплат|карт|деньг|акча|pay|cash/.test(q)) return faqs[4].a

  return FALLBACK[lang] || FALLBACK.ru
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const bottomRef = useRef(null)
  const lang = typeof window !== 'undefined'
    ? (localStorage.getItem('i18nextLng') || 'ru').split('-')[0]
    : 'ru'
  const faqLang = FAQ[lang] ? lang : 'ru'

  useEffect(() => {
    if (open && !started) {
      setMessages([{ from: 'bot', text: GREET[faqLang] || GREET.ru }])
      setStarted(true)
    }
  }, [open, started, faqLang])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(text) {
    if (!text.trim()) return
    const userMsg = { from: 'user', text: text.trim() }
    const botReply = { from: 'bot', text: getBotReply(text, faqLang) }
    setMessages((prev) => [...prev, userMsg, botReply])
    setInput('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Toggle button */}
      <button
        className="chatbot-toggle"
        type="button"
        aria-label="Открыть чат"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span className="chatbot-header__avatar">◔</span>
            <div>
              <strong>LUNA Café</strong>
              <small>Онлайн</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg--${msg.from}`}>
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </div>
            ))}
            {/* FAQ quick buttons — shown after greeting */}
            {messages.length === 1 && (
              <div className="chatbot-faq">
                {(FAQ[faqLang] || FAQ.ru).map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className="chatbot-faq__btn"
                    onClick={() => sendMessage(item.q)}
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={faqLang === 'ky' ? 'Жазыңыз...' : faqLang === 'en' ? 'Type a message...' : 'Написать...'}
              maxLength={200}
            />
            <button type="submit" aria-label="Отправить">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
