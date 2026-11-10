"""
Главная точка входа: Индивидуальный аналитический проект (ИТИС КФУ)
Тема: Tech Layoffs & Hiring Trends — Аналитический движок и собственная Hash Table
Студент: Куриганов Константин Витальевич (Группа 11-511)
"""

import sys
import time
from dataset import generate_dataset, export_csv
from my_hash_map import MyHashMap
from benchmark import run_benchmark, format_benchmark_table


def main():
    print("=" * 70)
    print(" ИТИС КФУ · ИНДИВИДУАЛЬНЫЙ АНАЛИТИЧЕСКИЙ ПРОЕКТ (КУРС АСД)")
    print(" Студент: Куриганов Константин Витальевич · Группа: 11-511")
    print(" Тема: Tech Layoffs & Hiring Trends (2025–2026)")
    print(" Реализация: Собственная Hash Table (Separate Chaining + djb2)")
    print("=" * 70)
    print()

    # Шаг 1: Генерация выборки данных
    dataset_size = 10000
    if len(sys.argv) > 1:
        try:
            dataset_size = int(sys.argv[1])
        except ValueError:
            pass

    print(f"[*] Шаг 1: Генерация синтетического датасета (объем N = {dataset_size:,} записей)...")
    t0 = time.perf_counter()
    records = generate_dataset(dataset_size, seed=2026)
    t1 = time.perf_counter()
    print(f"    ✓ Датасет успешно сформирован за {(t1 - t0)*1000:.1f} мс.")
    print()

    # Шаг 2: Первые несколько записей
    print("[*] Шаг 2: Предпросмотр первых 3 записей структуры LayoffRecord:")
    print("-" * 70)
    for r in records[:3]:
        print(f" • ID: {r.record_id:<18} | Компания: {r.company_name:<22} | Уволено: {r.layoffs_count:>5} ({r.workforce_cut_pct:>4.1f}%)")
        print(f"   Отрасль: {r.industry} | Дата: {r.date} | Статус найма: {r.hiring_status}")
    print("-" * 70)
    print()

    # Шаг 3: Построение индекса MyHashMap
    print("[*] Шаг 3: Построение собственного индекса MyHashMap (уникальный ключ record_id)...")
    hmap = MyHashMap(initial_capacity=8)
    t0 = time.perf_counter()
    for r in records:
        hmap.put(r.record_id, r)
    t1 = time.perf_counter()
    print(f"    ✓ Индекс построен за {(t1 - t0)*1000:.1f} мс.")
    print()

    # Шаг 4: Вывод статистики хеш-таблицы
    stats = hmap.stats()
    print("[*] Шаг 4: Анализ состояния хеш-таблицы (MyHashMap.stats()):")
    print(f"    • Элементов (size):                 {stats.size:,}")
    print(f"    • Вместимость корзин (capacity):    {stats.capacity:,}")
    print(f"    • Коэффициент загрузки (load_factor): {stats.load_factor:.4f} (порог <= 0.75)")
    print(f"    • Занятых корзин (used_buckets):    {stats.used_buckets:,} ({(stats.used_buckets/stats.capacity)*100:.1f}%)")
    print(f"    • Пустых корзин (empty_buckets):   {stats.empty_buckets:,}")
    print(f"    • Самая длинная цепочка (longest):  {stats.longest_bucket} пар")
    print(f"    • Средняя длина занятой корзины:    {stats.avg_bucket_length:.2f}")
    print()

    # Шаг 5: Проверка точечного поиска
    test_id = records[len(records) // 2].record_id
    print(f"[*] Шаг 5: Точечный поиск по ключу '{test_id}':")
    t0 = time.perf_counter_ns()
    found = hmap.get(test_id)
    t1 = time.perf_counter_ns()
    if found:
        print(f"    ✓ Запись найдена за {(t1 - t0)/1000:.2f} мкс!")
        print(f"      Компания: {found.company_name}, Отрасль: {found.industry}, Сокращение: {found.layoffs_count} чел.")
    else:
        print("    ✗ Запись не найдена.")
    print()

    # Шаг 6: Запуск сравнительного бенчмарка (Шаг 8 из задания)
    print("[*] Шаг 6: Запуск сравнительного тестирования (Linear Search vs MyHashMap на 30 запросах)...")
    bench = run_benchmark(records, hmap, num_queries=30)
    print()
    print(format_benchmark_table(bench))
    print()
    print("✓ Программа успешно завершила работу. Все требования лабораторной работы выполнены.")


if __name__ == "__main__":
    main()
