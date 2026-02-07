
import React, { useState, useEffect, useRef } from 'react';
import { analyzeCheckIn, getAssistantResponse } from './services/geminiService';
import { CheckInData, EmotionalState, WellnessCategory, ChatMessage, UserProfile } from './types';
import BreathingExercise from './components/BreathingExercise';
import StressChart from './components/StressChart';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  const [step, setStep] = useState<'auth' | 'onboarding' | 'home' | 'checkin' | 'results' | 'assistant' | 'category_menu' | 'settings'>('auth');
  
  const [user, setUser] = useState<UserProfile>({
    name: '',
    emailOrPhone: '',
    locationAccess: false,
    darkMode: false,
    emergencyContactName: 'Mãe/Pai',
    emergencyContactPhone: '912345678'
  });
  const [password, setPassword] = useState('');

  const [history, setHistory] = useState<CheckInData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<WellnessCategory>('Burnout');
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState('');
  const [currentResult, setCurrentResult] = useState<CheckInData | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyAlertSent, setEmergencyAlertSent] = useState(false);
  
  // Assistant states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial App Load
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initial mock data
  useEffect(() => {
    const mockHistory: CheckInData[] = Array.from({ length: 6 }).map((_, i) => ({
      timestamp: Date.now() - (6 - i) * 86400000,
      moodScale: 5 + Math.floor(Math.random() * 4),
      text: "Dia produtivo mas cansativo.",
      stressScore: 30 + (i * 10), 
      emotionalState: i > 4 ? EmotionalState.OVERLOADED : EmotionalState.STRESSED,
      aiMessage: "Tente descansar um pouco mais hoje.",
      suggestions: []
    }));
    setHistory(mockHistory);
  }, []);

  const changeStep = (newStep: typeof step) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setIsTransitioning(false);
    }, 800);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.name || !user.emailOrPhone || !password) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setStep('onboarding');
      setIsTransitioning(false);
    }, 1200);
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      setHasCompletedOnboarding(true);
      setStep('home');
      setIsTransitioning(false);
    }, 1200);
  };

  const handleLogout = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      setHasCompletedOnboarding(false);
      setStep('auth');
      setIsTransitioning(false);
    }, 1000);
  };

  const hasWorseningTrend = () => {
    if (history.length < 3) return false;
    const lastThree = history.slice(-3);
    return lastThree[2].stressScore > lastThree[1].stressScore && 
           lastThree[1].stressScore > lastThree[0].stressScore;
  };

  const handleCheckIn = async () => {
    setIsTransitioning(true);
    const analysis = await analyzeCheckIn(mood, note);
    const newEntry: CheckInData = {
      timestamp: Date.now(),
      moodScale: mood,
      text: note,
      ...analysis
    };
    setHistory([...history, newEntry]);
    setCurrentResult(newEntry);
    setTimeout(() => {
      setStep('results');
      setIsTransitioning(false);
    }, 800);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const message = textOverride || chatInput;
    if (!message.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: message };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);
    if (step !== 'assistant' && step !== 'settings') changeStep('assistant');

    const response = await getAssistantResponse(chatMessages, message);
    setChatMessages(prev => [...prev, { role: 'model', text: response || "Desculpe, estou com dificuldades técnicas agora." }]);
    setIsTyping(false);
  };

  const triggerEmergency = () => {
    setEmergencyAlertSent(true);
    setTimeout(() => {
      setShowEmergencyModal(false);
      setEmergencyAlertSent(false);
    }, 3000);
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-500';
    if (score < 60) return 'text-yellow-500';
    if (score < 85) return 'text-orange-500';
    return 'text-red-500';
  };

  // Styles based on Dark Mode
  const bgMain = user.darkMode ? 'bg-slate-950' : 'bg-blue-50/20';
  const bgCard = user.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
  const textPrimary = user.darkMode ? 'text-white' : 'text-slate-800';
  const textSecondary = user.darkMode ? 'text-slate-400' : 'text-slate-500';
  const borderLight = user.darkMode ? 'border-slate-800' : 'border-slate-50';

  // 1. Full Page Loading Screen
  if (isAppLoading || isTransitioning) {
    return (
      <div className={`max-w-md mx-auto min-h-screen flex flex-col items-center justify-center ${user.darkMode ? 'bg-slate-950' : 'bg-white'} z-[200]`}>
        <div className="relative">
          <div className="w-20 h-20 bg-blue-600 rounded-[1.8rem] flex items-center justify-center animate-pulse shadow-2xl shadow-blue-200/20">
            <span className="text-white font-black text-3xl italic">MP</span>
          </div>
          <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-1.5 ${user.darkMode ? 'bg-slate-800' : 'bg-slate-100'} rounded-full overflow-hidden`}>
             <div className="h-full bg-blue-600 animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
        <p className={`mt-14 font-bold tracking-widest text-[10px] uppercase ${user.darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          {isAppLoading ? 'A carregar MindPulse...' : 'Sincronizando...'}
        </p>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Auth Screen
  if (step === 'auth') {
    return (
      <div className={`max-w-md mx-auto min-h-screen px-6 flex flex-col justify-center ${bgMain} animate-in fade-in duration-700`}>
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-500/10">
            <span className="text-white font-black text-2xl italic">MP</span>
          </div>
          <h1 className={`text-3xl font-black ${textPrimary}`}>Cria a tua conta</h1>
          <p className={`${textSecondary} mt-2`}>Dá o primeiro passo para o equilíbrio.</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
            <input 
              type="text" 
              required
              value={user.name}
              onChange={e => setUser({...user, name: e.target.value})}
              placeholder="Ex: Gonçalo Garcia"
              className={`w-full p-4 ${user.darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-800'} rounded-2xl outline-none focus:border-blue-300 transition-all`}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email ou Telemóvel</label>
            <input 
              type="text" 
              required
              value={user.emailOrPhone}
              onChange={e => setUser({...user, emailOrPhone: e.target.value})}
              placeholder="gg@mindpulse.ai"
              className={`w-full p-4 ${user.darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-800'} rounded-2xl outline-none focus:border-blue-300 transition-all`}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Palavra-passe</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full p-4 ${user.darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-800'} rounded-2xl outline-none focus:border-blue-300 transition-all`}
            />
          </div>
          <button 
            type="submit"
            className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black shadow-2xl active:scale-95 transition-all mt-4"
          >
            Continuar
          </button>
        </form>
      </div>
    );
  }

  // 3. Onboarding Screen
  if (step === 'onboarding') {
    return (
      <div className={`max-w-md mx-auto min-h-screen px-6 py-12 flex flex-col ${bgMain} animate-in slide-in-from-right-8 duration-700`}>
        <h1 className={`text-3xl font-black ${textPrimary} mb-2`}>Quase lá, {user.name.split(' ')[0]}!</h1>
        <p className={`${textSecondary} mb-8`}>Completa a tua ficha para personalizarmos a IA.</p>
        
        <form onSubmit={handleOnboardingSubmit} className="space-y-6 flex-1">
          <div className={`${bgCard} p-6 rounded-3xl shadow-sm border space-y-4`}>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Idade</label>
              <input 
                type="number" 
                value={user.age}
                onChange={e => setUser({...user, age: e.target.value})}
                placeholder="Ex: 24"
                className={`w-full p-3 ${user.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} rounded-xl outline-none`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ocupação</label>
              <select 
                value={user.occupation}
                onChange={e => setUser({...user, occupation: e.target.value})}
                className={`w-full p-3 ${user.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} rounded-xl outline-none`}
              >
                <option value="">Selecionar...</option>
                <option value="Estudante">Estudante</option>
                <option value="Profissional">Jovem Profissional</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className={`${bgCard} p-6 rounded-3xl shadow-sm border space-y-4`}>
            <h3 className={`font-black ${textPrimary} text-sm uppercase tracking-widest`}>Contacto de Emergência</h3>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome do Contacto</label>
              <input 
                type="text" 
                value={user.emergencyContactName}
                onChange={e => setUser({...user, emergencyContactName: e.target.value})}
                className={`w-full p-3 ${user.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} rounded-xl outline-none`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Número de Telefone</label>
              <input 
                type="tel" 
                value={user.emergencyContactPhone}
                onChange={e => setUser({...user, emergencyContactPhone: e.target.value})}
                className={`w-full p-3 ${user.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} rounded-xl outline-none`}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100/10"
          >
            Finalizar Perfil
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-24 px-4 flex flex-col pt-8 transition-colors duration-500 ${bgMain}`}>
      {/* Header */}
      <header className="flex items-center justify-between mb-8 relative z-50 px-2">
        <div onClick={() => changeStep('home')} className="cursor-pointer">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
            MindPulse AI
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Dashboard</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => changeStep('settings')}
            className={`w-10 h-10 rounded-2xl ${user.darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-400'} flex items-center justify-center shadow-sm active:scale-90 transition-all border ${user.darkMode ? 'border-slate-700' : 'border-slate-100'}`}
          >
            ⚙️
          </button>
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-100/10 uppercase">
            {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'GG'}
          </div>
        </div>
      </header>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`${user.darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'} rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center space-y-6`}>
            {!emergencyAlertSent ? (
              <>
                <div className="w-20 h-20 bg-red-100/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                  <span className="text-4xl">🚨</span>
                </div>
                <h2 className={`text-2xl font-black ${textPrimary}`}>Alerta SOS?</h2>
                <p className={`${textSecondary} text-sm leading-relaxed`}>Isso notificará imediatamente o contacto <strong>{user.emergencyContactName}</strong> ({user.emergencyContactPhone}) com a tua localização.</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={triggerEmergency}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-100/10 active:scale-95"
                  >
                    ENVIAR AGORA
                  </button>
                  <button 
                    onClick={() => setShowEmergencyModal(false)}
                    className="w-full py-2 text-slate-400 font-bold text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="py-10 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-2xl font-black text-green-600">Alerta Enviado</h2>
                <p className={`${textSecondary} mt-2 font-medium`}>Socorro a caminho para a tua localização.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Screen */}
      {step === 'settings' && (
        <div className={`fixed inset-0 z-[60] ${bgMain} p-6 overflow-y-auto animate-in slide-in-from-bottom-8 duration-500 pb-12`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-3xl font-black ${textPrimary}`}>Definições</h2>
            <button onClick={() => changeStep('home')} className={`w-10 h-10 rounded-full ${user.darkMode ? 'bg-slate-800 text-white' : 'bg-white'} flex items-center justify-center text-xl shadow-sm`}>×</button>
          </div>

          <div className="space-y-6">
            <section className={`${bgCard} p-6 rounded-3xl shadow-sm border space-y-4`}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A Minha Conta</h3>
              <div className={`flex items-center gap-4 py-2 border-b ${borderLight}`}>
                <div className="w-12 h-12 bg-blue-100/10 rounded-2xl flex items-center justify-center text-blue-600 font-black">
                   {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className={`font-bold ${textPrimary}`}>{user.name}</p>
                  <p className="text-xs text-slate-400">{user.emailOrPhone}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm py-2">
                 <span className={`${user.darkMode ? 'text-slate-300' : 'text-slate-600'} font-black text-[10px] uppercase tracking-widest`}>Ocupação</span>
                 <span className={`font-bold ${textPrimary}`}>{user.occupation || 'Não definida'}</span>
              </div>
            </section>

            <section className={`${bgCard} p-6 rounded-3xl shadow-sm border space-y-4`}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergência</h3>
              <div className="flex justify-between items-center text-sm">
                 <div>
                   <p className={`font-bold ${textPrimary}`}>{user.emergencyContactName}</p>
                   <p className="text-xs text-slate-400 font-bold">{user.emergencyContactPhone}</p>
                 </div>
                 <button className="text-blue-600 text-xs font-black uppercase">Editar</button>
              </div>
              <button 
                onClick={() => setShowEmergencyModal(true)}
                className={`w-full py-3 ${user.darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'} rounded-xl font-black text-xs uppercase tracking-widest`}
              >
                Testar Botão SOS
              </button>
            </section>

            <section className={`${bgCard} p-6 rounded-3xl shadow-sm border space-y-4`}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aparência & Dados</h3>
              <div className={`flex justify-between items-center py-2 border-b ${borderLight}`}>
                 <span className={`text-sm font-bold ${user.darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Versão Dark</span>
                 <button 
                  onClick={() => setUser({...user, darkMode: !user.darkMode})}
                  className={`w-12 h-6 rounded-full transition-all relative ${user.darkMode ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-200'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.darkMode ? 'right-1' : 'left-1'}`}></div>
                 </button>
              </div>
              <div className="flex justify-between items-center py-2">
                 <div className="flex flex-col">
                   <span className={`text-sm font-bold ${user.darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Acesso à Localização</span>
                   <span className="text-[10px] text-slate-400 font-medium">Usado apenas para o SOS</span>
                 </div>
                 <button 
                  onClick={() => setUser({...user, locationAccess: !user.locationAccess})}
                  className={`w-12 h-6 rounded-full transition-all relative ${user.locationAccess ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-200'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.locationAccess ? 'right-1' : 'left-1'}`}></div>
                 </button>
              </div>
            </section>

            <button 
              onClick={handleLogout}
              className={`w-full py-4 text-red-500 font-black text-xs uppercase tracking-[0.2em] border rounded-2xl ${user.darkMode ? 'bg-slate-900 border-red-900/20' : 'bg-white border-red-100'} active:bg-red-50 transition-colors shadow-sm`}
            >
              Terminar Sessão
            </button>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 px-1">
        {hasWorseningTrend() && !['results', 'checkin', 'assistant', 'settings'].includes(step) && (
          <div className={`${bgCard} mb-6 p-5 border-l-4 border-red-500 rounded-2xl flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2 border`}>
            <span className="text-2xl">⚡</span>
            <div>
              <p className={`${textPrimary} font-black text-sm`}>Risco Detectado</p>
              <p className={`${textSecondary} text-xs mt-0.5`}>Notei uma subida no teu stress, {user.name.split(' ')[0]}. Que tal uma pausa?</p>
              <button onClick={() => handleSendMessage("Como posso reduzir o meu stress?")} className="text-blue-600 font-black text-xs mt-2 underline">Falar com MPAI</button>
            </div>
          </div>
        )}

        {step === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Burnout', icon: '🔥', color: 'from-orange-400 to-red-500', cat: 'Burnout' },
                { label: 'Foco', icon: '🎯', color: 'from-blue-500 to-indigo-600', cat: 'Focus' },
                { label: 'Sono', icon: '🌙', color: 'from-purple-500 to-fuchsia-600', cat: 'Sleep' },
                { label: 'Corpo', icon: '🏃', color: 'from-green-500 to-emerald-600', cat: 'Physical' }
              ].map((item) => (
                <button 
                  key={item.label}
                  onClick={() => { setSelectedCategory(item.cat as WellnessCategory); changeStep('category_menu'); }}
                  className={`p-6 rounded-[2rem] bg-gradient-to-br ${item.color} text-white shadow-xl text-left relative overflow-hidden active:scale-95 transition-all group`}
                >
                  <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-bold text-lg">{item.label}</span>
                  <div className="absolute -right-3 -bottom-3 opacity-20 text-white text-7xl font-black">{item.icon}</div>
                </button>
              ))}
            </div>

            <section>
              <div className="flex justify-between items-end mb-4 px-1">
                <h3 className={`text-sm font-black ${textPrimary} uppercase tracking-widest`}>O Teu Pulso</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Últimos 7 dias</span>
              </div>
              <div className={`p-6 rounded-[2.5rem] shadow-sm ${bgCard} border`}>
                <StressChart history={history} isDarkMode={user.darkMode} />
                <div className={`mt-4 pt-4 border-t ${borderLight} flex justify-between items-center`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Stress Médio</span>
                    <span className="text-xl font-black text-blue-600">42%</span>
                  </div>
                  <button onClick={() => changeStep('checkin')} className={`px-4 py-2 ${user.darkMode ? 'bg-blue-600/20 text-blue-400 border border-blue-900/30' : 'bg-blue-50 text-blue-600'} text-xs font-black rounded-xl hover:bg-blue-100 transition-colors`}>
                    + Novo Check-in
                  </button>
                </div>
              </div>
            </section>

            <section className={`${user.darkMode ? 'bg-slate-900' : 'bg-slate-900'} rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                <h3 className="font-black tracking-tight uppercase text-xs">Assistente MPAI</h3>
              </div>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">"Olá {user.name.split(' ')[0]}, as tuas métricas de foco subiram 15%. Queres saber porquê?"</p>
              <button 
                onClick={() => changeStep('assistant')}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-900/40"
              >
                Conversar com IA
              </button>
            </section>
          </div>
        )}

        {step === 'category_menu' && (
          <div className="animate-in slide-in-from-right-4 duration-400 pb-12">
            <button onClick={() => changeStep('home')} className="mb-6 text-slate-400 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 group">
              <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Painel Geral
            </button>
            <h2 className={`text-4xl font-black mb-2 ${textPrimary}`}>
              {selectedCategory === 'Focus' ? 'Foco' : selectedCategory === 'Sleep' ? 'Sono' : selectedCategory === 'Physical' ? 'Corpo' : 'Burnout'}
            </h2>
            <p className={`${textSecondary} mb-8 font-medium`}>Otimização de rotina com base em dados de stress.</p>
            
            <div className="space-y-4">
              <section className={`${bgCard} p-6 rounded-[2rem] border shadow-sm flex items-center gap-5 transition-all`}>
                 <div className={`w-14 h-14 ${user.darkMode ? 'bg-slate-800' : 'bg-indigo-50'} rounded-[1.2rem] flex items-center justify-center text-2xl shadow-inner`}>🤖</div>
                 <div className="flex-1">
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-1">IA MPAI</p>
                    <p className={`text-sm ${user.darkMode ? 'text-slate-200' : 'text-slate-700'} font-bold italic leading-snug`}>"O teu stress costuma baixar 20% após sessões de {selectedCategory.toLowerCase()}."</p>
                 </div>
              </section>

              {selectedCategory === 'Burnout' && (
                <>
                  <button onClick={() => changeStep('checkin')} className={`${bgCard} w-full p-6 rounded-[2rem] shadow-sm border text-left flex justify-between items-center group active:scale-95 transition-all`}>
                    <div>
                      <p className={`font-black text-lg ${textPrimary}`}>Check-in Burnout</p>
                      <p className={`text-xs ${textSecondary} font-bold`}>Sessão rápida de 10 segundos</p>
                    </div>
                    <span className="text-3xl group-hover:scale-110 transition-transform">🔥</span>
                  </button>
                  <BreathingExercise isDarkMode={user.darkMode} />
                </>
              )}
              {selectedCategory === 'Focus' && (
                <div className="p-8 bg-blue-600 rounded-[3rem] text-center text-white shadow-2xl shadow-blue-100/10">
                  <span className="text-5xl mb-6 block">🎯</span>
                  <h3 className="font-black text-2xl mb-2">Deep Work Sprint</h3>
                  <p className="text-blue-100/70 text-sm mb-8 font-medium">Baseado no teu pulso: Sugerimos 30 min.</p>
                  <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black shadow-lg">Iniciar Agora</button>
                </div>
              )}
              {selectedCategory === 'Sleep' && (
                <div className="p-8 bg-indigo-900 rounded-[3rem] text-center text-white shadow-2xl">
                  <span className="text-5xl mb-6 block">🌙</span>
                  <h3 className="font-black text-2xl mb-2">Modo Noite IA</h3>
                  <p className="text-indigo-200/60 text-sm mb-8 font-medium">Preparação para sono profundo em 4 etapas.</p>
                  <button className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg">Ativar Guia</button>
                </div>
              )}
              {selectedCategory === 'Physical' && (
                <div className="p-8 bg-emerald-600 rounded-[3rem] text-center text-white shadow-2xl">
                  <span className="text-5xl mb-6 block">🏃</span>
                  <h3 className="font-black text-2xl mb-2">Alívio de Tensão</h3>
                  <p className="text-emerald-100/70 text-sm mb-8 font-medium">IA detectou imobilidade prolongada.</p>
                  <button className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-black">Alongar Agora</button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'checkin' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`${bgCard} p-8 rounded-[3rem] shadow-xl border`}>
              <h2 className={`text-3xl font-black mb-8 ${textPrimary}`}>Check-in Pulso</h2>
              
              <div className="mb-10 text-center">
                <label className="block text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.3em]">O Teu Humor</label>
                <div className="flex justify-around text-4xl mb-8">
                  <button onClick={() => setMood(2)} className={`transition-all ${mood <= 3 ? "scale-125 saturate-150" : "grayscale opacity-30"}`}>😫</button>
                  <button onClick={() => setMood(5)} className={`transition-all ${mood > 3 && mood <= 7 ? "scale-125 saturate-150" : "grayscale opacity-30"}`}>😐</button>
                  <button onClick={() => setMood(9)} className={`transition-all ${mood > 7 ? "scale-125 saturate-150" : "grayscale opacity-30"}`}>😊</button>
                </div>
                <div className="text-blue-600 font-black text-4xl mb-4 tabular-nums">{mood}</div>
                <input 
                  type="range" min="1" max="10" value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-100/20 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="mb-10">
                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.3em]">Diário Rápido</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="O que está a ocupar a tua mente?..."
                  className={`w-full p-6 ${user.darkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-700'} border-none rounded-[1.5rem] h-44 font-bold focus:ring-4 focus:ring-blue-100/20 transition-all outline-none`}
                />
              </div>

              <div className="flex gap-4">
                <button onClick={() => changeStep('home')} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                <button onClick={handleCheckIn} disabled={!note.trim()} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100/10 disabled:opacity-50 active:scale-95 transition-all">
                  Analisar Pulso
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'results' && currentResult && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className={`${bgCard} p-10 rounded-[3.5rem] shadow-2xl text-center relative overflow-hidden border`}>
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/5 rounded-full -mt-20 blur-3xl"></div>
               <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Risco de Burnout</h3>
               <div className={`text-8xl font-black mb-4 tabular-nums ${getScoreColor(currentResult.stressScore)}`}>
                 {currentResult.stressScore}
               </div>
               <div className={`inline-block px-4 py-1.5 ${user.darkMode ? 'bg-slate-800' : 'bg-slate-50'} border ${borderLight} rounded-full text-slate-500 text-[9px] font-black uppercase tracking-widest mb-10`}>
                 Estado: {currentResult.emotionalState}
               </div>
               
               <p className={`${textPrimary} text-xl font-black leading-relaxed mb-10 px-2 italic`}>
                 "{currentResult.aiMessage}"
               </p>

               <div className="text-left space-y-3 mb-10">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] pl-2 mb-4">Plano Recomendado</p>
                 {currentResult.suggestions.map((s, idx) => (
                   <div key={idx} className={`flex items-center gap-4 p-4 ${user.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-white'} rounded-2xl border shadow-sm`}>
                     <span className="text-xl">✨</span>
                     <p className={`text-sm ${user.darkMode ? 'text-slate-200' : 'text-slate-700'} font-black leading-tight`}>{s}</p>
                   </div>
                 ))}
               </div>

               <button onClick={() => changeStep('home')} className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black shadow-2xl active:scale-95 transition-all">
                 Voltar ao Dashboard
               </button>
            </div>
          </div>
        )}

        {step === 'assistant' && (
          <div className={`flex flex-col h-[78vh] ${bgCard} rounded-[3rem] overflow-hidden shadow-2xl border animate-in slide-in-from-bottom-8 duration-500`}>
            <div className={`p-6 ${user.darkMode ? 'bg-slate-800' : 'bg-slate-900'} text-white flex justify-between items-center`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-900/40">🤖</div>
                <div>
                  <span className="font-black block leading-none tracking-tight">IA Assistente</span>
                  <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mt-1 block">MPAI Engine</span>
                </div>
              </div>
              <button onClick={() => changeStep('home')} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 text-xl hover:bg-white/20 transition-all font-light">×</button>
            </div>
            
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${user.darkMode ? 'bg-slate-950/20' : 'bg-slate-50/20'}`}>
              {chatMessages.length === 0 && (
                <div className="text-center text-slate-400 py-16 px-6">
                  <div className={`w-20 h-20 ${user.darkMode ? 'bg-slate-800' : 'bg-blue-50'} rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner`}>⚡</div>
                  <p className={`mb-10 font-black ${user.darkMode ? 'text-slate-300' : 'text-slate-700'} text-lg`}>"Olá {user.name.split(' ')[0]}! Como posso ajudar-te hoje?"</p>
                  <div className="flex flex-col gap-3">
                    {["Dicas de foco?", "Sinto-me cansado.", "Como evitar o burnout?"].map(hint => (
                      <button key={hint} onClick={() => handleSendMessage(hint)} className={`text-sm p-4 ${user.darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'} border rounded-2xl font-black text-left hover:border-blue-400 hover:shadow-lg transition-all flex justify-between items-center group`}>
                        {hint} <span className="opacity-0 group-hover:opacity-100 transition-all text-blue-600">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] p-4 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-100/10' : `${user.darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${borderLight} rounded-tl-none shadow-sm font-bold`}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 items-center text-[10px] text-slate-400 font-black px-2 uppercase tracking-widest">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                  </div>
                  MPAI Processando...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className={`p-6 border-t ${borderLight} flex gap-3 ${user.darkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Diz algo ao MPAI..."
                className={`flex-1 ${user.darkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-800'} p-4 rounded-2xl outline-none text-sm font-black border border-transparent focus:border-blue-100 transition-all`}
              />
              <button onClick={() => handleSendMessage()} className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100/10 flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90">
                <span className="text-xl">✈️</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Nav Bottom */}
      <footer className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto ${user.darkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-50'} backdrop-blur-xl border-t px-12 py-5 flex justify-between items-center z-40 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] rounded-t-[3rem]`}>
        <button onClick={() => changeStep('home')} className={`text-2xl transition-all ${step === 'home' || step === 'category_menu' ? 'text-blue-600 scale-125' : 'text-slate-300 hover:text-slate-500'}`}>🏠</button>
        <button onClick={() => changeStep('checkin')} className={`text-2xl transition-all ${step === 'checkin' ? 'text-blue-600 scale-125' : 'text-slate-300 hover:text-slate-500'}`}>➕</button>
        <button onClick={() => changeStep('assistant')} className={`text-2xl transition-all ${step === 'assistant' ? 'text-blue-600 scale-125' : 'text-slate-300 hover:text-slate-500'}`}>💬</button>
      </footer>
    </div>
  );
};

export default App;
