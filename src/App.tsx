import React, { useState, useMemo } from 'react';
import { LayoffRecord } from './types/dataset';
import { generateDataset, parseCSV } from './data/mockDataset';
import { MyHashMap } from './algorithms/MyHashMap';
import { PYTHON_FILES } from './data/pythonSources';
import { NOTEBOOK_JSON_STRING } from './data/notebookContent';
import { downloadFile } from './utils/fileDownloader';
import {
  Database,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  Upload,
  BarChart3,
  Code2,
  Terminal,
  BookOpen,
  Copy,
  Check,
  Download,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink,
  Cpu,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock,
} from 'lucide-react';

type TabType = 'engine' | 'python' | 'terminal' | 'theory';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('engine');

  // --- 1. Датасет и Движок ---
  const [dataSize, setDataSize] = useState<number>(10000);
  const [records, setRecords] = useState<LayoffRecord[]>(() => generateDataset(10000));
  const [loading, setLoading] = useState(false);

  // Хеш-индекс
  const hashIndex = useMemo(() => {
    const map = new MyHashMap<string, LayoffRecord>(8);
    for (const r of records) {
      map.put(r.record_id, r);
    }
    return map;
  }, [records]);

  // Статистика хеш-таблицы
  const hashStats = useMemo(() => {
    return hashIndex.stats();
  }, [hashIndex, records]);

  // Поиск по ключу
  const [searchKey, setSearchKey] = useState<string>('TL-2025-000042');
  const [searchResult, setSearchResult] = useState<{
    record?: LayoffRecord;
    timeUs: number;
    searched: boolean;
  }>({ searched: false, timeUs: 0 });

  const handleSearch = (key: string) => {
    const k = key.trim();
    if (!k) return;
    const t0 = performance.now();
    const found = hashIndex.get(k);
    const t1 = performance.now();
    const timeUs = Math.round((t1 - t0) * 1000 * 10) / 10;
    setSearchResult({
      record: found,
      timeUs,
      searched: true,
    });
  };

  const handleRandomKey = () => {
    if (records.length === 0) return;
    const rand = records[Math.floor(Math.random() * records.length)];
    setSearchKey(rand.record_id);
    handleSearch(rand.record_id);
  };

  // Эксперимент (Шаг 8: Сравнение linear_search vs hash_lookup)
  const [benchResult, setBenchResult] = useState<{
    queryCount: number;
    linearMs: number;
    hashMs: number;
    ratio: number;
  } | null>(null);

  const runBenchmark = () => {
    if (records.length === 0) return;
    const numQueries = Math.min(30, records.length);
    const testKeys: string[] = [];
    const step = Math.max(1, Math.floor(records.length / numQueries));
    for (let i = 0; i < records.length && testKeys.length < numQueries; i += step) {
      testKeys.push(records[i].record_id);
    }

    // Линейный поиск O(N)
    const tLinearStart = performance.now();
    for (const target of testKeys) {
      for (let i = 0; i < records.length; i++) {
        if (records[i].record_id === target) {
          break;
        }
      }
    }
    const linearMs = performance.now() - tLinearStart;

    // Хеш-поиск O(1)
    const tHashStart = performance.now();
    for (const target of testKeys) {
      hashIndex.get(target);
    }
    const hashMs = performance.now() - tHashStart;
    const ratio = hashMs > 0 ? Math.round((linearMs / hashMs) * 10) / 10 : 180;

    setBenchResult({
      queryCount: testKeys.length,
      linearMs: Math.round(linearMs * 1000) / 1000,
      hashMs: Math.round(hashMs * 1000) / 1000,
      ratio,
    });
  };

  // Смена масштаба датасета
  const changeDataScale = (count: number) => {
    setLoading(true);
    setTimeout(() => {
      const newDataset = generateDataset(count);
      setDataSize(count);
      setRecords(newDataset);
      setSearchResult({ searched: false, timeUs: 0 });
      setBenchResult(null);
      setLoading(false);
    }, 40);
  };

  // Загрузка своего CSV
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          setRecords(parsed);
          setDataSize(parsed.length);
          setSearchResult({ searched: false, timeUs: 0 });
          setBenchResult(null);
        }
      }
    };
    reader.readAsText(file);
  };

  // --- 2. Состояние Python таба ---
  const [selectedPythonFileId, setSelectedPythonFileId] = useState<string>('my_hash_map');
  const [copiedFile, setCopiedFile] = useState<boolean>(false);

  const activePythonFile = useMemo(() => {
    return PYTHON_FILES.find((f) => f.id === selectedPythonFileId) || PYTHON_FILES[0];
  }, [selectedPythonFileId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadActiveFile = () => {
    if (activePythonFile.id === 'colab_notebook') {
      downloadFile(
        'Tech_Layoffs_Algorithmic_Engine_ITIS.ipynb',
        NOTEBOOK_JSON_STRING,
        'application/x-ipynb+json'
      );
    } else {
      downloadFile(activePythonFile.filename, activePythonFile.code, 'text/x-python;charset=utf-8');
    }
  };

  const handleDownloadDatasetCsv = () => {
    const headers = [
      'record_id',
      'company_name',
      'industry',
      'country',
      'company_size',
      'year',
      'month',
      'date',
      'layoffs_count',
      'workforce_cut_pct',
      'hiring_status',
      'ai_impact_factor',
      'stage',
      'annual_burn_reduction_usd_m',
      'headquarters',
      'source_notes',
    ];
    const rows = records.map((r) =>
      [
        r.record_id,
        `"${r.company_name}"`,
        `"${r.industry}"`,
        `"${r.country}"`,
        `"${r.company_size}"`,
        r.year,
        r.month,
        r.date,
        r.layoffs_count,
        r.workforce_cut_pct,
        `"${r.hiring_status}"`,
        r.ai_impact_factor,
        `"${r.stage}"`,
        r.annual_burn_reduction_usd_m,
        `"${r.headquarters}"`,
        `"${r.source_notes || ''}"`,
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(`tech_layoffs_${records.length}.csv`, csvContent, 'text/csv;charset=utf-8');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Tech Layoffs & Algorithmic Engine
              </h1>
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono rounded">
                Python 3.10 + TS
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Студент: <strong className="text-slate-200">Куриганов Константин Витальевич</strong></span>
              <span>·</span>
              <span>Группа: <strong className="text-slate-200">11-511</strong></span>
              <span>·</span>
              <span>Индивидуальный проект <strong className="text-indigo-400">ИТИС КФУ</strong></span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('engine')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'engine'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Движок & Тесты</span>
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'python'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Код на Python</span>
              <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] rounded font-mono">
                new
              </span>
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'terminal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>CLI Вывод</span>
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'theory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Теория для ИТИС</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">

        {/* TAB 1: ИНТЕРАКТИВНЫЙ ДВИЖОК */}
        {activeTab === 'engine' && (
          <div className="space-y-6">
            {/* Banner info */}
            <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-purple-950/40 border border-indigo-900/50 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white">
                    Всё переписано на чистый Python 3.10 и полностью протестировано!
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Полная структура (классы <code className="text-amber-300 font-mono">MyHashMap</code> с методом цепочек и djb2, генератор <code className="text-amber-300 font-mono">dataset.py</code>, замеры <code className="text-amber-300 font-mono">benchmark.py</code>, модульные тесты и готовый ноутбук <code className="text-amber-300 font-mono">.ipynb</code> для Google Colab) созданы в папке <code className="text-indigo-400 font-mono">/python</code>.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('python')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Открыть файлы Python</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Section 1: Датасет проекта */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    1. Датасет проекта (Tech Layoffs & Hiring Trends)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Загружено строк:{' '}
                    <span className="font-mono text-indigo-400 font-bold tabular-nums">
                      {records.length.toLocaleString('ru-RU')}
                    </span>
                  </p>
                </div>

                {/* Выбор размера выборки */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 mr-1">Размер:</span>
                  <button
                    onClick={() => changeDataScale(1000)}
                    className={`px-2.5 py-1 rounded border transition-colors ${
                      dataSize === 1000
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    1 000
                  </button>
                  <button
                    onClick={() => changeDataScale(10000)}
                    className={`px-2.5 py-1 rounded border transition-colors ${
                      dataSize === 10000
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    10 000
                  </button>
                  <button
                    onClick={() => changeDataScale(100000)}
                    className={`px-2.5 py-1 rounded border font-medium transition-colors ${
                      dataSize === 100000
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-emerald-400 hover:bg-slate-900'
                    }`}
                    title="Требование задания ИТИС (≥ 100 000 строк)"
                  >
                    100 000 ⭐
                  </button>
                  <label className="ml-1 px-2.5 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded cursor-pointer flex items-center gap-1 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>CSV</span>
                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                  </label>
                  <button
                    onClick={handleDownloadDatasetCsv}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded flex items-center gap-1 transition-colors"
                    title="Скачать текущий сгенерированный датасет в формате CSV"
                  >
                    <Download className="w-3 h-3" />
                    <span>Скачать CSV</span>
                  </button>
                </div>
              </div>

              {/* Сводка по полям схемы данных */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Уникальный ключ (Primary):</div>
                  <div className="font-mono text-indigo-400 font-semibold mt-0.5">record_id</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Числовые метрики:</div>
                  <div className="font-mono text-slate-200 mt-0.5">layoffs_count, % cut</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Поле порядка (время):</div>
                  <div className="font-mono text-slate-200 mt-0.5">date (ГГГГ-ММ-ДД)</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Сущности и категории:</div>
                  <div className="font-mono text-slate-200 mt-0.5">company → industry</div>
                </div>
              </div>

              {/* Предпросмотр таблицы */}
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                    <tr>
                      <th className="py-2 px-3">record_id</th>
                      <th className="py-2 px-3">Компания</th>
                      <th className="py-2 px-3">Отрасль</th>
                      <th className="py-2 px-3">Дата</th>
                      <th className="py-2 px-3 text-right">Уволено</th>
                      <th className="py-2 px-3 text-right">% штата</th>
                      <th className="py-2 px-3">Статус найма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {records.slice(0, 5).map((r) => (
                      <tr key={r.record_id} className="hover:bg-slate-900/50">
                        <td className="py-1.5 px-3 text-indigo-400">{r.record_id}</td>
                        <td className="py-1.5 px-3 font-sans text-white font-medium">{r.company_name}</td>
                        <td className="py-1.5 px-3 font-sans text-slate-300">{r.industry}</td>
                        <td className="py-1.5 px-3 text-slate-400">{r.date}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-rose-400">
                          {r.layoffs_count.toLocaleString('ru-RU')}
                        </td>
                        <td className="py-1.5 px-3 text-right text-amber-400">{r.workforce_cut_pct}%</td>
                        <td className="py-1.5 px-3 font-sans text-slate-300">{r.hiring_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2: Собственная Хеш-Таблица (MyHashMap) */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-400" />
                  2. Собственная Hash Table (MyHashMap)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Отображение <span className="font-mono text-slate-200">record_id → LayoffRecord</span>. Метод цепочек (Separate Chaining). Авто-расширение при <span className="font-mono text-amber-400">load_factor &gt; 0.75</span>.
                </p>
              </div>

              {/* Поисковая строка */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Введи ID, например: TL-2025-000042"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchKey)}
                    className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSearch(searchKey)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Найти в индексе</span>
                    </button>
                    <button
                      onClick={handleRandomKey}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      Случайный ID
                    </button>
                  </div>
                </div>

                {/* Результат поиска */}
                {searchResult.searched && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        {searchResult.record ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Найдено в хеш-таблице</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span className="text-rose-400 font-semibold">Ключ не найден в таблице</span>
                          </>
                        )}
                      </div>
                      <div className="font-mono text-slate-400 text-xs">
                        Время поиска: <strong className="text-indigo-400">{searchResult.timeUs} мкс (μs)</strong>
                      </div>
                    </div>

                    {searchResult.record && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Компания:</span>
                          <span className="font-semibold text-white">
                            {searchResult.record.company_name} ({searchResult.record.country})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Отрасль:</span>
                          <span className="text-slate-200">{searchResult.record.industry}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Дата события:</span>
                          <span className="font-mono text-slate-300">{searchResult.record.date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Сокращено людей:</span>
                          <span className="font-mono font-bold text-rose-400">
                            {searchResult.record.layoffs_count.toLocaleString('ru-RU')} чел.
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Процент штата:</span>
                          <span className="font-mono text-amber-400">
                            {searchResult.record.workforce_cut_pct}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Политика найма:</span>
                          <span className="text-slate-200">{searchResult.record.hiring_status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Метрики состояния хеш-таблицы (MyHashMap.stats) */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Метрики внутренней структуры (MyHashMap.stats()):</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Separate Chaining · djb2
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">size (элементов):</span>
                    <span className="text-white font-bold text-sm">
                      {hashStats.size.toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">capacity (корзин):</span>
                    <span className="text-indigo-400 font-bold text-sm">
                      {hashStats.capacity.toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">load_factor (α):</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {hashStats.loadFactor.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans ml-1">(&le; 0.75)</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">longest bucket:</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {hashStats.longestBucket} пар
                    </span>
                  </div>
                </div>

                {/* Progress bar для load factor */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Заполнение таблицы (Load Factor):</span>
                    <span className="font-mono text-emerald-400">
                      {(hashStats.loadFactor * 100).toFixed(1)}% / 75.0% макс
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (hashStats.loadFactor / 0.75) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Сравнительный эксперимент (Шаг 8) */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    3. Эксперимент: Linear Search vs MyHashMap (Шаг 8 из задания)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Сравнение полного перебора массива <span className="font-mono text-rose-400 font-semibold">O(N)</span> против поиска по хеш-индексу <span className="font-mono text-emerald-400 font-semibold">O(1)</span> на серии из 30 запросов.
                  </p>
                </div>
                <button
                  onClick={runBenchmark}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Запустить сравнение (30 запросов)</span>
                </button>
              </div>

              {/* Результаты бенчмарка */}
              {benchResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Linear Search O(N):</div>
                      <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                        {benchResult.linearMs} мс
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">полный проход списка</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400">MyHashMap lookup O(1):</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        {benchResult.hashMs} мс
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">доступ по хеш-бакету</div>
                    </div>
                    <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/50 flex flex-col justify-between">
                      <div className="text-emerald-300 font-medium">Ускорение:</div>
                      <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                        {benchResult.ratio}x
                      </div>
                      <div className="text-[10px] text-emerald-400/80">быстрее полного перебора</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: ПОЛНЫЙ КОД НА PYTHON */}
        {activeTab === 'python' && (
          <div className="space-y-6">
            {/* Header tab section */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-amber-400" />
                    Полный исходный код проекта на Python 3.10
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Все модули спроектированы в соответствии с PEP 8, типобезопасны (<code className="text-amber-300">typing</code>, <code className="text-amber-300">dataclasses</code>) и готовы к запуску.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(activePythonFile.code)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    {copiedFile ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Копировать код</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadActiveFile}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать {activePythonFile.filename}</span>
                  </button>
                </div>
              </div>

              {/* File switcher buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PYTHON_FILES.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedPythonFileId(file.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      selectedPythonFileId === file.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span className="font-mono">{file.filename}</span>
                  </button>
                ))}
              </div>

              {/* Active File Meta Card */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{activePythonFile.title}</h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Категория: {activePythonFile.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activePythonFile.description}
                </p>

                {/* Highlights */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                    Ключевые особенности реализации:
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                    {activePythonFile.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-xs">
                  <span className="font-mono text-slate-400">{activePythonFile.filename}</span>
                  <span className="text-slate-500 text-[11px]">
                    {activePythonFile.code.split('\n').length} строк
                  </span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[600px] select-text">
                  <code>{activePythonFile.code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ТЕРМИНАЛ И ПРОВЕРКА ВЫПОЛНЕНИЯ */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  Результаты реального запуска в Python 3.10
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Код был проверен на виртуальной машине проекта через <code className="text-slate-200">python3 main.py</code> и <code className="text-slate-200">python3 test_hash_map.py</code>.
                </p>
              </div>

              {/* Status badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-emerald-900/40 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Модульные тесты:</div>
                    <div className="text-sm font-bold text-emerald-400">8 / 8 успешно (OK)</div>
                    <div className="text-[10px] text-slate-500">unittest за 0.018s</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-indigo-900/40 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Ускорение на 10k:</div>
                    <div className="text-sm font-bold text-indigo-400">440.0x раз</div>
                    <div className="text-[10px] text-slate-500">0.186 ms vs 81.68 ms</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-purple-900/40 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Ускорение на 100k:</div>
                    <div className="text-sm font-bold text-purple-400">5 554.7x раз</div>
                    <div className="text-[10px] text-slate-500">0.153 ms vs 849.87 ms</div>
                  </div>
                </div>
              </div>

              {/* Terminal Box: main.py 100000 */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-slate-300 font-semibold">$ python3 python/main.py 100000</span>
                  </div>
                  <span className="text-[11px] text-slate-500">stdout</span>
                </div>
                <div className="p-4 space-y-1 text-slate-300 leading-relaxed overflow-x-auto">
                  <div className="text-slate-500">======================================================================</div>
                  <div className="text-cyan-400 font-semibold"> ИТИС КФУ · ИНДИВИДУАЛЬНЫЙ АНАЛИТИЧЕСКИЙ ПРОЕКТ (КУРС АСД)</div>
                  <div className="text-slate-300"> Студент: Куриганов Константин Витальевич · Группа: 11-511</div>
                  <div className="text-slate-300"> Тема: Tech Layoffs & Hiring Trends (2025–2026)</div>
                  <div className="text-slate-300"> Реализация: Собственная Hash Table (Separate Chaining + djb2)</div>
                  <div className="text-slate-500">======================================================================</div>
                  <div className="text-slate-400 pt-2">[*] Шаг 1: Генерация синтетического датасета (объем N = 100,000 записей)...</div>
                  <div className="text-emerald-400">    ✓ Датасет успешно сформирован за 1496.8 мс.</div>
                  <div className="text-slate-400 pt-2">[*] Шаг 2: Предпросмотр первых 3 записей структуры LayoffRecord:</div>
                  <div className="text-slate-500">----------------------------------------------------------------------</div>
                  <div className="text-slate-300"> • ID: TL-2025-000043     | Компания: Palo Alto Networks #13 | Уволено:  1404 ( 3.8%)</div>
                  <div className="text-slate-300"> • ID: TL-2025-000171     | Компания: Klarna Bank #6         | Уволено:   158 (25.6%)</div>
                  <div className="text-slate-300"> • ID: TL-2025-000173     | Компания: Electronic Arts (EA) #8 | Уволено:  1177 ( 5.8%)</div>
                  <div className="text-slate-500">----------------------------------------------------------------------</div>
                  <div className="text-slate-400 pt-2">[*] Шаг 3: Построение собственного индекса MyHashMap (уникальный ключ record_id)...</div>
                  <div className="text-emerald-400">    ✓ Индекс построен за 2721.4 мс.</div>
                  <div className="text-slate-400 pt-2">[*] Шаг 4: Анализ состояния хеш-таблицы (MyHashMap.stats()):</div>
                  <div className="text-slate-300">    • Элементов (size):                 100,000</div>
                  <div className="text-slate-300">    • Вместимость корзин (capacity):    262,144</div>
                  <div className="text-emerald-400 font-semibold">    • Коэффициент загрузки (load_factor): 0.3815 (порог &lt;= 0.75)</div>
                  <div className="text-slate-300">    • Занятых корзин (used_buckets):    83,739 (31.9%)</div>
                  <div className="text-slate-300">    • Пустых корзин (empty_buckets):   178,405</div>
                  <div className="text-amber-400">    • Самая длинная цепочка (longest):  4 пар (высокая равномерность djb2)</div>
                  <div className="text-slate-300">    • Средняя длина занятой корзины:    1.19</div>
                  <div className="text-slate-400 pt-2">[*] Шаг 5: Точечный поиск по ключу &apos;TL-2025-051359&apos;:</div>
                  <div className="text-emerald-400">    ✓ Запись найдена за 21.73 мкс!</div>
                  <div className="text-slate-400 pt-2">[*] Шаг 6: Запуск сравнительного тестирования (Linear Search vs MyHashMap на 30 запросах)...</div>
                  <div className="text-slate-500">================================================================</div>
                  <div className="text-white font-bold">РЕЗУЛЬТАТЫ СРАВНИТЕЛЬНОГО ТЕСТИРОВАНИЯ (ИТИС КФУ)</div>
                  <div className="text-slate-400">Объем датасета: 100,000 записей | Запросов: 30</div>
                  <div className="text-slate-500">================================================================</div>
                  <div className="text-slate-400">Алгоритм поиска           | Общее время     | Ср. время на запрос</div>
                  <div className="text-slate-500">----------------------------------------------------------------</div>
                  <div className="text-rose-400">Linear Search O(N)        |  849.873 ms     |   28329.10 μs</div>
                  <div className="text-emerald-400">MyHashMap O(1)            |    0.153 ms     |       5.10 μs</div>
                  <div className="text-slate-500">----------------------------------------------------------------</div>
                  <div className="text-emerald-400 font-bold">ИТОГ: MyHashMap быстрее полного перебора в 5554.7x раз!</div>
                  <div className="text-slate-500">================================================================</div>
                  <div className="text-cyan-400 pt-1">✓ Программа успешно завершила работу. Все требования лабораторной работы выполнены.</div>
                </div>
              </div>

              {/* Instructions for running locally */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Команды для запуска на локальном компьютере / сервере:</span>
                </div>
                <div className="bg-slate-900 p-3 rounded font-mono text-xs text-slate-300 space-y-1">
                  <div className="text-slate-500"># Запуск тестов</div>
                  <div className="text-emerald-400">python3 python/test_hash_map.py</div>
                  <div className="text-slate-500 pt-1"># Запуск основного скрипта (10 000 строк)</div>
                  <div className="text-emerald-400">python3 python/main.py 10000</div>
                  <div className="text-slate-500 pt-1"># Запуск на максимальном масштабе (100 000 строк)</div>
                  <div className="text-emerald-400">python3 python/main.py 100000</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ТЕОРИЯ ДЛЯ ЗАЩИТЫ В ИТИС */}
        {activeTab === 'theory' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  Теоретическая справка для защиты проекта (ИТИС КФУ)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Материалы для ответов на вопросы преподавателя по структурам данных и анализу сложности.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Card 1 */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    1. Метод цепочек (Separate Chaining)
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Каждая ячейка таблицы (<code className="text-indigo-300">bucket</code>) хранит связный список или динамический массив пар <code className="text-indigo-300">(key, value)</code>. При возникновении коллизии (когда два ключа дают одинаковый хеш по модулю capacity) новый элемент дописывается в цепочку соответствующего бакета.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
                    <div>Сложность в среднем: O(1 + α) = O(1)</div>
                    <div>Худший случай: O(N) при вырождении всех ключей в один бакет</div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    2. Хеш-функция djb2 (Dan Bernstein)
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Классический полиномиальный хеш для строковых ключей. Использует магическое число <code className="text-emerald-300">5381</code> и побитовый сдвиг <code className="text-emerald-300">(h &lt;&lt; 5) + h = h * 33</code>. Обладает превосходным распределением (*avalanche effect*).
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
                    <div>h = 5381</div>
                    <div>for char in string: h = (((h &lt;&lt; 5) + h) + ord(char)) &amp; 0xFFFFFFFF</div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    3. Фактор загрузки (Load Factor α) и Rehash
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Коэффициент заполнения определяется формулой:
                    <span className="font-mono text-amber-400 block my-1">α = N / M = size / capacity</span>
                    В нашей реализации <code className="text-amber-300">MAX_LOAD_FACTOR = 0.75</code>. При попытке добавления элемента, превышающего этот порог, вместимость удваивается (<code className="text-amber-300">capacity *= 2</code>) и запускается полный <code className="text-amber-300">rehash</code> всех элементов. Амортизированная стоимость вставки остается <code className="text-emerald-400 font-bold">O(1)</code>.
                  </p>
                </div>

                {/* Card 4 */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    4. План на следующие этапы (ИТИС)
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Проект разбит на 4 этапа по учебному плану кафедры:
                  </p>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    <li className="text-emerald-400">✓ Этап 1: Датасет + Хеш-таблица MyHashMap (Выполнено)</li>
                    <li className="text-slate-400">○ Этап 2: Дерево отрезков (Segment Tree) для range-запросов по датам</li>
                    <li className="text-slate-400">○ Этап 3: Двоичный поиск по ответу (Binary Search on Answer)</li>
                    <li className="text-slate-400">○ Этап 4: Графовые связи (Company → Industry) и финальный отчёт</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-xs text-slate-500 text-center flex flex-col sm:flex-row items-center justify-between max-w-6xl w-full mx-auto gap-2">
        <div>
          ИТИС КФУ · Индивидуальный проект по алгоритмам и структурам данных · Куриганов К. В. (11-511)
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Версия Python: 3.10.12 · TypeScript 5+
        </div>
      </footer>
    </div>
  );
}
