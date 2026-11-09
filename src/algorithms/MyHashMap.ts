export interface KeyValuePair<K, V> {
  key: K;
  value: V;
}

export interface HashMapStats {
  size: number;
  capacity: number;
  loadFactor: number;
  emptyBuckets: number;
  usedBuckets: number;
  longestBucket: number;
  avgBucketLength: number;
  bucketDistribution: { length: number; count: number }[];
}

/**
 * Реализация собственной Hash Table для индивидуального проекта (ИТИС КФУ):
 * - Метод цепочек (Separate Chaining) для решения коллизий: bucket -> [(k, v), ...]
 * - Начальная емкость: capacity = 8
 * - Порог заполнения: MAX_LOAD_FACTOR = 0.75
 * - При выходе за порог: удвоение capacity и полный rehash всех старых пар
 */
export class MyHashMap<K extends string | number, V> {
  public static readonly MAX_LOAD_FACTOR = 0.75;

  public capacity: number;
  public size: number;
  public buckets: KeyValuePair<K, V>[][];

  constructor(initialCapacity: number = 8) {
    this.capacity = initialCapacity;
    this.size = 0;
    this.buckets = Array.from({ length: this.capacity }, () => []);
  }

  /**
   * Хеш-функция для строк: полиномиальный хеш djb2
   */
  private _hash(key: K): number {
    const str = String(key);
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i);
      h = h & h; // Приведение к 32-битному целому
    }
    return Math.abs(h);
  }

  /**
   * Номер bucket: остаток от деления хеша на вместимость
   */
  public _index(key: K): number {
    return this._hash(key) % this.capacity;
  }

  public getLoadFactor(): number {
    return this.size / this.capacity;
  }

  /**
   * Увеличение емкости в 2 раза и полный rehash старых пар
   */
  private _resize(): void {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.size = 0;

    for (const bucket of oldBuckets) {
      for (const item of bucket) {
        this.put(item.key, item.value);
      }
    }
  }

  public put(key: K, value: V): void {
    const idx = this._index(key);
    const bucket = this.buckets[idx];

    // Если ключ уже есть — обновляем значение (size не растет, resize не нужен)
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket[i].value = value;
        return;
      }
    }

    // Если новый ключ превысит load factor > 0.75 — расширяем таблицу
    if ((this.size + 1) / this.capacity > MyHashMap.MAX_LOAD_FACTOR) {
      this._resize();
      const newIdx = this._index(key);
      this.buckets[newIdx].push({ key, value });
    } else {
      bucket.push({ key, value });
    }

    this.size++;
  }

  public get(key: K): V | undefined {
    const idx = this._index(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        return bucket[i].value;
      }
    }
    return undefined;
  }

  public contains(key: K): boolean {
    return this.get(key) !== undefined;
  }

  public remove(key: K): boolean {
    const idx = this._index(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket.splice(i, 1);
        this.size--;
        return true;
      }
    }
    return false;
  }

  public stats(): HashMapStats {
    let emptyBuckets = 0;
    let longestBucket = 0;
    const lengthCounts: { [len: number]: number } = {};

    for (const b of this.buckets) {
      const len = b.length;
      lengthCounts[len] = (lengthCounts[len] || 0) + 1;
      if (len === 0) {
        emptyBuckets++;
      }
      if (len > longestBucket) {
        longestBucket = len;
      }
    }

    const usedBuckets = this.capacity - emptyBuckets;
    const avgBucketLength = usedBuckets > 0 ? this.size / usedBuckets : 0;

    const bucketDistribution = Object.entries(lengthCounts)
      .map(([l, count]) => ({ length: Number(l), count }))
      .sort((a, b) => a.length - b.length);

    return {
      size: this.size,
      capacity: this.capacity,
      loadFactor: this.getLoadFactor(),
      emptyBuckets,
      usedBuckets,
      longestBucket,
      avgBucketLength,
      bucketDistribution,
    };
  }
}
