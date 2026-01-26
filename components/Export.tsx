
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { AppContextType } from '../types';
import { Download, Table, FileSpreadsheet, History, CheckCircle2, Tag } from 'lucide-react';
import * as XLSX from 'xlsx';

const Export: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;

  const exportExcel = (data: any[], filename: string, type: 'TRANSACTIONS' | 'CATEGORIES' | 'BUDGETS' | 'GOALS' | 'GENERIC' = 'GENERIC') => {
    if (!data || data.length === 0) {
      context.notify("⚠️ Aucune donnée à exporter.");
      return;
    }
    
    try {
      context.notify("⚡ Génération du fichier Excel...");
      
      let finalData = [];

      if (type === 'CATEGORIES') {
        // Formatage spécifique pour correspondre au format d'importation
        finalData = data.map(cat => ({
          "Nom": cat.name,
          "Type": cat.type,
          "Icone": cat.icon,
          "Couleur (HEX)": cat.color,
          "Sous-Categories": cat.subCategories?.join(', ') || ''
        }));
      } else {
        // Nettoyage générique des données pour l'export (on retire les ID techniques)
        finalData = data.map(({ id, ...rest }) => rest);
      }

      const worksheet = XLSX.utils.json_to_sheet(finalData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Données");
      
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFileName = `${filename}_${dateStr}.xlsx`;

      // Déclenchement impératif du téléchargement
      XLSX.writeFile(workbook, fullFileName);
      
      context.notify("✅ Téléchargement terminé !");
    } catch (error) {
      console.error("Erreur Export:", error);
      context.notify("❌ Erreur lors de l'export.");
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in duration-500 py-12">
      <div className="text-center space-y-4">
        <div className="inline-block p-6 bg-blue-50 text-blue-600 rounded-[2rem] shadow-xl shadow-blue-100 mb-4">
          <FileSpreadsheet size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Exportation des Données</h2>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">Archivez votre comptabilité au format Excel (.xlsx) pour vos dossiers personnels ou votre expert-comptable.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ExportCard 
          title="Journal des Transactions" 
          icon={<Table className="text-blue-500" />}
          description="L'intégralité de vos flux financiers de tous vos comptes bancaires."
          onExport={() => exportExcel(context.transactions, 'Journal_Transactions')}
        />
        <ExportCard 
          title="Liste des Catégories" 
          icon={<Tag className="text-pink-500" />}
          description="Toute votre arborescence de catégories et sous-catégories personnalisées."
          onExport={() => exportExcel(context.categories, 'Configuration_Categories', 'CATEGORIES')}
        />
        <ExportCard 
          title="Budgets & Plafonds" 
          icon={<FileSpreadsheet className="text-amber-500" />}
          description="Vos limites de dépenses par catégorie et l'état actuel des consommations."
          onExport={() => exportExcel(context.budgets, 'Configuration_Budgets', 'BUDGETS')}
        />
        <ExportCard 
          title="Objectifs d'Épargne" 
          icon={<History className="text-emerald-500" />}
          description="Le détail de vos projets projet par projet avec les montants cibles."
          onExport={() => exportExcel(context.goals, 'Suivi_Objectifs', 'GOALS')}
        />
        <ExportCard 
          title="Rapprochements" 
          icon={<CheckCircle2 className="text-slate-700" />}
          description="Transactions pointées (C, G, D) uniquement pour vérification bancaire."
          onExport={() => exportExcel(context.transactions.filter(t => t.reconciliation !== 'NONE'), 'Transactions_Pointees')}
        />
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="flex items-center space-x-6 relative z-10">
           <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center">
              <Download className="text-blue-400" size={32} />
           </div>
           <div>
              <p className="font-black text-xl uppercase tracking-tight">Sauvegarde Totale</p>
              <p className="text-xs text-slate-400 font-medium">Exportez tout l'historique pour une réimportation ultérieure.</p>
           </div>
        </div>
        <button 
          onClick={() => exportExcel(context.transactions, 'Backup_Suivi_Bancaire')}
          className="w-full md:w-auto px-10 py-5 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-[1.5rem] transition-all uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95"
        >
          Exporter maintenant
        </button>
      </div>
    </div>
  );
};

const ExportCard: React.FC<{ title: string, description: string, icon: React.ReactNode, onExport: () => void }> = ({ title, description, icon, onExport }) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group border-b-8 hover:border-b-blue-500 flex flex-col h-full">
    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-3xl mb-8 shadow-inner group-hover:scale-110 transition-transform shrink-0">
      {icon}
    </div>
    <h3 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tighter">{title}</h3>
    <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium flex-1">{description}</p>
    <button 
      onClick={onExport}
      className="w-full py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center space-x-3 group-hover:bg-slate-900 group-hover:text-white group-hover:border-transparent transition-all shadow-sm shrink-0"
    >
      <Download size={16} />
      <span>Télécharger Excel</span>
    </button>
  </div>
);

export default Export;
