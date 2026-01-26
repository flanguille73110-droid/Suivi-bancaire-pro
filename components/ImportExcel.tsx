
import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../App';
import { AppContextType, Transaction, TransactionType, ReconciliationMarker, Category } from '../types';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, ArrowRight, Table, Info, X, Wallet, Download, Tag, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

type ImportMode = 'TRANSACTIONS' | 'CATEGORIES';

const ImportExcel: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { accounts, categories, addTransaction, addCategory, notify } = context;

  const [importMode, setImportMode] = useState<ImportMode | null>(null);
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Mapping pour Transactions
  const [mapping, setMapping] = useState<Record<string, string>>({
    date: '', description: '', amount: '', category: '', subCategory: '', paymentMethod: ''
  });

  // Mapping pour Catégories
  const [catMapping, setCatMapping] = useState<Record<string, string>>({
    name: '', type: '', icon: '', color: '', subCategories: ''
  });

  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || '');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (type: ImportMode) => {
    try {
        const wb = XLSX.utils.book_new();
        if (type === 'TRANSACTIONS') {
          const headers = ["Date", "Description", "Montant", "Categorie", "Sous-Categorie", "Moyen de paiement"];
          const data = [["2024-03-20", "Courses Intermarché", "-45.50", "Alimentation", "Supermarché", "Carte"]];
          const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
          XLSX.utils.book_append_sheet(wb, ws, "Modèle Transactions");
          XLSX.writeFile(wb, "Modele_Import_Transactions.xlsx");
        } else {
          const headers = ["Nom", "Type (REVENUE ou EXPENSE)", "Icone", "Couleur (HEX)", "Sous-Categories (separées par virgule)"];
          const data = [
            ["Loisirs", "EXPENSE", "🎮", "#8b5cf6", "Cinéma, Jeux Vidéo, Concerts"],
            ["Bonus", "REVENUE", "🧧", "#10b981", "Primes, Cadeaux"]
          ];
          const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
          XLSX.utils.book_append_sheet(wb, ws, "Modèle Catégories");
          XLSX.writeFile(wb, "Modele_Import_Categories.xlsx");
        }
    } catch (e) {
        notify("Erreur lors de la génération du modèle.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
          const dataArr = evt.target?.result;
          const wb = XLSX.read(dataArr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          
          if (data.length > 0) {
            const fileHeaders = (data[0] as string[]).map(h => h?.toString() || "");
            setHeaders(fileHeaders);
            setRawData(data.slice(1));
            
            // Auto-mapping intelligent
            if (importMode === 'TRANSACTIONS') {
                const newMapping = { ...mapping };
                fileHeaders.forEach(header => {
                    const h = header.toLowerCase();
                    if (h.includes('date')) newMapping.date = header;
                    if (h.includes('desc') || h.includes('libellé')) newMapping.description = header;
                    if (h.includes('montant') || h.includes('valeur')) newMapping.amount = header;
                    if (h.includes('catégorie') || h.includes('categorie')) newMapping.category = header;
                    if (h.includes('sous-cat') || h.includes('sous cat')) newMapping.subCategory = header;
                    if (h.includes('moyen') || h.includes('paiement')) newMapping.paymentMethod = header;
                });
                setMapping(newMapping);
            } else {
                const newCatMapping = { ...catMapping };
                fileHeaders.forEach(header => {
                    const h = header.toLowerCase();
                    if (h.includes('nom') || h.includes('name')) newCatMapping.name = header;
                    if (h.includes('type')) newCatMapping.type = header;
                    if (h.includes('icone') || h.includes('icon')) newCatMapping.icon = header;
                    if (h.includes('couleur') || h.includes('color')) newCatMapping.color = header;
                    if (h.includes('sous') || h.includes('sub')) newCatMapping.subCategories = header;
                });
                setCatMapping(newCatMapping);
            }
            setStep(2);
          }
      } catch (err) {
          notify("Impossible de lire ce fichier.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const generatePreview = () => {
    if (importMode === 'TRANSACTIONS') {
        if (!mapping.date || !mapping.amount) {
            notify("La Date et le Montant sont obligatoires.");
            return;
        }
        const preview = rawData.map(row => {
            const dateVal = row[headers.indexOf(mapping.date)];
            const amountVal = parseFloat(row[headers.indexOf(mapping.amount)]?.toString().replace(',', '.') || "0");
            const catVal = row[headers.indexOf(mapping.category)] || "";
            const foundCat = categories.find(c => c.name.toLowerCase() === catVal.toString().toLowerCase());

            return {
                date: formatDate(dateVal),
                description: (row[headers.indexOf(mapping.description)] || "").toString(),
                revenue: amountVal > 0 ? amountVal : 0,
                expense: amountVal < 0 ? Math.abs(amountVal) : 0,
                categoryId: foundCat?.id || categories[0]?.id || '',
                subCategory: (row[headers.indexOf(mapping.subCategory)] || "").toString(),
                paymentMethod: (row[headers.indexOf(mapping.paymentMethod)] || "Virement").toString(),
                type: amountVal >= 0 ? TransactionType.REVENUE : TransactionType.EXPENSE,
                sourceAccountId: targetAccountId,
                reconciliation: ReconciliationMarker.NONE
            };
        });
        setPreviewData(preview);
    } else {
        if (!catMapping.name || !catMapping.type) {
            notify("Le Nom et le Type sont obligatoires.");
            return;
        }
        const preview = rawData.map(row => {
            const typeStr = (row[headers.indexOf(catMapping.type)] || "EXPENSE").toString().toUpperCase();
            const subStr = (row[headers.indexOf(catMapping.subCategories)] || "").toString();
            
            return {
                name: (row[headers.indexOf(catMapping.name)] || "Sans nom").toString(),
                type: typeStr.includes("REV") ? TransactionType.REVENUE : TransactionType.EXPENSE,
                icon: (row[headers.indexOf(catMapping.icon)] || "📁").toString(),
                color: (row[headers.indexOf(catMapping.color)] || "#64748b").toString(),
                subCategories: subStr ? subStr.split(',').map(s => s.trim()).filter(s => s !== "") : []
            };
        });
        setPreviewData(preview);
    }
    setStep(3);
  };

  const formatDate = (val: any) => {
    if (!val) return new Date().toISOString().split('T')[0];
    if (typeof val === 'number') {
      const date = new Date((val - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val.toString();
      return d.toISOString().split('T')[0];
    } catch {
      return val.toString();
    }
  };

  const finalizeImport = () => {
    if (importMode === 'TRANSACTIONS') {
        previewData.forEach(t => {
            addTransaction({ ...t, id: Math.random().toString(36).substr(2, 9) + Date.now() } as Transaction);
        });
        notify(`${previewData.length} transactions ajoutées.`);
    } else {
        previewData.forEach(c => {
            addCategory({ ...c, id: Math.random().toString(36).substr(2, 9) + Date.now() } as Category);
        });
        notify(`${previewData.length} catégories créées.`);
    }
    reset();
  };

  const reset = () => {
    setStep(1);
    setFileName("");
    setRawData([]);
    setPreviewData([]);
    setImportMode(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!importMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 py-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Importation de Données</h2>
          <p className="text-slate-500 font-medium">Choisissez le type d'éléments que vous souhaitez importer par fichier Excel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={() => setImportMode('TRANSACTIONS')}
            className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center text-center space-y-6"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Table size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Transactions</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed font-medium">Importez votre historique bancaire complet (revenus, dépenses).</p>
            </div>
            <div className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200">Choisir ce mode</div>
          </button>

          <button 
            onClick={() => setImportMode('CATEGORIES')}
            className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center text-center space-y-6"
          >
            <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Catégories</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed font-medium">Configurez votre arborescence de budgets et sous-catégories rapidement.</p>
            </div>
            <div className="px-6 py-3 bg-pink-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-200">Choisir ce mode</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={reset} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={16} className="mr-2" /> Retour au choix
        </button>
        <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                Importation : {importMode === 'TRANSACTIONS' ? 'Transactions' : 'Catégories'}
            </h2>
        </div>
        <div className="w-20" /> {/* Spacer */}
      </div>

      <div className="flex justify-center items-center space-x-4 mb-12">
        <StepIndicator num={1} label="Fichier" active={step >= 1} current={step === 1} />
        <ArrowRight size={16} className="text-slate-300" />
        <StepIndicator num={2} label="Mapping" active={step >= 2} current={step === 2} />
        <ArrowRight size={16} className="text-slate-300" />
        <StepIndicator num={3} label="Validation" active={step >= 3} current={step === 3} />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden p-8 md:p-12">
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto py-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-[2rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group p-6 text-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={28} />
                </div>
                <p className="text-lg font-bold text-slate-800">Cliquez pour importer</p>
                <p className="text-sm text-slate-400 mt-1">Fichier .xlsx ou .csv</p>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-8 flex flex-col justify-center space-y-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tighter">
                      <Download size={20} className="mr-2 text-pink-500" /> Télécharger le modèle
                  </h3>
                  <button 
                      onClick={() => downloadTemplate(importMode)}
                      className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                      <div className="flex items-center">
                          <FileSpreadsheet className="text-emerald-500 mr-3" size={20} />
                          <span className="text-sm font-bold text-slate-700">Modèle {importMode === 'TRANSACTIONS' ? 'Transactions' : 'Catégories'}</span>
                      </div>
                      <Download size={16} className="text-slate-300 group-hover:text-blue-500" />
                  </button>
              </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="font-black text-slate-800 text-lg flex items-center uppercase tracking-tighter border-b border-slate-100 pb-2">
                  <Table className="mr-2 text-blue-500" size={22} /> Correspondance des colonnes
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {importMode === 'TRANSACTIONS' ? (
                    <>
                      <MappingField label="Date" required value={mapping.date} onChange={v => setMapping({...mapping, date: v})} options={headers} />
                      <MappingField label="Libellé" value={mapping.description} onChange={v => setMapping({...mapping, description: v})} options={headers} />
                      <MappingField label="Montant" required value={mapping.amount} onChange={v => setMapping({...mapping, amount: v})} options={headers} />
                      <MappingField label="Catégorie" value={mapping.category} onChange={v => setMapping({...mapping, category: v})} options={headers} />
                      <MappingField label="Sous-Catégorie" value={mapping.subCategory} onChange={v => setMapping({...mapping, subCategory: v})} options={headers} />
                      <MappingField label="Moyen paiement" value={mapping.paymentMethod} onChange={v => setMapping({...mapping, paymentMethod: v})} options={headers} />
                    </>
                  ) : (
                    <>
                      <MappingField label="Nom de catégorie" required value={catMapping.name} onChange={v => setCatMapping({...catMapping, name: v})} options={headers} />
                      <MappingField label="Type (Revenu/Dépense)" required value={catMapping.type} onChange={v => setCatMapping({...catMapping, type: v})} options={headers} />
                      <MappingField label="Icône (Emoji)" value={catMapping.icon} onChange={v => setCatMapping({...catMapping, icon: v})} options={headers} />
                      <MappingField label="Couleur (Code Hex)" value={catMapping.color} onChange={v => setCatMapping({...catMapping, color: v})} options={headers} />
                      <MappingField label="Sous-Catégories" value={catMapping.subCategories} onChange={v => setCatMapping({...catMapping, subCategories: v})} options={headers} />
                    </>
                  )}
                </div>
              </div>

              {importMode === 'TRANSACTIONS' && (
                <div className="space-y-6">
                  <h3 className="font-black text-slate-800 text-lg flex items-center uppercase tracking-tighter border-b border-slate-100 pb-2">
                    <Wallet className="mr-2 text-pink-500" size={22} /> Destination
                  </h3>
                  <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte de destination</label>
                    <select 
                        className="w-full px-5 py-4 bg-white border-2 border-transparent rounded-xl outline-none focus:border-blue-500 font-bold shadow-sm transition-all"
                        value={targetAccountId}
                        onChange={e => setTargetAccountId(e.target.value)}
                    >
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 flex justify-center">
              <button 
                onClick={generatePreview}
                className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 uppercase text-xs tracking-widest"
              >
                <span>Prévisualiser l'import</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Récapitulatif avant validation</h3>
            
            <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    {importMode === 'TRANSACTIONS' ? (
                      <>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Montant</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4">Icône</th>
                        <th className="px-6 py-4">Nom</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Sous-Catégories</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewData.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {importMode === 'TRANSACTIONS' ? (
                        <>
                          <td className="px-6 py-4 text-slate-400 font-bold">{row.date}</td>
                          <td className="px-6 py-4 font-black text-slate-800 truncate max-w-[200px]">{row.description}</td>
                          <td className={`px-6 py-4 text-right font-black ${row.revenue > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {row.revenue > 0 ? `+${row.revenue.toFixed(2)}€` : `-${row.expense.toFixed(2)}€`}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-2xl">{row.icon}</td>
                          <td className="px-6 py-4 font-black text-slate-800">{row.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${row.type === 'REVENUE' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                            {row.subCategories?.join(', ') || 'Aucune'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-10 rounded-[2.5rem] shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-6 text-center md:text-left">
                <CheckCircle2 size={48} />
                <div>
                  <p className="text-2xl font-black uppercase tracking-tight">Validation finale</p>
                  <p className="text-sm text-emerald-50 font-medium">{previewData.length} éléments vont être importés maintenant.</p>
                </div>
              </div>
              <button 
                onClick={finalizeImport}
                className="w-full md:w-auto px-12 py-5 bg-white text-emerald-600 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all uppercase text-xs tracking-widest"
              >
                Confirmer l'import
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StepIndicator: React.FC<{ num: number, label: string, active: boolean, current: boolean }> = ({ num, label, active, current }) => (
  <div className={`flex items-center space-x-2 ${active ? 'text-slate-900' : 'text-slate-300'}`}>
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${current ? 'bg-blue-500 text-white shadow-xl shadow-blue-200 scale-110' : active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
      {num}
    </div>
    <span className={`text-xs font-black uppercase tracking-[0.2em] ${current ? 'text-blue-500' : active ? 'text-slate-900' : 'text-slate-300'}`}>{label}</span>
  </div>
);

const MappingField: React.FC<{ label: string, required?: boolean, value: string, onChange: (v: string) => void, options: string[] }> = ({ label, required, value, onChange, options }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex justify-between">
      <span>{label}</span>
      {required && <span className="text-rose-400">Obligatoire</span>}
    </label>
    <select 
      className={`w-full px-5 py-3.5 bg-slate-50 border-2 rounded-xl outline-none transition-all font-bold text-sm ${value ? 'border-emerald-200 bg-emerald-50/30 text-emerald-700' : 'border-transparent focus:border-blue-500 focus:bg-white'}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">-- Choisir une colonne --</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default ImportExcel;
