
import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../App';
import { AppContextType, Transaction, TransactionType, ReconciliationMarker, Category } from '../types';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, ArrowRight, Table, Info, X, Wallet, Download, Tag, ArrowLeft, RefreshCw } from 'lucide-react';
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
  
  const [mapping, setMapping] = useState<Record<string, string>>({
    date: '', description: '', amount: '', debit: '', credit: '', category: '', subCategory: '', paymentMethod: '', reconciliation: ''
  });
  const [invertAmounts, setInvertAmounts] = useState(false);

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
          const headers = ["Date", "Description", "Montant", "Categorie", "Sous-Categorie", "Moyen de paiement", "Rapprochement"];
          const data = [["2024-03-20", "Courses Intermarché", "-45.50", "Alimentation", "Supermarché", "Carte", "C"]];
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
            
            if (importMode === 'TRANSACTIONS') {
                const newMapping = { date: '', description: '', amount: '', debit: '', credit: '', category: '', subCategory: '', paymentMethod: '', reconciliation: '' };
                fileHeaders.forEach(header => {
                    const h = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (h.includes('date')) newMapping.date = header;
                    if (h.includes('desc') || h.includes('libelle')) newMapping.description = header;
                    if (h === 'montant' || h === 'valeur' || h === 'prix') newMapping.amount = header;
                    if (h.includes('debit')) newMapping.debit = header;
                    if (h.includes('credit')) newMapping.credit = header;
                    if (h.includes('categorie')) newMapping.category = header;
                    if (h.includes('sous-cat') || h.includes('sous cat')) newMapping.subCategory = header;
                    if (h.includes('moyen') || h.includes('paiement')) newMapping.paymentMethod = header;
                    if (h.includes('rapproch') || h.includes('pointage')) newMapping.reconciliation = header;
                });
                setMapping(newMapping);
            } else {
                const newCatMapping = { name: '', type: '', icon: '', color: '', subCategories: '' };
                fileHeaders.forEach(header => {
                    const h = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

  const parseAmount = (val: any): number => {
    if (val === undefined || val === null || val === "") return 0;
    let s = val.toString().trim();
    if (s.startsWith('(') && s.endsWith(')')) {
        s = '-' + s.substring(1, s.length - 1);
    }
    const isNegativeSuffix = s.endsWith('-');
    if (isNegativeSuffix) s = '-' + s.slice(0, -1);
    
    s = s.replace(',', '.').replace(/\s/g, '').replace(/[€$]/g, '');
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  };

  const findCategory = (catVal: string, description: string, type: TransactionType): string => {
    const searchCat = catVal.toLowerCase().trim();
    const searchDesc = description.toLowerCase().trim();
    
    if (searchCat) {
        const found = categories.find(c => c.name.toLowerCase() === searchCat);
        if (found) return found.id;
    }
    const matchedByDesc = categories.find(c => searchDesc.includes(c.name.toLowerCase()));
    if (matchedByDesc) return matchedByDesc.id;
    const fallback = categories.find(c => c.type === type);
    return fallback ? fallback.id : categories[0]?.id;
  };

  const generatePreview = () => {
    if (importMode === 'TRANSACTIONS') {
        const dateIdx = headers.indexOf(mapping.date);
        const amountIdx = headers.indexOf(mapping.amount);
        const debitIdx = headers.indexOf(mapping.debit);
        const creditIdx = headers.indexOf(mapping.credit);
        const descIdx = headers.indexOf(mapping.description);
        const catIdx = headers.indexOf(mapping.category);
        const subCatIdx = headers.indexOf(mapping.subCategory);
        const methodIdx = headers.indexOf(mapping.paymentMethod);
        const reconIdx = headers.indexOf(mapping.reconciliation);

        if (dateIdx === -1 || (amountIdx === -1 && debitIdx === -1)) {
            notify("La Date et au moins un Montant sont obligatoires.");
            return;
        }

        const preview = rawData.map(row => {
            let finalAmount = 0;
            if (debitIdx !== -1 || creditIdx !== -1) {
              const d = parseAmount(row[debitIdx]);
              const c = parseAmount(row[creditIdx]);
              finalAmount = c - Math.abs(d);
            } else {
              finalAmount = parseAmount(row[amountIdx]);
            }
            if (invertAmounts) finalAmount = -finalAmount;

            const type = finalAmount >= 0 ? TransactionType.REVENUE : TransactionType.EXPENSE;
            // Modifié : Utilise "" si la description est absente au lieu de "Import Excel"
            const description = (row[descIdx] || "").toString();
            const catVal = catIdx !== -1 ? (row[catIdx] || "").toString() : "";
            
            // Gestion intelligente du rapprochement importé
            let recon = ReconciliationMarker.NONE;
            if (reconIdx !== -1) {
                const rawRecon = (row[reconIdx] || "").toString().trim().toUpperCase();
                if (rawRecon.includes("CHECK") || rawRecon.includes("✅")) recon = ReconciliationMarker.GREEN_CHECK;
                else if (rawRecon === "C") recon = ReconciliationMarker.C;
                else if (rawRecon === "G") recon = ReconciliationMarker.G;
                else if (rawRecon === "G2") recon = ReconciliationMarker.G2;
                else if (rawRecon === "D") recon = ReconciliationMarker.D;
                else if (rawRecon === "D2") recon = ReconciliationMarker.D2;
            }

            return {
                date: formatDate(row[dateIdx]),
                description: description,
                revenue: type === TransactionType.REVENUE ? Math.abs(finalAmount) : 0,
                expense: type === TransactionType.EXPENSE ? Math.abs(finalAmount) : 0,
                categoryId: findCategory(catVal, description, type),
                subCategory: subCatIdx !== -1 ? (row[subCatIdx] || "").toString() : "",
                paymentMethod: methodIdx !== -1 ? (row[methodIdx] || "Virement").toString() : "Virement",
                type: type,
                sourceAccountId: targetAccountId,
                reconciliation: recon
            };
        });
        setPreviewData(preview);
    } else {
        const nameIdx = headers.indexOf(catMapping.name);
        const typeIdx = headers.indexOf(catMapping.type);
        const iconIdx = headers.indexOf(catMapping.icon);
        const colorIdx = headers.indexOf(catMapping.color);
        const subsIdx = headers.indexOf(catMapping.subCategories);

        if (nameIdx === -1 || typeIdx === -1) {
            notify("Le Nom et le Type sont obligatoires.");
            return;
        }

        const preview = rawData.map(row => {
            const typeStr = (row[typeIdx] || "EXPENSE").toString().toUpperCase();
            const subStr = subsIdx !== -1 ? (row[subsIdx] || "").toString() : "";
            
            return {
                name: (row[nameIdx] || "Sans nom").toString(),
                type: typeStr.includes("REV") ? TransactionType.REVENUE : TransactionType.EXPENSE,
                icon: iconIdx !== -1 ? (row[iconIdx] || "📁").toString() : "📁",
                color: colorIdx !== -1 ? (row[colorIdx] || "#64748b").toString() : "#64748b",
                subCategories: subStr ? subStr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== "") : []
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
      if (isNaN(d.getTime())) {
        const parts = val.toString().split(/[\/-]/);
        if (parts.length === 3) {
           if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
           if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        return val.toString();
      }
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
    setInvertAmounts(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!importMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 py-12">
        <div className="text-center space-y-4">
          <div className="inline-block p-6 bg-blue-50 text-blue-600 rounded-[2.5rem] shadow-xl shadow-blue-100 mb-4">
             <FileSpreadsheet size={48} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Importation de Données</h2>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">Choisissez le type de données que vous souhaitez importer massivement dans votre application.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={() => setImportMode('TRANSACTIONS')} 
            className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center hover:border-blue-500 transition-all text-center space-y-4"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><Table size={32}/></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Transactions</h3>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">Journal comptable</p>
            </div>
          </button>
          <button 
            onClick={() => setImportMode('CATEGORIES')} 
            className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center hover:border-pink-500 transition-all text-center space-y-4"
          >
            <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><Tag size={32}/></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Catégories</h3>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">Arborescence & Icônes</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={reset} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={16} className="mr-2" /> Retour au menu
        </button>
        <div className="flex space-x-3">
           <StepIndicator num={1} label="Fichier" active={step >= 1} current={step === 1} />
           <StepIndicator num={2} label="Colonnes" active={step >= 2} current={step === 2} />
           <StepIndicator num={3} label="Aperçu" active={step >= 3} current={step === 3} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        {step === 1 && (
          <div className="p-16 flex flex-col items-center space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">1. Sélection du fichier</h3>
                <p className="text-sm text-slate-400 font-medium">Glissez votre fichier Excel (.xlsx) ou cliquez pour parcourir.</p>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-lg h-64 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center space-y-4 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:text-blue-500 group-hover:bg-white transition-all shadow-inner">
                  <Upload size={32} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cliquez pour téléverser</p>
              </div>
              
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
              
              <div className="pt-8 border-t border-slate-50 w-full flex flex-col items-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Besoin d'aide ?</p>
                 <button 
                  onClick={() => downloadTemplate(importMode)}
                  className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest"
                 >
                   <Download size={14} />
                   <span>Télécharger le modèle type</span>
                 </button>
              </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-10 space-y-10 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-6 border-b border-slate-50">
               <div className="flex items-center space-x-6">
                 <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl shadow-inner"><Table size={24}/></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">2. Mapping des colonnes</h3>
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Fichier : {fileName}</p>
                 </div>
               </div>
               
               {importMode === 'TRANSACTIONS' && (
                 <button 
                  onClick={() => setInvertAmounts(!invertAmounts)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${invertAmounts ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200'}`}
                 >
                   <RefreshCw size={14} className={invertAmounts ? 'animate-spin' : ''} />
                   <span>Inverser les signes (+/-)</span>
                 </button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {importMode === 'TRANSACTIONS' ? (
                <>
                  <div className="space-y-6">
                    <MappingField label="Date d'opération" required options={headers} value={mapping.date} onChange={(v) => setMapping({...mapping, date: v})} />
                    <MappingField label="Description / Libellé" options={headers} value={mapping.description} onChange={(v) => setMapping({...mapping, description: v})} />
                    
                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                       <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center">
                         <Info size={12} className="mr-2" /> Configuration du Montant
                       </p>
                       <div className="grid grid-cols-1 gap-4">
                          <MappingField label="Colonne Montant (Unique)" options={headers} value={mapping.amount} onChange={(v) => setMapping({...mapping, amount: v, debit: '', credit: ''})} />
                          <div className="flex items-center justify-center text-xs font-black text-slate-300 py-1">OU (SI SÉPARÉ)</div>
                          <div className="grid grid-cols-2 gap-4">
                            <MappingField label="Débit (-)" options={headers} value={mapping.debit} onChange={(v) => setMapping({...mapping, debit: v, amount: ''})} />
                            <MappingField label="Crédit (+)" options={headers} value={mapping.credit} onChange={(v) => setMapping({...mapping, credit: v, amount: ''})} />
                          </div>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <MappingField label="Catégorie (Optionnel)" options={headers} value={mapping.category} onChange={(v) => setMapping({...mapping, category: v})} />
                    <MappingField label="Sous-catégorie" options={headers} value={mapping.subCategory} onChange={(v) => setMapping({...mapping, subCategory: v})} />
                    <MappingField label="Mode de paiement" options={headers} value={mapping.paymentMethod} onChange={(v) => setMapping({...mapping, paymentMethod: v})} />
                    <MappingField label="Rapprochement / Pointage" options={headers} value={mapping.reconciliation} onChange={(v) => setMapping({...mapping, reconciliation: v})} />
                    
                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Compte de destination :</label>
                      <div className="grid grid-cols-2 gap-3">
                        {accounts.map(acc => (
                          <button key={acc.id} onClick={() => setTargetAccountId(acc.id)} className={`px-4 py-3 rounded-xl font-black text-[9px] uppercase border-2 transition-all ${targetAccountId === acc.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100'}`}>
                            {acc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-6">
                    <MappingField label="Nom de la catégorie" required options={headers} value={catMapping.name} onChange={(v) => setCatMapping({...catMapping, name: v})} />
                    <MappingField label="Type (REVENUE/EXPENSE)" required options={headers} value={catMapping.type} onChange={(v) => setCatMapping({...catMapping, type: v})} />
                    <MappingField label="Icône" options={headers} value={catMapping.icon} onChange={(v) => setCatMapping({...catMapping, icon: v})} />
                  </div>
                  <div className="space-y-6">
                    <MappingField label="Couleur (HEX)" options={headers} value={catMapping.color} onChange={(v) => setCatMapping({...catMapping, color: v})} />
                    <MappingField label="Sous-catégories" options={headers} value={catMapping.subCategories} onChange={(v) => setCatMapping({...catMapping, subCategories: v})} />
                  </div>
                </>
              )}
            </div>

            <div className="pt-8 border-t border-slate-50 flex justify-end">
               <button 
                onClick={generatePreview}
                className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center"
               >
                 Vérifier avant Importation <ArrowRight size={16} className="ml-3" />
               </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-10 space-y-8 animate-in slide-in-from-right duration-300">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">3. Aperçu des données détectées</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{previewData.length} lignes à intégrer</p>
                </div>
                <div className="flex space-x-3">
                   <button onClick={() => setStep(2)} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Retour au mapping</button>
                   <button onClick={finalizeImport} className="px-10 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">Lancer l'importation</button>
                </div>
             </div>

             <div className="max-h-[500px] overflow-y-auto rounded-[2rem] border-2 border-slate-50 shadow-inner bg-slate-50/20">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-white text-slate-400 font-black uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      {importMode === 'TRANSACTIONS' ? (
                        <>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4 text-right">Montant</th>
                          <th className="px-6 py-4">Catégorie détectée</th>
                          <th className="px-6 py-4">Rapproch.</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4">Nom</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Icône</th>
                          <th className="px-6 py-4">Sous-Cat</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {previewData.map((item, idx) => {
                      const cat = categories.find(c => c.id === item.categoryId);
                      return (
                        <tr key={idx} className="hover:bg-white bg-transparent transition-colors group">
                           {importMode === 'TRANSACTIONS' ? (
                             <>
                                <td className="px-6 py-4 text-slate-400 font-bold">{item.date}</td>
                                <td className="px-6 py-4 font-bold text-slate-700 truncate max-w-[200px]">{item.description}</td>
                                <td className={`px-6 py-4 text-right font-black ${item.type === 'REVENUE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {item.type === 'REVENUE' ? `+${item.revenue.toFixed(2)}` : `-${item.expense.toFixed(2)}`}€
                                </td>
                                <td className="px-6 py-4">
                                  <div className={`inline-flex items-center px-3 py-1.5 rounded-xl font-black uppercase text-[9px] shadow-sm ${item.type === 'REVENUE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                     <span className="mr-2 text-base">{cat?.icon}</span> {cat?.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-black text-center text-slate-400">
                                   {item.reconciliation !== ReconciliationMarker.NONE ? (
                                      <span className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[8px]">{item.reconciliation === ReconciliationMarker.GREEN_CHECK ? '✅' : item.reconciliation}</span>
                                   ) : '-'}
                                </td>
                             </>
                           ) : (
                             <>
                                <td className="px-6 py-3 font-black text-slate-900">{item.name}</td>
                                <td className="px-6 py-3">
                                   <span className={`px-2 py-1 rounded-lg font-black uppercase text-[9px] ${item.type === 'REVENUE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      {item.type}
                                   </span>
                                </td>
                                <td className="px-6 py-3 text-xl">{item.icon}</td>
                                <td className="px-6 py-3 text-slate-400 font-medium truncate max-w-[200px]">{item.subCategories.join(', ') || '-'}</td>
                             </>
                           )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MappingField: React.FC<{ label: string, required?: boolean, value: string, onChange: (v: string) => void, options: string[] }> = ({ label, required, value, onChange, options }) => (
  <div className="space-y-1.5 animate-in fade-in duration-300">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex justify-between">
      <span>{label}</span>
      {required && <span className="text-rose-400 text-[8px] italic font-bold">Obligatoire</span>}
    </label>
    <select 
      className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none transition-all uppercase text-xs ${value ? 'border-blue-100 bg-white text-slate-900' : 'border-transparent text-slate-300 focus:border-blue-500 focus:text-slate-900'}`} 
      value={value} 
      onChange={e => onChange(e.target.value)}
    >
      <option value="">-- Choisir la colonne --</option>
      {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const StepIndicator: React.FC<{ num: number, label: string, active: boolean, current: boolean }> = ({ num, label, active, current }) => (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all ${current ? 'bg-white shadow-sm border border-slate-100' : 'opacity-60'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${current ? 'bg-blue-500 text-white shadow-lg' : active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
        {num}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest ${current ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </div>
);

export default ImportExcel;
