"""
Бенчмарк: Сравнение скорости Линейного поиска O(N) и Хеш-таблицы MyHashMap O(1)
Шаг 8 аналитического проекта (ИТИС КФУ)
Автор: Куриганов Константин Витальевич (группа 11-511)
"""

import time
from typing import List, Optional, Tuple, Dict, Any
from dataset import LayoffRecord
from my_hash_map import MyHashMap


def linear_search(records: List[LayoffRecord], target_id: str) -> Optional[LayoffRecord]:
    """Линейный поиск O(N): последовательный перебор списка элементов."""
    for record in records:
        if record.record_id == target_id:
            return record
    return None


def run_benchmark(
    records: List[LayoffRecord],
    hash_map: MyHashMap[str, LayoffRecord],
    num_queries: int = 30
) -> Dict[str, Any]:
    """
    Проводит сравнительное тестирование времени поиска.
    Выбирает равномерно распределенные ключи по всему объёму датасета.
    """
    if not records:
        raise ValueError("Датасет пуст!")

    actual_queries = min(num_queries, len(records))
    step = max(1, len(records) // actual_queries)
    test_keys = [records[i].record_id for i in range(0, len(records), step)][:actual_queries]

    # 1. Замер времени для Линейного поиска O(N)
    t0_linear = time.perf_counter_ns()
    for key in test_keys:
        linear_search(records, key)
    t1_linear = time.perf_counter_ns()
    linear_ns_total = t1_linear - t0_linear
    linear_ms = linear_ns_total / 1_000_000.0
    linear_avg_us = (linear_ns_total / actual_queries) / 1_000.0

    # 2. Замер времени для Хеш-таблицы MyHashMap O(1)
    t0_hash = time.perf_counter_ns()
    for key in test_keys:
        hash_map.get(key)
    t1_hash = time.perf_counter_ns()
    hash_ns_total = t1_hash - t0_hash
    hash_ms = hash_ns_total / 1_000_000.0
    hash_avg_us = (hash_ns_total / actual_queries) / 1_000.0

    # Расчет ускорения
    ratio = (linear_ms / hash_ms) if hash_ms > 0 else 1.0

    return {
        "dataset_size": len(records),
        "query_count": actual_queries,
        "linear_total_ms": round(linear_ms, 3),
        "linear_avg_us": round(linear_avg_us, 2),
        "hash_total_ms": round(hash_ms, 3),
        "hash_avg_us": round(hash_avg_us, 2),
        "speedup_ratio": round(ratio, 1),
    }


def format_benchmark_table(res: Dict[str, Any]) -> str:
    """Форматирует результаты бенчмарка в красивую текстовую таблицу."""
    lines = [
        "=" * 64,
        f"РЕЗУЛЬТАТЫ СРАВНИТЕЛЬНОГО ТЕСТИРОВАНИЯ (ИТИС КФУ)",
        f"Объем датасета: {res['dataset_size']:,} записей | Запросов: {res['query_count']}",
        "=" * 64,
        f"{'Алгоритм поиска':<25} | {'Общее время':<15} | {'Ср. время на запрос':<18}",
        "-" * 64,
        f"{'Linear Search O(N)':<25} | {res['linear_total_ms']:>8.3f} ms     | {res['linear_avg_us']:>10.2f} μs",
        f"{'MyHashMap O(1)':<25} | {res['hash_total_ms']:>8.3f} ms     | {res['hash_avg_us']:>10.2f} μs",
        "-" * 64,
        f"ИТОГ: MyHashMap быстрее полного перебора в {res['speedup_ratio']}x раз!",
        "=" * 64,
    ]
    return "\n".join(lines)
