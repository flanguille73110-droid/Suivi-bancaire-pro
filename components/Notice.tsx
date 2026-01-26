
import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  Tag, 
  ArrowRightLeft, 
  Repeat, 
  PieChart, 
  Target, 
  Download, 
  Upload,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Search
} from 'lucide-react';

const Notice: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-4 py-8">
        <div className="inline-block p-4 bg-gradient-to-tr from-blue-500 to-pink-500 rounded-3xl shadow-xl shadow-blue-200 mb-4">
          <Lightbulb className="text-white" size={40} />
        </div>
        <h2 className="text-4xl font-black text-slate-900">Guide de l'Utilisateur</h2>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
          Tout ce que vous devez savoir pour maîtriser votre application de Suivi Bancaire Pro et optimiser vos finances.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Section 1: Dashboard */}
        <NoticeSection 
          icon={<LayoutDashboard className="text-blue-500" />}
          title="1. Tableau de Bord (Dashboard)"
          color="blue"
        >
          <p>Le centre de contrôle visuel de vos finances. Il regroupe :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Solde Consolidé :</strong> Somme totale de tous vos comptes.</li>
            <li><strong>Widgets d'Objectifs :</strong> Barre de progression rapide de vos 3 objectifs les plus importants.</li>
            <li><strong>Alertes Budgétaires :</strong> S'affichent automatiquement dès que vous atteignez 80% d'un budget défini.</li>
          </ul>
        </NoticeSection>

        {/* Section 2: UI & Navigation */}
        <NoticeSection 
          icon={<div className="w-6 h-6 rounded-md bg-gradient-to-r from-pink-500 to-blue-500" />}
          title="2. Interface & Couleurs"
          color="slate"
        >
          <p>L'application utilise des codes couleurs dynamiques pour une navigation intuitive :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Navigation :</strong> L'onglet sélectionné dans le menu est mis en évidence par un dégradé <span className="font-bold text-pink-500">Rose</span> à <span className="font-bold text-blue-500">Bleu</span>.</li>
            <li><strong>Recherche :</strong> Les boutons de recherche et filtres utilisent un dégradé <span className="font-bold text-blue-500">Bleu</span> à <span className="font-bold text-pink-500">Rose</span> pour un repérage rapide.</li>
          </ul>
        </NoticeSection>

        {/* Section 3: Accounts */}
        <NoticeSection 
          icon={<Wallet className="text-indigo-500" />}
          title="3. Gestion des Comptes"
          color="indigo"
        >
          <p>Différencie le <strong>Compte Principal</strong> des <strong>Comptes Multiples</strong>.</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Rapprochement :</strong> Utilisez le sélecteur pour marquer vos transactions (Coche verte, G, D, C pour le solde pointé).</li>
            <li><strong>Calculs Réels :</strong> Saisissez le <em>Solde Banque</em> manuel pour voir la différence immédiate avec votre suivi.</li>
          </ul>
        </NoticeSection>

        {/* Section 4: Financial Analysis (NEW/UPDATED) */}
        <NoticeSection 
          icon={<BarChart3 className="text-blue-600" />}
          title="4. Analyse Financière & Filtres"
          color="blue"
        >
          <p>Un moteur de recherche puissant pour disséquer vos finances sur le compte principal :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Recherche Multi-critères :</strong> Filtrez par dates (Début/Fin), Catégories, Sous-catégories, Mois, Année et Montant précis.</li>
            <li><strong>Type d'opération :</strong> Un sélecteur unique vous permet d'isoler uniquement les <em>Revenus</em> ou uniquement les <em>Dépenses</em>.</li>
            <li><strong>Statistiques Dynamiques :</strong> Les compteurs de revenus, dépenses et solde se mettent à jour instantanément selon vos filtres.</li>
          </ul>
        </NoticeSection>

        {/* Section 5: Recurring */}
        <NoticeSection 
          icon={<Repeat className="text-emerald-500" />}
          title="5. Transactions Récurrentes"
          color="emerald"
        >
          <p>Automatisez vos mouvements périodiques.</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Reste à passer :</strong> L'application calcule intelligemment ce qu'il reste à prélever ce mois-ci en ignorant les transactions déjà présentes dans votre journal.</li>
            <li><strong>Bouton ⚡ Zap :</strong> Force l'exécution immédiate d'une transaction récurrente vers le journal réel.</li>
          </ul>
        </NoticeSection>

        {/* Section 6: Budgets & Goals */}
        <NoticeSection 
          icon={<Target className="text-pink-600" />}
          title="6. Budgets & Objectifs"
          color="pink"
        >
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Budgets :</strong> Limites par catégorie avec alertes visuelles (50%, 80%, 100%).</li>
            <li><strong>Objectifs 🎯 :</strong> Suivi de vos projets d'épargne avec progression circulaire et badges de réussite.</li>
          </ul>
        </NoticeSection>

        {/* Section 7: Import/Export */}
        <NoticeSection 
          icon={<Upload className="text-slate-900" />}
          title="7. Sauvegarde & Import Excel"
          color="slate"
        >
          <p>Ne perdez jamais vos données et évitez la saisie manuelle :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Modèles :</strong> Téléchargez nos modèles Excel ou CSV pour préparer vos données.</li>
            <li><strong>Mapping intelligent :</strong> L'importateur tente de faire correspondre automatiquement vos colonnes (Date, Montant, Description).</li>
          </ul>
        </NoticeSection>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-pink-600 p-1 rounded-[2.5rem] shadow-2xl">
        <div className="bg-white p-10 rounded-[2.3rem] text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Vous êtes prêt !</h3>
          <p className="text-slate-500 font-medium italic">
            "Une analyse précise est la clé d'une gestion sereine."
          </p>
        </div>
      </div>
    </div>
  );
};

interface NoticeSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  color: string;
}

const NoticeSection: React.FC<NoticeSectionProps> = ({ icon, title, children, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-100 bg-blue-50/30',
    indigo: 'border-indigo-100 bg-indigo-50/30',
    rose: 'border-rose-100 bg-rose-50/30',
    pink: 'border-pink-100 bg-pink-50/30',
    emerald: 'border-emerald-100 bg-emerald-50/30',
    slate: 'border-slate-200 bg-slate-50/50',
  };

  return (
    <div className={`p-8 rounded-[2.5rem] border ${colorMap[color]} shadow-sm space-y-4 transition-all hover:shadow-md`}>
      <div className="flex items-center space-x-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">
          {icon}
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      </div>
      <div className="text-slate-600 leading-relaxed font-medium text-sm">
        {children}
      </div>
    </div>
  );
};

export default Notice;
