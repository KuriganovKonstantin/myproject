"""
Модульные тесты для проверки корректности MyHashMap и генератора данных
ИТИС КФУ · Куриганов Константин Витальевич (11-511)
"""

import unittest
from my_hash_map import MyHashMap
from dataset import generate_dataset, parse_csv, export_csv


class TestMyHashMap(unittest.TestCase):
    def setUp(self):
        self.hmap = MyHashMap(initial_capacity=8)

    def test_put_and_get(self):
        self.hmap.put("key1", "val1")
        self.hmap.put("key2", 42)
        self.assertEqual(self.hmap.get("key1"), "val1")
        self.assertEqual(self.hmap.get("key2"), 42)
        self.assertIsNone(self.hmap.get("unknown_key"))

    def test_overwrite_existing_key(self):
        self.hmap.put("fruit", "apple")
        self.assertEqual(len(self.hmap), 1)
        self.hmap.put("fruit", "banana")
        self.assertEqual(len(self.hmap), 1)
        self.assertEqual(self.hmap.get("fruit"), "banana")

    def test_remove(self):
        self.hmap.put("id1", "value1")
        self.hmap.put("id2", "value2")
        self.assertTrue(self.hmap.remove("id1"))
        self.assertEqual(len(self.hmap), 1)
        self.assertIsNone(self.hmap.get("id1"))
        self.assertFalse(self.hmap.remove("nonexistent"))

    def test_resize_and_load_factor(self):
        # Initial capacity is 8, threshold is 8 * 0.75 = 6.0
        # Inserting 7th unique key must trigger resize to 16
        for i in range(6):
            self.hmap.put(f"item_{i}", i)
        self.assertEqual(self.hmap.capacity, 8)
        self.assertLessEqual(self.hmap.get_load_factor(), 0.75)

        # 7-й элемент вызывает resize: (6 + 1)/8 = 7/8 = 0.875 > 0.75
        self.hmap.put("item_6", 6)
        self.assertEqual(self.hmap.capacity, 16)
        self.assertLessEqual(self.hmap.get_load_factor(), 0.75)

        # Проверяем, что все элементы сохранились после rehash
        for i in range(7):
            self.assertEqual(self.hmap.get(f"item_{i}"), i)

    def test_stats(self):
        records = generate_dataset(100)
        for r in records:
            self.hmap.put(r.record_id, r)

        stats = self.hmap.stats()
        self.assertEqual(stats.size, 100)
        self.assertGreater(stats.capacity, 100)
        self.assertLessEqual(stats.load_factor, 0.75)
        self.assertGreater(stats.used_buckets, 0)
        self.assertGreaterEqual(stats.longest_bucket, 1)

    def test_python_dunder_methods(self):
        self.hmap["alpha"] = 100
        self.hmap["beta"] = 200
        self.assertEqual(self.hmap["alpha"], 100)
        self.assertTrue("alpha" in self.hmap)
        self.assertFalse("gamma" in self.hmap)
        del self.hmap["alpha"]
        self.assertFalse("alpha" in self.hmap)
        self.assertEqual(len(self.hmap), 1)


class TestDataset(unittest.TestCase):
    def test_generate_dataset(self):
        data = generate_dataset(500)
        self.assertEqual(len(data), 500)
        self.assertTrue(data[0].record_id.startswith("TL-"))
        self.assertGreater(data[0].layoffs_count, 0)
        # Проверяем сортировку по дате
        for i in range(len(data) - 1):
            self.assertLessEqual(data[i].date, data[i + 1].date)

    def test_csv_parse_and_export(self):
        data = generate_dataset(50)
        export_csv(data, "/tmp/test_export.csv")
        with open("/tmp/test_export.csv", "r", encoding="utf-8") as f:
            csv_text = f.read()
        parsed = parse_csv(csv_text)
        self.assertEqual(len(parsed), 50)
        self.assertEqual(parsed[0].record_id, data[0].record_id)


if __name__ == "__main__":
    unittest.main()
