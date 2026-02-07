
import React, { useState, useEffect } from 'react';

interface Props {
  isDarkMode?: boolean;
}

const BreathingExercise: React.FC<Props> = ({ isDarkMode }) => {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [seconds, setSeconds] = useState(4);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer: number;
    if (isActive) {
      timer = window.setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            if (phase === 'Inhale') { setPhase('Hold'); return 4; }
            if (phase === 'Hold') { setPhase('Exhale'); return 4; }
            if (phase === 'Exhale') { setPhase('Inhale'); return 4; }
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase]);

  const phaseLabels = {
    Inhale: 'Inspira',
    Hold: 'Retém',
    Exhale: 'Expira'
  };

  return (
    <div className={`flex flex-col items-center p-8 rounded-[2.5rem] transition-colors duration-500 shadow-xl ${isDarkMode ? 'bg-indigo-900/40 border border-indigo-800' : 'bg-blue-600'}`}>
      <h3 className={`text-xl font-black mb-6 ${isDarkMode ? 'text-indigo-200' : 'text-blue-100'}`}>Respiração Quadrada</h3>
      
      <div className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${isActive ? (phase === 'Inhale' ? 'scale-125' : phase === 'Exhale' ? 'scale-75' : 'scale-110') : 'scale-100'} ${isDarkMode ? 'border-indigo-400 text-indigo-100' : 'border-blue-200 text-white'}`}>
        <span className="text-3xl font-black">{isActive ? seconds : 'Pronto?'}</span>
      </div>

      <p className={`mt-8 text-xl font-bold h-8 ${isDarkMode ? 'text-indigo-100' : 'text-white'}`}>
        {isActive ? phaseLabels[phase] : 'Começa a relaxar'}
      </p>

      <button 
        onClick={() => setIsActive(!isActive)}
        className={`mt-8 px-10 py-3 rounded-full font-black transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-500 text-white' : 'bg-white text-blue-600 shadow-lg'}`}
      >
        {isActive ? 'Pausa' : 'Começar Agora'}
      </button>
    </div>
  );
};

export default BreathingExercise;
