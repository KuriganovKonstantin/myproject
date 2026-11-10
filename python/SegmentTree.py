"""
Реализация дерева отрезков (Segment Tree) для суммы на отрезке.

Теоретические особенности:
- Назначение: Range Sum Query (RSQ) и точечные обновления (Point Update).
- Пространственная сложность: O(N) — массив дерева размером 4 * N.
- Временная сложность:
    - Построение дерева (build): O(N)
    - Запрос суммы на отрезке (query): O(log N)
    - Обновление элемента (update): O(log N)
"""

import math


class SegmentTree:
    """
    Дерево отрезков на базе одномерного массива.
    Поддерживает сумму на подотрезке и точечное обновление элементов.
    """

    def __init__(self, data):
        """Принимает список чисел либо размер для инициализации нулями."""
        if isinstance(data, int):
            self.data = [0] * max(0, data)
        else:
            self.data = list(data)

        self.n = len(self.data)
        # Размер 4 * N гарантирует достаточное место под все узлы
        self.tree = [0] * (4 * self.n) if self.n > 0 else []

        if self.n > 0:
            self._build(node=0, l=0, r=self.n - 1)

    def _build(self, node, l, r):
        """Рекурсивное построение дерева снизу вверх: O(N)."""
        if l == r:
            self.tree[node] = self.data[l]
            return

        mid = (l + r) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2

        self._build(left_child, l, mid)
        self._build(right_child, mid + 1, r)

        self.tree[node] = self.tree[left_child] + self.tree[right_child]

    def _update(self, node, l, r, idx, val):
        """Внутренний рекурсивный спуск для обновления значения: O(log N)."""
        if l == r:
            self.tree[node] = val
            return

        mid = (l + r) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2

        if idx <= mid:
            self._update(left_child, l, mid, idx, val)
        else:
            self._update(right_child, mid + 1, r, idx, val)

        self.tree[node] = self.tree[left_child] + self.tree[right_child]

    def _query(self, node, l, r, ql, qr):
        """Внутренний подсчет суммы на отрезке [ql, qr]: O(log N)."""
        # Отрезок запроса вне текущего подотрезка
        if ql > r or qr < l:
            return 0

        # Текущий отрезок полностью внутри запроса
        if ql <= l and r <= qr:
            return self.tree[node]

        mid = (l + r) // 2
        left_sum = self._query(2 * node + 1, l, mid, ql, qr)
        right_sum = self._query(2 * node + 2, mid + 1, r, ql, qr)

        return left_sum + right_sum

    def update(self, index, value):
        """Обновляет значение элемента по индексу."""
        if not (0 <= index < self.n):
            raise IndexError("Index out of range")

        self.data[index] = value
        self._update(node=0, l=0, r=self.n - 1, idx=index, val=value)

    def query(self, left, right):
        """Возвращает сумму на отрезке [left, right] включительно."""
        if not (0 <= left <= right < self.n):
            raise IndexError("Invalid range query boundaries")

        return self._query(node=0, l=0, r=self.n - 1, ql=left, qr=right)

    def stats(self):
        """Статистика структуры для отчета."""
        height = math.ceil(math.log2(self.n)) + 1 if self.n > 0 else 0
        allocated = len(self.tree)
        non_zero_nodes = sum(1 for x in self.tree if x != 0)

        return {
            "elements_count": self.n,
            "tree_array_size": allocated,
            "tree_height": height,
            "total_sum": self.tree[0] if self.tree else 0,
            "non_zero_nodes": non_zero_nodes,
        }

    # --- Магические методы (работает как список со срезами) ---

    def __len__(self):
        return self.n

    def __getitem__(self, item):
        """
        tree[i]     -> возвращает элемент data[i]
        tree[l:r]   -> возвращает сумму на полуинтервале [l, r)
        """
        if isinstance(item, int):
            if item < 0:
                item += self.n
            if not (0 <= item < self.n):
                raise IndexError("Index out of range")
            return self.data[item]

        if isinstance(item, slice):
            start = 0 if item.start is None else item.start
            stop = self.n if item.stop is None else item.stop

            # Обработка отрицательных индексов
            if start < 0:
                start += self.n
            if stop < 0:
                stop += self.n

            if start >= stop:
                return 0

            return self.query(start, stop - 1)

        raise TypeError("Indices must be integers or slices")

    def __setitem__(self, index, value):
        """Позволяет изменять элемент через tree[i] = x."""
        if index < 0:
            index += self.n
        self.update(index, value)

    def __repr__(self):
        total = self.tree[0] if self.tree else 0
        return f"SegmentTree(size={self.n}, total_sum={total})"
