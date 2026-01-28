
import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Tag, 
  Repeat, 
  Target, 
  Upload,
  Info,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Clock,
  ShieldCheck
} from 'lucide-react';

const Notice: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-4 py-8">
        <div className="inline-block p-4 bg-gradient-to-tr from-blue-500 to-pink-500 rounded-3xl shadow-xl shadow-blue-200 mb-4">
          <Lightbulb className="text-white" size={40} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Guide de l'Utilisateur</h2>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
          Maîtrisez votre application de Suivi Bancaire Pro et optimisez votre gestion financière quotidienne.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Section 1: Dashboard */}
        <NoticeSection 
          icon={<LayoutDashboard className="text-blue-500" />}
          title="1. Tableau de Bord (Dashboard)"
          color="blue"
        >
          <p>Votre tour de contrôle financière :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Patrimoine Global :</strong> Vue consolidée de tous vos comptes en temps réel.</li>
            <li><strong>Échéances Imminentes :</strong> Affiche les prochains prélèvements par sous-catégorie avec la date exacte (JJ/MM).</li>
            <li><strong>Alertes Budgétaires :</strong> Indicateurs automatiques basés sur vos plafonds de dépenses.</li>
          </ul>
        </NoticeSection>

        {/* Section 2: Recurring & Automation */}
        <NoticeSection 
          icon={<Repeat className="text-emerald-500" />}
          title="2. Échéancier & Automatisation"
          color="emerald"
        >
          <p>L'intelligence de l'application se trouve ici :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Détection Automatique (Nouveau) :</strong> Une coche verte <span className="text-emerald-500 font-bold">"Payé"</span> apparaît automatiquement dans la colonne Statut si une transaction correspondante est détectée dans votre journal ce mois-ci.</li>
            <li><strong>Critères de détection :</strong> Même compte source + Même montant + Libellé similaire.</li>
            <li><strong>Bouton ⚡ Zap :</strong> Permet de générer manuellement une transaction dans le journal à partir d'un modèle récurrent.</li>
          </ul>
        </NoticeSection>

        {/* Section 3: Accounts & Reconciliation */}
        <NoticeSection 
          icon={<Wallet className="text-indigo-500" />}
          title="3. Gestion des Comptes & Pointage"
          color="indigo"
        >
          <p>Assurez une réconciliation parfaite avec votre banque :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Marqueurs de Pointage :</strong> Utilisez les statuts (Check, G, D, C) pour suivre le rapprochement bancaire.</li>
            <li><strong>Reste à Vivre :</strong> Calculé sur le compte principal en soustrayant les échéances récurrentes non encore passées du solde réel.</li>
          </ul>
        </NoticeSection>

        {/* Section 4: Analysis */}
        <NoticeSection 
          icon={<BarChart3 className="text-blue-600" />}
          title="4. Analyse & Filtres"
          color="blue"
        >
          <p>Explorez vos données sans limites :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Recherche Puissante :</strong> Filtrez par montant exact, période, ou catégorie pour retrouver n'importe quel flux.</li>
            <li><strong>Indicateurs Filtrés :</strong> Les totaux de revenus et dépenses s'adaptent instantanément à vos critères de recherche.</li>
          </ul>
        </NoticeSection>

        {/* Section 5: Security */}
        <NoticeSection 
          icon={<ShieldCheck className="text-slate-900" />}
          title="5. Confidentialité & Sauvegarde"
          color="slate"
        >
          <p>Vos données vous appartiennent :</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Stockage Local :</strong> Aucune donnée n'est envoyée sur un serveur. Tout reste dans votre navigateur.</li>
            <li><strong>Export Excel :</strong> Sauvegardez régulièrement votre comptabilité au format .xlsx via l'onglet Export.</li>
          </ul>
        </NoticeSection>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-pink-600 p-1 rounded-[2.5rem] shadow-2xl">
        <div className="bg-white p-10 rounded-[2.3rem] text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Prêt pour le déploiement</h3>
          <p className="text-slate-500 font-medium italic">
            "Votre gestion financière est maintenant automatisée et sécurisée."
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
