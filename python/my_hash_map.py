class MyHashMap:
    """
    Хеш-таблица с разрешением коллизий методом цепочек
    и динамическим рехешированием (алгоритм djb2).
    """

    MAX_LOAD_FACTOR = 0.75

    def __init__(self, initial_capacity=8):
        self.capacity = max(1, initial_capacity)
        self.size = 0
        self.buckets = [[] for _ in range(self.capacity)]

    def _hash(self, key):
        """Хеш-функция djb2 (32 бита)."""
        h = 5381
        for ch in str(key):
            h = (((h << 5) + h) + ord(ch)) & 0xFFFFFFFF
        return h

    def _index(self, key):
        return self._hash(key) % self.capacity

    def get_load_factor(self):
        return self.size / self.capacity

    def _resize(self):
        """Удвоение емкости и перехеширование всех элементов."""
        old_buckets = self.buckets
        self.capacity *= 2
        self.buckets = [[] for _ in range(self.capacity)]
        self.size = 0

        for bucket in old_buckets:
            for k, v in bucket:
                self.put(k, v)

    def put(self, key, value):
        idx = self._index(key)

        # Если ключ уже есть — обновляем значение
        for item in self.buckets[idx]:
            if item[0] == key:
                item[1] = value
                return

        # Если превышаем порог — увеличиваем таблицу
        if (self.size + 1) / self.capacity > self.MAX_LOAD_FACTOR:
            self._resize()
            idx = self._index(key)

        self.buckets[idx].append([key, value])
        self.size += 1

    def get(self, key, default=None):
        idx = self._index(key)
        for k, v in self.buckets[idx]:
            if k == key:
                return v
        return default

    def contains(self, key):
        idx = self._index(key)
        return any(k == key for k, _ in self.buckets[idx])

    def remove(self, key):
        idx = self._index(key)
        bucket = self.buckets[idx]
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket.pop(i)
                self.size -= 1
                return True
        return False

    def stats(self):
        """Сбор статистики распределения для отчета."""
        empty_buckets = sum(1 for b in self.buckets if len(b) == 0)
        used_buckets = self.capacity - empty_buckets
        longest_bucket = max(len(b) for b in self.buckets) if self.buckets else 0
        avg_len = (self.size / used_buckets) if used_buckets > 0 else 0.0

        distribution = {}
        for b in self.buckets:
            length = len(b)
            distribution[length] = distribution.get(length, 0) + 1

        return {
            "size": self.size,
            "capacity": self.capacity,
            "load_factor": round(self.get_load_factor(), 3),
            "empty_buckets": empty_buckets,
            "used_buckets": used_buckets,
            "longest_bucket": longest_bucket,
            "avg_bucket_length": round(avg_len, 2),
            "distribution": sorted(distribution.items()),
        }

    # Магические методы для работы как с обычным dict: map[k] = v
    def __setitem__(self, key, value):
        self.put(key, value)

    def __getitem__(self, key):
        idx = self._index(key)
        for k, v in self.buckets[idx]:
            if k == key:
                return v
        raise KeyError(key)

    def __delitem__(self, key):
        if not self.remove(key):
            raise KeyError(key)

    def __contains__(self, key):
        return self.contains(key)

    def __len__(self):
        return self.size

    def __iter__(self):
        for bucket in self.buckets:
            for k, _ in bucket:
                yield k

    def keys(self):
        return [k for bucket in self.buckets for k, _ in bucket]

    def values(self):
        return [v for bucket in self.buckets for _, v in bucket]

    def items(self):
        return [(k, v) for bucket in self.buckets for k, v in bucket]

    def __repr__(self):
        return (
            f"MyHashMap(size={self.size}, capacity={self.capacity}, "
            f"load_factor={self.get_load_factor():.2f})"
        )
