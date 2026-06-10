import { useState } from 'react';

export function Admin() {
  const [activeTab, setActiveTab] = useState<'moder' | 'anons'>('moder');

  return (
    <div className="min-h-[var(--app-vh)] bg-[#060a14] text-[#dbe9ff]">
      <div className="max-w-[520px] mx-auto px-3.5 pt-3.5 pb-6 flex flex-col gap-4">
        {/* Header */}
        <header className="flex flex-col gap-3.5 pt-2">
          <div className="leading-none">
            <div className="text-[22px] font-extrabold tracking-[3px] text-[#eaf4ff] text-glow">
              IN<span className="text-[#38e1ff]">TR</span>
            </div>
            <div className="text-[9px] tracking-[4px] text-[#6b7c9e] mt-0.5">
              ADMIN
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setActiveTab('moder')}
              className={`flex-1 py-3 px-3 rounded-[14px] border font-semibold text-sm transition-all ${
                activeTab === 'moder'
                  ? 'bg-gradient-to-br from-[#2ea8ff] to-[#38e1ff] text-[#02101f] border-transparent'
                  : 'glass text-[#dbe9ff]'
              }`}
              style={activeTab === 'moder' ? { boxShadow: '0 0 16px var(--glow)' } : {}}
            >
              🎙 Эфир
            </button>
            <button
              onClick={() => setActiveTab('anons')}
              className={`flex-1 py-3 px-3 rounded-[14px] border font-semibold text-sm transition-all ${
                activeTab === 'anons'
                  ? 'bg-gradient-to-br from-[#2ea8ff] to-[#38e1ff] text-[#02101f] border-transparent'
                  : 'glass text-[#dbe9ff]'
              }`}
              style={activeTab === 'anons' ? { boxShadow: '0 0 16px var(--glow)' } : {}}
            >
              📢 Анонсы
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-3.5">
          {activeTab === 'moder' && (
            <>
              <h2 className="text-[17px] font-extrabold text-[#38e1ff] tracking-wide">
                Черновики ИИ (на одобрение)
              </h2>
              <p className="text-xs text-[#6b7c9e] -mt-2 leading-relaxed">
                ИИ собрал чат и предложил выпуск. Отредактируйте и одобрите — текст уйдёт в эфир.
              </p>
              <div className="glass p-8 text-center text-[#6b7c9e]">
                Нет черновиков. ИИ ещё собирает заявки студии…
              </div>
            </>
          )}

          {activeTab === 'anons' && (
            <>
              <h2 className="text-[17px] font-extrabold text-[#38e1ff] tracking-wide">
                Окна объявлений (стартовый экран)
              </h2>
              <div className="glass p-4 text-center text-[#6b7c9e]">
                Редактор анонсов (coming soon)
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
