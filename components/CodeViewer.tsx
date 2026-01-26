
import React, { useState } from 'react';
import { Copy, Check, FileCode, Hash, Braces } from 'lucide-react';

const CodeViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'html' | 'css' | 'js'>('js');
  const [copied, setCopied] = useState(false);

  const codes = {
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suivi Bancaire Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script type="importmap">
    {
      "imports": {
        "react/": "https://esm.sh/react@^19.2.3/",
        "react": "https://esm.sh/react@^19.2.3",
        "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
        "lucide-react": "https://esm.sh/lucide-react@^0.563.0",
        "xlsx": "https://esm.sh/xlsx@0.18.5"
      }
    }
    </script>
</head>
<body class="bg-slate-50 text-slate-900">
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
</body>
</html>`,
    css: `/* Styles personnalisés basés sur Tailwind */
body {
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Animations d'entrée */
.animate-in {
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}`,
    js: `// Logique principale de l'application (React + TypeScript)
import React, { useState, useEffect, createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Wallet, CreditCard } from 'lucide-react';

// Context global pour l'état de l'application
export const AppContext = createContext(null);

const App = () => {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('sb_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  // Gestion du stockage local
  useEffect(() => {
    localStorage.setItem('sb_accounts', JSON.stringify(accounts));
  }, [accounts]);

  return (
    <AppContext.Provider value={{ accounts, setAccounts }}>
      <div className="app-container">
        {/* Navigation et rendu des composants */}
        <h1>Mon Suivi Bancaire</h1>
      </div>
    </AppContext.Provider>
  );
};

// Montage de l'application
const root = createRoot(document.getElementById('root'));
root.render(<App />);`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codes[activeSubTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2 py-4">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Code Source</h2>
        <p className="text-slate-500 font-medium italic">Accédez au cœur technique de votre application</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
        {/* Navigation des sous-onglets de code */}
        <div className="flex bg-slate-900 p-2 space-x-2 border-b border-slate-800">
          <CodeTab 
            id="html" 
            label="index.html" 
            icon={<FileCode size={14} />} 
            active={activeSubTab === 'html'} 
            onClick={() => setActiveSubTab('html')} 
          />
          <CodeTab 
            id="css" 
            label="styles.css" 
            icon={<Hash size={14} />} 
            active={activeSubTab === 'css'} 
            onClick={() => setActiveSubTab('css')} 
          />
          <CodeTab 
            id="js" 
            label="App.tsx (Logic)" 
            icon={<Braces size={14} />} 
            active={activeSubTab === 'js'} 
            onClick={() => setActiveSubTab('js')} 
          />
        </div>

        {/* Fenêtre de Code */}
        <div className="relative flex-1 bg-slate-950 font-mono text-sm leading-relaxed overflow-auto p-8 text-slate-300">
          <button 
            onClick={handleCopy}
            className="absolute top-4 right-4 flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 active:scale-95 z-10"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span className="text-xs font-bold uppercase tracking-widest">{copied ? 'Copié !' : 'Copier'}</span>
          </button>
          
          <pre className="whitespace-pre-wrap break-all">
            {codes[activeSubTab]}
          </pre>
        </div>
      </div>

      <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start space-x-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-500">
          <Braces size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">Note Technique</h4>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            Le code JavaScript présenté ici est une version simplifiée de la logique principale utilisant React et TypeScript. 
            L'application réelle utilise un système de composants modulaire et le framework CSS Tailwind pour son design réactif.
          </p>
        </div>
      </div>
    </div>
  );
};

const CodeTab: React.FC<{ 
  id: string, 
  label: string, 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void 
}> = ({ label, icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${active ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default CodeViewer;
