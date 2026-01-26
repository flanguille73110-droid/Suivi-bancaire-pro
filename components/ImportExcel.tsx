
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
  
  const [mapping, setMapping] = useState<Record<string, string>>({
    date: '', description: '', amount: '', category: '', subCategory: '', paymentMethod: ''
  });

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
          <p className="text-slate-500 font-medium">Choisissez le type d'import</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button onClick={() => setImportMode('TRANSACTIONS')} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center">
            <h3 className="text-2xl font-black text-slate-900 uppercase">Transactions</h3>
          </button>
          <button onClick={() => setImportMode('CATEGORIES')} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center">
            <h3 className="text-2xl font-black text-slate-900 uppercase">Catégories</h3>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={reset} className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <ArrowLeft size={16} className="mr-2" /> Retour
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden p-8">
        {step === 1 && (
          <div className="flex flex-col items-center space-y-6">
              <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-blue-500 text-white rounded-2xl font-black">
                Choisir un fichier
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <button onClick={generatePreview} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black">
              Prévisualiser
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <button onClick={finalizeImport} className="px-12 py-5 bg-emerald-500 text-white rounded-2xl font-black">
              Confirmer l'import
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const MappingField: React.FC<{ label: string, required?: boolean, value: string, onChange: (v: string) => void, options: string[] }> = ({ label, required, value, onChange, options }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex justify-between">
      <span>{label}</span>
      {required && <span className="text-rose-400">Obligatoire</span>}
    </label>
    <select className="w-full px-5 py-3.5 bg-slate-50 border-2 rounded-xl" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-- Choisir --</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const StepIndicator: React.FC<{ num: number, label: string, active: boolean, current: boolean }> = ({ num, label, active, current }) => (
    <div className={`flex items-center space-x-2 ${active ? 'text-slate-900' : 'text-slate-300'}`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${current ? 'bg-blue-500 text-white' : active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
        {num}
      </div>
    </div>
);

export default ImportExcel;
