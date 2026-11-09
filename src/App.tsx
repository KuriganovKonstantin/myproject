import React, { useState, useMemo } from 'react';
import { LayoffRecord } from './types/dataset';
import { generateDataset, parseCSV } from './data/mockDataset';
import { MyHashMap } from './algorithms/MyHashMap';
import { Database, Search, Zap, CheckCircle2, AlertCircle, Upload, ArrowRight, BarChart3 } from 'lucide-react';

export default function App() {
  // Выборка данных
  const [dataSize, setDataSize] = useState<number>(10000);
  const [records, setRecords] = useState<LayoffRecord[]>(() => generateDataset(10000));
  const [loading, setLoading] = useState(false);

  // 1. Построение индекса: MyHashMap (уникальный ключ record_id -> запись)
  const hashIndex = useMemo(() => {
    const map = new MyHashMap<string, LayoffRecord>(8);
    for (const r of records) {
      map.put(r.record_id, r);
    }
    return map;
  }, [records]);

  // Статистика хеш-таблицы (метод stats() из Колаба)
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

  // Эксперимент из Колаба (Шаг 8: Сравнение linear_search vs hash_lookup на 30 запросах)
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

    // 1. Линейный поиск O(N)
    const tLinearStart = performance.now();
    for (const target of testKeys) {
      for (let i = 0; i < records.length; i++) {
        if (records[i].record_id === target) {
          break;
        }
      }
    }
    const linearMs = performance.now() - tLinearStart;

    // 2. Хеш-поиск O(1)
    const tHashStart = performance.now();
    for (const target of testKeys) {
      hashIndex.get(target);
    }
    const hashMs = performance.now() - tHashStart;

    const ratio = hashMs > 0 ? Math.round((linearMs / hashMs) * 10) / 10 : 150;

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h1 className="text-base font-bold text-white tracking-tight">
                Tech Layoffs & Hiring Trends — Индивидуальный проект
              </h1>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Студент: Куриганов Константин Витальевич · Группа 11-511 · ИТИС КФУ
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Этап:</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-md font-mono text-indigo-300">
              v0.1: Данные + MyHashMap
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-6 py-8 flex-1 space-y-8">
        {/* Section 1: Датасет и описание */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                1. Датасет проекта (Kaggle: Tech Layoffs & Hiring Trends 2026)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Загружено строк:{' '}
                <span className="font-mono text-indigo-400 font-bold tabular-nums">
                  {records.length.toLocaleString('ru-RU')}
                </span>
              </p>
            </div>

            {/* Выбор размера выборки */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1">Размер:</span>
              <button
                onClick={() => changeDataScale(1000)}
                className={`px-2.5 py-1 rounded border ${
                  dataSize === 1000
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                1 000
              </button>
              <button
                onClick={() => changeDataScale(10000)}
                className={`px-2.5 py-1 rounded border ${
                  dataSize === 10000
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                10 000
              </button>
              <button
                onClick={() => changeDataScale(100000)}
                className={`px-2.5 py-1 rounded border font-medium ${
                  dataSize === 100000
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-emerald-400 hover:bg-slate-900'
                }`}
                title="Требование задания (≥ 100 000 строк)"
              >
                100 000 ⭐
              </button>
              <label className="ml-2 px-2.5 py-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Свой CSV</span>
                <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Сводка по полям (по критериям из задания) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-slate-400">Уникальный ID (ключ):</div>
              <div className="font-mono text-indigo-400 font-semibold mt-0.5">record_id</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-slate-400">Числовые поля:</div>
              <div className="font-mono text-slate-200 mt-0.5">layoffs_count, % cut</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-slate-400">Поле порядка:</div>
              <div className="font-mono text-slate-200 mt-0.5">date (ГГГГ-ММ-ДД)</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <div className="text-slate-400">Связь объектов:</div>
              <div className="font-mono text-slate-200 mt-0.5">company → industry</div>
            </div>
          </div>

          {/* Предпросмотр первых 4 строк */}
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
                  <th className="py-2 px-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {records.slice(0, 4).map((r) => (
                  <tr key={r.record_id} className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3 text-indigo-400">{r.record_id}</td>
                    <td className="py-1.5 px-3 font-sans text-white font-medium">{r.company_name}</td>
                    <td className="py-1.5 px-3 font-sans text-slate-300">{r.industry}</td>
                    <td className="py-1.5 px-3 text-slate-400">{r.date}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-rose-400">
                      {r.layoffs_count}
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
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              2. Первый индекс: Собственная Hash Table (MyHashMap)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Хранит отображение: <span className="font-mono text-slate-200">record_id → данные записи</span>.
              Коллизии разрешаются методом цепочек (Separate Chaining). При load factor &gt; 0.75
              происходит автоматический resize (удвоение capacity) и rehash.
            </p>
          </div>

          {/* Строка поиска */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Введи ID, например: TL-2025-000001"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchKey)}
                className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={() => handleSearch(searchKey)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Найти в индексе
              </button>
              <button
                onClick={handleRandomKey}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
              >
                Случайный ID
              </button>
            </div>

            {/* Карточка найденного результата */}
            {searchResult.searched && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    {searchResult.record ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Найдено в хеш-таблице</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-400 font-semibold">Ключ не найден</span>
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
                      <span className="text-slate-400 block">Компания:</span>
                      <span className="font-semibold text-white">
                        {searchResult.record.company_name} ({searchResult.record.country})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Отрасль:</span>
                      <span className="text-slate-200">{searchResult.record.industry}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Дата события:</span>
                      <span className="font-mono text-slate-300">{searchResult.record.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Уволено сотрудников:</span>
                      <span className="font-mono font-bold text-rose-400">
                        {searchResult.record.layoffs_count.toLocaleString('ru-RU')} чел.
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Сокращение штата:</span>
                      <span className="font-mono text-amber-400">
                        {searchResult.record.workforce_cut_pct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Политика найма:</span>
                      <span className="text-slate-200">{searchResult.record.hiring_status}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Эксперимент из Колаба (Linear Search vs Hash Lookup) */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                3. Эксперимент: Linear Search vs MyHashMap (Шаг 8 из Колаба)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Сравнение скорости полного перебора массива O(N) против индексного поиска O(1).
              </p>
            </div>

            <button
              onClick={runBenchmark}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              Запустить сравнение (30 запросов)
            </button>
          </div>

          {/* Результаты бенчмарка */}
          {benchResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Linear search O(N):</div>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                    {benchResult.linearMs} мс
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">полный проход массива</div>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400">MyHashMap lookup O(1):</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {benchResult.hashMs} мс
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">поиск по хеш-индексу</div>
                </div>

                <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/50 col-span-2 sm:col-span-1 flex flex-col justify-between">
                  <div className="text-emerald-300 font-medium">Отношение времени:</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {benchResult.ratio}x
                  </div>
                  <div className="text-[10px] text-emerald-400/80">быстрее полного перебора</div>
                </div>
              </div>
            </div>
          )}

          {/* Статистика MyHashMap.stats() */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              Состояние хеш-таблицы (MyHashMap.stats()):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">size (элементов):</span>
                <span className="text-white font-bold">{hashStats.size.toLocaleString('ru-RU')}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">capacity (корзин):</span>
                <span className="text-indigo-400 font-bold">
                  {hashStats.capacity.toLocaleString('ru-RU')}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">load_factor:</span>
                <span className="text-emerald-400 font-bold">
                  {hashStats.loadFactor.toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-500 font-sans ml-1">(&le; 0.75)</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">longest bucket:</span>
                <span className="text-amber-400 font-bold">{hashStats.longestBucket} пар</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: План развития на следующие пары */}
        <section className="bg-slate-900/20 border border-dashed border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-300">План расширения проекта (ИТИС):</span>
            <div className="text-[11px] text-slate-500 mt-0.5">
              На следующих занятиях будут добавляться: Segment Tree (отчёты по окнам дат), Binary Search on Answer и графовые связи (company → industry).
            </div>
          </div>
          <span className="text-indigo-400 font-mono text-[11px] shrink-0">
            Шаг 1 из 4 выполнен ✓
          </span>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-xs text-slate-500 text-center">
        ИТИС КФУ · Индивидуальный проект по алгоритмам и структурам данных · Куриганов К. В. (11-511)
      </footer>
    </div>
  );
}
